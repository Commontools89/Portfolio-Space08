export default function Contact() {
  return `
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
  `;
}