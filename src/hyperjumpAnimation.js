export default function createHyperjumpAnimation(p) {
  let stars = [];
  let speed;
  let maxSpeed = 50; // default classic hyperjump peak speed
  let normalSpeed = 7.5;
  let currentSpeed = normalSpeed;
  let transitioning = false;
  let onTransitionComplete;
  let transitionProgress = 0;
  let transitionIncrement = 0.02; // default duration ~1s
  let transitionLinesOnly = false; // draw full dots+trails by default

  function setup() {
    resetSketch();
  }

  function draw() {
    speed = transitioning ? easeInOutQuad(transitionProgress) * (maxSpeed - normalSpeed) + normalSpeed : normalSpeed;
    p.background(0);
    p.translate(p.width / 2, p.height / 2);
    for (let star of stars) {
      star.update();
      star.show();
    }

    if (transitioning) {
      transitionProgress += transitionIncrement;
      if (transitionProgress >= 1) {
        transitioning = false;
        currentSpeed = normalSpeed;
        transitionProgress = 0;
        if (onTransitionComplete) {
          onTransitionComplete();
        }
      }
    }
  }

  function resetSketch() {
    stars = [];
    // scale star count by viewport to reduce work on small devices
    const base = (window.innerWidth * window.innerHeight) / (1280 * 720);
    const count = Math.round(500 * Math.max(0.6, Math.min(1.2, base)));
    for (let i = 0; i < count; i++) {
      stars.push(new Star());
    }
  }

  function windowResized() {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    resetSketch();
  }

  function startTransition(optionsOrCallback, maybeCallback) {
    // Support both startTransition(callback) and startTransition(options, callback)
    let options = {};
    let callback = null;
    if (typeof optionsOrCallback === 'function') {
      callback = optionsOrCallback;
    } else {
      options = optionsOrCallback || {};
      callback = maybeCallback || null;
    }

    // Configure fast vs classic transition per call
    if (options.mode === 'fast' || options.fast === true) {
      transitionIncrement = 0.06; // ~400ms
      maxSpeed = 70;
      transitionLinesOnly = true; // lighter visuals for snap
    } else {
      transitionIncrement = 0.02; // classic ~1s
      maxSpeed = 50;
      transitionLinesOnly = false; // full hyperjump look
    }

    transitioning = true;
    currentSpeed = normalSpeed;
    transitionProgress = 0;
    onTransitionComplete = callback;
  }

  function easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  class Star {
    constructor() {
      this.x = p.random(-p.width, p.width);
      this.y = p.random(-p.height, p.height);
      this.z = p.random(p.width);
      this.pz = this.z;
      this.baseSpeed = window.innerWidth <= 767 ? 3 : 7.5;
    }

    update() {
      this.z = this.z - (transitioning ? speed : this.baseSpeed);
      if (this.z < 1) {
        this.z = p.width;
        this.x = p.random(-p.width, p.width);
        this.y = p.random(-p.height, p.height);
        this.pz = this.z;
      }
    }

    show() {
      const sx = p.map(this.x / this.z, 0, 1, 0, p.width);
      const sy = p.map(this.y / this.z, 0, 1, 0, p.height);
      const r = p.map(this.z, 0, p.width, 16, 0);
      if (transitioning && transitionLinesOnly) {
        // Fast mode: streaks only
        const px = p.map(this.x / this.pz, 0, 1, 0, p.width);
        const py = p.map(this.y / this.pz, 0, 1, 0, p.height);
        p.stroke(255);
        p.line(px, py, sx, sy);
      } else {
        // Classic mode: dot + trailing line
        p.fill(255);
        p.noStroke();
        p.ellipse(sx, sy, r, r);
        const px = p.map(this.x / this.pz, 0, 1, 0, p.width);
        const py = p.map(this.y / this.pz, 0, 1, 0, p.height);
        p.stroke(255);
        p.line(px, py, sx, sy);
      }
      this.pz = this.z;
    }
  }

  return {
    setup,
    draw,
    windowResized,
    startTransition
  };
}