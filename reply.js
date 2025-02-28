
// Enhanced Comment System Implementation
// Light theme with improved functionality and responsiveness

// Create and inject the comment panel
const commentPanel = document.createElement('div');
commentPanel.id = 'comment-panel-container';
commentPanel.style.cssText = `
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60%;
  background-color: #ffffff;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  display: none;
  flex-direction: column;
  z-index: 1000;
  transform: translateY(100%);
  transition: transform 0.3s ease;
`;

commentPanel.innerHTML = `
  <div class="comment-panel-header" style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-bottom: 1px solid #e1e8ed; cursor: grab;">
    <div style="width: 24px;"></div>
    <div class="resize-handle" style="width: 40px; height: 5px; background-color: #e1e8ed; border-radius: 3px; position: absolute; top: 6px; left: 50%; transform: translateX(-50%);"></div>
    <span class="comment-panel-title" style="font-weight: bold; font-size: 18px; color: #14171a;">Comments</span>
    <button class="comment-panel-close" style="background: none; border: none; color: #657786; font-size: 24px; cursor: pointer; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; padding: 0;">×</button>
  </div>
  <div class="comment-panel-content" style="flex: 1; overflow-y: auto; padding: 16px; background-color: #ffffff;">
    <div class="comment-messages" style="display: flex; flex-direction: column;"></div>
    <div class="comment-typing-indicator" style="display: none; padding: 8px 0; color: #657786; font-style: italic; font-size: 14px;">Someone is typing...</div>
  </div>
  <div class="comment-input-container" style="display: flex; padding: 12px 16px; border-top: 1px solid #e1e8ed; background-color: #ffffff;">
    <textarea class="comment-textarea" placeholder="Add a comment..." style="flex: 1; background-color: #f5f8fa; border: 1px solid #e1e8ed; border-radius: 20px; color: #14171a; padding: 10px 15px; resize: none; outline: none; max-height: 100px; overflow-y: auto;"></textarea>
    <button class="comment-send-btn" disabled style="background-color: #1da1f2; color: white; border: none; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer; margin-left: 12px;">
      <svg viewBox="0 0 24 24" style="width: 18px; height: 18px; fill: currentColor;">
        <path d="M2.252 6.456l19.476 5.825c.53.159.53.928 0 1.088L2.252 19.194c-.43.129-.81-.303-.53-.604l4.309-4.672c.45-.487.45-1.256 0-1.742L1.722 7.06c-.28-.302.1-.733.53-.604z"></path>
      </svg>
    </button>
  </div>
`;

document.body.appendChild(commentPanel);

// Add necessary styles for animations and smooth operation
const styleElement = document.createElement('style');
styleElement.textContent = `
  #comment-panel-container.active {
    transform: translateY(0);
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes bounce {
    from { transform: translateY(0); }
    to { transform: translateY(-5px); }
  }
  
  .comment-message {
    display: flex;
    padding: 12px 0;
    border-bottom: 1px solid #e1e8ed;
    animation: fadeIn 0.3s ease;
  }
  
  .loading-indicator {
    display: flex;
    justify-content: center;
    padding: 20px;
  }
  
  .loading-dot {
    width: 8px;
    height: 8px;
    margin: 0 4px;
    border-radius: 50%;
    background-color: #1da1f2;
    animation: bounce 0.5s infinite alternate;
  }
  
  .loading-dot:nth-child(2) {
    animation-delay: 0.1s;
  }
  
  .loading-dot:nth-child(3) {
    animation-delay: 0.2s;
  }
  
  .reply-btn {
    display: flex;
    align-items: center;
    cursor: pointer !important;
    transition: color 0.2s;
  }
  
  .reply-btn:hover {
    color: #1da1f2 !important;
  }
`;
document.head.appendChild(styleElement);

