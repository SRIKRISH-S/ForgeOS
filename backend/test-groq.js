import dotenv from 'dotenv';
import Groq from 'groq-sdk';
dotenv.config();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
async function test() {
  const r = await groq.chat.completions.create({
    messages: [{ role: 'system', content: 'Respond with { "test": true }' }, { role: 'user', content: 'Go' }],
    model: 'allam-2-7b'
  });
  console.log(JSON.stringify(r.choices[0].message.content));
}
test();
