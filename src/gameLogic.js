class SpaceMeditation {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.isActive = false;
    
    // Ripple effects
    this.ripples = [];
    
    // Particle effects
    this.particles = [];
    
    // Mouse/touch position
    this.mouseX = 0;
    this.mouseY = 0;
    
    this.init();
  }
  
  init() {
    this.canvas = document.getElementById('gameCanvas');
    if (!this.canvas) {
      console.error('Game canvas not found');
      return;
    }
    
    this.ctx = this.canvas.getContext('2d');
    this.setupEventListeners();
    this.resizeCanvas();
    
    // Start the meditation loop
    this.meditationLoop();
  }
  
  setupEventListeners() {
    // Mouse events
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = e.clientX - rect.left;
      this.mouseY = e.clientY - rect.top;
    });
    
    this.canvas.addEventListener('mousedown', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this.createRipple(x, y);
      this.createParticles(x, y);
    });
    
    // Touch events for mobile
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const touch = e.touches[0];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      this.createRipple(x, y);
      this.createParticles(x, y);
    });
    
    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const touch = e.touches[0];
      this.mouseX = touch.clientX - rect.left;
      this.mouseY = touch.clientY - rect.top;
    });
    
    // Window resize
    window.addEventListener('resize', () => {
      this.resizeCanvas();
    });
  }
  
  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }
  
  startMeditation() {
    this.isActive = true;
    this.updateUI();
  }
  
  stopMeditation() {
    this.isActive = false;
    this.ripples = [];
    this.particles = [];
    this.updateUI();
  }
  
  meditationLoop() {
    if (this.isActive) {
      this.update();
    }
    this.render();
    requestAnimationFrame(() => this.meditationLoop());
  }
  
  update() {
    // Update ripples
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const ripple = this.ripples[i];
      ripple.radius += ripple.speed;
      ripple.opacity -= 0.02;
      
      if (ripple.opacity <= 0) {
        this.ripples.splice(i, 1);
      }
    }
    
    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life -= 0.02;
      particle.size *= 0.98;
      
      if (particle.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }
  
  createRipple(x, y) {
    this.ripples.push({
      x: x,
      y: y,
      radius: 0,
      speed: 2,
      opacity: 1,
      color: `hsl(${Math.random() * 60 + 180}, 70%, 60%)` // Blue to cyan range
    });
  }
  
  createParticles(x, y) {
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      const speed = 1 + Math.random() * 2;
      
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 3,
        life: 1,
        color: `hsl(${Math.random() * 60 + 180}, 70%, 60%)` // Blue to cyan range
      });
    }
  }
  
  updateUI() {
    const scoreElement = document.getElementById('score');
    const livesElement = document.getElementById('lives');
    const levelElement = document.getElementById('level');
    
    if (scoreElement) scoreElement.textContent = this.ripples.length;
    if (livesElement) livesElement.textContent = this.particles.length;
    if (levelElement) levelElement.textContent = this.isActive ? 'Active' : 'Inactive';
  }
  
  render() {
    // Very subtle fade effect
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.01)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw ripples
    this.drawRipples();
    
    // Draw particles
    this.drawParticles();
    
    // Draw floating orb that follows mouse
    if (this.isActive) {
      this.drawFloatingOrb();
    }
  }
  
  drawRipples() {
    this.ripples.forEach(ripple => {
      this.ctx.save();
      this.ctx.globalAlpha = ripple.opacity;
      this.ctx.strokeStyle = ripple.color;
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.restore();
    });
  }
  
  drawParticles() {
    this.particles.forEach(particle => {
      this.ctx.save();
      this.ctx.globalAlpha = particle.life;
      this.ctx.fillStyle = particle.color;
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    });
  }
  
  drawFloatingOrb() {
    this.ctx.save();
    
    // Create a subtle glow effect
    const gradient = this.ctx.createRadialGradient(
      this.mouseX, this.mouseY, 0,
      this.mouseX, this.mouseY, 30
    );
    gradient.addColorStop(0, 'rgba(213, 250, 27, 0.8)');
    gradient.addColorStop(0.5, 'rgba(213, 250, 27, 0.3)');
    gradient.addColorStop(1, 'rgba(213, 250, 27, 0)');
    
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(this.mouseX, this.mouseY, 30, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Draw the core orb
    this.ctx.fillStyle = '#d5fa1b';
    this.ctx.beginPath();
    this.ctx.arc(this.mouseX, this.mouseY, 8, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.restore();
  }
}

export default SpaceMeditation;
