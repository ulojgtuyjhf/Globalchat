
// Firebase Configuration
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, query as firestoreQuery, where, getDocs, addDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getDatabase, ref, push, set, onChildAdded, update, query as dbQuery, limitToLast, startAfter, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

// Strong Content Moderation Configuration
const BLOCKED_PATTERNS = [
  /http(s)?:\/\/[^\s]+/i, // Block URLs
  /\bwww\.[^\s]+/i, // Block URLs starting with "www"
  /\.com\b/i, // Block .com domains
  /\.net\b/i, // Block .net domains
  /\.org\b/i, // Block .org domains
  /rape(s|d|ing)?\b/i, // Block explicit content and variations
  /fuck(ed|ing|s)?\b/i, // Block profanity and variations
  /sh(it|itty)?\b/i, // Block profanity and variations
  /damn(ed)?\b/i, // Block mild profanity and variations
  /ass(hole|es)?\b/i, // Block offensive language
  /bitch(es|y)?\b/i, // Block offensive language
  /cunt(s)?\b/i, // Block offensive language
  /dick(s|head)?\b/i, // Block offensive language
  /pussy\b/i, // Block offensive language
  /nigg(er|a|s)?\b/i, // Block racial slurs
  /fag(got|s)?\b/i, // Block offensive slurs
  /\bsex(ual|y|ing|ed)?\b/i, // Block explicit sexual references
  /\bpenis\b/i, // Block explicit content
  /\bvagina\b/i, // Block explicit content
  /boob(s|ies)?\b/i, // Block explicit content
  /\bfuck[\s\-]you\b/i, // Block "fuck you" variations
  /suck[\s\-]my[\s\-](dick|cock)\b/i, // Block explicit phrases
  /\bkill[\s\-]yourself\b/i, // Block harmful phrases
  /\bi[\s\-]?hate[\s\-]?you\b/i, // Block hate speech
];

function containsBlockedContent(input) {
  return BLOCKED_PATTERNS.some(pattern => pattern.test(input));
}

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDnPz8BWCaXJOazlFVO4Eap8VxdSR2oDFQ",
  authDomain: "globalchat-2d669.firebaseapp.com",
  projectId: "globalchat-2d669",
  storageBucket: "globalchat-2d669.appspot.com",
  messagingSenderId: "178714711978",
  appId: "1:178714711978:web:fb831188be23e62a4bbdd3",
  databaseURL: "https://globalchat-2d669-default-rtdb.firebaseio.com/"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const database = getDatabase(app);
const storage = getStorage(app);
const chatRef = ref(database, 'messages');

const chatContainer = document.getElementById('chatContainer');
const messageInput = document.getElementById('messageInput');
const loadingIndicator = document.getElementById('loadingIndicator');

let currentUser = null;
const activeReplies = new Set();
let lastMessageTime = 0;
const followedUsers = new Set();
let lastMessageKey = null;
const MESSAGE_LIMIT = 50;
const MESSAGE_BATCH_SIZE = 10;
const messageCache = new Map();
let selectedFiles = [];

