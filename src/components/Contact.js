export default function Contact() {
  return `
    <div id="contact" class="component">
      <div class="genai-chat-container">
        <div class="chat-window-wrapper" id="ai-chat-window-wrapper">
          <div class="chat-window-glow"></div>
          <div class="chat-window-darkBg"></div>
          <div class="chat-window-darkBg"></div>
          <div class="chat-window-darkBg"></div>
          <div class="chat-window-white"></div>
          <div class="chat-window-border"></div>
          <div class="chat-window" id="ai-chat-window">
            <div class="chat-messages" id="ai-chat-messages" role="log" aria-live="polite"></div>
          </div>
        </div>
        <div class="input-wrapper">
          <div id="poda">
            <div class="glow"></div>
            <div class="darkBorderBg"></div>
            <div class="darkBorderBg"></div>
            <div class="darkBorderBg"></div>
            <div class="white"></div>
            <div class="border"></div>
            <form id="ai-chat-form" autocomplete="off">
              <input id="ai-chat-input" type="text" placeholder="Type something here...." class="input" aria-label="Chat with AI" />
              <div id="input-mask"></div>
              <div id="pink-mask"></div>
              <div class="filterBorder"></div>
              <button type="submit" class="send-button" id="filter-icon" aria-label="Send message">
                <svg class="rocket-icon" viewBox="0 0 32 20" xmlns="http://www.w3.org/2000/svg">
                  <polygon points="22,10 10,4 10,16" fill="#d5fa1b"/>
                  <polygon points="10,7 0,10 10,13" fill="#ff8a00"/>
                </svg>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;
}