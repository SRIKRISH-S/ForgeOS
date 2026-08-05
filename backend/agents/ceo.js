// ============================================================
// CEOAgent — ForgeOS Autonomous Business Growth Engine
// ============================================================
// Runs periodically (or on demand). Analyzes revenue, customer
// feedback, conversion rates, and pricing. Launches promotions,
// recommends new services, retires poor performers, and
// continuously grows the business without human intervention.
// ============================================================

import 'dotenv/config';
import Groq from 'groq-sdk';
import { v4 as uuidv4 } from 'uuid';
import { readDb, updateDb } from '../database.js';
import { retrieveContext, recordDecision, storeLearning, recordPricingChange } from './memory.js';
import { reflectOnCEODecision } from './reflection.js';

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ============================================================
// Main CEO Analysis Cycle
// ============================================================

/**
 * Runs a full CEO analysis cycle. Evaluates business health,
 * generates autonomous decisions, and updates business metrics.
 * Called periodically by the background worker or manually.
 *
 * @returns {object} CEO report with health metrics and decisions
 */
export async function runCEOCycle() {
  const db = await readDb();
  if (!db.currentBusiness) return null;

  await setAgentStatus('ceo', 'thinking', 'Analyzing business performance');

  const business = db.currentBusiness;
  const orders = db.orders || [];
  const memoryContext = await retrieveContext('business performance revenue growth', {
    maxResults: 5,
    includeCustomers: true,
    includeLearnings: true,
    includeDecisions: true
  });

  // Compute metrics
  const totalRevenue = orders
    .filter(o => o.status === 'fulfilled' || o.status === 'paid')
    .reduce((sum, o) => sum + (o.price || 0), 0);
  const totalOrders = orders.length;
  const fulfilledOrders = orders.filter(o => o.status === 'fulfilled').length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / Math.max(fulfilledOrders, 1)) : 0;
  const fulfillmentRate = totalOrders > 0 ? Math.round((fulfilledOrders / totalOrders) * 100) : 0;

  // Service-level revenue breakdown
  const serviceRevenue = {};
  orders.filter(o => o.status === 'fulfilled' || o.status === 'paid').forEach(o => {
    serviceRevenue[o.serviceName] = (serviceRevenue[o.serviceName] || 0) + o.price;
  });

  try {
    await setAgentStatus('ceo', 'negotiating', 'Generating strategic recommendations');

    const msg = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: `You are CEOAgent, the autonomous business growth engine for ${business.businessName}.

BUSINESS STATE:
- Category: ${business.category}
- Services: ${JSON.stringify(business.services?.map(s => ({ name: s.name, price: s.price })))}
- Total Revenue: $${totalRevenue}
- Total Orders: ${totalOrders} (${fulfilledOrders} fulfilled, ${pendingOrders} pending)
- Avg Order Value: $${avgOrderValue}
- Fulfillment Rate: ${fulfillmentRate}%
- Service Revenue: ${JSON.stringify(serviceRevenue)}

MEMORY CONTEXT:
- Recent learnings: ${memoryContext.relevantLearnings.map(l => l.insight).join('; ') || 'None yet'}
- Service performance: ${JSON.stringify(memoryContext.serviceMetrics.map(s => ({ name: s.name, score: s.avgScore, orders: s.totalOrders })))}
- Recent decisions: ${memoryContext.relevantDecisions.slice(0, 3).map(d => d.output).join('; ') || 'None yet'}

Analyze the business and produce an autonomous CEO report. Respond ONLY with valid JSON:
{
  "healthScore": 75,
  "growthScore": 60,
  "customerSatisfaction": 80,
  "riskLevel": "low|medium|high|critical",
  "executiveSummary": "2-3 sentence summary of current state",
  "revenueTrend": "growing|stable|declining",
  "decisions": [
    {
      "type": "pricing_optimization|promotion_launch|service_creation|service_retirement|growth_recommendation|risk_alert",
      "title": "Short decision title",
      "description": "What to do and why",
      "impact": "Expected impact",
      "priority": "high|medium|low"
    }
  ],
  "recommendations": [
    "Actionable recommendation 1",
    "Actionable recommendation 2"
  ],
  "risks": [
    { "risk": "Risk description", "severity": "high|medium|low", "mitigation": "How to address" }
  ]
}`
      }]
    });

    const text = msg.choices[0].message.content.trim();
    const cleaned = text.replace(/```json|```/g, '').trim();
    const report = JSON.parse(cleaned);

    // Persist CEO decisions
    const persistedDecisions = [];
    if (report.decisions && Array.isArray(report.decisions)) {
      for (const decision of report.decisions) {
        const d = {
          id: uuidv4(),
          ...decision,
          status: 'proposed',
          metrics: {
            revenueAtTime: totalRevenue,
            ordersAtTime: totalOrders,
            fulfillmentRate
          },
          createdAt: new Date().toISOString()
        };

        // Have ReflectionAgent validate the decision
        const validation = await reflectOnCEODecision(d, business);
        d.reflectionApproved = validation.approved;
        d.reflectionConfidence = validation.confidence;
        d.reflectionConcern = validation.concern;

        if (validation.approved) {
          d.status = 'approved';
        }

        persistedDecisions.push(d);
      }
    }

    // Update database with CEO analysis results
    await updateDb(db => {
      db.businessHealth = {
        healthScore: report.healthScore || 0,
        growthScore: report.growthScore || 0,
        customerSatisfaction: report.customerSatisfaction || 0,
        riskLevel: report.riskLevel || 'low',
        lastAnalyzedAt: new Date().toISOString()
      };

      db.ceoDecisions.unshift(...persistedDecisions);
      if (db.ceoDecisions.length > 50) db.ceoDecisions = db.ceoDecisions.slice(0, 50);

      return db;
    });

    // Store learnings from CEO analysis
    await storeLearning(
      'business_strategy',
      `CEO cycle: Health ${report.healthScore}/100, Growth ${report.growthScore}/100. ${report.executiveSummary}`,
      'CEOAgent periodic analysis',
      report.healthScore / 100
    );

    await recordDecision(
      'CEOAgent',
      'periodic_analysis',
      `Business state: $${totalRevenue} rev, ${totalOrders} orders`,
      `Health: ${report.healthScore}, Growth: ${report.growthScore}, Decisions: ${persistedDecisions.length}`,
      report.healthScore >= 60 ? 'healthy' : 'needs_attention',
      report.healthScore
    );

    await setAgentStatus('ceo', 'completed', `Analysis complete: Health ${report.healthScore}/100`);

    return {
      ...report,
      decisions: persistedDecisions,
      computedMetrics: {
        totalRevenue,
        totalOrders,
        fulfilledOrders,
        pendingOrders,
        avgOrderValue,
        fulfillmentRate,
        serviceRevenue
      }
    };

  } catch (err) {
    await setAgentStatus('ceo', 'error', `CEO cycle failed: ${err.message}`);
    return {
      healthScore: 50,
      growthScore: 50,
      customerSatisfaction: 50,
      riskLevel: 'medium',
      executiveSummary: 'CEO analysis could not be completed.',
      decisions: [],
      recommendations: [],
      risks: [],
      computedMetrics: { totalRevenue, totalOrders, fulfilledOrders, pendingOrders, avgOrderValue, fulfillmentRate, serviceRevenue }
    };
  }
}

