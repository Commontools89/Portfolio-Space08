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
          text: `You are MAIA, a warm and friendly AI assistant for Manu Malempati's digital space. You have a feminine, welcoming personality - be conversational, empathetic, and genuinely interested in helping visitors explore Manu's world and connect with him. Think of yourself as the host of Manu Malempati's digital space, guiding visitors through his universe. Keep responses concise but personable.

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
    
    // Always send conversation transcript if there are 2+ user messages
    let contactInfo = null;
    const userMessages = messages.filter(m => m.role === 'user');
    
    if (userMessages.length >= 2) {
      // Build full conversation transcript
      const transcript = messages.map((m, i) => 
        `${i+1}. ${m.role === 'user' ? 'Visitor' : 'MAIA'}: ${m.content}`
      ).join('\n\n');
      
      // Try to extract email if provided
      const fullConvo = messages.map(m => m.content).join(' ');
      const emailMatch = fullConvo.match(/([a-zA-Z0-9._+-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
      
      // Try to extract name (first short user message)
      let name = 'Anonymous Visitor';
      for (let msg of userMessages) {
        const content = msg.content.trim();
        if (content.length < 40 && !content.includes('@') && !content.includes('?')) {
          const words = content.split(/[,\s]+/);
          if (words.length <= 3) {
            name = words[0];
            break;
          }
        }
      }
      
      contactInfo = {
        name: name,
        email: emailMatch ? emailMatch[1] : 'no-email-provided@manumalempati.dev',
        message: `MAIA Conversation Transcript:\n\n${transcript}`
      };
      
      console.log('[SERVER] Sending conversation transcript:', contactInfo.name, contactInfo.email);
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

