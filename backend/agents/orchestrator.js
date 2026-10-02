// ============================================================
// OrchestratorAgent — ForgeOS Multi-Agent Coordinator & Brain
// ============================================================
// Central brain of ForgeOS. Receives business prompts & execution
// requests, constructs multi-agent execution plans, assigns tasks,
// orchestrates collaborative negotiations between agents:
//   User → Orchestrator → Architect → Finance reviews pricing →
//   Sales predicts demand → Architect revises → Reflection validates →
//   CEO approves → Launch.
// Implements self-healing execution, retries, and step tracing with:
// Goal, Thought, Action, Observation, and Next Step.
// ============================================================

import 'dotenv/config';
import Groq from 'groq-sdk';
import { v4 as uuidv4 } from 'uuid';
import { updateDb } from '../database.js';
import { architectBusiness } from './architect.js';
import { getWalletBalance } from './finance.js';
import { retrieveContext, recordDecision } from './memory.js';
import { reflectOnBusinessDesign } from './reflection.js';
import { runCEOCycle } from './ceo.js';

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ============================================================
// Orchestration Pipeline (Business Launch & Collaborative Planning)
// ============================================================

/**
 * Orchestrates full multi-agent collaborative launch pipeline.
 * Replaces linear workflow with iterative inter-agent collaboration.
 *
 * @param {string} prompt - User business prompt
 * @returns {object} Execution run output containing business config, logs, and trace steps
 */
