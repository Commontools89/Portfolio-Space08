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
            setupContactForm();
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

  function setupContactForm() {
    const form = document.getElementById('contact-form');
    if (form) {
      const sendButton = form.querySelector('.send-button');
      
      // Button animations
      sendButton.addEventListener('mousedown', () => {
        sendButton.classList.add('hold');
      });

      sendButton.addEventListener('mouseup', () => {
        sendButton.classList.remove('hold');
        sendButton.classList.add('clicked');
        setTimeout(() => {
          sendButton.classList.remove('clicked');
        }, 400);
      });

      // Form submission
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Get form data
        const formData = {
          from_name: form.querySelector('[name="from_name"]').value,
          reply_to: form.querySelector('[name="reply_to"]').value,
          message: form.querySelector('[name="message"]').value,
        };

        const chatMessages = document.querySelector('.chat-messages');

        // Add user's message to chat
        const userMessageHTML = `
          <div class="message sent" style="animation-delay: 0.2s">
            <div class="message-content">
              <div class="message-bubble">
                ${formData.message}
              </div>
              <div class="message-time">Just now</div>
            </div>
          </div>
        `;
        chatMessages.insertAdjacentHTML('beforeend', userMessageHTML);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        try {
          // Send email using EmailJS
          await emailjs.send(
            'service_c7qjp5g', // Add your EmailJS service ID
            'template_svorfoe', // Add your EmailJS template ID
            formData
          );

          // Show success message
          const responseHTML = `
            <div class="message received" style="animation-delay: 0.4s">
              <div class="message-content">
                <div class="message-bubble">
                  Got your signal! I'll get back to you in a rotation.
                </div>
                <div class="message-time">Just now</div>
              </div>
            </div>
          `;
          chatMessages.insertAdjacentHTML('beforeend', responseHTML);
          chatMessages.scrollTop = chatMessages.scrollHeight;
          
          // Launch the ship animation
          const shipBtn = form.querySelector('.send-ship');
          if (shipBtn) {
            shipBtn.classList.add('launching');
            setTimeout(() => {
              shipBtn.classList.remove('launching');
            }, 800);
          }

          // Clear form
          form.reset();

        } catch (error) {
          console.error('Failed to send email:', error);
          // Show error message
          const errorHTML = `
            <div class="message received" style="animation-delay: 0.4s">
              <div class="message-content">
                <div class="message-bubble error">
                  Oops! Something went wrong. Please try again later.
                </div>
                <div class="message-time">Just now</div>
              </div>
            </div>
          `;
          chatMessages.insertAdjacentHTML('beforeend', errorHTML);
          chatMessages.scrollTop = chatMessages.scrollHeight;
        }
      });
    }
  }
});

// Add event listener for window resize
window.addEventListener('resize', () => {
  if (typeof p5 !== 'undefined' && p5.instance) {
    p5.instance.windowResized();
  }
});