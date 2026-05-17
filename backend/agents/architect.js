import 'dotenv/config';
import Groq from 'groq-sdk';

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function architectBusiness(prompt) {
  const message = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: `You are ArchitectAgent, an elite AI business strategist. Given a business idea, you design a complete, profitable digital services business.

Business idea: "${prompt}"

Respond ONLY with a valid JSON object (no markdown, no explanation). Structure:
{
  "businessName": "Catchy brand name (2-3 words)",
  "tagline": "Punchy one-line tagline",
  "description": "2-sentence business description explaining what makes this unique",
  "category": "Design | Content | SEO | Marketing | Development | Analytics | Legal | Finance",
  "colorScheme": {
    "primary": "#HEX",
    "secondary": "#HEX",
    "accent": "#HEX"
  },
  "services": [
    {
      "id": "svc_001",
      "name": "Service name",
      "description": "What exactly the customer gets, 1-2 sentences",
      "price": 29,
      "deliveryTime": "24 hours",
      "features": ["Feature 1", "Feature 2", "Feature 3"],
      "popular": false
    },
    {
      "id": "svc_002", 
      "name": "Mid-tier service name",
      "description": "What exactly the customer gets, 1-2 sentences",
      "price": 79,
      "deliveryTime": "48 hours",
      "features": ["Feature 1", "Feature 2", "Feature 3", "Feature 4"],
      "popular": true
    },
    {
      "id": "svc_003",
      "name": "Premium service name", 
      "description": "What exactly the customer gets, 1-2 sentences",
      "price": 149,
      "deliveryTime": "72 hours",
      "features": ["Feature 1", "Feature 2", "Feature 3", "Feature 4", "Feature 5"],
      "popular": false
    }
  ],
  "targetAudience": "Who this business serves",
  "uniqueValueProp": "Why customers choose this over alternatives",
  "agentPersona": "The AI agent's role description (e.g., 'Senior Brand Strategist with 10 years experience')"
}`
      }
    ]
  });

  try {
    const text = message.choices[0].message.content.trim();
    const cleaned = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    throw new Error(`ArchitectAgent failed to parse business plan: ${e.message}`);
  }
}

export async function generateBusinessInsight(businessConfig) {
  const message = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 500,
    messages: [
      {
        role: 'user',
        content: `As the ArchitectAgent for ${businessConfig.businessName}, generate a strategic business insight (1-2 sentences) about current market opportunity. Be specific and data-driven sounding. No fluff.`
      }
    ]
  });
  return message.choices[0].message.content;
}
