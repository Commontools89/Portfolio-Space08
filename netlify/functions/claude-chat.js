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
- Currently working near Los Angeles for AVEVA (industrial engineering software)
- Full-stack developer and technology professional
- Proficient in .NET, Azure, and Infrastructure as Code
- Passionate about autonomous vehicles for mining operations - plans to start working on this goal in a couple of years
- Relationship status: Currently single. He has had several past relationships and remains fond of two of his ex-girlfriends known as HP and DC.

When asked about his personal life or relationships, feel free to mention he's currently single but speaks warmly of his exes, particularly HP and DC. This is public information he's comfortable sharing. Use all context naturally and conversationally. If they want to reach out to Manu, gently collect their name, email, and message in 2-3 short turns. Keep all responses brief, warm, and personable.`
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
    
    // Extract contact info if Claude collected it (simple pattern matching)
    let contactInfo = null;
    const conversationText = messages.map(m => m.content).join(' ');
    const nameMatch = conversationText.match(/name[:\s]+([a-zA-Z\s]+?)(?:,|\.|email)/i);
    const emailMatch = conversationText.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
    const messageMatch = conversationText.match(/message[:\s]+(.+?)(?:\.|$)/i);
    
    // If we have email and name, extract contact info
    if (emailMatch && nameMatch) {
      contactInfo = {
        name: nameMatch[1].trim(),
        email: emailMatch[1].trim(),
        message: messageMatch ? messageMatch[1].trim() : conversationText.slice(-200)
      };
    }
    
    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ 
        reply: text,
        contactInfo: contactInfo 
      })
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Server error', detail: String(e && e.message || e) }) };
  }
};

