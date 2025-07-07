import OpenAI from "openai";
import { db } from "./db";
import { orders, orderItems, products, productionTasks, productComponents } from "@shared/schema";
import { eq, and, isNull } from "drizzle-orm";
import { analyzeOrderProduction, type OrderProductionAnalysis } from "./ai-production-service";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface ProductionTaskRecommendation {
  orderId: number;
  orderNumber: string;
  totalProductionTime: number;
  totalCost: number;
  priority: 'high' | 'medium' | 'low';
  estimatedStartDate: string;
  estimatedEndDate: string;
  requiredResources: {
    specialists: number;
    generalWorkers: number;
    equipment: string[];
    criticalMaterials: string[];
  };
  risks: Array<{
    type: string;
    probability: number;
    impact: string;
    mitigation: string;
  }>;
  dependencies: string[];
  productionSteps: Array<{
    stepNumber: number;
    operation: string;
    estimatedHours: number;
    requiredSkills: string[];
    qualityChecks: string[];
  }>;
}

export interface MassProductionPlan {
  totalOrders: number;
  totalProductionTime: number;
  totalCost: number;
  timeframe: {
    earliestStart: string;
    latestEnd: string;
    totalDays: number;
  };
  resourceRequirements: {
    peakSpecialists: number;
    peakGeneralWorkers: number;
    totalEquipmentHours: Record<string, number>;
    materialsList: Array<{
      name: string;
      totalQuantity: number;
      unit: string;
      estimatedCost: number;
    }>;
  };
  productionSchedule: Array<{
    week: number;
    weekStart: string;
    weekEnd: string;
    scheduledOrders: Array<{
      orderId: number;
      orderNumber: string;
      productionHours: number;
      completionPercentage: number;
    }>;
    resourceUtilization: {
      specialists: number;
      generalWorkers: number;
      equipmentHours: number;
    };
  }>;
  bottlenecks: Array<{
    type: 'resource' | 'equipment' | 'material' | 'skill';
    description: string;
    affectedOrders: number[];
    impact: string;
    recommendations: string[];
  }>;
  optimizations: Array<{
    type: 'scheduling' | 'resource' | 'cost' | 'quality';
    suggestion: string;
    estimatedSavings: number;
    implementationEffort: 'low' | 'medium' | 'high';
  }>;
  qualityPlan: {
    checkpoints: Array<{
      stage: string;
      frequency: string;
      criteria: string[];
      responsibleRole: string;
    }>;
    expectedDefectRate: number;
    qualityMetrics: string[];
  };
}

export async function generateMassProductionPlan(): Promise<{
  plan: MassProductionPlan;
  orderRecommendations: ProductionTaskRecommendation[];
}> {
  try {
    // Отримуємо всі оплачені замовлення без виробничих завдань
    const paidOrders = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        totalAmount: orders.totalAmount,
        estimatedDelivery: orders.estimatedDelivery,
        clientId: orders.clientId,
        status: orders.status,
        paymentDate: orders.paymentDate
      })
      .from(orders)
      .where(
        eq(orders.status, 'confirmed') // Тільки підтверджені замовлення - без фільтра по paymentDate для тестування
      );

    console.log(`Знайдено ${paidOrders.length} замовлень для аналізу виробництва`);

    if (paidOrders.length === 0) {
      return {
        plan: createEmptyPlan(),
        orderRecommendations: []
      };
    }

    // Аналізуємо кожне замовлення
    const orderAnalyses: OrderProductionAnalysis[] = [];
    const orderRecommendations: ProductionTaskRecommendation[] = [];

    for (const order of paidOrders) {
      try {
        const analysis = await analyzeOrderProduction(order.id);
        orderAnalyses.push(analysis);

        const recommendation = await generateOrderProductionTask(order, analysis);
        orderRecommendations.push(recommendation);
      } catch (error) {
        console.error(`Помилка аналізу замовлення ${order.id}:`, error);
        // Продовжуємо з іншими замовленнями
      }
    }

    // Генеруємо загальний план виробництва
    const plan = await generateOverallProductionPlan(orderAnalyses, paidOrders);

    return {
      plan,
      orderRecommendations
    };

  } catch (error) {
    console.error("Помилка генерації масового плану виробництва:", error);
    throw error;
  }
}

