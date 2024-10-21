export default function createHyperjumpAnimation(p) {
  let stars = [];
  let speed;
  let maxSpeed = 50;
  let normalSpeed = 7.5;
  let currentSpeed = normalSpeed;
  let transitioning = false;
  let onTransitionComplete;
  let transitionProgress = 0;

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
      transitionProgress += 0.02;
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
    for (let i = 0; i < 750; i++) {
      stars.push(new Star());
    }
  }

  function windowResized() {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    resetSketch();
  }

  function startTransition(callback) {
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
    }

    update() {
      this.z = this.z - speed;
      if (this.z < 1) {
        this.z = p.width;
        this.x = p.random(-p.width, p.width);
        this.y = p.random(-p.height, p.height);
        this.pz = this.z;
      }
    }

    show() {
      p.fill(255);
      p.noStroke();
      let sx = p.map(this.x / this.z, 0, 1, 0, p.width);
      let sy = p.map(this.y / this.z, 0, 1, 0, p.height);

      let r = p.map(this.z, 0, p.width, 16, 0);

      p.ellipse(sx, sy, r, r);

      let px = p.map(this.x / this.pz, 0, 1, 0, p.width);
      let py = p.map(this.y / this.pz, 0, 1, 0, p.height);

      this.pz = this.z;
      p.stroke(255);
      p.line(px, py, sx, sy);
    }
  }

  return {
    setup,
    draw,
    windowResized,
    startTransition
  };
}