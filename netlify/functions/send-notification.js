// Simple notification handler - logs to Netlify and optionally sends email
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  
  try {
    const { conversation, visitorName, visitorEmail, timestamp } = JSON.parse(event.body || '{}');
    
    // Log to Netlify function logs (you can view these in Netlify dashboard)
    console.log('=== NEW MAIA CONVERSATION ===');
    console.log('Visitor:', visitorName || 'Anonymous');
    console.log('Email:', visitorEmail || 'Not provided');
    console.log('Time:', timestamp || new Date().toISOString());
    console.log('Conversation:');
    console.log(conversation);
    console.log('==============================');
    
    // Use Netlify's built-in email notifications (if configured)
    // Or integrate with SendGrid/Mailgun here
    
    // For now, return success - conversations are logged and viewable in Netlify
    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ 
        success: true,
        logged: true,
        message: 'Conversation logged to Netlify'
      })
    };
  } catch (e) {
    console.error('Notification error:', e);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: 'Server error', detail: String(e.message || e) }) 
    };
  }
};