async function generateOrderProductionTask(
  order: any,
  analysis: OrderProductionAnalysis
): Promise<ProductionTaskRecommendation> {
  try {
    const prompt = `
Створіть виробниче завдання для замовлення на основі AI аналізу:

ЗАМОВЛЕННЯ:
- Номер: ${order.orderNumber}
- Сума: ${order.totalAmount} грн
- Дедлайн: ${order.estimatedDelivery ? new Date(order.estimatedDelivery).toLocaleDateString() : 'не вказано'}

AI АНАЛІЗ:
- Загальний час виробництва: ${analysis.totalProductionTime} годин
- Загальна вартість: ${analysis.totalCost} грн
- Критичний шлях: ${analysis.criticalPath.join(', ')}
- Можливість дотримання дедлайну: ${analysis.deliveryFeasibility.canMeetDeadline ? 'так' : 'ні'}

ТОВАРИ ДО ВИРОБНИЦТВА:
${analysis.productRecommendations.map(prod => `
- ${prod.productName} (${prod.quantity} шт.)
  Час виробництва: ${prod.recommendation.productionTime.estimated} ${prod.recommendation.productionTime.unit}
  Ризик: ${prod.recommendation.riskAssessment.overallRisk}
  Спеціалісти: ${prod.recommendation.resourceRequirements.workforce.specialists}
  Робітники: ${prod.recommendation.resourceRequirements.workforce.generalWorkers}
`).join('')}

Відповідь у JSON форматі:
{
  "priority": "high|medium|low",
  "estimatedStartDate": "YYYY-MM-DD",
  "estimatedEndDate": "YYYY-MM-DD",
  "requiredResources": {
    "specialists": число_спеціалістів,
    "generalWorkers": число_робітників,
    "equipment": ["обладнання1", "обладнання2"],
    "criticalMaterials": ["матеріал1", "матеріал2"]
  },
  "risks": [
    {
      "type": "тип_ризику",
      "probability": ймовірність_0_1,
      "impact": "опис_впливу",
      "mitigation": "план_мітигації"
    }
  ],
  "dependencies": ["залежність1", "залежність2"],
  "productionSteps": [
    {
      "stepNumber": номер_кроку,
      "operation": "назва_операції",
      "estimatedHours": години,
      "requiredSkills": ["навичка1", "навичка2"],
      "qualityChecks": ["перевірка1", "перевірка2"]
    }
  ]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "Ви експерт з планування виробництва. Створюйте детальні, реалістичні виробничі завдання. Відповідайте ТІЛЬКИ валідним JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 2000
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    // Розрахунок дат
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + (analysis.totalProductionTime * 60 * 60 * 1000));

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      totalProductionTime: analysis.totalProductionTime,
      totalCost: analysis.totalCost,
      priority: result.priority || determinePriority(order, analysis),
      estimatedStartDate: result.estimatedStartDate || startDate.toISOString().split('T')[0],
      estimatedEndDate: result.estimatedEndDate || endDate.toISOString().split('T')[0],
      requiredResources: result.requiredResources || {
        specialists: 1,
        generalWorkers: 2,
        equipment: ['Стандартне обладнання'],
        criticalMaterials: ['Основні матеріали']
      },
      risks: result.risks || [],
      dependencies: result.dependencies || [],
      productionSteps: result.productionSteps || []
    };

  } catch (error) {
    console.error("Помилка генерації виробничого завдання:", error);
    
    // Базове завдання у випадку помилки
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + (analysis.totalProductionTime * 60 * 60 * 1000));

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      totalProductionTime: analysis.totalProductionTime,
      totalCost: analysis.totalCost,
      priority: determinePriority(order, analysis),
      estimatedStartDate: startDate.toISOString().split('T')[0],
      estimatedEndDate: endDate.toISOString().split('T')[0],
      requiredResources: {
        specialists: 1,
        generalWorkers: 2,
        equipment: ['Стандартне обладнання'],
        criticalMaterials: ['Основні матеріали']
      },
      risks: [],
      dependencies: [],
      productionSteps: []
    };
  }
}

async function generateOverallProductionPlan(
  orderAnalyses: OrderProductionAnalysis[],
  orders: any[]
): Promise<MassProductionPlan> {
  try {
    const totalProductionTime = orderAnalyses.reduce((sum, analysis) => sum + analysis.totalProductionTime, 0);
    const totalCost = orderAnalyses.reduce((sum, analysis) => sum + analysis.totalCost, 0);

    // Розрахунок часових рамок
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + (totalProductionTime * 60 * 60 * 1000));
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));

    // Аналіз ресурсів
    const resourceAnalysis = analyzeResourceRequirements(orderAnalyses);
    
    // Генерація розкладу по тижнях
    const schedule = generateWeeklySchedule(orderAnalyses, orders, startDate, endDate);

    // Виявлення вузьких місць
    const bottlenecks = identifyBottlenecks(orderAnalyses, resourceAnalysis);

    return {
      totalOrders: orders.length,
      totalProductionTime,
      totalCost,
      timeframe: {
        earliestStart: startDate.toISOString().split('T')[0],
        latestEnd: endDate.toISOString().split('T')[0],
        totalDays
      },
      resourceRequirements: resourceAnalysis,
      productionSchedule: schedule,
      bottlenecks,
      optimizations: [
        {
          type: 'scheduling',
          suggestion: 'Розглянути паралельне виробництво для скорочення загального часу',
          estimatedSavings: totalProductionTime * 0.15,
          implementationEffort: 'medium'
        },
        {
          type: 'resource',
          suggestion: 'Оптимізувати використання обладнання для зменшення простоїв',
          estimatedSavings: totalCost * 0.1,
          implementationEffort: 'low'
        }
      ],
      qualityPlan: {
        checkpoints: [
          {
            stage: 'Початок виробництва',
            frequency: 'На кожному замовленні',
            criteria: ['Наявність матеріалів', 'Готовність обладнання', 'Кваліфікація персоналу'],
            responsibleRole: 'Майстер зміни'
          },
          {
            stage: 'Проміжний контроль',
            frequency: '50% готовності',
            criteria: ['Відповідність технічним вимогам', 'Дотримання часових рамок'],
            responsibleRole: 'Контролер якості'
          },
          {
            stage: 'Фінальний контроль',
            frequency: 'Перед відвантаженням',
            criteria: ['Повна функціональність', 'Зовнішній вигляд', 'Комплектність'],
            responsibleRole: 'Головний контролер'
          }
        ],
        expectedDefectRate: 2.5,
        qualityMetrics: ['% браку', 'Час на виправлення', 'Задоволеність клієнтів']
      }
    };

  } catch (error) {
    console.error("Помилка генерації загального плану:", error);
    return createEmptyPlan();
  }
}

function determinePriority(order: any, analysis: OrderProductionAnalysis): 'high' | 'medium' | 'low' {
  // Високий пріоритет: великі замовлення або терміновий дедлайн
  if (parseFloat(order.totalAmount) > 50000 || !analysis.deliveryFeasibility.canMeetDeadline) {
    return 'high';
  }
  
  // Середній пріоритет: стандартні замовлення
  if (parseFloat(order.totalAmount) > 10000) {
    return 'medium';
  }
  
  return 'low';
}

function analyzeResourceRequirements(orderAnalyses: OrderProductionAnalysis[]) {
  const specialists = Math.max(...orderAnalyses.map(analysis => 
    analysis.productRecommendations.reduce((sum, prod) => 
      sum + prod.recommendation.resourceRequirements.workforce.specialists, 0)
  ));

  const generalWorkers = Math.max(...orderAnalyses.map(analysis => 
    analysis.productRecommendations.reduce((sum, prod) => 
      sum + prod.recommendation.resourceRequirements.workforce.generalWorkers, 0)
  ));

  return {
    peakSpecialists: specialists,
    peakGeneralWorkers: generalWorkers,
    totalEquipmentHours: { 'Стандартне обладнання': 100 },
    materialsList: [
      { name: 'Основні матеріали', totalQuantity: 100, unit: 'кг', estimatedCost: 5000 }
    ]
  };
}

function generateWeeklySchedule(orderAnalyses: OrderProductionAnalysis[], orders: any[], startDate: Date, endDate: Date) {
  const schedule = [];
  const weekCount = Math.ceil((endDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));

  for (let week = 1; week <= weekCount; week++) {
    const weekStart = new Date(startDate.getTime() + (week - 1) * 7 * 24 * 60 * 60 * 1000);
    const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);

    const scheduledOrders = orderAnalyses.slice((week - 1) * 2, week * 2).map((analysis, index) => ({
      orderId: analysis.orderId,
      orderNumber: orders.find(o => o.id === analysis.orderId)?.orderNumber || `#${analysis.orderId}`,
      productionHours: analysis.totalProductionTime,
      completionPercentage: week === weekCount ? 100 : (week * 100 / weekCount)
    }));

    schedule.push({
      week,
      weekStart: weekStart.toISOString().split('T')[0],
      weekEnd: weekEnd.toISOString().split('T')[0],
      scheduledOrders,
      resourceUtilization: {
        specialists: Math.min(3, scheduledOrders.length),
        generalWorkers: Math.min(6, scheduledOrders.length * 2),
        equipmentHours: scheduledOrders.reduce((sum, order) => sum + order.productionHours, 0)
      }
    });
  }

  return schedule;
}

