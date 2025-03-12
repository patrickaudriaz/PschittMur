const { MongoClient } = require('mongodb');

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'pschittmur';

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  // If we already have a connection, use it
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  // If no connection, create a new one
  if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable');
  }

  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(DB_NAME);

  // Cache the client and db connection
  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

module.exports = { connectToDatabase }; 