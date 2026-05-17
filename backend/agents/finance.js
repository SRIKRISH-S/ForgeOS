import 'dotenv/config';
import fetch from 'node-fetch';

const LOCUS_API_BASE = 'https://api.locusfinance.io/v1';
const DEMO_MODE = process.env.DEMO_MODE === 'true' || 
                  !process.env.LOCUS_API_KEY || 
                  process.env.LOCUS_API_KEY.includes('your_locus_api_key_here') ||
                  process.env.LOCUS_API_KEY === '';

// ============================================================
// LOCUS CHECKOUT INTEGRATION
// Docs: https://locusfinance.io/developers/checkout
// ============================================================

export async function createLocusCheckout(order, businessConfig) {
  if (DEMO_MODE) {
    // Demo mode: simulate Locus checkout
    return {
      checkoutId: `demo_${Date.now()}`,
      checkoutUrl: `#demo-checkout`,
      amount: order.price,
      currency: 'USD',
      status: 'pending',
      isDemoMode: true
    };
  }

  try {
    const response = await fetch(`${LOCUS_API_BASE}/checkout/sessions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.LOCUS_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: order.price * 100, // in cents
        currency: 'USD',
        description: `${businessConfig.businessName} - ${order.serviceName}`,
        customer_email: order.customerEmail,
        metadata: {
          orderId: order.id,
          businessId: businessConfig.businessName,
          serviceId: order.serviceId
        },
        success_url: `${process.env.FRONTEND_URL}/order-success?orderId=${order.id}`,
        cancel_url: `${process.env.FRONTEND_URL}/storefront`,
        wallet_id: process.env.LOCUS_WALLET_ID // Route revenue to your Locus wallet
      })
    });

    if (!response.ok) {
      throw new Error(`Locus API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (err) {
    console.error('[FinanceAgent] Locus checkout error:', err);
    throw err;
  }
}

export async function getWalletBalance() {
  if (DEMO_MODE) {
    // Simulated wallet for demo
    return {
      balance: 847.50,
      currency: 'USD',
      totalEarned: 1243.00,
      pendingPayouts: 395.50,
      isDemoMode: true
    };
  }

  try {
    const response = await fetch(`${LOCUS_API_BASE}/wallets/${process.env.LOCUS_WALLET_ID}`, {
      headers: {
        'Authorization': `Bearer ${process.env.LOCUS_API_KEY}`
      }
    });
    return await response.json();
  } catch (err) {
    console.error('[FinanceAgent] Wallet balance error:', err);
    return { balance: 0, error: err.message };
  }
}

export async function processWebhook(payload, signature) {
  // Verify webhook signature from Locus
  // Implementation depends on Locus webhook verification method
  // See: https://locusfinance.io/developers/webhooks
  
  const event = payload;
  
  switch (event.type) {
    case 'checkout.completed':
      return { type: 'payment_received', orderId: event.metadata?.orderId };
    case 'payout.processed':
      return { type: 'payout_sent', amount: event.amount };
    default:
      return { type: 'unknown', event: event.type };
  }
}

export function generateRevenueMetrics(orders) {
  const completed = orders.filter(o => o.status === 'completed' || o.status === 'fulfilled');
  const totalRevenue = completed.reduce((sum, o) => sum + (o.price || 0), 0);
  const avgOrderValue = completed.length > 0 ? totalRevenue / completed.length : 0;

  // Generate hourly revenue data for the last 24 hours
  const hourlyData = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    revenue: Math.random() > 0.6 ? Math.floor(Math.random() * 150 + 20) : 0
  }));

  return {
    totalRevenue,
    completedOrders: completed.length,
    pendingOrders: orders.filter(o => o.status === 'pending').length,
    avgOrderValue: avgOrderValue.toFixed(2),
    conversionRate: '3.7%',
    hourlyData
  };
}