// Initialize UI elements for image sharing
function initializeImageSharingUI() {
  // Add styles for the image upload system
  const style = document.createElement('style');
  style.textContent = `
    .message-media {
      max-width: 300px;
      max-height: 200px;
      border-radius: 10px;
      margin-top: 10px;
      cursor: pointer;
      transition: transform 0.3s ease;
    }
    
    .message-media:hover {
      transform: scale(1.05);
    }
    
    .preview-area {
      padding: 10px;
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      background: linear-gradient(145deg, #f0f5fc, #e6eaf3);
      border-radius: 10px;
      margin-bottom: 10px;
      box-shadow: 
        3px 3px 6px rgba(0, 0, 0, 0.15),
        -3px -3px 6px rgba(255, 255, 255, 0.8);
    }
    
    .preview-item {
      position: relative;
      width: 100px;
      height: 100px;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 3px 3px 6px rgba(0, 0, 0, 0.15);
      transition: transform 0.3s ease;
    }
    
    .preview-item:hover {
      transform: scale(1.05);
      box-shadow: 4px 4px 8px rgba(0, 0, 0, 0.2);
    }
    
    .preview-item img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .preview-remove {
      position: absolute;
      top: 4px;
      right: 4px;
      background: rgba(0, 0, 0, 0.6);
      color: white;
      border: none;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      transition: background 0.3s ease;
    }
    
    .preview-remove:hover {
      background: rgba(0, 0, 0, 0.8);
    }
    
    .upload-btn {
      background: linear-gradient(145deg, #f0f5fc, #e6eaf3);
      border: none;
      padding: 8px;
      cursor: pointer;
      margin-right: 10px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 
        3px 3px 6px rgba(0, 0, 0, 0.15),
        -3px -3px 6px rgba(255, 255, 255, 0.8);
      transition: all 0.3s ease;
    }
    
    .upload-btn:hover {
      transform: translateY(-2px);
      box-shadow: 
        4px 4px 8px rgba(0, 0, 0, 0.2),
        -4px -4px 8px rgba(255, 255, 255, 0.9);
    }
    
    .media-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s ease;
    }
    
    .media-overlay.active {
      opacity: 1;
      pointer-events: auto;
    }
    
    .media-overlay img {
      max-width: 90%;
      max-height: 90%;
      border-radius: 10px;
      box-shadow: 0 0 20px rgba(255, 255, 255, 0.2);
    }
    
    .close-overlay {
      position: absolute;
      top: 20px;
      right: 20px;
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border: none;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      font-size: 20px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.3s ease;
    }
    
    .close-overlay:hover {
      background: rgba(255, 255, 255, 0.3);
    }
  `;
  document.head.appendChild(style);
  
  // Create preview area
  const previewArea = document.createElement('div');
  previewArea.className = 'preview-area';
  previewArea.style.display = 'none';
  document.querySelector('.input-container').insertAdjacentElement('beforebegin', previewArea);
  
  // Create file input
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.multiple = true;
  fileInput.accept = 'image/*';
  fileInput.style.display = 'none';
  fileInput.id = 'file-input';
  document.body.appendChild(fileInput);
  
  // Create upload button
  const uploadBtn = document.createElement('button');
  uploadBtn.className = 'upload-btn';
  uploadBtn.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 19H3a2 2 0 01-2-2V8a2 2 0 012-2h5l2-3h6l2 3h3a2 2 0 012 2v9a2 2 0 01-2 2z"/>
      <circle cx="12" cy="13" r="3"/>
    </svg>
  `;
  document.querySelector('.input-container').insertBefore(uploadBtn, document.querySelector('.input-container').firstChild);
  
  // Create media overlay for image preview
  const mediaOverlay = document.createElement('div');
  mediaOverlay.className = 'media-overlay';
  mediaOverlay.innerHTML = `
    <button class="close-overlay">×</button>
    <img src="" alt="Full size image">
  `;
  document.body.appendChild(mediaOverlay);
  
  // Add event listeners
  uploadBtn.addEventListener('click', () => fileInput.click());
  
  fileInput.addEventListener('change', handleFileSelection);
  
  mediaOverlay.querySelector('.close-overlay').addEventListener('click', () => {
    mediaOverlay.classList.remove('active');
  });
  
  // Close overlay when clicking outside the image
  mediaOverlay.addEventListener('click', (e) => {
    if (e.target === mediaOverlay) {
      mediaOverlay.classList.remove('active');
    }
  });
  
  // Add keyboard listener to close with Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mediaOverlay.classList.contains('active')) {
      mediaOverlay.classList.remove('active');
    }
  });
}

// Handle file selection
function handleFileSelection(e) {
  const files = Array.from(e.target.files).filter(file => file.type.startsWith('image/'));
  if (files.length === 0) return;
  
  // Limit to 5 images at a time
  const maxImages = 5;
  if (selectedFiles.length + files.length > maxImages) {
    alert(`You can only upload up to ${maxImages} images at once.`);
    const allowedCount = maxImages - selectedFiles.length;
    selectedFiles = [...selectedFiles, ...files.slice(0, allowedCount)];
  } else {
    selectedFiles = [...selectedFiles, ...files];
  }
  
  updatePreviewArea();
}

// Update the preview area with selected images
function updatePreviewArea() {
  const previewArea = document.querySelector('.preview-area');
  previewArea.innerHTML = '';
  
  if (selectedFiles.length > 0) {
    previewArea.style.display = 'flex';
    
    selectedFiles.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = function(e) {
        const preview = document.createElement('div');
        preview.className = 'preview-item';
        
        const img = document.createElement('img');
        img.src = e.target.result;
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'preview-remove';
        removeBtn.innerHTML = '×';
        removeBtn.onclick = function(e) {
          e.stopPropagation();
          selectedFiles.splice(index, 1);
          updatePreviewArea();
        };
        
        preview.appendChild(img);
        preview.appendChild(removeBtn);
        previewArea.appendChild(preview);
      };
      reader.readAsDataURL(file);
    });
  } else {
    previewArea.style.display = 'none';
  }
}

// Styling for Follow Button
function initializeFollowButton() {
  const styleTag = document.createElement('style');
  styleTag.textContent = `
    .follow-btn {
      background-color: #000000;
      color: #fff;
      border: none;
      padding: 4px 8px;
      text-align: center;
      text-decoration: none;
      display: inline-block;
      font-size: 10px;
      margin: 4px 2px;
      cursor: pointer;
      border-radius: 8px;
      box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.15), -2px -2px 4px rgba(255, 255, 255, 0.8);
      transition: all 0.3s ease;
    }
    .follow-btn:active {
      box-shadow: inset 2px 2px 4px rgba(0, 0, 0, 0.2), inset -2px -2px 4px rgba(255, 255, 255, 0.7);
    }
    .follow-btn.followed {
      background-color: #333333;
      color: #fff;
    }
    .follow-btn:hover {
      transform: translateY(-2px);
      box-shadow: 3px 3px 6px rgba(0, 0, 0, 0.2), -3px -3px 6px rgba(255, 255, 255, 0.9);
    }
  `;
  document.head.appendChild(styleTag);
}

// Follow/Unfollow User
async function toggleFollow(userId, userName) {
  if (!currentUser) {
    alert('Please log in first!');
    return;
  }
  
  try {
    const followQuery = firestoreQuery(
      collection(db, 'follows'),
      where('followerUserId', '==', currentUser.uid),
      where('followedUserId', '==', userId)
    );
    
    const followSnapshot = await getDocs(followQuery);
    
    if (followSnapshot.empty) {
      await addDoc(collection(db, 'follows'), {
        followerUserId: currentUser.uid,
        followedUserId: userId,
        followedUserName: userName,
        timestamp: new Date().toISOString()
      });
      followedUsers.add(userId);
      alert(`You are now following ${userName}`);
    } else {
      followSnapshot.docs.forEach(async (followDoc) => {
        await deleteDoc(doc(db, 'follows', followDoc.id));
      });
      followedUsers.delete(userId);
      alert(`You have unfollowed ${userName}`);
    }
    
    updateFollowButtons();
  } catch (error) {
    console.error('Follow/Unfollow error:', error);
  }
}

// Update Follow Buttons
function updateFollowButtons() {
  const followButtons = document.querySelectorAll('.follow-btn');
  followButtons.forEach(btn => {
    const userId = btn.getAttribute('data-user-id');
    btn.textContent = followedUsers.has(userId) ? 'Unfollow' : 'Follow';
    btn.classList.toggle('followed', followedUsers.has(userId));
  });
}

// Fetch Followed Users
async function fetchFollowedUsers() {
  if (!currentUser) return;
  
  try {
    const followQuery = firestoreQuery(
      collection(db, 'follows'),
      where('followerUserId', '==', currentUser.uid)
    );
    
    const followSnapshot = await getDocs(followQuery);
    followedUsers.clear();
    followSnapshot.docs.forEach(doc => {
      const followedUserId = doc.data().followedUserId;
      followedUsers.add(followedUserId);
    });
    
    updateFollowButtons();
  } catch (error) {
    console.error('Error fetching followed users:', error);
  }
}

function moderateContent(text) {
  const hasBlockedContent = BLOCKED_PATTERNS.some(pattern => pattern.test(text));
  if (hasBlockedContent) {
    alert('Your message contains prohibited content. Please revise and adhere to the content guidelines.');
    return false;
  }
  return true;
}

function createLoadingAnimation() {
  const dotCount = 3;
  const loadingDots = Array.from({ length: dotCount }, () => {
    const dot = document.createElement('div');
    dot.classList.add('loading-dot');
    return dot;
  });
  
  loadingIndicator.innerHTML = '';
  loadingDots.forEach(dot => loadingIndicator.appendChild(dot));
}

async function getCountryFromIP() {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    return data.country_code.toLowerCase();
  } catch (error) {
    console.error('Failed to fetch country:', error);
    return 'unknown';
  }
}

onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      const countryCode = await getCountryFromIP();
      
      currentUser = {
        uid: user.uid,
        displayName: user.displayName || userData?.displayName || "Anonymous",
        photoURL: user.photoURL || userData?.photoURL || "default-profile.png",
        country: countryCode
      };
      
      await fetchFollowedUsers();
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  } else {
    currentUser = null;
    followedUsers.clear();
  }
});

// Global Rate Limit Configuration
const GLOBAL_RATE_LIMIT_MS = 3000; // 3 seconds
const lastMessageTimeRef = ref(database, 'lastMessageTime'); 

// Function to check and update global rate limit
async function checkAndUpdateGlobalRateLimit() {
  try {
    const snapshot = await get(lastMessageTimeRef);
    const lastMessageTime = snapshot.exists() ? snapshot.val() : 0;
    const currentTime = Date.now();

    if (currentTime - lastMessageTime < GLOBAL_RATE_LIMIT_MS) {
      alert('Please wait 3 seconds before sending your next message. This is a global rate limit.');
      return false;
    }

    // Update the last message time in the database
    await set(lastMessageTimeRef, currentTime);
    return true;
  } catch (error) {
    console.error('Error checking global rate limit:', error);
    return false;
  }
}

// Upload images and get URLs
async function uploadImages(files) {
  const uploadPromises = files.map(async (file) => {
    const imageRef = storageRef(storage, `images/${Date.now()}_${file.name}`);
    await uploadBytes(imageRef, file);
    return getDownloadURL(imageRef);
  });
  
  return Promise.all(uploadPromises);
}

// Send Message Function
async function sendMessage(parentMessageId = null) {
  if (!currentUser) {
    alert('You must log in to continue.');
    return;
  }

  const messageText = messageInput.value.trim();

  if (messageText === '' && selectedFiles.length === 0) {
    alert('Please enter a message or select an image to share.');
    return;
  }

  if (messageText !== '' && !moderateContent(messageText)) return;

  // Check and update global rate limit
  const isAllowed = await checkAndUpdateGlobalRateLimit();
  if (!isAllowed) return;

  createLoadingAnimation();
  loadingIndicator.style.display = 'flex';

  try {
    const newMessageRef = push(chatRef);
    
    // Upload images if any
    const imageUrls = selectedFiles.length > 0 ? await uploadImages(selectedFiles) : [];
    
    const messageData = {
      userId: currentUser.uid,
      name: currentUser.displayName,
      photoURL: currentUser.photoURL,
      text: messageText,
      timestamp: new Date().toISOString(),
      country: currentUser.country,
      parentMessageId: parentMessageId,
      replyCount: 0,
      isCreator: parentMessageId !== null,
      images: imageUrls
    };

    await set(newMessageRef, messageData);
    
    // Clear input and selected files
    messageInput.value = '';
    selectedFiles = [];
    updatePreviewArea();
    
  } catch (error) {
    console.error('Error sending message:', error);
    alert('Failed to send message. Please try again.');
  } finally {
    loadingIndicator.style.display = 'none';
  }
}

// Send Reply Function
async function sendReply(parentMessageId) {
  const replyTextarea = document.querySelector(`[data-message-id="${parentMessageId}"] .reply-textarea`);
  const replyText = replyTextarea.value.trim();

  if (replyText === '') {
    alert('Please enter a reply message.');
    return;
  }

  if (!moderateContent(replyText)) return;

  // Check and update global rate limit
  const isAllowed = await checkAndUpdateGlobalRateLimit();
  if (!isAllowed) return;

  try {
    const reply = {
      text: replyText,
      timestamp: new Date().toISOString(),
      userId: currentUser.uid,
      name: currentUser.displayName,
      photoURL: currentUser.photoURL,
      country: currentUser.country,
      parentMessageId: parentMessageId,
      isCreator: true,
      images: []
    };

    // Push the reply to the database
    const newReplyRef = push(chatRef);
    await set(newReplyRef, reply);
    replyTextarea.value = '';
    toggleReplyInput(parentMessageId);

    // Update reply count on parent message
    const parentRef = ref(database, `messages/${parentMessageId}`);
    const snapshot = await get(parentRef);
    if (snapshot.exists()) {
      await update(parentRef, {
        replyCount: (snapshot.val().replyCount || 0) + 1
      });
    }
  } catch (error) {
    console.error('Error sending reply:', error);
    alert('Failed to send reply. Please try again.');
  }
}

// Load more messages
async function loadMoreMessages() {
  if (!lastMessageKey) return;

  const messagesQuery = dbQuery(
    chatRef,
    limitToLast(MESSAGE_BATCH_SIZE),
    startAfter(lastMessageKey)
  );

  try {
    const snapshot = await get(messagesQuery);

    if (snapshot.exists()) {
      const messages = [];
      snapshot.forEach(childSnapshot => {
        const messageData = childSnapshot.val();
        if (!messageCache.has(childSnapshot.key)) {
          messages.push({
            key: childSnapshot.key,
            data: messageData
          });
          messageCache.set(childSnapshot.key, messageData);
        }
      });

      messages.reverse().forEach(({ key, data }) => {
        appendMessage(data, key);
      });

      if (messages.length > 0) {
        lastMessageKey = messages[0].key;
      }
    }
  } catch (error) {
    console.error('Error loading more messages:', error);
  }
}

// Append Message Function
function appendMessage(message, messageId) {
  if (document.querySelector(`[data-message-id="${messageId}"]`)) return;

  const messageElement = document.createElement('div');
  messageElement.classList.add('message');
  messageElement.setAttribute('data-message-id', messageId);

  const flagUrl = `https://flagcdn.com/w320/${message.country}.png`;
  const messageTime = new Date(message.timestamp).toLocaleTimeString();

  const isCreator = message.isCreator ?
    '<span class="creator-tag">Creator</span>' : '';
    
  // Build image gallery HTML if there are any images
  let imagesHTML = '';
  if (message.images && message.images.length > 0) {
    message.images.forEach((imageUrl, index) => {
      imagesHTML += `
        <img src="${imageUrl}" class="message-media" alt="Shared image ${index+1}" 
             data-full-url="${imageUrl}" onclick="showFullImage('${imageUrl}')">
      `;
    });
  }

  messageElement.innerHTML = `
    <div class="message-header">
      <div class="profile-section">
        <div class="profile" style="background-image: url(${message.photoURL})"></div>
        <h4>
          ${message.name}
          ${isCreator}
          <img src="${flagUrl}" class="message-flag" alt="Flag" onerror="this.src='default-flag.png'">
          <button class="follow-btn" data-user-id="${message.userId}" onclick="toggleFollow('${message.userId}', '${message.name}')">
            ${followedUsers.has(message.userId) ? 'Unfollow' : 'Follow'}
          </button>
        </h4>
      </div>
      <span class="message-time">${messageTime}</span>
    </div>
    <div class="message-content">
      <p>${message.text}</p>
      <div class="message-images">${imagesHTML}</div>
    </div>
    <div class="reply-section">
      <div class="reply-count" onclick="toggleReplyInput('${messageId}')">
        <img src="https://cdn-icons-png.flaticon.com/512/2462/2462719.png" alt="Reply">
        Reply (${message.replyCount || 0})
      </div>
    </div>
  `;

  chatContainer.appendChild(messageElement);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Show full-sized image
