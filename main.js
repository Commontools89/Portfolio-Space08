import createHyperjumpAnimation from './src/hyperjumpAnimation.js';
import About from './src/components/About.js';
import Contact from './src/components/Contact.js';
import Planet from './src/components/Planet.js';
import { createPlanet } from './src/planetAnimation.js';

console.log('main.js is loaded');

const sketch = (p) => {
  let hyperjumpAnimation;

  p.setup = () => {
    console.log('Setup function called');
    p.createCanvas(p.windowWidth, p.windowHeight).parent("sketch-holder");
    hyperjumpAnimation = createHyperjumpAnimation(p);
    hyperjumpAnimation.setup();
    
    document.getElementById('loading-text').style.display = 'none';
  };

  p.draw = () => {
    hyperjumpAnimation.draw();
  };

  p.windowResized = () => {
    console.log('Window resized');
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    hyperjumpAnimation.windowResized();
  };

  window.startTransition = (options, callback) => {
    // Back-compat: allow startTransition(callback)
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    hyperjumpAnimation.startTransition(options || {}, () => {
      document.getElementById('portfolio').classList.add('visible');
      if (callback) callback();
    });
  };
};

new p5(sketch);

if (typeof p5 === 'undefined') {
  console.error('p5.js is not loaded');
} else {
  console.log('p5.js is loaded successfully');
}

