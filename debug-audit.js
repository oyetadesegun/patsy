const { PrismaClient } = require('@prisma/client');
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

  console.log("Connecting using standard Prisma Client...");

  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });

  try {
    console.log("Fetching audit logs...");
    const logs = await prisma.auditLog.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }
    });
    console.log("Successfully fetched logs:", logs.length);
    console.log(JSON.stringify(logs, null, 2));
  } catch (error) {
    console.error("Prisma Error Message:", error.message);
    console.error("Prisma Error Code:", error.code);
    console.error("Full Error Object:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
