import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Node 18+ has fetch; for older runtimes you can add node-fetch
// import fetch from 'node-fetch';

dotenv.config();

const app = express();

// Basic CORS (adjust origin to your deployed frontend for prod hardening)
app.use(cors({
  origin: process.env.CORS_ORIGIN || true,
  credentials: false
}));

// Body parsing and size limits
app.use(express.json({ limit: '1mb' }));

// Health
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Claude proxy
app.post('/api/claude', async (req, res) => {
  try {
    const apiKey = process.env.CLAUDE_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'CLAUDE_API_KEY not configured' });
    }
    const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];

    const payload = {
      model: 'claude-3-5-haiku-latest',
      max_tokens: 600,
      system: [
        {
          type: 'text',
          text: 'You are an AI contact assistant for Manu Malempati\'s portfolio site. Be concise, friendly, and helpful. If the user wants to contact Manu, collect name, email, and a short message in 2–3 turns. Keep replies brief.'
        }
      ],
      messages: messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: [{ type: 'text', text: String(m.content ?? '') }]
      }))
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), Number(process.env.CLAUDE_TIMEOUT_MS || 15000));
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    }).catch(err => {
      if (err.name === 'AbortError') {
        return { ok: false, status: 504, text: async () => 'Gateway Timeout' };
      }
      throw err;
    });
    clearTimeout(timeout);

    if (!resp?.ok) {
      const detail = await resp.text?.() ?? 'Unknown error';
      return res.status(resp?.status || 500).json({ error: 'Claude error', detail });
    }
    const data = await resp.json();
    const text = (data?.content?.[0]?.text) || '';
    return res.json({ reply: text });
  } catch (e) {
    return res.status(500).json({ error: 'Server error', detail: String(e?.message || e) });
  }
});

const port = Number(process.env.PORT || 3000);
const server = app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});

// Server timeouts
server.setTimeout(Number(process.env.SERVER_TIMEOUT_MS || 30000));
server.headersTimeout = Number(process.env.SERVER_HEADERS_TIMEOUT_MS || 20000);
server.requestTimeout = Number(process.env.SERVER_REQ_TIMEOUT_MS || 30000);


