(function(){const n=document.createElement("link").relList;if(n&&n.supports&&n.supports("modulepreload"))return;for(const t of document.querySelectorAll('link[rel="modulepreload"]'))c(t);new MutationObserver(t=>{for(const s of t)if(s.type==="childList")for(const i of s.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&c(i)}).observe(document,{childList:!0,subtree:!0});function d(t){const s={};return t.integrity&&(s.integrity=t.integrity),t.referrerPolicy&&(s.referrerPolicy=t.referrerPolicy),t.crossOrigin==="use-credentials"?s.credentials="include":t.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function c(t){if(t.ep)return;t.ep=!0;const s=d(t);fetch(t.href,s)}})();function z(e){let n=[],d,c=50,t=7.5,s=!1,i,o=0;function l(){r()}function m(){d=s?g(o)*(c-t)+t:t,e.background(0),e.translate(e.width/2,e.height/2);for(let a of n)a.update(),a.show();s&&(o+=.02,o>=1&&(s=!1,o=0,i&&i()))}function r(){n=[];for(let a=0;a<750;a++)n.push(new y)}function h(){e.resizeCanvas(e.windowWidth,e.windowHeight),r()}function u(a){s=!0,o=0,i=a}function g(a){return a<.5?2*a*a:-1+(4-2*a)*a}class y{constructor(){this.x=e.random(-e.width,e.width),this.y=e.random(-e.height,e.height),this.z=e.random(e.width),this.pz=this.z,this.baseSpeed=window.innerWidth<=767?3:7.5}update(){this.z=this.z-(s?d:this.baseSpeed),this.z<1&&(this.z=e.width,this.x=e.random(-e.width,e.width),this.y=e.random(-e.height,e.height),this.pz=this.z)}show(){e.fill(255),e.noStroke();let v=e.map(this.x/this.z,0,1,0,e.width),f=e.map(this.y/this.z,0,1,0,e.height),p=e.map(this.z,0,e.width,16,0);e.ellipse(v,f,p,p);let b=e.map(this.x/this.pz,0,1,0,e.width),L=e.map(this.y/this.pz,0,1,0,e.height);this.pz=this.z,e.stroke(255),e.line(b,L,v,f)}}return{setup:l,draw:m,windowResized:h,startTransition:u}}function w(){return`
    <div id="about" class="component active">
      <h2 data-text="Manu Malempati">Manu Malempati</h2>
      <p class="about-content">I'm a computer engineer with a passion for art, technology, geo-politics, and everything that brings life to this world. When I'm not coding, you can find me playing competitive video games, reading life stories and dreaming about the cosmos.</p>
    </div>
  `}function T(){return`
    <div id="contact" class="component">
      <div class="iphone-chat">
        <div class="chat-container">
          <div class="chat-header">
            <div class="status-bar">
              <span class="status-dot online"></span>
              <span class="status-text"> Online</span>
            </div>
          </div>
          <div class="chat-messages">
            <div class="message received">
              <div class="message-content">
                <div class="message-bubble">
                  Hey there! Thanks for orbiting my space. How can I help you?
                </div>
                <div class="message-time">Just now</div>
              </div>
            </div>
          </div>
          <form id="contact-form" class="chat-form">
            <div class="message-input-wrapper">
              <input type="text" name="from_name" placeholder="Your Name" required class="chat-input name-input">
              <input type="email" name="reply_to" placeholder="Your Email" required class="chat-input email-input">
              <div class="message-input-container">
                <textarea name="message" placeholder="Hit me up..." required class="chat-input message-input"></textarea>
                <button type="submit" class="send-button">
                  <svg viewBox="0 0 24 24" width="24" height="24">
                    <path fill="currentColor" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                  </svg>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  `}console.log("main.js is loaded");const H=e=>{let n;e.setup=()=>{console.log("Setup function called"),e.createCanvas(e.windowWidth,e.windowHeight).parent("sketch-holder"),n=z(e),n.setup(),document.getElementById("loading-text").style.display="none"},e.draw=()=>{n.draw()},e.windowResized=()=>{console.log("Window resized"),e.resizeCanvas(e.windowWidth,e.windowHeight),n.windowResized()},window.startTransition=d=>{n.startTransition(()=>{document.getElementById("portfolio").classList.add("visible"),d&&d()})}};new p5(H);typeof p5>"u"?console.error("p5.js is not loaded"):console.log("p5.js is loaded successfully");document.addEventListener("DOMContentLoaded",()=>{const e=document.getElementById("landing-page"),n=document.getElementById("portfolio"),d=document.querySelector("#landing-page h1"),c=document.querySelector(".content");c.innerHTML=w(),e&&d?e.addEventListener("click",()=>{d.classList.add("animate-out"),e.style.background="transparent",window.startTransition(()=>{e.classList.add("hidden"),n.classList.remove("hidden")})}):console.error("Landing page or landing page text not found"),document.querySelectorAll("nav a").forEach(i=>{i.addEventListener("click",o=>{o.preventDefault();const l=i.getAttribute("data-component");window.startTransition(()=>{switch(l){case"about":c.innerHTML=w();break;case"contact":c.innerHTML=T(),s();break}})})}),function(){emailjs.init("Bb2IL9GPVGwGFwKmK")}();function s(){const i=document.getElementById("contact-form");if(i){const o=i.querySelector(".send-button");o.addEventListener("mousedown",()=>{o.classList.add("hold")}),o.addEventListener("mouseup",()=>{o.classList.remove("hold"),o.classList.add("clicked"),setTimeout(()=>{o.classList.remove("clicked")},400)}),i.addEventListener("submit",async l=>{l.preventDefault();const m={from_name:i.querySelector('[name="from_name"]').value,reply_to:i.querySelector('[name="reply_to"]').value,message:i.querySelector('[name="message"]').value},r=document.querySelector(".chat-messages"),h=`
          <div class="message sent" style="animation-delay: 0.2s">
            <div class="message-content">
              <div class="message-bubble">
                ${m.message}
              </div>
              <div class="message-time">Just now</div>
            </div>
          </div>
        `;r.insertAdjacentHTML("beforeend",h),r.scrollTop=r.scrollHeight;try{await emailjs.send("service_c7qjp5g","template_svorfoe",m);const u=`
            <div class="message received" style="animation-delay: 0.4s">
              <div class="message-content">
                <div class="message-bubble">
                  Got your signal! I'll get back to you in a rotation.
                </div>
                <div class="message-time">Just now</div>
              </div>
            </div>
          `;r.insertAdjacentHTML("beforeend",u),r.scrollTop=r.scrollHeight,i.reset()}catch(u){console.error("Failed to send email:",u);const g=`
            <div class="message received" style="animation-delay: 0.4s">
              <div class="message-content">
                <div class="message-bubble error">
                  Oops! Something went wrong. Please try again later.
                </div>
                <div class="message-time">Just now</div>
              </div>
            </div>
          `;r.insertAdjacentHTML("beforeend",g),r.scrollTop=r.scrollHeight}})}}});window.addEventListener("resize",()=>{typeof p5<"u"&&p5.instance&&p5.instance.windowResized()});
