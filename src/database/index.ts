import { MongoClient, Db } from "mongodb";

const uri = process.env.DB_URL || "mongodb://localhost:27017";

const db_client = new MongoClient(uri);
let db_connection: Db;

export async function initDb() {
    try {
      await db_client.connect();
      db_connection = db_client.db(process.env.DB_NAME);
      console.log("Connected successfully to database");
    } catch {
      await db_client.close();
    }
}

export function db() {
  return db_connection;
}


