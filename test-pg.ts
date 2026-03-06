import { Client } from "pg";
import * as dotenv from "dotenv";
dotenv.config();

async function testConnection() {
  const connectionString = process.env.DATABASE_URL;
  console.log("Connecting to:", connectionString?.split("@")[1]); // Log host part only for safety

  const client = new Client({
    connectionString,
    connectionTimeoutMillis: 5000,
  });

  try {
    console.log("Attempting direct connection...");
    await client.connect();
    console.log("Connected successfully!");
    const res = await client.query('SELECT COUNT(*) FROM "InventoryItem"');
    console.log("InventoryItem count:", res.rows[0].count);
  } catch (err) {
    console.error("Connection error Details:", err.message);
    if (err.stack) console.error(err.stack);
  } finally {
    await client.end();
  }
}

testConnection();
