/**
 * Frontend Integration - DSpace Assistant Chat Widget
 *
 * This file shows how to integrate the Rasa DSpace Assistant
 * into a web frontend (React, Vue, vanilla JS, etc.)
 */

// ============================================================================
// 1. VANILLA JAVASCRIPT INTEGRATION
// ============================================================================

class DSpaceAssistantChat {
  constructor(config = {}) {
    this.rasaUrl = config.rasaUrl || 'http://localhost:5005/webhooks/rest/webhook';
    this.userId = config.userId || `user_${Date.now()}`;
    this.container = config.container || '#chat-widget';
    this.messages = [];
    this.isLoading = false;

    this.initializeUI();
    this.attachEventListeners();
  }

  /**
   * Initialize chat widget UI
   */
  initializeUI() {
    const container = document.querySelector(this.container);

    container.innerHTML = `
      <div class="dspace-assistant-chat">
        <div class="chat-header">
          <h3>📚 DSpace Assistant</h3>
          <p>Powered by ROSERAG</p>
        </div>

        <div class="chat-messages" id="chat-messages">
          <div class="message bot-message">
            <p>Welcome to DSpace! How can I help you today?</p>
          </div>
        </div>

        <div class="chat-input-wrapper">
          <input
            type="text"
            id="chat-input"
            placeholder="Ask about documents, search, submission..."
            class="chat-input"
            autocomplete="off"
          />
          <button id="send-btn" class="send-button">Send</button>
        </div>

        <div class="chat-footer">
          <small>Tip: Ask "What can you help with?" for options</small>
        </div>
      </div>
    `;

    // Add styles
    this.injectStyles();
  }

