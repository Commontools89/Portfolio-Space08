export default function Contact() {
  return `
    <div id="contact" class="component">
      <h2>Contact Me</h2>
      <form id="contact-form" class="contact-form">
        <input type="text" name="name" placeholder="Your Name" required>
        <input type="email" name="email" placeholder="Your Email" required>
        <input type="tel" name="phone" placeholder="Your Phone Number">
        <textarea name="message" placeholder="Your Message" required></textarea>
        <button type="submit"><span>Get to me</span></button>
      </form>
    </div>
  `;
}