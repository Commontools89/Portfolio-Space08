// Twilio SMS notification handler
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromPhone = process.env.TWILIO_PHONE_FROM;
    const toPhone = process.env.TWILIO_PHONE_TO;
    
    if (!accountSid || !authToken || !fromPhone || !toPhone) {
      console.error('Twilio env vars not configured');
      return { 
        statusCode: 500, 
        body: JSON.stringify({ error: 'Twilio not configured' }) 
      };
    }
    
    const { visitorName, preview, timestamp } = JSON.parse(event.body || '{}');
    
    // Build SMS message
    const smsBody = `🌌 MAIA Chat Alert
From: ${visitorName || 'Anonymous'}
Preview: ${preview || 'New conversation'}
Time: ${timestamp || new Date().toLocaleString()}`;
    
    // Send via Twilio API
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    
    const resp = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        From: fromPhone,
        To: toPhone,
        Body: smsBody
      })
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

