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

When asked about his personal life or relationships, feel free to mention he's currently single but speaks warmly of his exes, particularly HP and DC. This is public information he's comfortable sharing. Use all context naturally and conversationally. 

IMPORTANT: When collecting contact information, once you have their name, email, and message, end your response by saying "I'll send this to Manu now!" - this triggers the automatic email. Keep all responses brief, warm, and personable.`
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
    
    // Extract contact info from conversation (look for email first, then find nearby name/message)
    let contactInfo = null;
    const fullConvo = messages.map(m => `${m.role}: ${m.content}`).join('\n');
    const emailMatch = fullConvo.match(/([a-zA-Z0-9._+-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
    
    if (emailMatch) {
      // Found email - extract name and message from user messages
      const userMessages = messages.filter(m => m.role === 'user');
      let name = '';
      let message = '';
      
      // Try to find name (first user message that's just a name or contains name pattern)
      for (let msg of userMessages) {
        const content = msg.content.toLowerCase();
        // Check if it looks like a name (short, no @ symbol, not a question)
        if (content.length < 50 && !content.includes('@') && !content.includes('?') && !content.includes('contact')) {
          const words = msg.content.trim().split(/[\s,]+/);
          if (words.length >= 1 && words.length <= 3 && !emailMatch[0].includes(words[0])) {
            name = msg.content.split(',')[0].trim();
            break;
          }
        }
      }
      
      // Extract message (look for message after email or last substantive user message)
      const lastUserMsg = userMessages[userMessages.length - 1];
      if (lastUserMsg && lastUserMsg.content.length > 10) {
        message = lastUserMsg.content;
      }
      
      contactInfo = {
        name: name || 'Website Visitor',
        email: emailMatch[1],
        message: message || 'User would like to get in touch with Manu.'
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