  /**
   * Inject CSS styles for chat widget
   */
  injectStyles() {
    const styles = `
      .dspace-assistant-chat {
        display: flex;
        flex-direction: column;
        height: 600px;
        max-width: 500px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        overflow: hidden;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }

      .chat-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 20px;
        text-align: center;
      }

      .chat-header h3 {
        margin: 0;
        font-size: 20px;
      }

      .chat-header p {
        margin: 5px 0 0 0;
        font-size: 12px;
        opacity: 0.9;
      }

      .chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
        background: #f9f9f9;
      }

      .message {
        margin-bottom: 16px;
        display: flex;
        animation: slideIn 0.3s ease-out;
      }

      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .bot-message {
        justify-content: flex-start;
      }

      .user-message {
        justify-content: flex-end;
      }

      .message p {
        margin: 0;
        padding: 12px 16px;
        border-radius: 12px;
        max-width: 80%;
        word-wrap: break-word;
      }

      .bot-message p {
        background: #e8e8ff;
        color: #333;
      }

      .user-message p {
        background: #667eea;
        color: white;
      }

      .loading-indicator {
        display: flex;
        gap: 4px;
        align-items: center;
        padding: 12px 16px;
      }

      .loading-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #667eea;
        animation: pulse 1.4s infinite;
      }

      .loading-dot:nth-child(2) { animation-delay: 0.2s; }
      .loading-dot:nth-child(3) { animation-delay: 0.4s; }

      @keyframes pulse {
        0%, 60%, 100% { opacity: 0.3; }
        30% { opacity: 1; }
      }

      .chat-input-wrapper {
        display: flex;
        gap: 8px;
        padding: 12px;
        border-top: 1px solid #e0e0e0;
        background: white;
      }

      .chat-input {
        flex: 1;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        padding: 10px 12px;
        font-size: 14px;
        outline: none;
        transition: border-color 0.2s;
      }

      .chat-input:focus {
        border-color: #667eea;
      }

      .send-button {
        background: #667eea;
        color: white;
        border: none;
        border-radius: 8px;
        padding: 10px 20px;
        cursor: pointer;
        font-weight: 500;
        transition: background 0.2s;
      }

      .send-button:hover {
        background: #764ba2;
      }

      .send-button:disabled {
        background: #ccc;
        cursor: not-allowed;
      }

      .chat-footer {
        text-align: center;
        padding: 8px;
        background: #fafafa;
        border-top: 1px solid #e0e0e0;
        font-size: 12px;
        color: #666;
      }

      .message-source {
        font-size: 12px;
        color: #666;
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid #ddd;
      }

      .source-item {
        margin: 4px 0;
      }

      .confidence-badge {
        display: inline-block;
        background: #e8f5e9;
        color: #2e7d32;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 11px;
        margin-top: 8px;
      }

      /* Dark mode support */
      @media (prefers-color-scheme: dark) {
        .dspace-assistant-chat {
          background: #1e1e1e;
          color: #fff;
        }

        .chat-messages {
          background: #2a2a2a;
        }

        .bot-message p {
          background: #3a3a5a;
          color: #e0e0ff;
        }

        .chat-input {
          background: #2a2a2a;
          color: #fff;
          border-color: #444;
        }

        .message-source {
          color: #ccc;
          border-top-color: #444;
        }
      }
    `;

    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    const input = document.querySelector('#chat-input');
    const sendBtn = document.querySelector('#send-btn');

    sendBtn.addEventListener('click', () => this.sendMessage());
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.sendMessage();
    });
  }

  /**
   * Send message to Rasa
   */
  async sendMessage() {
    const input = document.querySelector('#chat-input');
    const message = input.value.trim();

    if (!message) return;

    // Add user message to UI
    this.addMessageToUI(message, 'user');
    input.value = '';
    input.focus();

    // Show loading indicator
    this.isLoading = true;
    this.showLoadingIndicator();

    try {
      // Send to Rasa
      const response = await fetch(this.rasaUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: this.userId,
          message: message
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const responses = await response.json();

      // Remove loading indicator
      this.removeLoadingIndicator();

      // Display bot responses
      for (const resp of responses) {
        if (resp.text) {
          this.addMessageToUI(resp.text, 'bot');
        }

        if (resp.buttons) {
          this.showButtons(resp.buttons);
        }
      }
    } catch (error) {
      this.removeLoadingIndicator();
      this.addMessageToUI(
        'Sorry, I encountered an error. Please try again.',
        'bot'
      );
      console.error('Chat error:', error);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Add message to chat UI
   */
  addMessageToUI(text, sender = 'bot') {
    const messagesDiv = document.querySelector('#chat-messages');
    const messageEl = document.createElement('div');
    messageEl.className = `message ${sender}-message`;

    // Parse markdown-like formatting
    const formattedText = this.formatMessage(text);

    messageEl.innerHTML = `<p>${formattedText}</p>`;
    messagesDiv.appendChild(messageEl);

    // Scroll to bottom
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }

  /**
   * Format message text (basic markdown support)
   */
  formatMessage(text) {
    // Escape HTML
    text = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Bold
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Line breaks
    text = text.replace(/\n/g, '<br>');

    // Links
    text = text.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>');

    // Bullet points
    text = text.replace(/• (.*?)(<br>|$)/g, '• $1<br>');

    return text;
  }

  /**
   * Show loading indicator
   */
  showLoadingIndicator() {
    const messagesDiv = document.querySelector('#chat-messages');
    const loader = document.createElement('div');
    loader.id = 'loading-indicator';
    loader.className = 'loading-indicator';
    loader.innerHTML = `
      <div class="loading-dot"></div>
      <div class="loading-dot"></div>
      <div class="loading-dot"></div>
    `;
    messagesDiv.appendChild(loader);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }

  /**
   * Remove loading indicator
   */
  removeLoadingIndicator() {
    const loader = document.querySelector('#loading-indicator');
    if (loader) loader.remove();
  }

  /**
   * Show action buttons
   */
  showButtons(buttons) {
    const messagesDiv = document.querySelector('#chat-messages');
    const buttonsDiv = document.createElement('div');
    buttonsDiv.className = 'message-buttons';
    buttonsDiv.style.cssText = `
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-top: 8px;
    `;

    for (const btn of buttons) {
      const btnEl = document.createElement('button');
      btnEl.textContent = btn.title;
      btnEl.style.cssText = `
        padding: 8px 16px;
        background: #667eea;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 13px;
      `;
      btnEl.onclick = () => {
        const payload = btn.payload;
        // If it's an intent, prepend with /
        const message = payload.startsWith('/') ? payload : `/${payload}`;
        document.querySelector('#chat-input').value = message;
        this.sendMessage();
      };
      buttonsDiv.appendChild(btnEl);
    }

    messagesDiv.appendChild(buttonsDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }
}

// ============================================================================
// 2. REACT INTEGRATION EXAMPLE
// ============================================================================

/**
 * React Component: DSpaceAssistantChat
 *
 * Usage:
 * <DSpaceAssistantChat rasaUrl="http://localhost:5005/webhooks/rest/webhook" />
 */

// import React, { useState, useRef, useEffect } from 'react';

// export function DSpaceAssistantChat({ rasaUrl = 'http://localhost:5005/webhooks/rest/webhook' }) {
//   const [messages, setMessages] = useState([
//     { text: 'Welcome to DSpace! How can I help you today?', sender: 'bot' }
//   ]);
//   const [input, setInput] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [userId] = useState(`user_${Date.now()}`);
//   const messagesEndRef = useRef(null);

//   const scrollToBottom = () => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   };

//   useEffect(scrollToBottom, [messages]);

//   const sendMessage = async () => {
//     if (!input.trim()) return;

//     const userMsg = input;
//     setInput('');
//     setMessages(prev => [...prev, { text: userMsg, sender: 'user' }]);
//     setLoading(true);

//     try {
//       const response = await fetch(rasaUrl, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ sender: userId, message: userMsg })
//       });

//       const responses = await response.json();
//       setMessages(prev => [
//         ...prev,
//         ...responses.map(r => ({ text: r.text, sender: 'bot' }))
//       ]);
//     } catch (error) {
//       setMessages(prev => [
//         ...prev,
//         { text: 'Sorry, an error occurred.', sender: 'bot' }
//       ]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="dspace-assistant-chat">
//       <div className="chat-messages">
//         {messages.map((msg, idx) => (
//           <div key={idx} className={`message ${msg.sender}-message`}>
//             <p>{msg.text}</p>
//           </div>
//         ))}
//         {loading && <div className="loading-indicator">Loading...</div>}
//         <div ref={messagesEndRef} />
//       </div>

//       <div className="chat-input-wrapper">
//         <input
//           type="text"
//           value={input}
//           onChange={e => setInput(e.target.value)}
//           onKeyPress={e => e.key === 'Enter' && sendMessage()}
//           placeholder="Ask about documents..."
//           className="chat-input"
//         />
//         <button onClick={sendMessage} disabled={loading} className="send-button">
//           Send
//         </button>
//       </div>
//     </div>
//   );
// }

// ============================================================================
// 3. INITIALIZATION EXAMPLE
// ============================================================================

/**
 * HTML Usage:
 *
 * <div id="chat-widget"></div>
 *
 * <script src="frontend-integration.js"></script>
 * <script>
 *   const chat = new DSpaceAssistantChat({
 *     rasaUrl: 'http://localhost:5005/webhooks/rest/webhook',
 *     container: '#chat-widget',
 *     userId: 'user123'
 *   });
 * </script>
 */

// Auto-initialize if page contains chat-widget
if (document.querySelector('#chat-widget')) {
  window.addEventListener('DOMContentLoaded', () => {
    new DSpaceAssistantChat({
      container: '#chat-widget',
      rasaUrl: 'http://localhost:5005/webhooks/rest/webhook'
    });
  });
}

export default DSpaceAssistantChat;
