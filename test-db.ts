import { prisma } from "./lib/prisma";

async function main() {
  try {
    console.log("Attempting to fetch inventory items...");
    const items = await prisma.inventoryItem.findMany();
    console.log("Success! Found " + items.length + " items.");
  } catch (error) {
    console.error("Connection failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
