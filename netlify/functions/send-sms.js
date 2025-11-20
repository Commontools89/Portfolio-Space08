// Twilio WhatsApp notification handler - sends alerts to your WhatsApp
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const toWhatsApp = process.env.TWILIO_WHATSAPP_TO; // Your WhatsApp number with country code
    const contentSid = process.env.TWILIO_CONTENT_SID || 'HXb5b62575e6e4ff6129ad7c8efe1f983e';
    
    if (!accountSid || !authToken || !toWhatsApp) {
      console.error('Twilio env vars not configured');
      return { 
        statusCode: 500, 
        body: JSON.stringify({ error: 'Twilio not configured' }) 
      };
    }
    
    const { visitorName, preview, timestamp } = JSON.parse(event.body || '{}');
    
    // Build plain WhatsApp message (no template)
    const whatsappMessage = `🌌 *MAIA Chat Alert*

👤 From: ${visitorName || 'Anonymous'}
💬 Message: ${preview || 'New conversation'}
🕐 Time: ${timestamp || new Date().toLocaleString()}

Check Netlify logs for full conversation.`;
    
    // Send via Twilio WhatsApp API (plain message)
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    
    const resp = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        From: 'whatsapp:+14155238886',
        To: `whatsapp:${toWhatsApp}`,
        Body: whatsappMessage
      }).toString()
    });
    
    if (!resp.ok) {
      const errText = await resp.text();
      console.error('Twilio error:', errText);
      return { 
        statusCode: resp.status, 
        body: JSON.stringify({ error: 'Twilio API error', detail: errText }) 
      };
    }
    
    const result = await resp.json();
    console.log('SMS sent:', result.sid);
    
    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ success: true, sid: result.sid })
    };
  } catch (e) {
    console.error('SMS function error:', e);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: 'Server error', detail: String(e.message || e) }) 
    };
  }
};

