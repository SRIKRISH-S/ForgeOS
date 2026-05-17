# ForgeOS — Autonomous AI Business Engine
### Built for Locus' Paygentic Hackathon — LocusFounder Track

> **One prompt. Four AI agents. A fully autonomous digital business.**

ForgeOS lets you launch any digital services business by typing a single sentence. Four specialized AI agents then run the entire operation — designing services, handling customers, fulfilling orders with Claude AI, and routing revenue through Locus — completely autonomously.

---

## 🎯 What Makes ForgeOS Win-Worthy

The judging criterion is: *"make you forget there was no person running the business."*

ForgeOS achieves this by deploying four Claude-powered agents that never sleep:

| Agent | Role |
|-------|------|
| **ArchitectAgent** | Designs your business, services, and pricing from a single prompt |
| **SalesAgent** | Handles customer inquiries and storefront operations |
| **FulfillmentAgent** | Delivers every service using Claude AI — zero human touch |
| **FinanceAgent** | Routes all revenue through Locus Checkout and Locus wallets |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- A Groq API key ([get one here](https://console.groq.com/keys))
- A Locus account ([sign up here](https://locusfinance.io)) — *or run in DEMO_MODE first*

### 1. Clone & Install

```bash
# Install backend
cd backend
npm install

# Install frontend
cd ../frontend
npm install
```

### 2. Configure Environment

```bash
cd backend
cp .env.example .env
```

Edit `.env`:

```env
# Required: Get from https://console.groq.com/keys
GROQ_API_KEY=gsk_...

# Locus Integration (see "Locus Setup" section below)
LOCUS_API_KEY=your_locus_api_key
LOCUS_WEBHOOK_SECRET=your_webhook_secret
LOCUS_WALLET_ID=your_wallet_id

# Set to true to test without real Locus keys
DEMO_MODE=true
```

### 3. Run the App

Open two terminals:

```bash
# Terminal 1 — Backend
cd backend
npm start

# Terminal 2 — Frontend
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) 🎉

---

## 💳 Locus Integration Setup

ForgeOS integrates with **Locus Checkout** for payments and **Locus Wallets** for revenue routing.

### Step 1: Create a Locus Account
1. Go to [locusfinance.io](https://locusfinance.io)
2. Sign up as a developer
3. Navigate to **Dashboard → API Keys**

### Step 2: Get Your API Keys
Copy these from your Locus dashboard:
- `LOCUS_API_KEY` — Your main API key
- `LOCUS_WEBHOOK_SECRET` — For verifying payment webhooks

### Step 3: Create a Wallet
1. In Locus Dashboard → **Wallets → Create Wallet**
2. Copy the Wallet ID → `LOCUS_WALLET_ID`

This wallet receives all revenue from your autonomous business.

### Step 4: Configure Webhooks
In Locus Dashboard → **Webhooks → Add Endpoint**:
- URL: `https://your-domain.com/api/webhooks/locus`
- Events: `checkout.completed`, `payout.processed`

When a customer pays, Locus fires a webhook → ForgeOS auto-triggers AI fulfillment.

### Payment Flow
```
Customer clicks "Pay" → Locus Checkout Session created →
Customer pays → Locus fires webhook → ForgeOS receives event →
FulfillmentAgent delivers service → Revenue in your Locus wallet
```

---

## 🏗 Architecture

```
forgeOS/
├── backend/
│   ├── server.js              — Express API server
│   ├── agents/
│   │   ├── architect.js       — Business generation (Claude)
│   │   ├── fulfillment.js     — Service delivery (Claude)
│   │   └── finance.js         — Locus payment integration
│   └── .env.example
└── frontend/
    └── src/
        ├── App.jsx             — Main app + navigation
        └── pages/
            ├── Launch.jsx      — Business prompt interface
            ├── Storefront.jsx  — Customer-facing storefront
            └── Dashboard.jsx  — Agent command center
```

### API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/business/generate` | Launch a new business from a prompt |
| `GET` | `/api/business` | Get current business config |
| `POST` | `/api/orders` | Create a new order |
| `POST` | `/api/orders/:id/fulfill` | Trigger AI fulfillment |
| `GET` | `/api/orders` | List all orders |
| `POST` | `/api/chat` | AI sales agent chat |
| `GET` | `/api/finance/wallet` | Locus wallet balance |
| `POST` | `/api/webhooks/locus` | Locus payment webhook |
| `GET` | `/api/logs` | Agent activity feed |
| `GET` | `/api/agents/activity` | Live agent statuses |

---

## 💡 Example Business Prompts

```
"Premium SEO audit service for Shopify stores"
"AI logo design studio for tech startups"
"Business plan writing service for first-time founders"
"LinkedIn content writing agency for B2B companies"
"UX audit service for SaaS landing pages"
"Market research report service for entrepreneurs"
```

---

## 🔧 Production Deployment

### Backend (Railway / Render / Fly.io)
```bash
# Set environment variables in your hosting dashboard
# Deploy from /backend directory
npm start
```

### Frontend (Vercel / Netlify)
```bash
cd frontend
npm run build
# Deploy the dist/ folder
```

Update `vite.config.js` proxy to point to your production backend URL.

---

## 📊 Demo Mode

Set `DEMO_MODE=true` in `.env` to run without real Locus credentials:
- Payments are simulated
- Wallet shows demo balance
- All AI fulfillment still works with real Claude API
- Perfect for hackathon demos

---

## 🛠 Tech Stack

- **Frontend**: React 18, Vite, Custom CSS (no UI library — all hand-crafted)
- **Backend**: Node.js, Express
- **AI**: Groq Llama 3 70B (via official SDK)
- **Payments**: Locus Checkout + Locus Wallets
- **Fonts**: Syncopate, Syne, DM Mono (Google Fonts)

---

## 🔮 What's Next (Post-Hackathon)

- **Email delivery**: Nodemailer integration to send deliverables to customers
- **Stripe fallback**: Optional payment gateway alongside Locus
- **Business analytics**: Real conversion tracking and A/B testing
- **Multi-business**: Run multiple autonomous businesses from one ForgeOS account
- **Customer portal**: Let customers track and download their orders
- **Auto-marketing**: SalesAgent creates and posts content to attract customers

---

Built with ❤️ for the **Locus' Paygentic Hackathon** — LocusFounder Track

*"The best projects are those that make you forget there was no person running the business."*
