import fs from 'fs/promises';
import path from 'path';

const DB_PATH = process.env.VERCEL ? path.join('/tmp', 'db.json') : path.join(process.cwd(), 'data', 'db.json');

const INITIAL_DATA = {
  currentBusiness: null,
  orders: [],
  agentLogs: [],
  chatHistory: []
};

async function ensureDb() {
  try {
    await fs.access(DB_PATH);
  } catch {
    await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
    await fs.writeFile(DB_PATH, JSON.stringify(INITIAL_DATA, null, 2));
  }
}

export async function readDb() {
  await ensureDb();
  const data = await fs.readFile(DB_PATH, 'utf-8');
  return JSON.parse(data);
}

export async function writeDb(data) {
  await ensureDb();
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
}

export async function updateDb(updater) {
  const data = await readDb();
  const newData = updater(data);
  await writeDb(newData);
  return newData;
}
