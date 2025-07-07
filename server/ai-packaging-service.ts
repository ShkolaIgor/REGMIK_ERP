import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface PackagingRecommendation {
  packageType: string;
  dimensions: {
    length: number;
    width: number;
    height: number;
    unit: string;
  };
  estimatedWeight: number;
  packagingMaterial: string;
  protectionLevel: 'standard' | 'reinforced' | 'fragile' | 'hazardous';
  specialInstructions: string[];
  estimatedCost: number;
  carbonFootprint: {
    packaging: number;
    shipping: number;
    total: number;
  };
  reasoning: string;
}

export interface OrderItem {
  productName: string;
  quantity: number;
  weight?: number;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
  };
  fragile?: boolean;
  category?: string;
  value?: number;
}

export interface ShippingDetails {
  destination: string;
  distance?: number;
  carrier: string;
  urgency: 'standard' | 'express' | 'overnight';
  weatherConditions?: string;
}

export async function generatePackagingRecommendation(
  orderItems: OrderItem[],
  shippingDetails: ShippingDetails
): Promise<PackagingRecommendation> {
  try {
    const prompt = `
Ви експерт з упаковки та логістики в Україні. Проаналізуйте наступне замовлення та надайте детальні рекомендації щодо оптимальної упаковки.

ТОВАРИ У ЗАМОВЛЕННІ:
${orderItems.map((item, index) => `
${index + 1}. ${item.productName}
   - Кількість: ${item.quantity}
   - Вага: ${item.weight || 'не вказана'} кг
   - Розміри: ${item.dimensions ? `${item.dimensions.length}x${item.dimensions.width}x${item.dimensions.height} см` : 'не вказані'}
   - Категорія: ${item.category || 'не вказана'}
   - Крихкий: ${item.fragile ? 'так' : 'ні'}
   - Вартість: ${item.value || 'не вказана'} грн
`).join('')}

ДЕТАЛІ ДОСТАВКИ:
- Пункт призначення: ${shippingDetails.destination}
- Перевізник: ${shippingDetails.carrier}
- Терміновість: ${shippingDetails.urgency}
- Відстань: ${shippingDetails.distance || 'не вказана'} км
- Погодні умови: ${shippingDetails.weatherConditions || 'стандартні'}

Враховуйте українські стандарти упаковки, кліматичні умови, та специфіку роботи перевізників.

ВІДПОВІДЬ у JSON форматі:
{
  "packageType": "тип упаковки (коробка/мішок/паллета/тубус/конверт)",
  "dimensions": {
    "length": числове_значення_см,
    "width": числове_значення_см,
    "height": числове_значення_см,
    "unit": "см"
  },
  "estimatedWeight": загальна_вага_кг,
  "packagingMaterial": "матеріал упаковки",
  "protectionLevel": "standard|reinforced|fragile|hazardous",
  "specialInstructions": ["інструкція1", "інструкція2"],
  "estimatedCost": вартість_упаковки_грн,
  "carbonFootprint": {
    "packaging": вуглецевий_слід_упаковки_кг_CO2,
    "shipping": вуглецевий_слід_доставки_кг_CO2,
    "total": загальний_вуглецевий_слід_кг_CO2
  },
  "reasoning": "детальне пояснення вибору упаковки українською мовою"
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "Ви експерт з упаковки та логістики в Україні. Надавайте практичні, економічно обґрунтовані рекомендації. Відповідайте ТІЛЬКИ валідним JSON без додatkових пояснень."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 2000
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    // Валідація та встановлення значень за замовчуванням
    return {
      packageType: result.packageType || 'коробка',
      dimensions: {
        length: result.dimensions?.length || 30,
        width: result.dimensions?.width || 20,
        height: result.dimensions?.height || 15,
        unit: result.dimensions?.unit || 'см'
      },
      estimatedWeight: result.estimatedWeight || calculateTotalWeight(orderItems),
      packagingMaterial: result.packagingMaterial || 'гофрокартон',
      protectionLevel: result.protectionLevel || 'standard',
      specialInstructions: result.specialInstructions || [],
      estimatedCost: result.estimatedCost || 50,
      carbonFootprint: {
        packaging: result.carbonFootprint?.packaging || 0.5,
        shipping: result.carbonFootprint?.shipping || 2.0,
        total: result.carbonFootprint?.total || 2.5
      },
      reasoning: result.reasoning || 'Стандартна рекомендація на основі аналізу товарів'
    };

  } catch (error) {
    console.error("Error generating packaging recommendation:", error);
    
    // Повертаємо базову рекомендацію у випадку помилки
    return {
      packageType: 'коробка',
      dimensions: {
        length: 30,
        width: 20,
        height: 15,
        unit: 'см'
      },
      estimatedWeight: calculateTotalWeight(orderItems),
      packagingMaterial: 'гофрокартон',
      protectionLevel: 'standard',
      specialInstructions: ['Стандартна упаковка'],
      estimatedCost: 50,
      carbonFootprint: {
        packaging: 0.5,
        shipping: 2.0,
        total: 2.5
      },
      reasoning: 'Базова рекомендація через технічну помилку AI аналізу'
    };
  }
}

function calculateTotalWeight(orderItems: OrderItem[]): number {
  return orderItems.reduce((total, item) => {
    const itemWeight = item.weight || 1; // Припускаємо 1 кг якщо вага не вказана
    return total + (itemWeight * item.quantity);
  }, 0);
}

export async function analyzePackagingEfficiency(
  currentPackaging: PackagingRecommendation,
  orderItems: OrderItem[]
): Promise<{
  efficiency: number;
  suggestions: string[];
  costSavings: number;
}> {
  try {
    const prompt = `
Проаналізуйте ефективність поточної упаковки та надайте рекомендації для оптимізації:

ПОТОЧНА УПАКОВКА:
- Тип: ${currentPackaging.packageType}
- Розміри: ${currentPackaging.dimensions.length}x${currentPackaging.dimensions.width}x${currentPackaging.dimensions.height} см
- Матеріал: ${currentPackaging.packagingMaterial}
- Вартість: ${currentPackaging.estimatedCost} грн
- Вуглецевий слід: ${currentPackaging.carbonFootprint.total} кг CO2

ТОВАРИ:
${orderItems.map(item => `- ${item.productName} (${item.quantity} шт.)`).join('\n')}

Відповідь у JSON форматі:
{
  "efficiency": відсоток_ефективності_0_100,
  "suggestions": ["пропозиція1", "пропозиція2"],
  "costSavings": потенційна_економія_грн
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "Ви експерт з оптимізації упаковки. Оцініть ефективність та надайте конкретні поради для покращення."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 1000
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      efficiency: result.efficiency || 75,
      suggestions: result.suggestions || ['Розгляньте використання більш компактної упаковки'],
      costSavings: result.costSavings || 0
    };

  } catch (error) {
    console.error("Error analyzing packaging efficiency:", error);
    return {
      efficiency: 75,
      suggestions: ['Неможливо проаналізувати ефективність через технічну помилку'],
      costSavings: 0
    };
  }
}