document.addEventListener('DOMContentLoaded', () => {
  const landingPage = document.getElementById('landing-page');
  const portfolio = document.getElementById('portfolio');
  const landingPageText = document.querySelector('#landing-page h1');
  const contentDiv = document.querySelector('.content');
  let currentPlanet = null;

  // Load initial content
  contentDiv.innerHTML = About();

  // No about arrow wiring; removed per latest spec

  if (landingPage && landingPageText) {
    landingPage.addEventListener('click', () => {
      landingPageText.classList.add('animate-out');
      landingPage.style.background = 'transparent';
      
      // Fast transition only for the first landing -> about reveal
      window.startTransition({ mode: 'fast' }, () => {
        landingPage.classList.add('hidden');
        portfolio.classList.remove('hidden');
      });
    });
  } else {
    console.error('Landing page or landing page text not found');
  }

  // Add event listeners for navigation
  const navLinks = document.querySelectorAll('nav a');
  
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetComponent = link.getAttribute('data-component');

      // Clean up existing planet instance if it exists
      if (currentPlanet) {
        currentPlanet.dispose && currentPlanet.dispose();
        currentPlanet = null;
      }
      
      // No game page; focusing on planet and other sections
      
      window.startTransition({ mode: 'classic' }, () => {
        // Clear previous content
        contentDiv.innerHTML = '';
        
        // Load new content
        switch(targetComponent) {
          case 'about':
            contentDiv.innerHTML = About();
            break;
          case 'contact':
            contentDiv.innerHTML = Contact();
            setupGenAIChat();
            break;
          case 'planet':
            contentDiv.innerHTML = Planet();
            setTimeout(() => {
              currentPlanet = createPlanet();
            }, 100);
            break;
        }
      });
    });
  });

  // Removed page-travel arrow logic

  

  // Initialize EmailJS with your public key
  (function() {
    emailjs.init("Bb2IL9GPVGwGFwKmK"); // Add your public key from EmailJS dashboard
  })();

  function setupGenAIChat() {
    const form = document.getElementById('ai-chat-form');
    const input = document.getElementById('ai-chat-input');
    const wrapper = document.getElementById('ai-chat-window-wrapper');
    const win = document.getElementById('ai-chat-window');
    const list = document.getElementById('ai-chat-messages');
    if (!form || !input || !list || !win || !wrapper) return;

    const messages = [];
    let notificationSent = false;
    let inactivityTimer = null;
    const INACTIVITY_DELAY = 30000; // 30 seconds of inactivity before sending summary

    function appendBubble(role, text) {
      const row = document.createElement('div');
      row.className = `ai-row ${role}`;
      const bubble = document.createElement('div');
      bubble.className = 'ai-bubble';
      bubble.textContent = text;
      row.appendChild(bubble);
      list.appendChild(row);
      list.scrollTop = list.scrollHeight;
    }

    function scheduleConversationSummary() {
      // Clear existing timer
      if (inactivityTimer) clearTimeout(inactivityTimer);
      
      // Schedule summary after inactivity
      inactivityTimer = setTimeout(() => {
        if (!notificationSent && messages.length >= 2) {
          sendConversationSummary();
        }
      }, INACTIVITY_DELAY);
    }

    async function sendConversationSummary() {
      if (notificationSent) return;
      notificationSent = true;
      
      try {
        // Build full conversation transcript
        const transcript = messages.map((m, i) => 
          `${m.role === 'user' ? 'Visitor' : 'MAIA'}: ${m.content}`
        ).join(' | ');
        
        // Extract visitor name if possible
        const userMsgs = messages.filter(m => m.role === 'user');
        let visitorName = 'Anonymous';
        for (let msg of userMsgs) {
          if (msg.content.length < 30 && !msg.content.includes('@') && !msg.content.includes('?')) {
            visitorName = msg.content.split(/[,\s]+/)[0];
            break;
          }
        }
        
        await fetch('/.netlify/functions/send-sms', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            visitorName: visitorName,
            preview: transcript,
            timestamp: new Date().toLocaleString()
          })
        });
        console.log('Conversation summary sent to WhatsApp');
      } catch (err) {
        console.error('Summary send error:', err);
      }
    }

    async function callClaude() {
      try {
        const endpoint = '/.netlify/functions/claude-chat';
        const resp = await fetch(endpoint, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ messages })
        });
        const data = await resp.json();
        console.log('Claude response:', data);
        const reply = data?.reply || '...';
        messages.push({ role: 'assistant', content: reply });
        appendBubble('assistant', reply);
        
        // Reset inactivity timer after each message
        scheduleConversationSummary();
      } catch (e) {
        console.error('Claude API error:', e);
        appendBubble('assistant', 'Oops, I had trouble responding. Please try again.');
      }
    }

    async function sendSMSNotification(contactInfo) {
      try {
        // Build conversation summary for final notification
        const conversationSummary = messages.map((m, i) => 
          `${m.role === 'user' ? 'User' : 'MAIA'}: ${m.content.slice(0, 100)}`
        ).join(' | ');
        
        await fetch('/.netlify/functions/send-sms', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            visitorName: contactInfo.name,
            preview: conversationSummary.slice(0, 150), // full context summary
            timestamp: new Date().toLocaleString()
          })
        });
        console.log('WhatsApp notification sent (once per session)');
      } catch (err) {
        console.error('WhatsApp error:', err);
      }
    }

    async function sendContactEmail(contactInfo) {
      try {
        console.log('Sending email with contactInfo:', contactInfo);
        const result = await emailjs.send(
          'service_c7qjp5g',
          'template_svorfoe',
          {
            from_name: contactInfo.name || 'Website Visitor',
            reply_to: contactInfo.email || '',
            message: contactInfo.message || ''
          }
        );
        console.log('EmailJS success:', result);
        return true;
      } catch (err) {
        console.error('EmailJS error:', err);
        return false;
      }
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const text = (input.value || '').trim();
      if (!text) return;
      // reveal chat window wrapper (with animated borders) on first submit
      if (!wrapper.classList.contains('visible')) {
        wrapper.classList.add('visible');
        // Add class to container to trigger layout shift
        document.querySelector('.genai-chat-container')?.classList.add('chat-active');
      }
      appendBubble('user', text);
      messages.push({ role: 'user', content: text });
      input.value = '';
      await callClaude();
    });
  }
});

// Add event listener for window resize
window.addEventListener('resize', () => {
  if (typeof p5 !== 'undefined' && p5.instance) {
    p5.instance.windowResized();
  }
});