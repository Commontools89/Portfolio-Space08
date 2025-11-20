export default function Contact() {
  return `
    <div id="contact" class="component">
      
      <div class="genai-chat">
        <div class="chat-window" id="ai-chat-window" aria-live="polite">
          <div class="chat-messages" id="ai-chat-messages"></div>
        </div>
        <form id="ai-chat-form" class="chat-input-bar" autocomplete="off">
          <input id="ai-chat-input" type="text" placeholder="Ask anything or say 'contact Manu'..." aria-label="Chat input" />
          <button type="submit" class="send-button send-ship" aria-label="Send">
            <span class="ship-wrap">
              <span class="ship-tail"></span>
              <span class="ship-head"></span>
            </span>
          </button>
        </form>
      </div>
    </div>
  `;
}