function showFullImage(imageUrl) {
  const overlay = document.querySelector('.media-overlay');
  const image = overlay.querySelector('img');
  image.src = imageUrl;
  overlay.classList.add('active');
}

// Toggle Reply Input Function
function toggleReplyInput(messageId) {
  const parentMessage = document.querySelector(`[data-message-id="${messageId}"]`);
  const existingReplyInput = parentMessage.querySelector('.reply-input');

  if (existingReplyInput) {
    existingReplyInput.remove();
    activeReplies.delete(messageId);
  } else {
    const replyInput = document.createElement('div');
    replyInput.classList.add('reply-input');
    replyInput.innerHTML = `
      <textarea placeholder="Type your reply..." class="reply-textarea"></textarea>
      <button onclick="sendReply('${messageId}')">Send Reply</button>
    `;
    parentMessage.appendChild(replyInput);
    
    // Focus the textarea
    const textarea = replyInput.querySelector('.reply-textarea');
    textarea.focus();
    
    activeReplies.add(messageId);
  }
}

// Initialize the application
function initApp() {
  initializeFollowButton();
  initializeImageSharingUI();
  
  // Set up scroll event for loading more messages
  let scrollTimeout;
  chatContainer.addEventListener('scroll', () => {
    if (scrollTimeout) clearTimeout(scrollTimeout);
    
    scrollTimeout = setTimeout(() => {
      if (chatContainer.scrollTop === 0) {
        loadMoreMessages();
      }
    }, 150);
  });
  
  // Message input events
  messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  
  // Start real-time message listener
  const recentMessagesQuery = dbQuery(chatRef, limitToLast(MESSAGE_LIMIT));
  onChildAdded(recentMessagesQuery, (snapshot) => {
    const message = snapshot.val();
    const messageId = snapshot.key;
    
    if (!messageCache.has(messageId)) {
      appendMessage(message, messageId);
      messageCache.set(messageId, message);
      lastMessageKey = messageId;
    }
  });
  
  // Load initial messages
  loadMoreMessages();
}

// Expose functions to global scope
window.sendMessage = sendMessage;
window.sendReply = sendReply;
window.toggleReplyInput = toggleReplyInput;
window.toggleFollow = toggleFollow;
window.showFullImage = showFullImage;

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);