// Attach event listeners to existing reply buttons
function attachReplyListeners() {
  const replyButtons = document.querySelectorAll('.reply-btn');
  replyButtons.forEach(button => {
    if (!button._hasClickListener) {
      button._hasClickListener = true;
      button.addEventListener('click', function(e) {
        e.stopPropagation();
        const messageElement = this.closest('.message');
        const messageId = messageElement.getAttribute('data-message-id');
        openCommentPanel(messageId, messageElement);
      });
    }
  });
}

// Initial attachment of listeners
attachReplyListeners();

// Observer to attach listeners to new reply buttons as they're added
const observer = new MutationObserver(mutations => {
  mutations.forEach(mutation => {
    if (mutation.type === 'childList') {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === 1) { // Element node
          const newReplyButtons = node.querySelectorAll ? node.querySelectorAll('.reply-btn') : [];
          newReplyButtons.forEach(button => {
            if (!button._hasClickListener) {
              button._hasClickListener = true;
              button.addEventListener('click', function(e) {
                e.stopPropagation();
                const messageElement = this.closest('.message');
                const messageId = messageElement.getAttribute('data-message-id');
                openCommentPanel(messageId, messageElement);
              });
            }
          });
        }
      });
    }
  });
});

// Start observing the chat container
const chatContainer = document.querySelector('.chat-container');
if (chatContainer) {
  observer.observe(chatContainer, {
    childList: true,
    subtree: true
  });
}

// Set up panel functionality
function setupPanelFunctionality() {
  const closeButton = commentPanel.querySelector('.comment-panel-close');
  const header = commentPanel.querySelector('.comment-panel-header');
  const textarea = commentPanel.querySelector('.comment-textarea');
  const sendButton = commentPanel.querySelector('.comment-send-btn');
  
  // Close button event - fixed to ensure proper closing
  closeButton.addEventListener('click', function() {
    commentPanel.style.transform = 'translateY(100%)';
    setTimeout(() => {
      commentPanel.style.display = 'none';
    }, 300);
  });

  // Textarea input event
  textarea.addEventListener('input', function() {
    // Auto-resize textarea
    this.style.height = 'auto';
    this.style.height = (Math.min(this.scrollHeight, 100)) + 'px';
    
    // Enable/disable send button based on content
    sendButton.disabled = this.value.trim().length === 0;
    
    // Update typing status if Firebase is available
    try {
      if (window.currentUser && window.database) {
        const messageId = commentPanel.getAttribute('data-message-id');
        const typingRef = ref(database, `commentTyping/${messageId}/${currentUser.uid}`);
        set(typingRef, {
          name: currentUser.displayName,
          timestamp: Date.now()
        });
        
        // Clear after 3 seconds
        clearTimeout(window.typingTimeout);
        window.typingTimeout = setTimeout(() => {
          set(typingRef, null);
        }, 3000);
      }
    } catch (e) {
      console.log('Typing indicator update failed, Firebase may not be ready');
    }
  });

  // Send button event
  sendButton.addEventListener('click', function() {
    sendComment();
  });

  // Enter key to send (Shift+Enter for new line)
  textarea.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!sendButton.disabled) {
        sendComment();
      }
    }
  });

  // Improved dragging and resizing functionality
  let startY, startHeight, isDragging = false;

  // Touch and mouse event handlers for dragging/resizing
  function startDrag(e) {
    // Get Y position from either mouse or touch event
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    // Ignore if clicking on close button
    if (e.target === closeButton) return;
    
    isDragging = true;
    startY = clientY;
    startHeight = commentPanel.offsetHeight;
    
    document.body.style.userSelect = 'none';
    
    // Prevent default only for touch events to avoid scroll blocking
    if (e.touches) e.preventDefault();
  }

  function dragMove(e) {
    if (!isDragging) return;
    
    // Get Y position from either mouse or touch event
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const deltaY = startY - clientY;
    const newHeight = Math.max(200, Math.min(window.innerHeight * 0.9, startHeight + deltaY));
    
    commentPanel.style.height = newHeight + 'px';
    
    // Prevent default for touch events
    if (e.touches) e.preventDefault();
  }

  function endDrag() {
    isDragging = false;
    document.body.style.userSelect = '';
  }

  // Mouse events
  header.addEventListener('mousedown', startDrag);
  document.addEventListener('mousemove', dragMove);
  document.addEventListener('mouseup', endDrag);

  // Touch events for mobile
  header.addEventListener('touchstart', startDrag, { passive: false });
  document.addEventListener('touchmove', dragMove, { passive: false });
  document.addEventListener('touchend', endDrag);
}

