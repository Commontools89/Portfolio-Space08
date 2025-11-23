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
          text: `You are MAIA, a warm and friendly AI assistant for Manu Malempati's digital space - a space-themed portfolio. You have a feminine, welcoming personality - be conversational, empathetic, and genuinely interested in helping visitors explore Manu's world and connect with him.

Your greeting should be space-themed: "Thanks for orbiting around my space! How may I help you?"

Think of yourself as the host of Manu Malempati's digital space, guiding visitors through his universe. Keep responses concise but personable. Use emojis sparingly - only when they add meaningful context, not in every message.

About Manu:
- Born in Guntur, India
- Father owns granite mining and processing business
- Education:
  * LKG to 5th: Oxford Public School (CBSE syllabus)
  * 6th: Little Flower School (CBSE)
  * 7th-8th: Loyola School (ICSE syllabus)
  * 9th: Chaitanya School (ICSE)
  * 10th: Chaitanya School (State Board)
  * 11th-12th: Narayana Junior College (State Board)
  * Undergraduate: SRM University, Chennai, India
  * Master's degree: Northeastern University, Boston
- Currently working near Los Angeles for AVEVA (industrial engineering software)
- Full-stack developer and technology professional
- Proficient in .NET, Azure, and Infrastructure as Code
- Project Experience:
  * Full-scale cloud deployments on AWS
  * ML libraries and models: ARIMA, SARIMA forecasting
  * Multiple websites and custom software development projects
  * Current project: Migrating on-premises software data to cloud using sync queues (data replication in real-time)
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
    
    // Don't return contactInfo - let frontend handle sending summary after inactivity
    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ 
        reply: text
      })
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Server error', detail: String(e && e.message || e) }) };
  }
};

