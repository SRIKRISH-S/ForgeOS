import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import { architectBusiness, generateBusinessInsight } from './agents/architect.js';
import { fulfillOrder, generateSalesResponse, generateAgentActivity } from './agents/fulfillment.js';
import { createLocusCheckout, getWalletBalance, processWebhook, generateRevenueMetrics } from './agents/finance.js';
import { readDb, writeDb, updateDb } from './database.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());
const publicDir = process.env.VERCEL ? '/tmp/deliverables' : 'public';
app.use(process.env.VERCEL ? '/deliverables' : '/', express.static(publicDir));

// ============================================================
// Database Logic
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
// ARCHITECT AGENT ROUTES
// ============================================================

// POST /api/business/generate - Launch a new AI business
app.post('/api/business/generate', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Business prompt required' });

    const businessConfig = await architectBusiness(prompt);
    const newBusiness = {
      ...businessConfig,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      prompt,
      status: 'active'
    };

    await updateDb(db => {
      db.currentBusiness = newBusiness;
      db.orders = []; // Reset orders for new business
      return db;
    });

    await addLog('ArchitectAgent', `Business created: ${businessConfig.businessName}`, 'success');
    await addLog('SalesAgent', `Storefront is live — accepting orders for ${businessConfig.services.length} services`, 'success');
    await addLog('FinanceAgent', `Locus wallet connected — revenue routing configured`, 'success');

    res.json({ success: true, business: newBusiness });
  } catch (err) {
    console.error('[ArchitectAgent] Error:', err);
    addLog('ArchitectAgent', `Failed to generate business: ${err.message}`, 'error');
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

// ============================================================
// SALES AGENT / ORDER ROUTES
// ============================================================

// POST /api/orders - Create a new order
app.post('/api/orders', async (req, res) => {
  try {
    const db = await readDb();
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
      await addLog('FinanceAgent', `Locus Checkout created — awaiting payment for $${service.price}`, 'info');
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
    const db = await readDb();
    const orderIndex = db.orders.findIndex(o => o.id === req.params.id);
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
    await addLog('FinanceAgent', `Revenue confirmed: $${order.price} — routing to Locus wallet`, 'success');

    res.json({ success: true, order });
  } catch (err) {
    console.error('[FulfillmentAgent] Error:', err);
    await addLog('FulfillmentAgent', `Fulfillment error: ${err.message}`, 'error');
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders - Get all orders
app.get('/api/orders', async (req, res) => {
  const { orders } = await readDb();
  res.json(orders);
});

// POST /api/orders/:id/roadmap - Generate AI business development roadmap for a service
app.post('/api/orders/:id/roadmap', async (req, res) => {
  try {
    const { architectBusiness: _ab, generateBusinessInsight } = await import('./agents/architect.js');
    const db = await readDb();
    const order = db.orders.find(o => o.id === req.params.id);
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

    // Cache roadmap on order
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
    const db = await readDb();
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
// FINANCE AGENT ROUTES
// ============================================================

// GET /api/finance/wallet - Get Locus wallet balance
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

// POST /api/webhooks/locus - Locus payment webhooks
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
        
        // Auto-trigger fulfillment
        const result = await fulfillOrder(order, db.currentBusiness);
        order.status = 'fulfilled';
        order.deliverable = result.deliverable;
        order.fileUrl = result.fileUrl;
        order.emailPreviewUrl = result.emailPreviewUrl;
        order.fulfilledAt = result.fulfilledAt;
        await writeDb(db);
        await addLog('FulfillmentAgent', `Auto-fulfilled order for ${order.customerName}`, 'success');
        if (result.emailPreviewUrl) {
          await addLog('FulfillmentAgent', `Email sent. Preview: ${result.emailPreviewUrl}`, 'success');
        }
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
  const { agentLogs } = await readDb();
  res.json(agentLogs);
});

// GET /api/agents/activity - Simulated agent heartbeat
app.get('/api/agents/activity', async (req, res) => {
  const db = await readDb();
  if (!db.currentBusiness) return res.json({ activities: [] });
  
  const activities = await Promise.all([
    generateAgentActivity(db.currentBusiness, 'scanning'),
    generateAgentActivity(db.currentBusiness, 'processing'),
    generateAgentActivity(db.currentBusiness, 'financial')
  ]);

  res.json({
    agents: [
      { id: 'architect', name: 'ArchitectAgent', status: 'active', activity: activities[0] },
      { id: 'sales', name: 'SalesAgent', status: 'active', activity: activities[1] },
      { id: 'fulfillment', name: 'FulfillmentAgent', status: db.orders.some(o => o.status === 'fulfilling') ? 'busy' : 'active', activity: activities[1] },
      { id: 'finance', name: 'FinanceAgent', status: 'active', activity: activities[2] }
    ]
  });
});

// ============================================================
// SERVER START
// ============================================================
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════╗
║         ForgeOS Backend v1.0          ║
║   Autonomous AI Business Engine       ║
╠═══════════════════════════════════════╣
║  Server: http://localhost:${PORT}         ║
║  Demo Mode: ${process.env.DEMO_MODE === 'true' ? 'YES (simulated payments)' : 'NO (live Locus)  '}  ║
╚═══════════════════════════════════════╝
    `);
  });
}

export default app;
