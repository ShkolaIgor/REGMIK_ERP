const { Pool } = require("@neondatabase/serverless");
const { drizzle } = require("drizzle-orm/neon-serverless");
const { eq, ilike } = require("drizzle-orm");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool });

// Імітація normalizeProductName
function normalizeProductName(name) {
  return name
    .toLowerCase()
    .replace(/[^\w\d]/g, '')
    .replace(/[іїєґ]/g, (char) => ({ 'і': 'i', 'ї': 'i', 'є': 'e', 'ґ': 'g' }[char]))
    .replace(/[абвгдеёжзийклмнопрстуфхцчшщъыьэюя]/g, (char) => {
      const mapping = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e',
        'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
        'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
        'ф': 'f', 'х': 'h', 'ц': 'c', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
        'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
      };
      return mapping[char] || char;
    })
    .replace(/[нксрвматехоуф]/g, (char) => {
      const mapping = {
        'н': 'h', 'с': 'c', 'к': 'k', 'р': 'p', 'в': 'b', 'м': 'm',
        'а': 'a', 'т': 't', 'е': 'e', 'х': 'x', 'о': 'o', 'у': 'y', 'ф': 'f'
      };
      return mapping[char] || char;
    });
}

async function testConnectorMatch() {
  const testName = "Роз'єм IDC-16";
  console.log(`🔍 Testing: ${testName}`);
  
  const normalized = normalizeProductName(testName);
  console.log(`Normalized: "${normalized}"`);
  
  // Get component with ID 85
  const component = await db.query.components.findFirst({
    where: eq(components.id, 85)
  });
  
  if (component) {
    console.log(`Component #85: "${component.name}"`);
    const normalizedComponent = normalizeProductName(component.name);
    console.log(`Normalized component: "${normalizedComponent}"`);
    
    // Check number matches
    const numberMatches = normalized.match(/\d+\.?\d*/g) || [];
    const componentNumbers = normalizedComponent.match(/\d+\.?\d*/g) || [];
    
    console.log(`Numbers in "${testName}": ${numberMatches}`);
    console.log(`Numbers in "${component.name}": ${componentNumbers}`);
    
    const commonNumbers = numberMatches.filter(num => componentNumbers.includes(num));
    console.log(`Common numbers: ${commonNumbers}`);
    
    // Check category blocking
    const isConnector = normalized.includes('rozyem') || normalized.includes('idc');
    const isCapacitor = normalizedComponent.includes('kondehcatop');
    
    console.log(`Is connector: ${isConnector}`);
    console.log(`Is capacitor: ${isCapacitor}`);
    console.log(`Should block: ${isConnector && isCapacitor}`);
  }
  
  await pool.end();
}

testConnectorMatch().catch(console.error);