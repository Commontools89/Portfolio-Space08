export default function Contact() {
  return `
    <div id="contact" class="component">
      <div class="genai-chat-container">
        <div class="chat-window" id="ai-chat-window">
          <div class="chat-messages" id="ai-chat-messages" role="log" aria-live="polite"></div>
        </div>
        <div class="input-wrapper">
          <div class="grid-bg"></div>
          <div id="poda">
            <div class="glow"></div>
            <div class="darkBorderBg"></div>
            <div class="darkBorderBg"></div>
            <div class="darkBorderBg"></div>
            <div class="white"></div>
            <div class="border"></div>
            <form id="ai-chat-form" id="main" autocomplete="off">
              <input id="ai-chat-input" type="text" placeholder="Ask anything or say 'contact Manu'..." class="input" aria-label="Chat with AI" />
              <div id="input-mask"></div>
              <div id="pink-mask"></div>
              <div class="filterBorder"></div>
              <button type="submit" class="send-button" id="filter-icon" aria-label="Send message">
                <svg class="rocket-icon" viewBox="0 0 32 20" xmlns="http://www.w3.org/2000/svg">
                  <polygon points="22,10 10,4 10,16" fill="#d5fa1b"/>
                  <polygon points="10,7 0,10 10,13" fill="#ff8a00"/>
                </svg>
              </button>
              <div id="search-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" viewBox="0 0 24 24" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" height="24" fill="none">
                  <circle stroke="url(#search)" r="8" cy="11" cx="11" />
                  <line stroke="url(#searchl)" y2="16.65" y1="22" x2="16.65" x1="22" />
                  <defs>
                    <linearGradient gradientTransform="rotate(50)" id="search">
                      <stop stop-color="#f8e7f8" offset="0%" />
                      <stop stop-color="#b6a9b7" offset="50%" />
                    </linearGradient>
                    <linearGradient id="searchl">
                      <stop stop-color="#b6a9b7" offset="0%" />
                      <stop stop-color="#837484" offset="50%" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;
}