// Open comment panel for a specific message
function openCommentPanel(messageId, messageElement) {
  // Store the message ID and reset the comments area
  commentPanel.setAttribute('data-message-id', messageId);
  commentPanel.querySelector('.comment-messages').innerHTML = '';
  
  // Show loading indicator
  const loadingIndicator = document.createElement('div');
  loadingIndicator.className = 'loading-indicator';
  loadingIndicator.innerHTML = `
    <div style="display: flex; justify-content: center; padding: 20px;">
      <div class="loading-dot"></div>
      <div class="loading-dot"></div>
      <div class="loading-dot"></div>
    </div>
  `;
  commentPanel.querySelector('.comment-messages').appendChild(loadingIndicator);
  
  // Show the panel with proper animation
  commentPanel.style.display = 'flex';
  // Small delay to ensure display takes effect before transform
  setTimeout(() => {
    commentPanel.style.transform = 'translateY(0)';
  }, 10);
  
  // Load comments if Firebase is available
  try {
    if (window.firebase && window.database) {
      loadComments(messageId);
    } else {
      // Fallback to static comments if Firebase isn't available
      setTimeout(() => {
        commentPanel.querySelector('.comment-messages').innerHTML = `
          <div style="text-align: center; padding: 20px; color: #657786;">
            Loading comments...
          </div>
        `;
      }, 1000);
    }
  } catch (e) {
    console.log('Failed to load comments, Firebase may not be ready');
    commentPanel.querySelector('.comment-messages').innerHTML = `
      <div style="text-align: center; padding: 20px; color: #657786;">
        Comments are currently unavailable.
      </div>
    `;
  }
  
  // Clear textarea
  const textarea = commentPanel.querySelector('.comment-textarea');
  textarea.value = '';
  textarea.style.height = 'auto';
  commentPanel.querySelector('.comment-send-btn').disabled = true;
}

// Send a comment
function sendComment() {
  const messageId = commentPanel.getAttribute('data-message-id');
  const textarea = commentPanel.querySelector('.comment-textarea');
  const text = textarea.value.trim();
  
  if (!text) return;
  
  // Add a temporary comment to the UI
  const temporaryComment = document.createElement('div');
  temporaryComment.className = 'comment-message';
  
  const userPhoto = window.currentUser ? window.currentUser.photoURL : "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png";
  const userName = window.currentUser ? window.currentUser.displayName : "Anonymous User";
  
  temporaryComment.innerHTML = `
    <img src="${userPhoto}" style="width: 40px; height: 40px; border-radius: 50%; margin-right: 12px;" alt="Profile">
    <div style="flex: 1;">
      <div style="display: flex; align-items: center; margin-bottom: 4px;">
        <span style="font-weight: bold; margin-right: 5px; color: #14171a;">${userName}</span>
        <span style="color: #657786; font-size: 14px;">just now</span>
      </div>
      <div style="word-wrap: break-word; line-height: 1.4; color: #14171a;">${text}</div>
    </div>
  `;
  
  commentPanel.querySelector('.comment-messages').appendChild(temporaryComment);
  
  // Reset textarea
  textarea.value = '';
  textarea.style.height = 'auto';
  commentPanel.querySelector('.comment-send-btn').disabled = true;
  
  // Try to use Firebase if available
  try {
    if (window.firebase && window.database && window.currentUser) {
      const commentsRef = ref(database, `comments/${messageId}`);
      push(commentsRef, {
        userId: currentUser.uid,
        name: currentUser.displayName,
        photoURL: currentUser.photoURL,
        text: text,
        timestamp: new Date().toISOString()
      });
      
      // Update reply count on the message
      const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
      if (messageElement) {
        const replyBtn = messageElement.querySelector('.reply-btn');
        if (replyBtn) {
          const currentCount = parseInt(replyBtn.textContent.trim() || "0");
          const svgContent = replyBtn.innerHTML.split('</svg>')[0] + '</svg>';
          replyBtn.innerHTML = svgContent + ' ' + (currentCount + 1);
        }
      }
    }
  } catch (e) {
    console.log('Failed to save comment, Firebase may not be ready');
  }
  
  // Scroll to bottom
  const contentDiv = commentPanel.querySelector('.comment-panel-content');
  contentDiv.scrollTop = contentDiv.scrollHeight;
}

