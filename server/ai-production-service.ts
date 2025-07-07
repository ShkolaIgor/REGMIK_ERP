import OpenAI from "openai";
import { db } from "./db";
import { products, productComponents, orders, orderItems } from "@shared/schema";
import { eq, inArray } from "drizzle-orm";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface ProductionRecommendation {
  productionTime: {
    estimated: number;
    unit: 'hours' | 'days' | 'weeks';
    breakdown: Array<{
      stage: string;
      time: number;
      description: string;
    }>;
  };
  resourceRequirements: {
    materials: Array<{
      name: string;
      quantity: number;
      unit: string;
      availability: 'available' | 'limited' | 'needs_ordering';
      estimatedCost: number;
    }>;
    equipment: Array<{
      name: string;
      utilizationTime: number;
      bottleneck: boolean;
    }>;
    workforce: {
      specialists: number;
      generalWorkers: number;
      totalHours: number;
    };
  };
  productionSequence: Array<{
    step: number;
    operation: string;
    duration: number;
    dependencies: string[];
    riskLevel: 'low' | 'medium' | 'high';
    instructions: string;
  }>;
  qualityChecks: Array<{
    stage: string;
    checkType: string;
    criteria: string;
    requiredTools: string[];
  }>;
  riskAssessment: {
    overallRisk: 'low' | 'medium' | 'high';
    risks: Array<{
      type: string;
      probability: number;
      impact: string;
      mitigation: string;
    }>;
  };
  costEstimate: {
    materials: number;
    labor: number;
    overhead: number;
    total: number;
    profitMargin: number;
  };
  optimizations: Array<{
    type: 'time' | 'cost' | 'quality' | 'efficiency';
    suggestion: string;
    impact: string;
    implementation: string;
  }>;
  sustainability: {
    energyConsumption: number; // kWh
    wasteGeneration: number; // kg
    carbonFootprint: number; // kg CO2
    recyclingOpportunities: string[];
  };
  reasoning: string;
}

export interface OrderProductionAnalysis {
  orderId: number;
  totalProductionTime: number;
  totalCost: number;
  criticalPath: string[];
  productRecommendations: Array<{
    productId: number;
    productName: string;
    quantity: number;
    recommendation: ProductionRecommendation;
  }>;
  orderLevelOptimizations: string[];
  deliveryFeasibility: {
    canMeetDeadline: boolean;
    recommendedStartDate: string;
    bufferTime: number;
  };
}

export async function analyzeOrderProduction(orderId: number): Promise<OrderProductionAnalysis> {
  try {
    // Отримуємо деталі замовлення з товарами та компонентами
    const orderData = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!orderData.length) {
      throw new Error(`Замовлення з ID ${orderId} не знайдено`);
    }

    const order = orderData[0];

    // Отримуємо позиції замовлення
    const orderItemsData = await db
      .select({
        id: orderItems.id,
        productId: orderItems.productId,
        quantity: orderItems.quantity,
        productName: products.name,
        productSku: products.sku,
        productDescription: products.description
      })
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, orderId));

    // Отримуємо компоненти для кожного товару
    const productIds = orderItemsData.map(item => item.productId).filter(Boolean);
    const componentsData = await db
      .select({
        parentProductId: productComponents.parentProductId,
        componentName: products.name,
        componentSku: products.sku,
        quantity: productComponents.quantity,
        isOptional: productComponents.isOptional,
        notes: productComponents.notes
      })
      .from(productComponents)
      .leftJoin(products, eq(productComponents.componentProductId, products.id))
      .where(inArray(productComponents.parentProductId, productIds));

    // Групуємо компоненти за товарами
    const productComponentsMap = new Map();
    componentsData.forEach(comp => {
      if (!productComponentsMap.has(comp.parentProductId)) {
        productComponentsMap.set(comp.parentProductId, []);
      }
      productComponentsMap.get(comp.parentProductId).push(comp);
    });

    const productRecommendations = [];

    // Генеруємо рекомендації для кожного товару
    for (const item of orderItemsData) {
      if (!item.productId) continue;

      const components = productComponentsMap.get(item.productId) || [];
      const recommendation = await generateProductionRecommendation(
        {
          productName: item.productName || 'Невідомий товар',
          productSku: item.productSku || '',
          description: item.productDescription || '',
          quantity: item.quantity || 1,
          components: components.map(comp => ({
            name: comp.componentName || 'Невідомий компонент',
            sku: comp.componentSku || '',
            quantity: parseFloat(comp.quantity || '1'),
            isOptional: comp.isOptional || false,
            notes: comp.notes || ''
          }))
        },
        {
          orderPriority: 'standard',
          deadline: order.estimatedDelivery ? new Date(order.estimatedDelivery) : undefined,
          qualityRequirements: 'standard'
        }
      );

      productRecommendations.push({
        productId: item.productId,
        productName: item.productName || 'Невідомий товар',
        quantity: item.quantity || 1,
        recommendation
      });
    }

    // Розраховуємо загальні показники замовлення
    const totalProductionTime = productRecommendations.reduce(
      (total, prod) => total + (prod.recommendation.productionTime.estimated * prod.quantity), 0
    );

    const totalCost = productRecommendations.reduce(
      (total, prod) => total + (prod.recommendation.costEstimate.total * prod.quantity), 0
    );

    const criticalPath = identifyCriticalPath(productRecommendations);
    
    const orderLevelOptimizations = await generateOrderOptimizations(productRecommendations, order);

    return {
      orderId,
      totalProductionTime,
      totalCost,
      criticalPath,
      productRecommendations,
      orderLevelOptimizations,
      deliveryFeasibility: {
        canMeetDeadline: order.estimatedDelivery ? 
          new Date(order.estimatedDelivery).getTime() > Date.now() + (totalProductionTime * 24 * 60 * 60 * 1000) : 
          true,
        recommendedStartDate: new Date().toISOString().split('T')[0],
        bufferTime: 2 // дні
      }
    };

  } catch (error) {
    console.error("Error analyzing order production:", error);
    throw error;
  }
}

