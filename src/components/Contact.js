export default function Contact() {
  return `
    <div id="contact" class="component">
      <div class="genai-chat-container">
        <div class="chat-window" id="ai-chat-window">
          <div class="chat-messages" id="ai-chat-messages" role="log" aria-live="polite"></div>
        </div>
        <div class="input-wrapper">
          <form id="ai-chat-form" class="chat-input-bar" autocomplete="off">
            <input id="ai-chat-input" type="text" placeholder="Ask anything or say 'contact Manu'..." aria-label="Chat with AI" />
            <button type="submit" class="send-button" aria-label="Send message">
              <svg class="rocket-icon" viewBox="0 0 32 20" xmlns="http://www.w3.org/2000/svg">
                <polygon points="22,10 10,4 10,16" fill="#d5fa1b" filter="url(#glow-verde)"/>
                <polygon points="10,7 0,10 10,13" fill="#ff8a00" filter="url(#glow-orange)"/>
                <defs>
                  <filter id="glow-verde" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                    <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
                  </filter>
                  <filter id="glow-orange" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="1.2" result="coloredBlur"/>
                    <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
                  </filter>
                </defs>
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  `;
}