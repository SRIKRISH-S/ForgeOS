// ============================================================
// MemoryAgent — ForgeOS Long-Term Knowledge System
// ============================================================
// Provides persistent memory across all agent operations.
// Stores customer profiles, service performance, decision history,
// pricing benchmarks, learned insights, and conversation summaries.
// Every agent calls MemoryAgent before making strategic decisions.
// ============================================================

import 'dotenv/config';
import Groq from 'groq-sdk';
import { v4 as uuidv4 } from 'uuid';
import { readDb, updateDb } from '../database.js';

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ============================================================
// Customer Profile Management
// ============================================================

/**
 * Upserts a customer profile from an order.
 * Creates a new profile or enriches an existing one.
 */
export async function upsertCustomerProfile(order) {
  await updateDb(db => {
    const existing = db.memory.customerProfiles.find(
      c => c.email === order.customerEmail
    );

    if (existing) {
      existing.orders.push({
        orderId: order.id,
        serviceId: order.serviceId,
        serviceName: order.serviceName,
        price: order.price,
        status: order.status,
        date: order.createdAt
      });
      existing.totalSpent = (existing.totalSpent || 0) + order.price;
      existing.lastSeen = new Date().toISOString();
    } else {
      db.memory.customerProfiles.push({
        id: uuidv4(),
        name: order.customerName,
        email: order.customerEmail,
        orders: [{
          orderId: order.id,
          serviceId: order.serviceId,
          serviceName: order.serviceName,
          price: order.price,
          status: order.status,
          date: order.createdAt
        }],
        totalSpent: order.price,
        preferences: [],
        satisfaction: null,
        firstSeen: new Date().toISOString(),
        lastSeen: new Date().toISOString()
      });
    }
    return db;
  });
}

// ============================================================
// Service Performance Tracking
// ============================================================

/**
 * Updates service performance metrics after fulfillment.
 * Tracks success rate, average score, and accumulated revenue.
 */
export async function updateServicePerformance(serviceId, serviceName, price, score, learnings = []) {
  await updateDb(db => {
    let perf = db.memory.servicePerformance.find(s => s.serviceId === serviceId);
    if (!perf) {
      perf = {
        serviceId,
        name: serviceName,
        totalOrders: 0,
        successCount: 0,
        successRate: 100,
        avgScore: 0,
        revenue: 0,
        learnings: []
      };
      db.memory.servicePerformance.push(perf);
    }

    perf.totalOrders += 1;
    if (score >= 60) perf.successCount += 1;
    perf.successRate = Math.round((perf.successCount / perf.totalOrders) * 100);
    perf.avgScore = Math.round(((perf.avgScore * (perf.totalOrders - 1)) + score) / perf.totalOrders);
    perf.revenue += price;
    if (learnings.length > 0) {
      perf.learnings.push(...learnings);
      if (perf.learnings.length > 20) perf.learnings = perf.learnings.slice(-20);
    }

    return db;
  });
}

// ============================================================
// Decision History
// ============================================================

/**
 * Records a decision made by any agent for future reference.
 */
export async function recordDecision(agent, type, input, output, outcome, score) {
  const decision = {
    id: uuidv4(),
    type,
    agent,
    input: typeof input === 'string' ? input : JSON.stringify(input).slice(0, 500),
    output: typeof output === 'string' ? output : JSON.stringify(output).slice(0, 500),
    outcome,
    score,
    timestamp: new Date().toISOString()
  };

  await updateDb(db => {
    db.memory.decisions.unshift(decision);
    if (db.memory.decisions.length > 100) db.memory.decisions = db.memory.decisions.slice(0, 100);
    return db;
  });

  return decision;
}

// ============================================================
// Learnings Store
// ============================================================

/**
 * Persists a learned insight derived by ReflectionAgent.
 */
export async function storeLearning(category, insight, source, confidence = 0.8) {
  const learning = {
    id: uuidv4(),
    category,
    insight,
    source,
    confidence,
    createdAt: new Date().toISOString()
  };

  await updateDb(db => {
    db.memory.learnings.unshift(learning);
    if (db.memory.learnings.length > 100) db.memory.learnings = db.memory.learnings.slice(0, 100);
    return db;
  });

  return learning;
}