async function generateProductionRecommendation(
  product: {
    productName: string;
    productSku: string;
    description: string;
    quantity: number;
    components: Array<{
      name: string;
      sku: string;
      quantity: number;
      isOptional: boolean;
      notes: string;
    }>;
  },
  context: {
    orderPriority: string;
    deadline?: Date;
    qualityRequirements: string;
  }
): Promise<ProductionRecommendation> {
  try {
    const prompt = `
Ви експерт з виробничого планування в Україні. Проаналізуйте виготовлення товару та надайте детальні рекомендації.

ТОВАР ДЛЯ ВИРОБНИЦТВА:
- Назва: ${product.productName}
- SKU: ${product.productSku}
- Опис: ${product.description}
- Кількість: ${product.quantity} шт.

КОМПОНЕНТИ/МАТЕРІАЛИ:
${product.components.map((comp, index) => `
${index + 1}. ${comp.name} (SKU: ${comp.sku})
   - Кількість на одиниці: ${comp.quantity}
   - Обов'язковий: ${comp.isOptional ? 'ні' : 'так'}
   - Примітки: ${comp.notes || 'немає'}
`).join('')}

КОНТЕКСТ ЗАМОВЛЕННЯ:
- Пріоритет: ${context.orderPriority}
- Дедлайн: ${context.deadline ? context.deadline.toLocaleDateString() : 'не вказано'}
- Вимоги якості: ${context.qualityRequirements}

Враховуйте українські виробничі стандарти, доступність матеріалів, робочу силу та обладнання.

ВІДПОВІДЬ у JSON форматі:
{
  "productionTime": {
    "estimated": числове_значення,
    "unit": "hours|days|weeks",
    "breakdown": [
      {
        "stage": "назва_етапу",
        "time": число_годин_або_днів,
        "description": "опис_етапу"
      }
    ]
  },
  "resourceRequirements": {
    "materials": [
      {
        "name": "назва_матеріалу",
        "quantity": числове_значення,
        "unit": "одиниця_виміру",
        "availability": "available|limited|needs_ordering",
        "estimatedCost": вартість_грн
      }
    ],
    "equipment": [
      {
        "name": "назва_обладнання",
        "utilizationTime": години_використання,
        "bottleneck": true/false
      }
    ],
    "workforce": {
      "specialists": кількість_спеціалістів,
      "generalWorkers": кількість_робітників,
      "totalHours": загальні_людино_години
    }
  },
  "productionSequence": [
    {
      "step": номер_кроку,
      "operation": "назва_операції",
      "duration": тривалість_годин,
      "dependencies": ["залежності"],
      "riskLevel": "low|medium|high",
      "instructions": "детальні_інструкції"
    }
  ],
  "qualityChecks": [
    {
      "stage": "етап_контролю",
      "checkType": "тип_перевірки",
      "criteria": "критерії_якості",
      "requiredTools": ["необхідні_інструменти"]
    }
  ],
  "riskAssessment": {
    "overallRisk": "low|medium|high",
    "risks": [
      {
        "type": "тип_ризику",
        "probability": ймовірність_0_1,
        "impact": "опис_впливу",
        "mitigation": "план_мітигації"
      }
    ]
  },
  "costEstimate": {
    "materials": вартість_матеріалів_грн,
    "labor": вартість_праці_грн,
    "overhead": накладні_витрати_грн,
    "total": загальна_вартість_грн,
    "profitMargin": відсоток_прибутку
  },
  "optimizations": [
    {
      "type": "time|cost|quality|efficiency",
      "suggestion": "пропозиція_оптимізації",
      "impact": "очікуваний_ефект",
      "implementation": "спосіб_впровадження"
    }
  ],
  "sustainability": {
    "energyConsumption": споживання_енергії_kWh,
    "wasteGeneration": відходи_кг,
    "carbonFootprint": вуглецевий_слід_кг_CO2,
    "recyclingOpportunities": ["можливості_переробки"]
  },
  "reasoning": "детальне_обґрунтування_рекомендацій"
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "Ви експерт з виробничого планування. Надавайте практичні, реалістичні рекомендації. Відповідайте ТІЛЬКИ валідним JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 3000
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    // Валідація та встановлення значень за замовчуванням
    return {
      productionTime: {
        estimated: result.productionTime?.estimated || 24,
        unit: result.productionTime?.unit || 'hours',
        breakdown: result.productionTime?.breakdown || [
          { stage: 'Підготовка', time: 4, description: 'Підготовка матеріалів та обладнання' },
          { stage: 'Виготовлення', time: 16, description: 'Основний процес виробництва' },
          { stage: 'Контроль якості', time: 4, description: 'Перевірка та тестування' }
        ]
      },
      resourceRequirements: {
        materials: result.resourceRequirements?.materials || [],
        equipment: result.resourceRequirements?.equipment || [],
        workforce: {
          specialists: result.resourceRequirements?.workforce?.specialists || 1,
          generalWorkers: result.resourceRequirements?.workforce?.generalWorkers || 2,
          totalHours: result.resourceRequirements?.workforce?.totalHours || 24
        }
      },
      productionSequence: result.productionSequence || [],
      qualityChecks: result.qualityChecks || [],
      riskAssessment: {
        overallRisk: result.riskAssessment?.overallRisk || 'medium',
        risks: result.riskAssessment?.risks || []
      },
      costEstimate: {
        materials: result.costEstimate?.materials || 500,
        labor: result.costEstimate?.labor || 800,
        overhead: result.costEstimate?.overhead || 200,
        total: result.costEstimate?.total || 1500,
        profitMargin: result.costEstimate?.profitMargin || 20
      },
      optimizations: result.optimizations || [],
      sustainability: {
        energyConsumption: result.sustainability?.energyConsumption || 10,
        wasteGeneration: result.sustainability?.wasteGeneration || 2,
        carbonFootprint: result.sustainability?.carbonFootprint || 5,
        recyclingOpportunities: result.sustainability?.recyclingOpportunities || []
      },
      reasoning: result.reasoning || 'Стандартна рекомендація на основі аналізу товару'
    };

  } catch (error) {
    console.error("Error generating production recommendation:", error);
    
    // Повертаємо базову рекомендацію у випадку помилки
    return {
      productionTime: {
        estimated: 24,
        unit: 'hours',
        breakdown: [
          { stage: 'Підготовка', time: 4, description: 'Підготовка матеріалів та обладнання' },
          { stage: 'Виготовлення', time: 16, description: 'Основний процес виробництва' },
          { stage: 'Контроль якості', time: 4, description: 'Перевірка та тестування' }
        ]
      },
      resourceRequirements: {
        materials: [],
        equipment: [],
        workforce: {
          specialists: 1,
          generalWorkers: 2,
          totalHours: 24
        }
      },
      productionSequence: [],
      qualityChecks: [],
      riskAssessment: {
        overallRisk: 'medium',
        risks: []
      },
      costEstimate: {
        materials: 500,
        labor: 800,
        overhead: 200,
        total: 1500,
        profitMargin: 20
      },
      optimizations: [],
      sustainability: {
        energyConsumption: 10,
        wasteGeneration: 2,
        carbonFootprint: 5,
        recyclingOpportunities: []
      },
      reasoning: 'Базова рекомендація через технічну помилку AI аналізу'
    };
  }
}

function identifyCriticalPath(productRecommendations: any[]): string[] {
  // Простий алгоритм для виявлення критичного шляху
  const sortedByTime = productRecommendations
    .sort((a, b) => b.recommendation.productionTime.estimated - a.recommendation.productionTime.estimated)
    .slice(0, 3)
    .map(prod => prod.productName);
  
  return sortedByTime;
}

async function generateOrderOptimizations(productRecommendations: any[], order: any): Promise<string[]> {
  const optimizations = [];
  
  // Аналіз паралельного виробництва
  if (productRecommendations.length > 1) {
    optimizations.push('Розглянути паралельне виробництво товарів для скорочення загального часу');
  }
  
  // Аналіз використання спільних компонентів
  const allComponents = productRecommendations.flatMap(prod => 
    prod.recommendation.resourceRequirements.materials.map((mat: any) => mat.name)
  );
  const duplicates = allComponents.filter((item, index) => allComponents.indexOf(item) !== index);
  
  if (duplicates.length > 0) {
    optimizations.push('Оптимізувати закупівлю спільних матеріалів для економії коштів');
  }
  
  return optimizations;
}