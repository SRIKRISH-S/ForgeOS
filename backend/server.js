import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import { architectBusiness, generateBusinessInsight } from './agents/architect.js';
import { fulfillOrder, generateSalesResponse, generateAgentActivity } from './agents/fulfillment.js';
import { createLocusCheckout, getWalletBalance, processWebhook, generateRevenueMetrics } from './agents/finance.js';
import { orchestrateBusinessLaunch } from './agents/orchestrator.js';
import { getMemoryState } from './agents/memory.js';
import { runCEOCycle, getCEODashboard } from './agents/ceo.js'; // Wait, let's verify path to ceo.js!
import { readDb, writeDb, updateDb } from './database.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());
const publicDir = process.env.VERCEL ? '/tmp/deliverables' : 'public';
app.use(process.env.VERCEL ? '/api/deliverables' : '/', express.static(publicDir));

app.use((req, res, next) => {
  if (process.env.VERCEL && !req.url.startsWith('/api')) {
    req.url = '/api' + req.url;
  }
  next();
});

// ============================================================
// Database Logging Helper
// ============================================================
async function addLog(agent, message, type = 'info') {
  const log = {
    id: uuidv4(),
    agent,
    message,
    type,
    timestamp: new Date().toISOString()
  };
  
  await updateDb(db => {
    db.agentLogs.unshift(log);
    if (db.agentLogs.length > 50) db.agentLogs.pop();
    return db;
  });
  
  return log;
}

// ============================================================
// MULTI-AGENT ORCHESTRATOR ROUTES
// ============================================================