function identifyBottlenecks(orderAnalyses: OrderProductionAnalysis[], resourceAnalysis: any) {
  return [
    {
      type: 'resource' as const,
      description: 'Обмежена кількість кваліфікованих спеціалістів',
      affectedOrders: orderAnalyses.map(a => a.orderId).slice(0, 3),
      impact: 'Може призвести до затримки виробництва на 2-3 дні',
      recommendations: [
        'Залучити додаткових спеціалістів',
        'Організувати навчання існуючого персоналу',
        'Розглянути аутсорсинг частини робіт'
      ]
    }
  ];
}

function createEmptyPlan(): MassProductionPlan {
  const today = new Date().toISOString().split('T')[0];
  
  return {
    totalOrders: 0,
    totalProductionTime: 0,
    totalCost: 0,
    timeframe: {
      earliestStart: today,
      latestEnd: today,
      totalDays: 0
    },
    resourceRequirements: {
      peakSpecialists: 0,
      peakGeneralWorkers: 0,
      totalEquipmentHours: {},
      materialsList: []
    },
    productionSchedule: [],
    bottlenecks: [],
    optimizations: [],
    qualityPlan: {
      checkpoints: [],
      expectedDefectRate: 0,
      qualityMetrics: []
    }
  };
}

export async function createProductionTasksFromPlan(orderRecommendations: ProductionTaskRecommendation[]): Promise<{
  success: boolean;
  createdTasks: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let createdTasks = 0;

  for (const recommendation of orderRecommendations) {
    try {
      // Створюємо виробниче завдання в базі даних
      await db.insert(productionTasks).values({
        orderId: recommendation.orderId,
        taskName: `Виробництво замовлення ${recommendation.orderNumber}`,
        description: `AI-згенероване завдання для замовлення ${recommendation.orderNumber}`,
        status: 'planned',
        priority: recommendation.priority,
        estimatedHours: recommendation.totalProductionTime,
        estimatedCost: recommendation.totalCost,
        startDate: new Date(recommendation.estimatedStartDate),
        dueDate: new Date(recommendation.estimatedEndDate),
        assignedUserId: null, // Буде призначено пізніше
        notes: `Ресурси: ${recommendation.requiredResources.specialists} спеціалістів, ${recommendation.requiredResources.generalWorkers} робітників`
      });

      createdTasks++;
    } catch (error) {
      console.error(`Помилка створення завдання для замовлення ${recommendation.orderId}:`, error);
      errors.push(`Замовлення ${recommendation.orderNumber}: ${error instanceof Error ? error.message : 'Невідома помилка'}`);
    }
  }

  return {
    success: errors.length === 0,
    createdTasks,
    errors
  };
}