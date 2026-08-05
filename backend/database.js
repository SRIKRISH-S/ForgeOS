import fs from 'fs/promises';
import path from 'path';

const DB_PATH = process.env.VERCEL ? path.join('/tmp', 'db.json') : path.join(process.cwd(), 'data', 'db.json');

// ============================================================
// ForgeOS Database Schema v2 — Autonomous Business Operating System
// Extends the original schema with memory, CEO decisions,
// execution traces, and real-time agent state tracking.
// ============================================================
const INITIAL_DATA = {
  // ---- Original Schema (preserved) ----
  currentBusiness: null,
  orders: [],
  agentLogs: [],
  chatHistory: [],

  // ---- Memory Store ----
  // Long-term knowledge base for MemoryAgent.
  // Stores customer profiles, service performance, decision history,
  // pricing benchmarks, and learned insights.
  memory: {
    customerProfiles: [],    // { id, name, email, orders, preferences, satisfaction, firstSeen, lastSeen }
    servicePerformance: [],  // { serviceId, name, totalOrders, successRate, avgScore, revenue, learnings }
    decisions: [],           // { id, type, agent, input, output, outcome, score, timestamp }
    learnings: [],           // { id, category, insight, source, confidence, createdAt }
    pricingHistory: [],      // { serviceId, oldPrice, newPrice, reason, impact, timestamp }
    conversationInsights: [] // { id, customerId, summary, sentiment, actionItems, timestamp }
  },

  // ---- CEO Autonomous Decisions ----
  // Log of every autonomous action taken by CEOAgent.
  ceoDecisions: [],
  // { id, type, title, description, impact, metrics, status, createdAt }
  // type: 'pricing_optimization' | 'promotion_launch' | 'service_creation' |
  //       'service_retirement' | 'growth_recommendation' | 'risk_alert'

  // ---- Execution Runs ----
  // Full trace of multi-agent collaborative reasoning chains.
  executionRuns: [],
  // {
  //   id, trigger, status, startedAt, completedAt,
  //   steps: [{ agent, goal, thought, action, observation, nextStep, status, duration }],
  //   retries: number, selfHealed: boolean
  // }

  // ---- Real-time Agent States ----
  // Live status for all 8 agents in the system.
  agentStates: {
    orchestrator:  { status: 'idle', lastAction: null, updatedAt: null },
    architect:     { status: 'idle', lastAction: null, updatedAt: null },
    sales:         { status: 'idle', lastAction: null, updatedAt: null },
    fulfillment:   { status: 'idle', lastAction: null, updatedAt: null },
    finance:       { status: 'idle', lastAction: null, updatedAt: null },
    memory:        { status: 'idle', lastAction: null, updatedAt: null },
    reflection:    { status: 'idle', lastAction: null, updatedAt: null },
    ceo:           { status: 'idle', lastAction: null, updatedAt: null }
  },
  // Valid statuses: 'idle' | 'planning' | 'thinking' | 'negotiating' |
  //                 'executing' | 'learning' | 'completed' | 'error'

  // ---- Business Health Metrics (computed by CEOAgent) ----
  businessHealth: {
    healthScore: 0,        // 0-100
    growthScore: 0,        // 0-100
    customerSatisfaction: 0, // 0-100
    riskLevel: 'low',     // 'low' | 'medium' | 'high' | 'critical'
    lastAnalyzedAt: null
  }
};

async function ensureDb() {
  try {
    await fs.access(DB_PATH);
  } catch {
    await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
    await fs.writeFile(DB_PATH, JSON.stringify(INITIAL_DATA, null, 2));
  }
}

/**
 * Ensures the loaded data has all schema keys.
 * Handles graceful migration when new fields are added to INITIAL_DATA
 * without losing existing persisted data.
 */
function migrateSchema(data) {
  const merged = { ...INITIAL_DATA, ...data };
  // Deep-merge nested objects that might be partially present
  if (data.memory) merged.memory = { ...INITIAL_DATA.memory, ...data.memory };
  if (data.agentStates) merged.agentStates = { ...INITIAL_DATA.agentStates, ...data.agentStates };
  if (data.businessHealth) merged.businessHealth = { ...INITIAL_DATA.businessHealth, ...data.businessHealth };
  return merged;
}

export async function readDb() {
  await ensureDb();
  const data = await fs.readFile(DB_PATH, 'utf-8');
  return migrateSchema(JSON.parse(data));
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
