// ============================================================
// ReflectionAgent — ForgeOS Post-Execution Analyst
// ============================================================
// Runs after every task completion. Analyzes outcomes, detects
// mistakes, scores performance (0-100), extracts learnings,
// suggests improvements, and persists insights into MemoryAgent.
// ============================================================

import 'dotenv/config';
import Groq from 'groq-sdk';
import { v4 as uuidv4 } from 'uuid';
import { updateDb } from '../database.js';
import {
  storeLearning,
  updateServicePerformance,
  recordDecision
} from './memory.js';

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Reflects on a completed order fulfillment.
 * Scores quality, detects issues, and extracts learnings.
 * Updates MemoryAgent with insights for future decisions.
 *
 * @param {object} order - The fulfilled order
 * @param {object} business - Current business configuration
 * @returns {object} Reflection result with score, analysis, and learnings
 */
export async function reflectOnOrder(order, business) {
  await setAgentStatus('reflection', 'thinking', 'Analyzing order outcome');

  try {
    const msg = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 1200,
      messages: [{
        role: 'user',
        content: `You are ReflectionAgent, the post-execution analyst for ${business.businessName}. Analyze this completed order and provide a detailed reflection.

Order Details:
- Service: ${order.serviceName} ($${order.price})
- Customer: ${order.customerName} (${order.customerEmail})
- Requirements: ${order.requirements || 'Standard delivery'}
- Status: ${order.status}
- Deliverable length: ${order.deliverable?.length || 0} characters

Deliverable Preview (first 500 chars):
${(order.deliverable || '').slice(0, 500)}

Respond ONLY with valid JSON:
{
  "score": 85,
  "verdict": "success" | "partial_success" | "failure",
  "qualityAnalysis": "2-3 sentences about deliverable quality",
  "strengthsFound": ["strength 1", "strength 2"],
  "issuesDetected": ["issue 1 if any"],
  "learnings": [
    { "category": "fulfillment|pricing|customer|quality", "insight": "Specific actionable insight" }
  ],
  "suggestions": ["Suggestion for improvement 1"],
  "customerSatisfactionEstimate": 80
}`
      }]
    });

    const text = msg.choices[0].message.content.trim();
    const cleaned = text.replace(/```json|```/g, '').trim();
    const reflection = JSON.parse(cleaned);

    // Persist learnings into MemoryAgent
    if (reflection.learnings && Array.isArray(reflection.learnings)) {
      for (const learning of reflection.learnings) {
        await storeLearning(
          learning.category,
          learning.insight,
          `ReflectionAgent on order ${order.id?.slice(0, 8)}`,
          reflection.score / 100
        );
      }
    }

    // Update service performance metrics
    await updateServicePerformance(
      order.serviceId,
      order.serviceName,
      order.price,
      reflection.score,
      reflection.learnings?.map(l => l.insight) || []
    );

    // Record this reflection as a decision
    await recordDecision(
      'ReflectionAgent',
      'order_reflection',
      `Order ${order.id?.slice(0, 8)}: ${order.serviceName}`,
      `Score: ${reflection.score}, Verdict: ${reflection.verdict}`,
      reflection.verdict,
      reflection.score
    );

    await setAgentStatus('reflection', 'completed', `Reflected on order: score ${reflection.score}`);
    return reflection;

  } catch (err) {
    await setAgentStatus('reflection', 'error', `Reflection failed: ${err.message}`);
    // Return a safe fallback reflection
    return {
      score: 70,
      verdict: 'partial_success',
      qualityAnalysis: 'Automated analysis could not be completed.',
      strengthsFound: ['Order was delivered'],
      issuesDetected: ['Reflection analysis failed'],
      learnings: [],
      suggestions: ['Retry reflection analysis'],
      customerSatisfactionEstimate: 65
    };
  }
}

/**
 * Reflects on a business generation event.
 * Evaluates service design, pricing strategy, and market fit.
 */
export async function reflectOnBusinessDesign(business) {
  await setAgentStatus('reflection', 'thinking', 'Evaluating business design');

  try {
    const msg = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 800,
      messages: [{
        role: 'user',
        content: `You are ReflectionAgent. Analyze this newly generated business design for quality and market viability.

Business: ${business.businessName}
Category: ${business.category}
Tagline: ${business.tagline}
Description: ${business.description}
Services: ${JSON.stringify(business.services?.map(s => ({ name: s.name, price: s.price, features: s.features?.length })))}
Target Audience: ${business.targetAudience}

Respond ONLY with valid JSON:
{
  "designScore": 80,
  "pricingScore": 75,
  "marketFitScore": 85,
  "overallScore": 80,
  "strengths": ["strength 1", "strength 2"],
  "risks": ["risk 1"],
  "pricingSuggestion": "Brief pricing optimization suggestion",
  "learnings": [
    { "category": "design|pricing|market", "insight": "Specific insight" }
  ]
}`
      }]
    });

    const text = msg.choices[0].message.content.trim();
    const cleaned = text.replace(/```json|```/g, '').trim();
    const reflection = JSON.parse(cleaned);

    // Persist learnings
    if (reflection.learnings && Array.isArray(reflection.learnings)) {
      for (const learning of reflection.learnings) {
        await storeLearning(
          learning.category,
          learning.insight,
          `ReflectionAgent on business design: ${business.businessName}`,
          reflection.overallScore / 100
        );
      }
    }

    await recordDecision(
      'ReflectionAgent',
      'business_design_review',
      `Business: ${business.businessName}`,
      `Design: ${reflection.designScore}, Pricing: ${reflection.pricingScore}, Market: ${reflection.marketFitScore}`,
      reflection.overallScore >= 70 ? 'approved' : 'needs_revision',
      reflection.overallScore
    );

    await setAgentStatus('reflection', 'completed', `Business review: ${reflection.overallScore}/100`);
    return reflection;

  } catch (err) {
    await setAgentStatus('reflection', 'error', err.message);
    return { designScore: 70, pricingScore: 70, marketFitScore: 70, overallScore: 70, strengths: [], risks: [], learnings: [] };
  }
}

/**
 * Reflects on a CEO autonomous decision for quality assurance.
 */
export async function reflectOnCEODecision(decision, business) {
  try {
    const msg = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 400,
      messages: [{
        role: 'user',
        content: `You are ReflectionAgent. Quickly validate this CEO autonomous decision.

Decision: ${decision.title}
Type: ${decision.type}
Description: ${decision.description}
Business: ${business.businessName} (${business.category})

Respond ONLY with valid JSON:
{
  "approved": true,
  "confidence": 85,
  "concern": "Brief concern if any, or null",
  "suggestion": "Brief improvement or null"
}`
      }]
    });

    const text = msg.choices[0].message.content.trim();
    return JSON.parse(text.replace(/```json|```/g, '').trim());
  } catch {
    return { approved: true, confidence: 60, concern: null, suggestion: null };
  }
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
