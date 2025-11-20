export default function Contact() {
  return `
    <div id="contact" class="component">
      <div class="genai-chat-container">
        <div class="chat-window" id="ai-chat-window">
          <div class="chat-window-glow"></div>
          <div class="chat-messages" id="ai-chat-messages" role="log" aria-live="polite"></div>
        </div>
        <div class="input-wrapper">
          <form id="ai-chat-form" autocomplete="off">
            <input id="ai-chat-input" type="text" placeholder="Type something here...." class="input" aria-label="Chat with AI" />
            <button type="submit" class="send-button" aria-label="Send message">
              <svg class="rocket-icon" viewBox="0 0 32 20" xmlns="http://www.w3.org/2000/svg">
                <polygon points="22,10 10,4 10,16" fill="#d5fa1b"/>
                <polygon points="10,7 0,10 10,13" fill="#ff8a00"/>
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  `;
}