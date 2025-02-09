
document.addEventListener('DOMContentLoaded', () => {
    // Add highlight styles with shimmer effect
    const style = document.createElement('style');
    style.textContent = `
    .message.is-reply {
      position: relative;
      overflow: hidden;
    }

    .message.is-reply::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      width: 4px;
      height: 100%;
      background: #000000;
      animation: slideIn 0.3s ease-out;
    }

    .message.is-reply::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.05);
      animation: fadeOut 2s forwards;
    }

    .username-mention {
      position: relative;
      font-weight: bold;
      padding: 0 4px;
      border-radius: 3px;
      animation: shimmer 2s infinite linear;
    }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    @keyframes slideIn {
      from { transform: translateX(-100%); }
      to { transform: translateX(0); }
    }

    @keyframes fadeOut {
      0% { opacity: 1; }
      50% { opacity: 0.7; }
      100% { opacity: 0; }
    }
  `;
    document.head.appendChild(style);

    // Function to generate a random color
    function getRandomColor() {
      return `hsl(${Math.floor(Math.random() * 360)}, 80%, 70%)`;
    }

    // Function to wrap @username mentions with highlight span and random color
    function highlightUsernameMention(text) {
      return text.replace(/(@\w+)/g, (match) => {
        const randomColor = getRandomColor();
        return `<span class="username-mention" style="background: linear-gradient(90deg, ${randomColor} 25%, #ffffff 50%, ${randomColor} 75%); background-size: 200% 100%; color: #000;">${match}</span>`;
      });
    }

    // Watch for new messages and handle highlighting
    const chatContainer = document.getElementById('chatContainer');
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.classList?.contains('message')) {
            const messageContent = node.querySelector('.message-content p');
            if (messageContent) {
              const text = messageContent.textContent;
              if (text.includes('@')) {
                node.classList.add('is-reply');
                messageContent.innerHTML = highlightUsernameMention(text);
              }
            }
          }
        });
      });
    });

    observer.observe(chatContainer, { childList: true });

    // Also handle existing messages in case they're loaded after the script
    function highlightExistingMessages() {
      document.querySelectorAll('.message .message-content p').forEach(content => {
        const text = content.textContent;
        if (text.includes('@')) {
          content.closest('.message').classList.add('is-reply');
          content.innerHTML = highlightUsernameMention(text);
        }
      });
    }

    // Run initial highlight
    highlightExistingMessages();
  });