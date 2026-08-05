# ForgeOS — Autonomous Business Operating System

> **An Autonomous Business Operating System powered by collaborating AI agents that plan, reason, execute, learn, reflect, optimize and continuously grow digital businesses with minimal human intervention.**

---

## ⚡ Core Platform Capabilities

ForgeOS turns any business prompt into an autonomous, self-sustaining digital enterprise. Rather than relying on rigid linear scripts, ForgeOS orchestrates **8 specialized AI agents** that operate synchronously and asynchronously through a shared memory store and continuous feedback loop.

### 🧠 Multi-Agent Collaborative Architecture

| Agent | Core Function | Primary Capabilities |
|-------|---------------|----------------------|
| **OrchestratorAgent** | Central Brain & Coordinator | Prompt decomposition, multi-agent execution planning, self-healing error retries, task assignment |
| **ArchitectAgent** | Business & Service Designer | Brand identity generation, tagline crafting, service tier packaging, pricing architecture |
| **SalesAgent** | Storefront & Demand Specialist | Customer inquiry handling, storefront conversion optimization, sales demand forecasting |
| **FinanceAgent** | Digital Credit & Revenue Manager | Instant Digital Pay integration, margin elasticity audit, automated revenue routing |
| **FulfillmentAgent** | AI Service Delivery Pipeline | Automated deliverable artifact generation, file export (.md), Nodemailer transaction simulation |
| **MemoryAgent** | Long-Term Knowledge Store | Customer profile tracking, historical decision index, semantic memory retrieval before every turn |
| **ReflectionAgent** | Quality Audit & Learning Loop | Post-fulfillment quality scoring (0-100), mistake detection, actionable learning extraction |
| **CEOAgent** | Autonomous Growth & Governance | Continuous background analysis, dynamic pricing tweaks, promotional campaign launches, risk radar |

---

## 🔄 Multi-Agent Collaborative Execution Flow

ForgeOS replaces simple step-by-step automation with collaborative multi-agent negotiation:

```
User Prompt
    ↓
[OrchestratorAgent] — Retrieves historical learnings from MemoryAgent & decomposes goal
    ↓
[ArchitectAgent] — Formulates brand identity & initial service tier catalog
    ↓
[FinanceAgent] — Reviews profit margins, pricing elasticity & wallet balance
    ↓
[SalesAgent] — Simulates buyer demand & forecasts storefront conversion rate
    ↓
[ArchitectAgent] — Synthesizes feedback into optimized pricing & popular tiers
    ↓
[ReflectionAgent] — Audits design quality (0-100) & flags potential operational risks
    ↓
[CEOAgent] — Grants executive launch authorization & deploys live storefront
```

Every agent execution produces a structured reasoning step:
- **Goal**: Specific objective assigned to the agent.
- **Thought**: Strategic rationale and evaluation of memory context.
- **Action**: Tool call, calculation, or API operation executed.
- **Observation**: Empirical output or data returned.
- **Next Step**: Downstream agent handoff or state update.

---

## 🛠 Features & System Highlights

