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

    async function callClaude() {
      try {
        const endpoint = (import.meta.env && import.meta.env.VITE_API_BASE_URL)
          ? `${import.meta.env.VITE_API_BASE_URL}/api/claude`
          : '/api/claude';
        const resp = await fetch(endpoint, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ messages })
        });
        const data = await resp.json();
        const reply = data?.reply || '...';
        messages.push({ role: 'assistant', content: reply });
        appendBubble('assistant', reply);
      } catch (e) {
        appendBubble('assistant', 'Oops, I had trouble responding. Please try again.');
      }
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const text = (input.value || '').trim();
      if (!text) return;
      // reveal chat window wrapper (with animated borders) on first submit
      if (!wrapper.classList.contains('visible')) wrapper.classList.add('visible');
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