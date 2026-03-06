const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const fs = require('fs');
const path = require('path');

// Manually load .env
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim().replace(/^"(.*)"$/, '$1');
    }
  });
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is not set");
    return;
  }

  console.log("Connecting using PG Adapter...");

  const pool = new Pool({ 
    connectionString,
    connectionTimeoutMillis: 5000 
  });
  
  try {
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    console.log("Fetching audit logs...");
    const logs = await prisma.auditLog.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }
    });
    console.log("Successfully fetched logs:", logs.length);
    console.log(JSON.stringify(logs, null, 2));
    
    await prisma.$disconnect();
  } catch (error) {
    console.error("Prisma Error Message:", error.message);
    if (error.cause) {
      console.error("Prisma Error Cause:", error.cause);
    }
  } finally {
    await pool.end();
  }
}

main();