- 💾 **Long-Term Memory Store**: `MemoryAgent` maintains persistent customer profiles, past order performance, decision outcomes, and learned insights. Every agent queries memory before making strategic decisions.
- 🔍 **Reflection Loop**: `ReflectionAgent` runs post-fulfillment to score deliverable quality, detect vulnerabilities, and extract learnings that feed directly back into long-term memory.
- 👑 **Continuous Background Autonomy**: `CEOAgent` runs continuous background analysis cycles every 60 seconds—optimizing prices, launching promotional campaigns, assessing risk levels, and generating strategic reports even when no users are active.
- 🛡️ **Self-Healing Execution**: Automatic retry mechanism with prompt backoff, strategy adjustment, and cross-agent assistance whenever an agent encounters an error.
- 🔌 **Plugin & Tool Framework**: Extensible architecture supporting external browser agents (Puppeteer/Playwright), email delivery gateways, CRM sync (HubSpot/Salesforce), and social media auto-publishers.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js 18+
- Groq API Key ([Get one here](https://console.groq.com/keys))

### 1. Clone & Install Dependencies

```bash
# Backend setup
cd backend
npm install

# Frontend setup
cd ../frontend
npm install
```

### 2. Configure Environment

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:

```env
GROQ_API_KEY=gsk_your_groq_api_key

# Set to true to run with simulated instant digital payments & wallet
DEMO_MODE=true
```

### 3. Launch ForgeOS

Open two terminal windows:

```bash
# Terminal 1 — Express Backend API (Port 3001)
cd backend
npm start

# Terminal 2 — React + Vite Cyberpunk UI (Port 5173)
cd frontend
npm run dev
```

Navigate to [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🌐 Platform Pages & Navigation

1. **Launch**: Single-prompt business creation with live multi-agent collaborative negotiation trace.
2. **Storefront**: Customer-facing digital agency storefront with AI sales agent chat & Instant Digital Pay integration.
3. **Dashboard**: Agent Command Center featuring live statuses across all 8 agents, order fulfillment queue, and activity feed.
4. **Memory**: Long-term knowledge explorer showing learned insights, customer profiles, decision history, and memory search.
5. **CEO Dashboard**: Executive command center displaying Business Health Index, Growth Score, 24h revenue timeline, autonomous decision log, and risk radar.
6. **Architecture**: Interactive 8-agent topology visualizer, live status indicators, animated communication lines, reasoning chain step inspector, and plugin registry.

---

## 🏗️ Codebase Structure

```
ForgeOS/
├── backend/
│   ├── server.js              — Express API server & continuous autonomy ticker
│   ├── database.js            — File/Vercel JSON database with memory & execution schema
│   ├── agents/
│   │   ├── orchestrator.js    — OrchestratorAgent (Collaborative pipeline & self-healing)
│   │   ├── architect.js       — ArchitectAgent (Business & service tier design)
│   │   ├── sales.js           — SalesAgent (Storefront inquiries & demand prediction)
│   │   ├── fulfillment.js     — FulfillmentAgent (Service delivery & artifact creation)
│   │   ├── finance.js         — FinanceAgent (Digital wallet & revenue routing)
│   │   ├── memory.js          — MemoryAgent (Long-term vector/keyword knowledge store)
│   │   ├── reflection.js      — ReflectionAgent (Quality scoring & learning loop)
│   │   └── ceo.js             — CEOAgent (Autonomous growth & governance engine)
│   └── plugins/
│       └── index.js           — Plugin framework (Browser agents, CRM, Social, Email)
└── frontend/
    └── src/
        ├── App.jsx             — Main navigation & view router
        ├── index.css           — Cyberpunk theme styling tokens & animations
        └── pages/
            ├── Launch.jsx      — Multi-agent collaborative launch page
            ├── Storefront.jsx  — Customer storefront & AI sales agent
            ├── Dashboard.jsx   — Live agent status command center
            ├── MemoryPage.jsx  — Knowledge base & customer profile memory explorer
            ├── CEODashboard.jsx— Business health index & autonomous decisions log
            └── ArchitecturePage.jsx — Interactive agent topology map & step trace
```

---

## 💳 Payment Gateway & Revenue Routing

ForgeOS connects with **Instant Digital Pay** for zero-friction digital credit purchases and automated revenue routing:

```
Customer selects service → Digital credit checkout →
Payment settled → Webhook triggered → FulfillmentAgent delivers service →
Revenue credited to ForgeOS Wallet → Memory & Reflection updated
```

---

## 💼 Tech Stack

- **Frontend**: React 18, Vite, Custom Cyberpunk CSS Design System (Syncopate, Syne, DM Mono Google Fonts)
- **Backend**: Node.js, Express, File/Vercel Database Persistence
- **AI Intelligence**: Groq Llama 3 70B (via official Groq SDK)
- **Payment Processing**: Digital Wallet & Instant Checkout API
- **Deliverables Engine**: Nodemailer (Ethereal test previews), Markdown exporter

---

## 📜 License

MIT License — Built for autonomous enterprise operation.
