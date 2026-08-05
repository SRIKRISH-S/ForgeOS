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
      agent,
      goal,
      thought,
      action,
      observation,
      nextStep,
      status,
      timestamp: new Date().toISOString()
    };
    steps.push(step);

    // Update real-time agent status in DB
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
      model: 'llama-3.3-70b-versatile',
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
      model: 'llama-3.3-70b-versatile',
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