// POST /api/business/orchestrate — Collaborative multi-agent launch pipeline
app.post('/api/business/orchestrate', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Business prompt required' });

    const result = await orchestrateBusinessLaunch(prompt);
    res.json(result);
  } catch (err) {
    console.error('[OrchestratorAgent] Launch Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Original legacy generate route (delegates to orchestrator for backward compatibility)
app.post('/api/business/generate', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Business prompt required' });

    const result = await orchestrateBusinessLaunch(prompt);
    res.json({ success: true, business: result.business });
  } catch (err) {
    console.error('[ArchitectAgent] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/business - Get current business
app.get('/api/business', async (req, res) => {
  const { currentBusiness } = await readDb();
  if (!currentBusiness) {
    return res.status(404).json({ error: 'No business launched yet' });
  }
  res.json(currentBusiness);
});

// GET /api/business/insight - Get strategic insight from ArchitectAgent
app.get('/api/business/insight', async (req, res) => {
  try {
    const { currentBusiness } = await readDb();
    if (!currentBusiness) return res.status(404).json({ error: 'No business active' });
    const insight = await generateBusinessInsight(currentBusiness);
    await addLog('ArchitectAgent', 'Generated strategic market insight', 'info');
    res.json({ insight });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/business/restore - Restore business configuration
app.post('/api/business/restore', async (req, res) => {
  try {
    const payload = req.body;
    if (!payload) return res.status(400).json({ error: 'Invalid restore payload' });
    
    const isFullDump = payload.currentBusiness !== undefined;
    const business = isFullDump ? payload.currentBusiness : payload;
    
    if (!business || !business.id) return res.status(400).json({ error: 'Invalid business config' });
    
    await updateDb(currentDb => {
      currentDb.currentBusiness = business;
      if (isFullDump) {
        if (payload.orders) currentDb.orders = payload.orders;
        if (payload.agentLogs) currentDb.agentLogs = payload.agentLogs;
        if (payload.chatHistory) currentDb.chatHistory = payload.chatHistory;
      }
      return currentDb;
    });
    await addLog('System', `Business configuration restored: ${business.businessName}`, 'info');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// SALES AGENT / ORDER ROUTES
// ============================================================

// POST /api/orders - Create a new order
app.post('/api/orders', async (req, res) => {
  try {
    let db = await readDb();
    
    if (!db.currentBusiness && req.body.business) {
      db.currentBusiness = req.body.business;
      await writeDb(db);
      await addLog('System', `Business auto-restored in order request: ${db.currentBusiness.businessName}`, 'info');
    }
    
    if (!db.currentBusiness) return res.status(404).json({ error: 'No business active' });
    
    const { serviceId, customerName, customerEmail, requirements } = req.body;
    const service = db.currentBusiness.services.find(s => s.id === serviceId);
    
    if (!service) return res.status(400).json({ error: 'Service not found' });

    const order = {
      id: uuidv4(),
      serviceId,
      serviceName: service.name,
      customerName,
      customerEmail,
      requirements: requirements || '',
      price: service.price,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    await addLog('SalesAgent', `New order received: ${service.name} from ${customerName} ($${service.price})`, 'success');

    // Create Locus Checkout session
    const checkout = await createLocusCheckout(order, db.currentBusiness);
    order.checkoutId = checkout.checkoutId;
    order.checkoutUrl = checkout.checkoutUrl;
    order.isDemoMode = checkout.isDemoMode;

    await updateDb(currentDb => {
      currentDb.orders.push(order);
      return currentDb;
    });

    if (checkout.isDemoMode) {
      await addLog('FinanceAgent', `[DEMO] Checkout session created — $${service.price} payment simulated`, 'info');
    } else {
      await addLog('FinanceAgent', `Digital Checkout created — awaiting payment for $${service.price}`, 'info');
    }

    res.json({ success: true, order, checkoutUrl: checkout.checkoutUrl });
  } catch (err) {
    console.error('[SalesAgent] Order error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/orders/:id/fulfill - Trigger AI fulfillment
app.post('/api/orders/:id/fulfill', async (req, res) => {
  try {
    let db = await readDb();
    
    if (!db.currentBusiness && req.body.business) {
      db.currentBusiness = req.body.business;
      await writeDb(db);
      await addLog('System', `Business auto-restored in fulfillment request: ${db.currentBusiness.businessName}`, 'info');
    }
    
    let orderIndex = db.orders.findIndex(o => o.id === req.params.id);
    if (orderIndex === -1 && req.body.order) {
      db.orders.push(req.body.order);
      await writeDb(db);
      orderIndex = db.orders.length - 1;
      await addLog('System', `Order auto-restored for fulfillment: ${req.params.id.slice(0, 8)}`, 'info');
    }
    
    if (orderIndex === -1) return res.status(404).json({ error: 'Order not found' });

    const order = db.orders[orderIndex];
    order.status = 'fulfilling';
    await writeDb(db);
    
    await addLog('FulfillmentAgent', `Starting fulfillment for order ${order.id.slice(0, 8)}... Service: ${order.serviceName}`, 'processing');

    const result = await fulfillOrder(order, db.currentBusiness);
    
    order.status = 'fulfilled';
    order.deliverable = result.deliverable;
    order.fileUrl = result.fileUrl;
    order.emailPreviewUrl = result.emailPreviewUrl;
    order.fulfilledAt = result.fulfilledAt;

    await writeDb(db);

    if (result.emailPreviewUrl) {
      await addLog('FulfillmentAgent', `Email sent to ${order.customerEmail}. Preview: ${result.emailPreviewUrl}`, 'success');
    }
    await addLog('FulfillmentAgent', `Order fulfilled successfully — deliverable available for download`, 'success');
    await addLog('FinanceAgent', `Revenue confirmed: $${order.price} — routing to digital wallet`, 'success');
    await addLog('ReflectionAgent', `Analyzing deliverable quality and updating MemoryAgent customer profile`, 'info');

    res.json({ success: true, order });
  } catch (err) {
    console.error('[FulfillmentAgent] Error:', err);
    await addLog('FulfillmentAgent', `Fulfillment error: ${err.message}`, 'error');
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders - Get all orders
app.get('/api/orders', async (req, res) => {
  const db = await readDb();
  if (!db.currentBusiness) {
    return res.status(404).json({ error: 'No business active' });
  }
  res.json(db.orders);
});

// POST /api/orders/:id/roadmap - Generate AI roadmap
app.post('/api/orders/:id/roadmap', async (req, res) => {
  try {
    let db = await readDb();
    
    if (!db.currentBusiness && req.body.business) {
      db.currentBusiness = req.body.business;
      await writeDb(db);
      await addLog('System', `Business auto-restored in roadmap request: ${db.currentBusiness.businessName}`, 'info');
    }
    
    let order = db.orders.find(o => o.id === req.params.id);
    if (!order && req.body.order) {
      db.orders.push(req.body.order);
      await writeDb(db);
      order = req.body.order;
      await addLog('System', `Order auto-restored for roadmap: ${req.params.id.slice(0, 8)}`, 'info');
    }
    
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const business = db.currentBusiness;
    const service = business.services.find(s => s.id === order.serviceId);

    const { default: Groq } = await import('groq-sdk');
    const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const msg = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 1800,
      messages: [{
        role: 'user',
        content: `You are ArchitectAgent, an elite AI business strategist. A customer just paid $${order.price} for "${service?.name || order.serviceName}" from ${business.businessName}.

Business category: ${business.category}
Business description: ${business.description}
Customer requirements: ${order.requirements || 'Standard delivery'}
Service features: ${service?.features?.join(', ') || 'Full service package'}

Generate a DETAILED, ACTIONABLE business development roadmap showing HOW this service will be delivered and what value the customer gains. Respond ONLY with valid JSON:
{
  "headline": "Short compelling headline (e.g. 'Your AI-Powered Growth Engine Activated')",
  "summary": "2-sentence executive summary of what will be built/delivered",
  "phases": [
    {
      "phase": 1,
      "title": "Phase title",
      "timeline": "e.g. Day 1-2",
      "icon": "emoji",
      "color": "#HEX",
      "steps": ["Specific action 1", "Specific action 2", "Specific action 3"]
    }
  ],
  "keyOutcomes": [
    { "metric": "e.g. +40% Organic Traffic", "description": "Brief explanation", "icon": "emoji" }
  ],
  "tools": ["Tool/technology 1", "Tool 2", "Tool 3"],
  "nextSteps": ["What the customer should prepare", "What to expect in their inbox", "How to track progress"],
  "estimatedROI": "e.g. 3-5x within 90 days"
}

Make it specific to ${business.category} and genuinely actionable. Include 3-4 phases and 3-4 key outcomes. Make it impressive and business-grade.`
      }]
    });

    const text = msg.choices[0].message.content.trim();
    const cleaned = text.replace(/```json|```/g, '').trim();
    const roadmap = JSON.parse(cleaned);

    await updateDb(currentDb => {
      const idx = currentDb.orders.findIndex(o => o.id === req.params.id);
      if (idx !== -1) currentDb.orders[idx].roadmap = roadmap;
      return currentDb;
    });

    await addLog('ArchitectAgent', `Business development roadmap generated for ${order.customerName}'s ${service?.name || order.serviceName} order`, 'success');
    res.json({ success: true, roadmap });
  } catch (err) {
    console.error('[RoadmapAgent] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/chat - Sales agent chat
app.post('/api/chat', async (req, res) => {
  try {
    let db = await readDb();
    
    if (!db.currentBusiness && req.body.business) {
      db.currentBusiness = req.body.business;
      await writeDb(db);
      await addLog('System', `Business auto-restored in chat request: ${db.currentBusiness.businessName}`, 'info');
    }
    
    if (!db.currentBusiness) return res.status(404).json({ error: 'No business active' });
    const { message } = req.body;
    
    const history = db.chatHistory.slice(-10);
    const response = await generateSalesResponse(message, db.currentBusiness, history);
    
    await updateDb(currentDb => {
      currentDb.chatHistory.push({ role: 'user', content: message });
      currentDb.chatHistory.push({ role: 'assistant', content: response });
      if (currentDb.chatHistory.length > 20) currentDb.chatHistory = currentDb.chatHistory.slice(-20);
      return currentDb;
    });

    await addLog('SalesAgent', `Handled customer inquiry: "${message.slice(0, 40)}..."`, 'info');
    res.json({ response });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// MEMORY AGENT ROUTES
// ============================================================

// GET /api/memory - Full memory store
app.get('/api/memory', async (req, res) => {
  try {
    const memory = await getMemoryState();
    res.json(memory);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// CEO AGENT & CONTINUOUS AUTONOMY ROUTES
// ============================================================

// GET /api/ceo/dashboard - CEO metrics & decision log
app.get('/api/ceo/dashboard', async (req, res) => {
  try {
    const ceoData = await getCEODashboard();
    res.json(ceoData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ceo/trigger - Manually trigger CEO cycle
app.post('/api/ceo/trigger', async (req, res) => {
  try {
    const report = await runCEOCycle();
    if (report) {
      await addLog('CEOAgent', `Autonomous growth cycle complete: Health ${report.healthScore}/100, ${report.decisions?.length || 0} decisions`, 'success');
    }
    res.json({ success: true, report });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// ARCHITECTURE & PLUGINS ROUTES
// ============================================================

// GET /api/architecture/status - Live topology state of all 8 agents
app.get('/api/architecture/status', async (req, res) => {
  const db = await readDb();
  res.json({
    businessName: db.currentBusiness?.businessName || 'ForgeOS Platform',
    agentStates: db.agentStates || {},
    executionRuns: (db.executionRuns || []).slice(0, 10),
    activeCount: Object.values(db.agentStates || {}).filter(a => a.status !== 'idle').length
  });
});

// GET /api/plugins - List registered plugin agents and tools
app.get('/api/plugins', async (req, res) => {
  const { getRegisteredPlugins } = await import('./plugins/index.js');
  const plugins = await getRegisteredPlugins();
  res.json({ plugins });
});

// ============================================================
// FINANCE AGENT ROUTES
// ============================================================

// GET /api/finance/wallet - Get wallet balance
app.get('/api/finance/wallet', async (req, res) => {
  try {
    const balance = await getWalletBalance();
    res.json(balance);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/finance/metrics - Revenue metrics
app.get('/api/finance/metrics', async (req, res) => {
  const { orders } = await readDb();
  const metrics = generateRevenueMetrics(orders);
  res.json(metrics);
});

// POST /api/webhooks/locus - Payment webhooks
app.post('/api/webhooks/locus', async (req, res) => {
  try {
    const event = await processWebhook(req.body, req.headers['locus-signature']);
    
    if (event.type === 'payment_received') {
      const db = await readDb();
      const order = db.orders.find(o => o.id === event.orderId);
      if (order) {
        order.status = 'paid';
        await writeDb(db);
        await addLog('FinanceAgent', `Payment received via Locus — $${order.price} settled`, 'success');
        
        const result = await fulfillOrder(order, db.currentBusiness);
        order.status = 'fulfilled';
        order.deliverable = result.deliverable;
        order.fileUrl = result.fileUrl;
        order.emailPreviewUrl = result.emailPreviewUrl;
        order.fulfilledAt = result.fulfilledAt;
        await writeDb(db);
        await addLog('FulfillmentAgent', `Auto-fulfilled order for ${order.customerName}`, 'success');
      }
    }
    
    res.json({ received: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// AGENT MONITORING
// ============================================================

// GET /api/logs - Agent activity feed
app.get('/api/logs', async (req, res) => {
  const db = await readDb();
  if (!db.currentBusiness) {
    return res.status(404).json({ error: 'No business active' });
  }
  res.json(db.agentLogs);
});

// GET /api/agents/activity - Heartbeat across all 8 agents
app.get('/api/agents/activity', async (req, res) => {
  const db = await readDb();
  if (!db.currentBusiness) return res.json({ activities: [] });
  
  const activities = await Promise.all([
    generateAgentActivity(db.currentBusiness, 'scanning'),
    generateAgentActivity(db.currentBusiness, 'processing'),
    generateAgentActivity(db.currentBusiness, 'financial')
  ]);

  const agentStates = db.agentStates || {};

  res.json({
    agents: [
      { id: 'orchestrator', name: 'OrchestratorAgent', status: agentStates.orchestrator?.status || 'active', activity: agentStates.orchestrator?.lastAction || 'Coordinating agent pipeline...' },
      { id: 'architect', name: 'ArchitectAgent', status: agentStates.architect?.status || 'active', activity: activities[0] },
      { id: 'sales', name: 'SalesAgent', status: agentStates.sales?.status || 'active', activity: activities[1] },
      { id: 'fulfillment', name: 'FulfillmentAgent', status: db.orders.some(o => o.status === 'fulfilling') ? 'busy' : (agentStates.fulfillment?.status || 'active'), activity: activities[1] },
      { id: 'finance', name: 'FinanceAgent', status: agentStates.finance?.status || 'active', activity: activities[2] },
      { id: 'memory', name: 'MemoryAgent', status: agentStates.memory?.status || 'active', activity: agentStates.memory?.lastAction || 'Indexing knowledge base & customer records' },
      { id: 'reflection', name: 'ReflectionAgent', status: agentStates.reflection?.status || 'active', activity: agentStates.reflection?.lastAction || 'Evaluating execution outcomes' },
      { id: 'ceo', name: 'CEOAgent', status: agentStates.ceo?.status || 'active', activity: agentStates.ceo?.lastAction || 'Monitoring business metrics & growth' }
    ]
  });
});

// ============================================================
// CONTINUOUS AUTONOMY TICKER (BACKGROUND WORKER)
// ============================================================
// Runs CEOAgent autonomous optimization cycle periodically in background
setInterval(async () => {
  try {
    const db = await readDb();
    if (db.currentBusiness) {
      await runCEOCycle();
    }
  } catch (err) {
    console.error('[Continuous Autonomy Worker Error]:', err.message);
  }
}, 60000); // Runs every 60 seconds

// ============================================================
// SERVER START
// ============================================================
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════╗
║            ForgeOS Backend v3.0                       ║
║     Autonomous Business Operating System              ║
╠═══════════════════════════════════════════════════════╣
║  Server: http://localhost:${PORT}                        ║
║  Agents: 8 Active Collaborating AI Agents             ║
║  Autonomy: Active (CEO ticker 60s background loop)    ║
║  Demo Mode: ${process.env.DEMO_MODE === 'true' ? 'YES (simulated payments)' : 'NO (live Locus)  '}  ║
╚═══════════════════════════════════════════════════════╝
    `);
  });
}

export default app;