// Load comments from Firebase
function loadComments(messageId) {
  try {
    const commentsRef = ref(database, `comments/${messageId}`);
    onValue(commentsRef, (snapshot) => {
      const commentsContainer = commentPanel.querySelector('.comment-messages');
      commentsContainer.innerHTML = '';
      
      const comments = snapshot.val();
      if (!comments) {
        commentsContainer.innerHTML = `
          <div style="text-align: center; padding: 20px; color: #657786;">
            No comments yet. Be the first to comment!
          </div>
        `;
        return;
      }
      
      // Add each comment to the UI
      Object.entries(comments).forEach(([commentId, comment]) => {
        const time = formatTime(new Date(comment.timestamp));
        
        const commentElement = document.createElement('div');
        commentElement.className = 'comment-message';
        
        commentElement.innerHTML = `
          <img src="${comment.photoURL}" style="width: 40px; height: 40px; border-radius: 50%; margin-right: 12px;" alt="Profile">
          <div style="flex: 1;">
            <div style="display: flex; align-items: center; margin-bottom: 4px;">
              <span style="font-weight: bold; margin-right: 5px; color: #14171a;">${comment.name}</span>
              <span style="color: #657786; font-size: 14px;">${time}</span>
            </div>
            <div style="word-wrap: break-word; line-height: 1.4; color: #14171a;">${comment.text}</div>
          </div>
        `;
        
        commentsContainer.appendChild(commentElement);
      });
      
      // Update comment count on the message
      const count = Object.keys(comments).length;
      const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
      if (messageElement) {
        const replyBtn = messageElement.querySelector('.reply-btn');
        if (replyBtn) {
          const svgContent = replyBtn.innerHTML.split('</svg>')[0] + '</svg>';
          replyBtn.innerHTML = svgContent + ' ' + count;
        }
      }
    });
  } catch (e) {
    console.log('Failed to load comments, Firebase may not be ready');
  }
}

// Helper function to format time
function formatTime(date) {
  const now = new Date();
  const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
  
  if (diffInHours < 24) {
    return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
  } else if (diffInHours < 48) {
    return 'Yesterday';
  } else {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}`;
  }
}

// Set up panel functionality
setupPanelFunctionality();

// Make sure all existing reply buttons are functional
setTimeout(() => {
  attachReplyListeners();
}, 500);

// Firebase compatibility layer - helps with different firebase import methods
function ref(db, path) {
  // Check which Firebase version is being used
  if (window.firebase && window.firebase.database) {
    // Firebase modular SDK
    return window.firebase.database().ref(path);
  } else if (window.database && window.database.ref) {
    // Firebase v9+ with getDatabase
    return window.database.ref(path);
  }
  return null;
}

function push(reference, data) {
  if (!reference) return null;
  
  if (reference.push) {
    return reference.push(data);
  }
  return null;
}

function set(reference, data) {
  if (!reference) return;
  
  if (reference.set) {
    reference.set(data);
  }
}

function onValue(reference, callback) {
  if (!reference) return;
  
  if (reference.on) {
    reference.on('value', callback);
  }
}

console.log("Comment system initialized with light theme");