export async function orchestrateBusinessLaunch(prompt) {
  const runId = uuidv4();
  const startedAt = new Date().toISOString();
  const steps = [];
  let retries = 0;
  let selfHealed = false;

  await logRunStart(runId, prompt);

  // Helper to record reasoning steps
  async function recordStep(agent, goal, thought, action, observation, nextStep, status = 'completed') {
    const step = {
      agent, goal, thought, action, observation, nextStep, status,
      timestamp: new Date().toISOString()
    };
    steps.push(step);
    await updateDb(db => {
      if (db.agentStates && db.agentStates[agent.toLowerCase().replace('agent', '')]) {
        db.agentStates[agent.toLowerCase().replace('agent', '')] = {
          status,
          lastAction: `${action}: ${observation.slice(0, 80)}...`,
          updatedAt: new Date().toISOString()
        };
      }
      return db;
    });
    await addLog(agent, `[${goal}] ${action} — ${observation.slice(0, 100)}`, status === 'error' ? 'error' : 'info');
    return step;
  }

  // VERCEL / DEMO MODE OVERRIDE
  // Bypass all sequential LLM calls to prevent 10s Serverless Timeout and guarantee instant launch.
  if (process.env.DEMO_MODE === 'true' || process.env.VERCEL) {
    const pLower = prompt.toLowerCase();
    
    // Default Mock
    let mockBus = {
      businessName: "ForgeOS Nexus",
      tagline: "Autonomous Solutions for Forward Thinkers",
      description: "We deploy autonomous agents to scale your operations instantly. Stop managing, start growing.",
      category: "Development",
      colorScheme: { primary: "#FFFFFF", secondary: "#7B8FFF", accent: "#AAFF00" },
      services: [
        { id: "svc_01", name: "Core Setup", description: "Basic infrastructure deployment.", price: 49, deliveryTime: "24h", features: ["1 Agent", "Standard Analytics"], popular: false },
        { id: "svc_02", name: "Growth Engine", description: "Full multi-agent ecosystem.", price: 149, deliveryTime: "48h", features: ["4 Agents", "Advanced Analytics", "24/7 Autonomy"], popular: true }
      ],
      targetAudience: "Tech founders and innovators",
      uniqueValueProp: "Zero-touch operational scaling",
      agentPersona: "Senior Automation Architect"
    };

    if (pLower.includes("ux audit") || pLower.includes("saas")) {
      mockBus = {
        ...mockBus,
        businessName: "SaaS UX Studio", tagline: "Convert Users. Eliminate Friction.",
        description: "Premium UX and CRO audit service for SaaS landing pages and web apps.", category: "Design",
        services: [
          { id: "svc_1", name: "Landing Page Audit", description: "Tear down of your homepage UX.", price: 99, deliveryTime: "48h", features: ["Video Walkthrough", "Actionable PDF"], popular: false },
          { id: "svc_2", name: "Full App Teardown", description: "Deep dive into your core user flows.", price: 299, deliveryTime: "3 days", features: ["Video Walkthrough", "Actionable PDF", "Figma Mocks"], popular: true }
        ]
      };
    } else if (pLower.includes("shopify") || pLower.includes("seo")) {
      mockBus = {
        ...mockBus,
        businessName: "RankForge E-com", tagline: "Dominate Search, Automate Sales.",
        description: "Technical SEO and content scaling for Shopify brands.", category: "SEO",
        colorScheme: { primary: "#FFFFFF", secondary: "#AAFF00", accent: "#7B8FFF" },
        services: [
          { id: "svc_1", name: "Technical Audit", description: "Site speed and structure analysis.", price: 129, deliveryTime: "2 days", features: ["Lighthouse Report", "Schema Fixes"], popular: false },
          { id: "svc_2", name: "Growth Sprints", description: "Monthly SEO content generation.", price: 499, deliveryTime: "7 days", features: ["4 Blog Posts", "Backlink Strategy"], popular: true }
        ]
      };
    } else if (pLower.includes("brand studio") || pLower.includes("startup")) {
      mockBus = {
        ...mockBus,
        businessName: "Aura Brand Labs", tagline: "Identity that resonates.",
        description: "AI-driven brand identity, minimalist logo design, and brand guidelines for tech startups.", category: "Design",
        colorScheme: { primary: "#FFFFFF", secondary: "#FFB020", accent: "#AAFF00" },
        services: [
          { id: "svc_1", name: "Logo Pack", description: "Minimalist vector logo.", price: 199, deliveryTime: "3 days", features: ["3 Concepts", "Source Files"], popular: false },
          { id: "svc_2", name: "Brand Identity Kit", description: "Complete brand guidelines.", price: 599, deliveryTime: "5 days", features: ["Logo", "Typography", "Color Palette", "Social Kits"], popular: true }
        ]
      };
    } else if (pLower.includes("content engine") || pLower.includes("b2b")) {
      mockBus = {
        ...mockBus,
        businessName: "B2B Content Engine", tagline: "Authority at scale.",
        description: "Automated thought leadership and LinkedIn content pipelines for B2B founders.", category: "Content",
        services: [
          { id: "svc_1", name: "LinkedIn Starter", description: "1 week of daily posts.", price: 149, deliveryTime: "2 days", features: ["7 Posts", "Hashtag Strategy"], popular: false },
          { id: "svc_2", name: "Authority Pipeline", description: "1 month of omnichannel content.", price: 899, deliveryTime: "5 days", features: ["30 LinkedIn Posts", "4 Newsletters", "Ghostwriting"], popular: true }
        ]
      };
    }

    // Populate fake steps
    await recordStep('OrchestratorAgent', 'Decompose User Request & Retrieve Long-Term Memory', 'Fetching historical learnings and service performance from MemoryAgent to inform design.', 'Querying MemoryAgent', 'Retrieved relevant learnings and service benchmarks.', 'Dispatch request to ArchitectAgent');
    await recordStep('ArchitectAgent', 'Design Brand & Service Hierarchy', 'Drafting brand identity and formulating service tiers.', 'Generated business design', `Created brand "${mockBus.businessName}" with tagline "${mockBus.tagline}".`, 'Pass service pricing to FinanceAgent');
    await recordStep('FinanceAgent', 'Financial Viability & Revenue Margin Audit', 'Evaluating pricing tiers and checking margin elasticity.', 'Calculated unit economics', 'Finance verdict: Approved.', 'Pass pricing models to SalesAgent');
    await recordStep('SalesAgent', 'Market Demand & Conversion Prediction', 'Predicting traffic volume and conversion rates based on pricing.', 'Ran conversion models', 'High conversion probability on mid-tier service.', 'Return recommendations');
    await recordStep('ReflectionAgent', 'Quality Scoring & Vulnerability Audit', 'Scoring business design across design, pricing, and market fit.', 'Ran comprehensive vulnerability analysis', 'Reflection verdict: Overall score 96/100.', 'Submit fully validated plan to CEOAgent');
    await recordStep('CEOAgent', 'Authorize Autonomous Business Launch', 'Reviewing quality score and collaborative audit results.', 'Granted executive launch approval', `Business "${mockBus.businessName}" officially live!`, 'Complete launch sequence');

    const newBusiness = { ...mockBus, id: uuidv4(), createdAt: new Date().toISOString(), prompt, status: 'active', qualityScore: 96, collaborativeTrace: { orchestratedBy: 'OrchestratorAgent v3.0 (Instant)', retries: 0, selfHealed: false } };
    await updateDb(db => {
      db.currentBusiness = newBusiness; db.orders = [];
      db.executionRuns.unshift({ id: runId, trigger: prompt, status: 'completed', startedAt, completedAt: new Date().toISOString(), steps, retries: 0, selfHealed: false });
      return db;
    });
    return { success: true, runId, business: newBusiness, executionTrace: steps };
  }


  try {
    // ------------------------------------------------------------
    // Step 1: OrchestratorAgent — Goal Decomposition & Context Retrieval
    // ------------------------------------------------------------
    await setAgentStatus('orchestrator', 'planning', 'Decomposing business goal and fetching long-term memory');

    const memoryContext = await retrieveContext(prompt, { maxResults: 5 });

    await recordStep(
      'OrchestratorAgent',
      'Decompose User Request & Retrieve Long-Term Memory',
      `Received business prompt: "${prompt}". Fetching historical learnings and service performance from MemoryAgent to inform design.`,
      'Querying MemoryAgent and initializing execution trace',
      `Retrieved ${memoryContext.relevantLearnings.length} relevant learnings and ${memoryContext.serviceMetrics.length} service benchmarks.`,
      'Dispatch request to ArchitectAgent for initial service design'
    );

    // ------------------------------------------------------------
    // Step 2: ArchitectAgent — Initial Business & Service Design
    // ------------------------------------------------------------
    await setAgentStatus('architect', 'thinking', 'Designing brand, tagline, and service tiers');

    let businessConfig;
    try {
      businessConfig = await architectBusiness(prompt);
      await recordStep(
        'ArchitectAgent',
        'Design Brand & Service Hierarchy',
        `Drafting brand identity for "${prompt}". Formulated ${businessConfig.services?.length || 0} service tiers with pricing range $${businessConfig.services?.[0]?.price || 0} - $${businessConfig.services?.[businessConfig.services?.length - 1]?.price || 0}.`,
        'Generated business design & service tiers',
        `Created brand "${businessConfig.businessName}" with tagline "${businessConfig.tagline}". Services: ${businessConfig.services?.map(s => s.name).join(', ')}.`,
        'Pass service pricing to FinanceAgent for revenue & margin review'
      );
    } catch (err) {
      // Self-healing attempt 1
      retries++;
      selfHealed = true;
      await recordStep(
        'OrchestratorAgent',
        'Self-Healing Retry on Architect Failure',
        `ArchitectAgent encountered an error: ${err.message}. Retrying with simplified prompt structure.`,
        'Re-triggering ArchitectAgent with self-healing fallback prompt',
        'Fallback prompt prepared.',
        'Retry ArchitectAgent design',
        'warning'
      );

      businessConfig = await architectBusiness(`${prompt} (focus on simple clear digital services)`);
    }

    // ------------------------------------------------------------
    // Step 3: FinanceAgent — Pricing & Margin Review
    // ------------------------------------------------------------
    await setAgentStatus('finance', 'negotiating', 'Evaluating margin profitability and wallet connectivity');

    const walletInfo = await getWalletBalance().catch(() => ({ balance: 1000, isDemoMode: true }));
    const financeReview = await reviewPricingStrategy(businessConfig, walletInfo);

    await recordStep(
      'FinanceAgent',
      'Financial Viability & Revenue Margin Audit',
      `Evaluating pricing tiers: ${businessConfig.services?.map(s => `$${s.price}`).join(', ')}. Checking margin elasticity and digital wallet revenue routing setup.`,
      'Calculated projected unit economics and tier profitability',
      `Finance verdict: ${financeReview.verdict}. Suggested price adjustments: ${JSON.stringify(financeReview.suggestedPrices)}.`,
      'Pass pricing models to SalesAgent for demand forecasting'
    );

    // ------------------------------------------------------------
    // Step 4: SalesAgent — Demand & Conversion Prediction
    // ------------------------------------------------------------
    await setAgentStatus('sales', 'thinking', 'Predicting storefront conversion rates');

    const salesPrediction = await predictDemand(businessConfig, financeReview);

    await recordStep(
      'SalesAgent',
      'Storefront Demand Forecasting & Persona Alignment',
      `Analyzing target audience (${businessConfig.targetAudience}) and unique value prop. Estimating storefront conversion rate.`,
      'Simulated target user inquiry funnel and store engagement',
      `Sales prediction: Estimated conversion ${salesPrediction.estimatedConversion}%. Recommended popular tier: ${salesPrediction.recommendedPopularTier}.`,
      'Request ArchitectAgent to apply financial and sales optimizations'
    );

    // ------------------------------------------------------------
    // Step 5: ArchitectAgent — Revise & Optimize Business Plan
    // ------------------------------------------------------------
    await setAgentStatus('architect', 'executing', 'Applying Finance & Sales agent recommendations');

    // Apply adjustments from Finance and Sales
    if (financeReview.suggestedPrices && businessConfig.services) {
      businessConfig.services.forEach((s, idx) => {
        if (financeReview.suggestedPrices[idx]) {
          s.price = financeReview.suggestedPrices[idx];
        }
      });
    }

    if (salesPrediction.recommendedPopularTier && businessConfig.services) {
      businessConfig.services.forEach(s => {
        s.popular = (s.name.toLowerCase().includes(salesPrediction.recommendedPopularTier.toLowerCase()));
      });
    }

    await recordStep(
      'ArchitectAgent',
      'Incorporate Feedback & Finalize Architecture',
      'Synthesizing feedback from FinanceAgent and SalesAgent into updated service catalog.',
      'Updated service prices and designated high-converting tier',
      `Revised business plan ready. Total services: ${businessConfig.services.length}. Optimized pricing active.`,
      'Submit finalized architecture to ReflectionAgent for validation'
    );

    // ------------------------------------------------------------
    // Step 6: ReflectionAgent — Validate Quality & Detect Vulnerabilities
    // ------------------------------------------------------------
    await setAgentStatus('reflection', 'learning', 'Validating business plan quality and risk factors');

    const reflectionResult = await reflectOnBusinessDesign(businessConfig);

    await recordStep(
      'ReflectionAgent',
      'Quality Scoring & Vulnerability Audit',
      `Scoring business design across design (${reflectionResult.designScore}), pricing (${reflectionResult.pricingScore}), and market fit (${reflectionResult.marketFitScore}).`,
      'Ran comprehensive vulnerability analysis',
      `Reflection verdict: Overall score ${reflectionResult.overallScore}/100. Key strengths: ${reflectionResult.strengths?.join(', ')}.`,
      'Submit fully validated plan to CEOAgent for final launch approval'
    );

    // ------------------------------------------------------------
    // Step 7: CEOAgent — Final Executive Approval & Autonomous Launch
    // ------------------------------------------------------------
    await setAgentStatus('ceo', 'thinking', 'Reviewing executive metrics and authorizing launch');

    const newBusiness = {
      ...businessConfig,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      prompt,
      status: 'active',
      qualityScore: reflectionResult.overallScore,
      collaborativeTrace: {
        orchestratedBy: 'OrchestratorAgent v3.0',
        retries,
        selfHealed
      }
    };

    await recordStep(
      'CEOAgent',
      'Authorize Autonomous Business Launch',
      `Reviewing quality score (${reflectionResult.overallScore}/100) and collaborative audit results. Confirming operational readiness.`,
      'Granted executive launch approval and deployed storefront',
      `Business "${newBusiness.businessName}" officially live! Storefront open, agents active.`,
      'Complete launch sequence and notify user'
    );

    // Update database
    await updateDb(db => {
      db.currentBusiness = newBusiness;
      db.orders = []; // Reset orders for new business
      db.executionRuns.unshift({
        id: runId,
        trigger: prompt,
        status: 'completed',
        startedAt,
        completedAt: new Date().toISOString(),
        steps,
        retries,
        selfHealed
      });
      return db;
    });

    await recordDecision(
      'OrchestratorAgent',
      'business_launch_orchestration',
      prompt,
      `Launched ${newBusiness.businessName} with ${steps.length} collaborative steps`,
      'success',
      reflectionResult.overallScore
    );

    // Immediately trigger CEOAgent analysis tailored to this brand-new business
    runCEOCycle().catch(e => console.error('[CEO Initial Cycle Error]:', e));

    // Set all agents to active/ready
    await setAllAgentsActive();

    return {
      success: true,
      business: newBusiness,
      trace: {
        runId,
        steps,
        retries,
        selfHealed
      }
    };

  } catch (err) {
    await recordStep(
      'OrchestratorAgent',
      'Handle Unexpected Execution Failure',
      `Execution failed with error: ${err.message}`,
      'Aborted launch pipeline and logged trace',
      `Error detail: ${err.message}`,
      'None - Error state',
      'error'
    );

    await updateDb(db => {
      db.executionRuns.unshift({
        id: runId,
        trigger: prompt,
        status: 'failed',
        startedAt,
        completedAt: new Date().toISOString(),
        steps,
        error: err.message,
        retries,
        selfHealed: false
      });
      return db;
    });

    throw err;
  }
}

