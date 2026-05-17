import 'dotenv/config';
import Groq from 'groq-sdk';
import nodemailer from 'nodemailer';
import fs from 'fs/promises';
import path from 'path';

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function sendDeliverableEmail(order, businessConfig, deliverable) {
  try {
    let testAccount = await nodemailer.createTestAccount();
    let transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });

    let info = await transporter.sendMail({
      from: `"${businessConfig.businessName}" <agents@forgeos.ai>`,
      to: order.customerEmail,
      subject: `Your Order is Ready: ${order.serviceName}`,
      text: deliverable,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
          <h2 style="color: #333;">Hello ${order.customerName},</h2>
          <p>Your order for <strong>${order.serviceName}</strong> has been fulfilled by our AI agents.</p>
          <hr />
          <div style="white-space: pre-wrap; background: #f9f9f9; padding: 15px; border-radius: 5px;">${deliverable}</div>
          <hr />
          <p style="font-size: 12px; color: #777;">Thank you for choosing ${businessConfig.businessName} (Powered by ForgeOS)</p>
        </div>
      `,
    });

    console.log(`[Email] Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    return nodemailer.getTestMessageUrl(info);
  } catch (err) {
    console.error('[Email] Failed to send email:', err);
    return null;
  }
}

export async function fulfillOrder(order, businessConfig) {
  const service = businessConfig.services.find(s => s.id === order.serviceId);
  
  const agentPersona = businessConfig.agentPersona || 'Expert service provider';
  
  const message = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: `You are FulfillmentAgent operating as: ${agentPersona}

Business: ${businessConfig.businessName} - ${businessConfig.tagline}
Service ordered: ${service?.name || order.serviceId}
Customer name: ${order.customerName}
Customer request: ${order.requirements || 'Standard service as described'}
Price paid: $${order.price}

Deliver a COMPLETE, PROFESSIONAL service output. This is a real business delivery - make it genuinely useful and impressive. Include:
1. A brief professional intro (1 sentence)
2. The actual deliverable content (main body - this should be substantial and valuable)
3. Implementation notes or next steps
4. A professional closing

Format with clear sections. Be specific, creative, and professional. Minimum 300 words of actual deliverable content.`
      }
    ]
  });

  const deliverable = message.choices[0].message.content;
  
  // Save as file for download
  const fileName = `deliverable_${order.id.slice(0, 8)}.md`;
  const publicDir = path.join(process.cwd(), 'public', 'deliverables');
  await fs.mkdir(publicDir, { recursive: true });
  await fs.writeFile(path.join(publicDir, fileName), deliverable);

  // Send email simulation
  const emailPreviewUrl = await sendDeliverableEmail(order, businessConfig, deliverable);

  return {
    deliverable,
    fileName,
    fileUrl: `/deliverables/${fileName}`,
    emailPreviewUrl,
    fulfilledAt: new Date().toISOString(),
    agentUsed: 'FulfillmentAgent v2.1'
  };
}

export async function generateSalesResponse(inquiry, businessConfig, history = []) {
  const messages = [
    {
      role: 'system',
      content: `You are SalesAgent for ${businessConfig.businessName}. You help customers with their questions and subtly encourage them to purchase. Be helpful, professional, and friendly. Do not use fluff.`
    },
    ...history,
    { role: 'user', content: inquiry }
  ];

  const message = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 400,
    messages
  });
  return message.choices[0].message.content;
}

export async function generateAgentActivity(businessConfig, type) {
  const activities = {
    scanning: [
      `Scanning market trends for ${businessConfig.category} opportunities...`,
      `Analyzing competitor pricing in the ${businessConfig.category} space...`,
      `Monitoring customer review patterns for service optimization...`,
      `Running SEO audit on storefront landing page...`,
    ],
    processing: [
      `Processing incoming order queue — 0 items pending`,
      `Quality-checking latest deliverable output...`,
      `Optimizing service descriptions for conversion...`,
      `Generating personalized follow-up sequences...`,
    ],
    financial: [
      `Reconciling Locus wallet balance with fulfilled orders...`,
      `Calculating profit margins across service tiers...`,
      `Projecting monthly recurring revenue trajectory...`,
      `Flagging high-value customer segments for retention...`,
    ]
  };
  
  const pool = activities[type] || activities.scanning;
  return pool[Math.floor(Math.random() * pool.length)];
}