// ============================================================
// Pricing History
// ============================================================

/**
 * Logs pricing changes for a service for trend analysis.
 */
export async function recordPricingChange(serviceId, oldPrice, newPrice, reason, impact = null) {
  await updateDb(db => {
    db.memory.pricingHistory.unshift({
      serviceId,
      oldPrice,
      newPrice,
      reason,
      impact,
      timestamp: new Date().toISOString()
    });
    if (db.memory.pricingHistory.length > 50) db.memory.pricingHistory = db.memory.pricingHistory.slice(0, 50);
    return db;
  });
}

// ============================================================
// Conversation Insights
// ============================================================

/**
 * Stores summarized insights from customer conversations.
 */
export async function storeConversationInsight(customerId, summary, sentiment, actionItems = []) {
  await updateDb(db => {
    db.memory.conversationInsights.unshift({
      id: uuidv4(),
      customerId,
      summary,
      sentiment,
      actionItems,
      timestamp: new Date().toISOString()
    });
    if (db.memory.conversationInsights.length > 50) {
      db.memory.conversationInsights = db.memory.conversationInsights.slice(0, 50);
    }
    return db;
  });
}

// ============================================================
// Context Retrieval — Called before every strategic decision
// ============================================================

/**
 * Retrieves relevant memory context for a given query/task.
 * This is called by other agents before making decisions to
 * ensure they leverage historical knowledge.
 */
export async function retrieveContext(query, options = {}) {
  const db = await readDb();
  const { maxResults = 5, includeCustomers = true, includeLearnings = true, includeDecisions = true } = options;

  const context = {
    relevantLearnings: [],
    relevantDecisions: [],
    customerContext: [],
    serviceMetrics: [],
    pricingTrends: []
  };

  // Use LLM to score relevance of learnings
  if (includeLearnings && db.memory.learnings.length > 0) {
    try {
      const msg = await client.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 600,
        messages: [{
          role: 'user',
          content: `You are MemoryAgent. Given a query and a list of past learnings, return the indices of the most relevant learnings (0-indexed) as a JSON array of numbers. Return at most ${maxResults} indices.

Query: "${query}"

Learnings:
${db.memory.learnings.slice(0, 30).map((l, i) => `[${i}] (${l.category}) ${l.insight}`).join('\n')}

Respond ONLY with a JSON array of indices, e.g. [0, 3, 7]. If none are relevant, return [].`
        }]
      });

      const text = msg.choices[0].message.content.trim();
      const indices = JSON.parse(text.replace(/```json|```/g, '').trim());
      if (Array.isArray(indices)) {
        context.relevantLearnings = indices
          .filter(i => i >= 0 && i < db.memory.learnings.length)
          .map(i => db.memory.learnings[i]);
      }
    } catch {
      // Fallback: return most recent learnings
      context.relevantLearnings = db.memory.learnings.slice(0, maxResults);
    }
  }

  // Recent decisions
  if (includeDecisions) {
    context.relevantDecisions = db.memory.decisions.slice(0, maxResults);
  }

  // Customer context
  if (includeCustomers) {
    context.customerContext = db.memory.customerProfiles.slice(0, maxResults);
  }

  // Service metrics
  context.serviceMetrics = db.memory.servicePerformance;

  // Pricing trends
  context.pricingTrends = db.memory.pricingHistory.slice(0, 10);

  return context;
}

/**
 * Returns the full memory state for the Memory Dashboard page.
 */
export async function getMemoryState() {
  const db = await readDb();
  return {
    customerProfiles: db.memory.customerProfiles,
    servicePerformance: db.memory.servicePerformance,
    decisions: db.memory.decisions.slice(0, 50),
    learnings: db.memory.learnings.slice(0, 50),
    pricingHistory: db.memory.pricingHistory.slice(0, 30),
    conversationInsights: db.memory.conversationInsights.slice(0, 30),
    stats: {
      totalCustomers: db.memory.customerProfiles.length,
      totalLearnings: db.memory.learnings.length,
      totalDecisions: db.memory.decisions.length,
      totalServices: db.memory.servicePerformance.length
    }
  };
}