// ============================================================
// CEO Dashboard Data Provider
// ============================================================

/**
 * Retrieves the full CEO dashboard state for the frontend.
 */
export async function getCEODashboard() {
  const db = await readDb();

  const orders = db.orders || [];
  const totalRevenue = orders
    .filter(o => o.status === 'fulfilled' || o.status === 'paid')
    .reduce((sum, o) => sum + (o.price || 0), 0);

  // Revenue timeline (hourly breakdown for the last 24 hours)
  const now = new Date();
  const revenueTimeline = [];
  for (let i = 23; i >= 0; i--) {
    const hourStart = new Date(now - i * 3600000);
    const hourEnd = new Date(now - (i - 1) * 3600000);
    const hourRevenue = orders
      .filter(o => {
        const t = new Date(o.createdAt);
        return t >= hourStart && t < hourEnd && (o.status === 'fulfilled' || o.status === 'paid');
      })
      .reduce((s, o) => s + o.price, 0);
    revenueTimeline.push({
      hour: hourStart.getHours(),
      revenue: hourRevenue
    });
  }

  return {
    businessHealth: db.businessHealth || { healthScore: 0, growthScore: 0, customerSatisfaction: 0, riskLevel: 'low' },
    decisions: db.ceoDecisions.slice(0, 20),
    totalRevenue,
    totalOrders: orders.length,
    fulfilledOrders: orders.filter(o => o.status === 'fulfilled').length,
    pendingOrders: orders.filter(o => o.status === 'pending').length,
    revenueTimeline,
    serviceBreakdown: db.memory.servicePerformance || []
  };
}

// ============================================================
// Agent State Helper
// ============================================================

async function setAgentStatus(agentKey, status, lastAction) {
  await updateDb(db => {
    if (db.agentStates && db.agentStates[agentKey]) {
      db.agentStates[agentKey] = {
        status,
        lastAction,
        updatedAt: new Date().toISOString()
      };
    }
    return db;
  });
}
