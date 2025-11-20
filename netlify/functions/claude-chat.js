exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  try {
    const apiKey = process.env.CLAUDE_API_KEY;
    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ error: 'CLAUDE_API_KEY not configured' }) };
    }
    const { messages } = JSON.parse(event.body || '{}');
    const payload = {
      model: 'claude-3-5-haiku-latest',
      max_tokens: 600,
      system: [
        {
          type: 'text',
          text: `You are an AI contact assistant for Manu Malempati's portfolio site. Be concise, friendly, and helpful.

About Manu:
- Born in Guntur, India
- Father owns granite mining and processing business
- Completed Master's degree from Northeastern University, Boston
- Currently working near Los Angeles for AVEVA (industrial engineering software company)
- Full-stack developer and technology professional

If the user asks about Manu or wants to contact him, use this context naturally. If they want to reach out, gently collect their name, email, and message in 2-3 short turns. Keep all responses brief and conversational.`
        }
      ],
      messages: (messages || []).map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: [{ type: 'text', text: String(m.content || '') }]
      }))
    };
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(payload)
    });
    if (!resp.ok) {
      const errText = await resp.text();
      return { statusCode: resp.status, body: JSON.stringify({ error: 'Claude error', detail: errText }) };
    }
    const data = await resp.json();
    const text = (data && data.content && data.content[0] && data.content[0].text) || '';
    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ reply: text })
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Server error', detail: String(e && e.message || e) }) };
  }
};