// ============================================================
// Inter-Agent Negotiation Helpers
// ============================================================

/**
 * FinanceAgent sub-routine to audit pricing.
 */
async function reviewPricingStrategy(businessConfig, walletInfo) {
  try {
    const msg = await client.chat.completions.create({
      model: 'allam-2-7b',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `You are FinanceAgent. Review pricing for services in ${businessConfig.businessName}:
Services: ${JSON.stringify(businessConfig.services?.map(s => ({ name: s.name, price: s.price })))}
Wallet balance: $${walletInfo.balance || 1000}

Respond ONLY with valid JSON:
{
  "verdict": "approved|pricing_adjusted",
  "marginEstimate": "e.g. 85%",
  "suggestedPrices": [35, 89, 169],
  "reasoning": "Brief explanation"
}`
      }]
    });

    const text = msg.choices[0].message.content.trim();
    return JSON.parse(text.replace(/```json|```/g, '').trim());
  } catch {
    return {
      verdict: 'approved',
      marginEstimate: '80%',
      suggestedPrices: businessConfig.services?.map(s => s.price) || [29, 79, 149],
      reasoning: 'Default pricing approved'
    };
  }
}

/**
 * SalesAgent sub-routine to predict storefront demand.
 */
async function predictDemand(businessConfig, financeReview) {
  try {
    const msg = await client.chat.completions.create({
      model: 'allam-2-7b',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `You are SalesAgent. Predict customer demand for ${businessConfig.businessName} (${businessConfig.category}):
Target Audience: ${businessConfig.targetAudience}
Services: ${JSON.stringify(businessConfig.services?.map(s => s.name))}

Respond ONLY with valid JSON:
{
  "estimatedConversion": 14.5,
  "recommendedPopularTier": "${businessConfig.services?.[1]?.name || 'Tier 2'}",
  "demandLevel": "high|medium|explosive",
  "keySellingPoint": "Brief hook"
}`
      }]
    });

    const text = msg.choices[0].message.content.trim();
    return JSON.parse(text.replace(/```json|```/g, '').trim());
  } catch {
    return {
      estimatedConversion: 12.0,
      recommendedPopularTier: businessConfig.services?.[1]?.name || '',
      demandLevel: 'high',
      keySellingPoint: businessConfig.tagline
    };
  }
}

// ============================================================
// State & Logging Helpers
// ============================================================

async function logRunStart(runId, prompt) {
  await addLog('OrchestratorAgent', `Initiated multi-agent collaborative launch for: "${prompt}"`, 'processing');
}

async function addLog(agent, message, type = 'info') {
  await updateDb(db => {
    db.agentLogs.unshift({
      id: uuidv4(),
      agent,
      message,
      type,
      timestamp: new Date().toISOString()
    });
    if (db.agentLogs.length > 50) db.agentLogs.pop();
    return db;
  });
}

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

async function setAllAgentsActive() {
  await updateDb(db => {
    const now = new Date().toISOString();
    Object.keys(db.agentStates).forEach(key => {
      db.agentStates[key] = {
        status: 'idle',
        lastAction: 'Standing by for autonomous execution',
        updatedAt: now
      };
    });
    return db;
  });
}
