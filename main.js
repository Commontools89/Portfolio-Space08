import createHyperjumpAnimation from './src/hyperjumpAnimation.js';
import About from './src/components/About.js';
import Contact from './src/components/Contact.js';

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

  window.startTransition = (callback) => {
    hyperjumpAnimation.startTransition(() => {
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

  // Load initial content
  contentDiv.innerHTML = About();

  if (landingPage && landingPageText) {
    landingPage.addEventListener('click', () => {
      landingPageText.classList.add('animate-out');
      landingPage.style.background = 'transparent';
      
      // Start the transition immediately
      window.startTransition(() => {
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
      
      window.startTransition(() => {
        switch(targetComponent) {
          case 'about':
            contentDiv.innerHTML = About();
            break;
          case 'contact':
            contentDiv.innerHTML = Contact();
            setupContactForm();
            break;
        }
      });
    });
  });

  function setupContactForm() {
    const form = document.getElementById('contact-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // Here you would typically send the data to your server
        console.log('Form submitted:', data);
        
        // For demonstration purposes, we'll just show an alert
        alert('Thank you for your message! We will get back to you soon.');
        form.reset();
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