
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs, addDoc, deleteDoc, orderBy, limit, startAfter } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getDatabase, ref, push, set, onChildAdded, onValue, update, get, onDisconnect, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDnPz8BWCaXJOazlFVO4Eap8VxdSR2oDFQ",
  authDomain: "globalchat-2d669.firebaseapp.com",
  projectId: "globalchat-2d669",
  messagingSenderId: "178714711978",
  appId: "1:178714711978:web:fb831188be23e62a4bbdd3",
  databaseURL: "https://globalchat-2d669-default-rtdb.firebaseio.com/"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const database = getDatabase(app);
const chatRef = ref(database, 'messages');
const recenceCollection = collection(db, 'recence');

const chatContainer = document.getElementById('chatContainer');
const loadingIndicator = document.getElementById('loadingIndicator');

let currentUser = null;
const followedUsers = new Set();
let isLoadingMore = false;
let lastVisibleMessage = null;
let noMoreMessages = false;
const MESSAGES_PER_PAGE = 10; // Reduced to 10 messages per page for better UX
const MAX_REALTIME_MESSAGES = 1; // Keep only ONE message in realtime DB
const DEBOUNCE_DELAY = 150; // Reduced debounce delay for more responsive scrolling
const SCROLL_TRIGGER_OFFSET = 1000; // Start loading earlier for smoother experience

// Initialize app
function initApp() {
  // Show loading indicator immediately when app starts
  loadingIndicator.style.display = 'flex';
  
  // Listen for messages
  listenForMessages();
  
  // Set up infinite scroll with performance optimizations
  setupInfiniteScroll();
  
  // Set up message archiving
  setupMessageArchiving();
  
  // Enable virtual scrolling for better performance
  setupVirtualScrolling();
}

// Format timestamp
function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

// Listen for new messages with real-time updates
function listenForMessages() {
  // Clear chat container but keep loading indicator visible
  while (chatContainer.firstChild && chatContainer.firstChild.id !== 'loadingIndicator') {
    chatContainer.removeChild(chatContainer.firstChild);
  }
  loadingIndicator.style.display = 'flex';
  
  // Listen for new messages being added from realtime database
  onChildAdded(chatRef, async (snapshot) => {
    const message = snapshot.val();
    const messageId = snapshot.key;
    
    // Don't re-render existing messages
    if (document.querySelector(`[data-message-id="${messageId}"]`)) {
      return;
    }
    
    // Create message element
    const messageElement = createMessageElement(message, messageId);
    
    // Always insert at the beginning for newest-first display
    if (chatContainer.firstChild) {
      chatContainer.insertBefore(messageElement, chatContainer.firstChild);
    } else {
      chatContainer.appendChild(messageElement);
    }
    
    // Archive message to Firestore immediately (since we're only keeping one)
    archiveMessage(messageId, message);
    
    // Reset pagination state when new messages arrive
    resetPaginationState();
    
    // Load initial archived messages after getting real-time message
    loadInitialArchivedMessages();
  });
  
  // If no real-time messages come in after 1 second, try loading archived messages
  setTimeout(() => {
    if (chatContainer.childElementCount <= 1) { // Only loading indicator
      loadInitialArchivedMessages();
    }
  }, 1000);
}

// Reset pagination state when new messages arrive
function resetPaginationState() {
  lastVisibleMessage = null;
  noMoreMessages = false;
}

// Load initial archived messages with performance optimizations
async function loadInitialArchivedMessages() {
  try {
    // Hide any existing end-of-feed message when loading initial messages
    const existingEndOfFeed = document.getElementById('end-of-feed');
    if (existingEndOfFeed) {
      existingEndOfFeed.remove();
    }
    
    const messagesQuery = query(
      recenceCollection,
      orderBy('timestamp', 'desc'),
      limit(MESSAGES_PER_PAGE)
    );
    
    const querySnapshot = await getDocs(messagesQuery);
    
    if (querySnapshot.empty) {
      // No archived messages found
      loadingIndicator.style.display = 'none';
      showEndOfFeed();
      return;
    }
    
    // Track the last visible document for pagination
    lastVisibleMessage = querySnapshot.docs[querySnapshot.docs.length - 1];
    
    // Create a document fragment to batch DOM updates
    const fragment = document.createDocumentFragment();
    let messagesAdded = 0;
    
    // Process messages
    querySnapshot.forEach(doc => {
      const message = doc.data();
      const messageId = doc.id;
      
      // Don't re-render existing messages
      if (document.querySelector(`[data-message-id="${messageId}"]`)) {
        return;
      }
      
      const messageElement = createMessageElement(message, messageId);
      fragment.appendChild(messageElement);
      messagesAdded++;
    });
    
    // Add all messages to the DOM at once
    chatContainer.appendChild(fragment);
    
    // Only hide loading indicator if we actually added messages
    if (messagesAdded > 0 || chatContainer.childElementCount > 1) {
      loadingIndicator.style.display = 'none';
    }
    
    // Set up sentinel for infinite scrolling
    updateScrollSentinel();
    
    // If we got fewer messages than requested, we're at the end
    if (querySnapshot.docs.length < MESSAGES_PER_PAGE) {
      noMoreMessages = true;
      showEndOfFeed();
    }
    
  } catch (error) {
    console.error('Error loading archived messages:', error);
    loadingIndicator.style.display = 'none';
  }
}

// Create scroll sentinel for infinite scrolling
function updateScrollSentinel() {
  // Remove existing sentinel if any
  const existingSentinel = document.getElementById('scroll-sentinel');
  if (existingSentinel) {
    existingSentinel.remove();
  }
  
  // Don't add a new sentinel if we've reached the end
  if (noMoreMessages) {
    return;
  }
  
  // Create new sentinel
  const sentinel = document.createElement('div');
  sentinel.id = 'scroll-sentinel';
  sentinel.style.height = '20px';
  sentinel.style.width = '100%';
  sentinel.style.visibility = 'hidden';
  
  // Add sentinel at the end of chat container
  chatContainer.appendChild(sentinel);
}

// Show end of feed message
function showEndOfFeed() {
  // Create "end of feed" element if it doesn't exist
  if (!document.getElementById('end-of-feed')) {
    const endOfFeed = document.createElement('div');
    endOfFeed.id = 'end-of-feed';
    endOfFeed.className = 'end-of-feed';
    endOfFeed.innerHTML = `
      <div class="end-of-feed-content">
        <svg viewBox="0 0 24 24" class="end-of-feed-icon">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-9h10v2H7z"></path>
        </svg>
        <p>You've reached the end</p>
        <p class="end-of-feed-subtitle">No more messages to load</p>
      </div>
    `;
    chatContainer.appendChild(endOfFeed);
  }
}

// Load more archived messages when scrolling with pagination and performance optimizations
async function loadMoreMessages() {
  if (isLoadingMore || !lastVisibleMessage || noMoreMessages) return;
  
  isLoadingMore = true;
  
  // Add loading indicator at the bottom of chat container
  const bottomLoader = document.createElement('div');
  bottomLoader.className = 'loading-dots bottom-loader';
  bottomLoader.id = 'bottom-loader';
  bottomLoader.innerHTML = `
    <div class="loading-dot"></div>
    <div class="loading-dot"></div>
    <div class="loading-dot"></div>
  `;
  chatContainer.appendChild(bottomLoader);
  
  try {
    const messagesQuery = query(
      recenceCollection,
      orderBy('timestamp', 'desc'),
      startAfter(lastVisibleMessage),
      limit(MESSAGES_PER_PAGE)
    );
    
    const querySnapshot = await getDocs(messagesQuery);
    
    // Remove bottom loader
    const loader = document.getElementById('bottom-loader');
    if (loader) loader.remove();
    
    if (querySnapshot.empty) {
      isLoadingMore = false;
      noMoreMessages = true;
      showEndOfFeed();
      return;
    }
    
    // Update last visible message
    lastVisibleMessage = querySnapshot.docs[querySnapshot.docs.length - 1];
    
    // Create a document fragment to batch DOM updates
    const fragment = document.createDocumentFragment();
    
    // Process messages
    querySnapshot.forEach(doc => {
      const message = doc.data();
      const messageId = doc.id;
      
      // Don't re-render existing messages
      if (document.querySelector(`[data-message-id="${messageId}"]`)) {
        return;
      }
      
      const messageElement = createMessageElement(message, messageId);
      fragment.appendChild(messageElement);
    });
    
    // Add all messages to the DOM at once
    chatContainer.appendChild(fragment);
    
    // Update sentinel position for infinite scrolling
    updateScrollSentinel();
    
    // If we got fewer messages than requested, we're at the end
    if (querySnapshot.docs.length < MESSAGES_PER_PAGE) {
      noMoreMessages = true;
      showEndOfFeed();
    }
    
  } catch (error) {
    console.error('Error loading more messages:', error);
    // Remove bottom loader on error too
    const loader = document.getElementById('bottom-loader');
    if (loader) loader.remove();
  } finally {
    isLoadingMore = false;
  }
}

// Create message element with performance optimizations
function createMessageElement(message, messageId) {
  const messageElement = document.createElement('div');
  messageElement.classList.add('message');
  messageElement.setAttribute('data-message-id', messageId);
  messageElement.setAttribute('data-timestamp', message.timestamp);
  
  const flagUrl = `https://flagcdn.com/w320/${message.country || 'unknown'}.png`;
  const messageTime = formatTimestamp(message.timestamp);
  const isFollowing = followedUsers.has(message.userId);
  const followBtnDisplay = message.userId === currentUser?.uid ? 'none' : 'inline-block';
  
  // Use lightweight placeholder before loading actual media
  let mediaHTML = '';
  if (message.media && message.media.length > 0) {
    mediaHTML = '<div class="media-container">';
    message.media.forEach(media => {
      if (media && media.url) {
        if (media.type === 'image') {
          // Use data-src for lazy loading
          mediaHTML += `<div class="image-placeholder">
            <img data-src="${media.url}" class="message-image" loading="lazy" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3C/svg%3E">
          </div>`;
        } else if (media.type === 'video') {
          // Fixed video handling with proper poster and controls
          mediaHTML += `<div class="video-placeholder">
            <video data-src="${media.url}" class="message-video" controls preload="none" poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3C/svg%3E">
              <source data-src="${media.url}" type="${media.mimeType || 'video/mp4'}">
              Your browser does not support the video tag.
            </video>
          </div>`;
        }
      }
    });
    mediaHTML += '</div>';
  }
  
  messageElement.innerHTML = `
    <img src="${message.photoURL}" class="profile-image" alt="Profile" loading="lazy" onerror="this.src='https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png'">
    <div class="message-content">
      <div class="message-header">
        <span class="user-name">${message.name}</span>
        <img src="${flagUrl}" class="country-flag" alt="Flag" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 1 1\'%3E%3C/svg%3E'" loading="lazy">
        <span class="message-time">${messageTime}</span>
        <button class="follow-btn ${isFollowing ? 'followed' : ''}" 
          data-user-id="${message.userId}" 
          onclick="toggleFollow('${message.userId}', '${message.name}')"
          style="display: ${followBtnDisplay}">
          ${isFollowing ? 'Following' : 'Follow'}
        </button>
      </div>
      <div class="message-text">${message.text || ''}</div>
      ${mediaHTML}
      <div class="action-buttons">
        <!-- Reply Button -->
       <button class="action-button reply-btn">
          <svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 122.97 122.88"><title>instagram-comment</title><path d="M61.44,0a61.46,61.46,0,0,1,54.91,89l6.44,25.74a5.83,5.83,0,0,1-7.25,7L91.62,115A61.43,61.43,0,1,1,61.44,0ZM96.63,26.25a49.78,49.78,0,1,0-9,77.52A5.83,5.83,0,0,1,92.4,103L109,107.77l-4.5-18a5.86,5.86,0,0,1,.51-4.34,49.06,49.06,0,0,0,4.62-11.58,50,50,0,0,0-13-47.62Z"/></svg>
          <span class="action-count">${message.replyCount || 0}</span>
        </button>
        
        <!-- Like Button -->
        <button class="action-button like-btn">
          <?xml version="1.0" encoding="utf-8"?><svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 122.88 107.68" style="enable-background:new 0 0 122.88 107.68" xml:space="preserve"><g><path d="M61.43,13.53C66.76,7.51,72.8,3.69,78.96,1.69c6.48-2.1,13.07-2.15,19.09-0.6c6.05,1.55,11.52,4.72,15.74,9.03 c5.58,5.7,9.09,13.36,9.09,22.02c0,13.7-6.6,26.75-17.42,39.37c-10.14,11.83-24.05,23.35-39.61,34.73 c-2.58,1.89-5.98,1.88-8.5,0.22l0,0.01l-0.03-0.02l0,0.01l-0.02-0.01l-0.21-0.15c-4.46-2.92-8.75-5.91-12.8-8.94 c-4.05-3.03-8.01-6.22-11.83-9.56C12.58,70.42,0,51.4,0,32.13c0-8.8,3.44-16.44,8.93-22.08c4.25-4.37,9.73-7.51,15.79-9.03V1.02 c5.99-1.5,12.57-1.4,19.05,0.69C49.99,3.71,56.09,7.54,61.43,13.53L61.43,13.53L61.43,13.53z M83.51,15.87 C78.02,17.65,72.51,22.02,68,29.78c-0.63,1.19-1.6,2.21-2.85,2.93c-3.56,2.05-8.11,0.82-10.15-2.74 c-4.5-7.82-10.14-12.27-15.78-14.08c-3.71-1.19-7.46-1.25-10.88-0.4l0,0l-0.02,0c-3.35,0.83-6.37,2.56-8.7,4.95 c-2.87,2.95-4.67,7-4.67,11.7c0,14.53,10.59,29.82,27.3,44.43c3.28,2.87,6.95,5.82,10.95,8.81c2.61,1.96,5.35,3.92,8.04,5.74 c13.03-9.76,24.53-19.53,32.9-29.3c8.58-10,13.8-19.92,13.8-29.68c0-4.55-1.84-8.58-4.76-11.57c-2.38-2.42-5.43-4.2-8.8-5.06 C90.98,14.63,87.23,14.67,83.51,15.87L83.51,15.87L83.51,15.87z"/></g></svg>
          <span class="action-count">${message.likeCount || 0}</span>
        </button>
        
        <!-- Retweet/Share Button -->
        <button class="action-button share-btn">
          <svg xmlns="http://www.w3.org/2000/svg" shape-rendering="geometricPrecision" text-rendering="geometricPrecision" image-rendering="optimizeQuality" fill-rule="evenodd" clip-rule="evenodd" viewBox="0 0 399 512.34"><path fill-rule="nonzero" d="m0 84.87.03-.01c0-4.73 3.84-8.57 8.58-8.57h223.02V8.59c.02-1.96.69-3.94 2.05-5.55 3.06-3.62 8.48-4.07 12.1-1.01l150.06 127.4c.4.33.77.69 1.11 1.1 3.06 3.62 2.61 9.04-1.01 12.1L246.21 269.75a8.584 8.584 0 0 1-5.97 2.41 8.61 8.61 0 0 1-8.61-8.61v-67.67H119.62v32.96c-.03 2.42-1.04 4.83-3.03 6.52L14.65 322.62a8.543 8.543 0 0 1-6.04 2.48c-4.75 0-8.61-3.85-8.61-8.6V84.87zm399 342.6-.03.01c0 4.73-3.84 8.57-8.58 8.57H167.37v67.71a8.696 8.696 0 0 1-2.05 5.54c-3.06 3.62-8.48 4.07-12.1 1.01L3.16 382.91c-.4-.33-.77-.69-1.11-1.09-3.06-3.62-2.61-9.05 1.01-12.11L152.79 242.6a8.584 8.584 0 0 1 5.97-2.41c4.75 0 8.61 3.85 8.61 8.6v67.67h112.01V283.5a8.703 8.703 0 0 1 3.03-6.52l101.94-87.26a8.604 8.604 0 0 1 6.04-2.48 8.61 8.61 0 0 1 8.61 8.61v231.62zm-17.21-8.57V214.52l-85.2 72.91v37.64a8.6 8.6 0 0 1-8.6 8.6H158.76a8.6 8.6 0 0 1-8.6-8.6v-57.7L21.88 376.27l128.28 108.91v-57.71a8.6 8.6 0 0 1 8.6-8.6l223.03.03zM17.21 93.44v204.39l85.2-72.92v-37.63c0-4.76 3.85-8.61 8.6-8.61h129.23a8.61 8.61 0 0 1 8.61 8.61v57.7l128.27-108.91L248.85 27.16v57.71c0 4.75-3.86 8.6-8.61 8.6l-223.03-.03z"/></svg>
          <span class="action-count">${message.shareCount || 0}</span>
        </button>
        
        <!-- Bookmark Button -->
        <button class="action-button bookmark-btn">
          <?xml version="1.0" encoding="utf-8"?><svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 122.88 87.46" style="enable-background:new 0 0 122.88 87.46" xml:space="preserve"><g><path d="M2.17,87.46c-1.2,0-2.17-0.91-2.17-2.04c0-1.13,0.97-2.04,2.17-2.04h9.16V20.59c0-0.65,0.27-1.25,0.7-1.68 c0.44-0.44,1.03-0.71,1.68-0.71h13.02c0.66,0,1.25,0.27,1.68,0.71c0.43,0.43,0.7,1.03,0.7,1.68v62.78h9.69V38.8 c0-0.65,0.27-1.24,0.7-1.68l0,0l0,0l0,0c0.43-0.43,1.03-0.7,1.67-0.7h13.02c0.67,0,1.26,0.27,1.68,0.7c0.43,0.43,0.7,1.04,0.7,1.68 v44.57h9.69V2.38c0-0.65,0.27-1.24,0.7-1.68l0,0l0,0C67.42,0.27,68.01,0,68.67,0h13.02c0.66,0,1.25,0.27,1.68,0.7l0,0 c0.43,0.43,0.7,1.04,0.7,1.68v80.99h9.69V25.8c0-0.65,0.27-1.25,0.7-1.68l0,0c0.43-0.43,1.03-0.7,1.69-0.7h13.02 c0.66,0,1.26,0.27,1.68,0.7c0.43,0.43,0.7,1.03,0.7,1.68v57.58h9.16c1.2,0,2.17,0.91,2.17,2.04c0,1.13-0.97,2.04-2.17,2.04h-11.27 c-0.02,0-0.04,0-0.06,0H95.94c-0.02,0-0.04,0-0.06,0H81.96c-0.02,0-0.04,0-0.06,0H68.46c-0.02,0-0.04,0-0.06,0H54.49 c-0.02,0-0.04,0-0.06,0H40.98c-0.02,0-0.04,0-0.06,0H27l-0.06,0H13.5l-0.06,0H2.17L2.17,87.46z M24.77,22.55h-9.1v60.56h9.1V22.55 L24.77,22.55z M52.25,40.76h-9.1v42.35h9.1V40.76L52.25,40.76z M79.73,4.34h-9.1v78.77h9.1V4.34L79.73,4.34z M107.2,27.76h-9.1 v55.36h9.1V27.76L107.2,27.76z"/></g></svg>
          <span class="action-count">${message.bookmarkCount || 0}</span>
        </button>
        
        <!-- Viewers Count Button -->
        <button class="action-button viewers-btn">
          <?xml version="1.0" encoding="utf-8"?><svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 122.88 103.44" style="enable-background:new 0 0 122.88 103.44" xml:space="preserve"><g><path d="M69.49,102.77L49.8,84.04l-20.23,18.27c-0.45,0.49-1.09,0.79-1.8,0.79c-1.35,0-2.44-1.09-2.44-2.44V60.77L0.76,37.41 c-0.98-0.93-1.01-2.47-0.09-3.45c0.31-0.33,0.7-0.55,1.11-0.67l0,0l118-33.2c1.3-0.36,2.64,0.39,3.01,1.69 c0.19,0.66,0.08,1.34-0.24,1.89l-49.2,98.42c-0.6,1.2-2.06,1.69-3.26,1.09C69.86,103.07,69.66,102.93,69.49,102.77L69.49,102.77 L69.49,102.77z M46.26,80.68L30.21,65.42v29.76L46.26,80.68L46.26,80.68z M28.15,56.73l76.32-47.26L7.22,36.83L28.15,56.73 L28.15,56.73z M114.43,9.03L31.79,60.19l38.67,36.78L114.43,9.03L114.43,9.03z"/></g></svg>
          <span class="action-count">${message.viewCount || 0}</span>
        </button>
      </div>
    </div>
  `;
  
  // Set it to not loaded initially (for virtual scrolling)
  messageElement.setAttribute('data-loaded', 'false');
  
  return messageElement;
}

// Archive message to Firestore
async function archiveMessage(messageId, message) {
  try {
    // Ensure media data is properly formatted before archiving
    if (message.media && message.media.length > 0) {
      // Make sure each media item has required properties
      message.media = message.media.map(media => {
        if (!media.type) {
          // Try to determine type from URL or set default
          if (media.url) {
            const url = media.url.toLowerCase();
            if (url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.mov') || 
                url.endsWith('.avi') || url.includes('video')) {
              media.type = 'video';
              if (!media.mimeType) {
                // Set default mime type based on extension
                if (url.endsWith('.mp4')) media.mimeType = 'video/mp4';
                else if (url.endsWith('.webm')) media.mimeType = 'video/webm';
                else if (url.endsWith('.mov')) media.mimeType = 'video/quicktime';
                else if (url.endsWith('.avi')) media.mimeType = 'video/x-msvideo';
                else media.mimeType = 'video/mp4'; // Default
              }
            } else {
              media.type = 'image';
            }
          }
        }
        return media;
      });
    }
    
    // Add to Firestore archive
    await setDoc(doc(recenceCollection, messageId), {
      ...message,
      archivedAt: Date.now()
    });
    
    // After successful archiving, ensure we only keep one message in realtime DB
    await ensureOnlyOneMessageInRealtime();
  } catch (error) {
    console.error('Error archiving message:', error);
  }
}

// Set up message archiving system with optimizations
function setupMessageArchiving() {
  // Periodically check and ensure we only have one message
  setInterval(ensureOnlyOneMessageInRealtime, 5000); // Check less frequently
}

// Ensure only one message in realtime database
async function ensureOnlyOneMessageInRealtime() {
  try {
    // Get all messages
    const snapshot = await get(chatRef);
    const messages = [];
    
    snapshot.forEach(childSnapshot => {
      messages.push({
        key: childSnapshot.key,
        timestamp: childSnapshot.val().timestamp
      });
    });
    
    // If there's more than one message
    if (messages.length > MAX_REALTIME_MESSAGES) {
      // Sort by timestamp (newest first)
      messages.sort((a, b) => b.timestamp - a.timestamp);
      
      // Keep only the most recent message
      const messagesToDelete = messages.slice(MAX_REALTIME_MESSAGES);
      
      // Delete older messages from realtime DB
      for (const message of messagesToDelete) {
        // Make sure message exists in Firestore before deleting from realtime
        const docRef = doc(recenceCollection, message.key);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          // It's safely archived, delete from realtime
          await remove(ref(database, `messages/${message.key}`));
        }
      }
    }
  } catch (error) {
    console.error('Error ensuring only one message in realtime:', error);
  }
}

// Debounce function for scroll events
function debounce(func, wait) {
  let timeout;
  return function() {
    const context = this;
    const args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
}

// Set up infinite scroll with performance optimizations
function setupInfiniteScroll() {
  // Use Intersection Observer for better performance
  const observerOptions = {
    root: null,
    rootMargin: '500px', // Larger margin to start loading earlier
    threshold: 0.1
  };
  
  const sentinelObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !isLoadingMore && lastVisibleMessage && !noMoreMessages) {
        loadMoreMessages();
      }
    });
  }, observerOptions);
  
  // Create and observe sentinel element initially
  updateScrollSentinel();
  
  // Re-observe sentinel whenever it's updated
  const observeSentinel = () => {
    const sentinel = document.getElementById('scroll-sentinel');
    if (sentinel) {
      sentinelObserver.observe(sentinel);
    }
  };
  
  // Initial observation
  observeSentinel();
  
  // Periodically check for sentinel to handle dynamic content
  const sentinelInterval = setInterval(observeSentinel, 1000);
  
  // Also handle scroll events (as backup) with improved debouncing
  const scrollHandler = debounce(() => {
    if (isLoadingMore || !lastVisibleMessage || noMoreMessages) return;
    
    // Check if we're near the bottom of the page
    const scrollPosition = window.innerHeight + window.pageYOffset;
    const bodyHeight = document.body.offsetHeight;
    
    if (bodyHeight - scrollPosition < SCROLL_TRIGGER_OFFSET) {
      loadMoreMessages();
    }
  }, DEBOUNCE_DELAY);
  
  window.addEventListener('scroll', scrollHandler, { passive: true });
}

// Set up virtual scrolling for better performance with large message counts
function setupVirtualScrolling() {
  // Use Intersection Observer for efficient visibility detection
  const visibilityObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const messageElement = entry.target;
      
      if (entry.isIntersecting) {
        // Element is visible, load its content if not already loaded
        if (messageElement.getAttribute('data-loaded') !== 'true') {
          // Load any lazy images or other content
          const lazyImages = messageElement.querySelectorAll('img[data-src]');
          lazyImages.forEach(img => {
            if (img.dataset.src) {
              img.src = img.dataset.src;
              delete img.dataset.src;
            }
          });
          
          // Load lazy videos - FIXED VIDEO HANDLING
          const lazyVideos = messageElement.querySelectorAll('video[data-src]');
          lazyVideos.forEach(video => {
            if (video.dataset.src) {
              video.src = video.dataset.src;
              
              // Also update source elements if present
              const sources = video.querySelectorAll('source[data-src]');
              sources.forEach(source => {
                if (source.dataset.src) {
                  source.src = source.dataset.src;
                  delete source.dataset.src;
                }
              });
              
              delete video.dataset.src;
              
              // Add event listeners for video
              video.addEventListener('loadedmetadata', () => {
                // Video metadata loaded successfully
                video.classList.add('video-loaded');
              });
              
              video.addEventListener('error', (e) => {
                console.error('Video load error:', e);
                // Add fallback message or placeholder
                const fallbackMsg = document.createElement('div');
                fallbackMsg.className = 'video-error';
                fallbackMsg.textContent = 'Video could not be loaded';
                video.parentNode.appendChild(fallbackMsg);
              });
            }
          });
          
          messageElement.setAttribute('data-loaded', 'true');
        }
      } else {
        // Element is out of view, could potentially unload heavy content
        // This is optional and depends on memory constraints
        if (messageElement.getAttribute('data-loaded') === 'true' && 
            Math.abs(entry.boundingClientRect.y) > 2000) {
          // Far out of view, pause videos to save resources
          const videos = messageElement.querySelectorAll('video');
          videos.forEach(video => {
            if (!video.paused) {
              video.pause();
            }
          });
        }
      }
    });
  }, {
    root: null,
    rootMargin: '500px', // Load content before it comes into view
    threshold: 0.01
  });
  
  // Function to observe new messages
  const observeMessages = debounce(() => {
    // Observe all messages that aren't already being observed
    document.querySelectorAll('.message:not([data-observed="true"])').forEach(message => {
      visibilityObserver.observe(message);
      message.setAttribute('data-observed', 'true');
    });
  }, 100);
  
  // Observe existing messages
  observeMessages();
  
  // Set up mutation observer to detect new messages
  const mutationObserver = new MutationObserver((mutations) => {
    let hasNewMessages = false;
    
    mutations.forEach(mutation => {
      if (mutation.type === 'childList' && mutation.addedNodes.length) {
        hasNewMessages = true;
      }
    });
    
    if (hasNewMessages) {
      observeMessages();
    }
  });
  
  // Start observing the chat container for added messages
  mutationObserver.observe(chatContainer, { 
    childList: true,
    subtree: false
  });
}

// Get country from IP address
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

// Authentication State Observer
onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data() || {};
      const countryCode = await getCountryFromIP();
      
      currentUser = {
        uid: user.uid,
        
        displayName: user.displayName || userData?.displayName || "User" + Math.floor(Math.random() * 10000),
        photoURL: user.photoURL || userData?.photoURL || "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png",
        country: countryCode
      };
      
      // Create user in database if not exists
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', user.uid), {
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL,
          createdAt: new Date().toISOString()
        });
      }
      
      // Fetch followed users
      await fetchFollowedUsers();
      
      // Set up presence system
      setupPresence(user.uid);
      
    } catch (error) {
      console.error('Error fetching user data:', error);
      loadingIndicator.style.display = 'none';
    }
  } else {
    // Sign in anonymously if no user
    signInAnonymously(auth)
      .catch((error) => {
        console.error('Anonymous auth error:', error);
        loadingIndicator.style.display = 'none';
      });
  }
});

// Set up user presence
function setupPresence(userId) {
  const userStatusRef = ref(database, `presence/${userId}`);
  
  // Set user as online
  const onlineData = {
    status: 'online',
    lastSeen: Date.now()
  };
  
  // Set user as offline when disconnected
  const connectedRef = ref(database, '.info/connected');
  onValue(connectedRef, (snapshot) => {
    if (snapshot.val() === true) {
      // User is connected
      set(userStatusRef, onlineData);
      
      // Clear presence on disconnect
      onDisconnect(userStatusRef).set({
        status: 'offline',
        lastSeen: Date.now()
      });
    }
  });
}

// Fetch Followed Users
async function fetchFollowedUsers() {
  if (!currentUser) return;
  
  try {
    const followQuery = query(
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

// Update Follow Buttons
function updateFollowButtons() {
  document.querySelectorAll('.follow-btn').forEach(btn => {
    const userId = btn.getAttribute('data-user-id');
    if (userId === currentUser?.uid) {
      btn.style.display = 'none'; // Hide follow button for own messages
    } else {
      btn.textContent = followedUsers.has(userId) ? 'Following' : 'Follow';
      btn.classList.toggle('followed', followedUsers.has(userId));
    }
  });
}

// Follow/Unfollow User
window.toggleFollow = async function(userId, userName) {
  if (!currentUser) {
    alert('Please log in to follow users');
    return;
  }
  
  try {
    const followQuery = query(
      collection(db, 'follows'),
      where('followerUserId', '==', currentUser.uid),
      where('followedUserId', '==', userId)
    );
    
    const followSnapshot = await getDocs(followQuery);
    
    if (followSnapshot.empty) {
      // Follow the user
      await addDoc(collection(db, 'follows'), {
        followerUserId: currentUser.uid,
        followedUserId: userId,
        followedUserName: userName,
        timestamp: Date.now()
      });
      followedUsers.add(userId);
    } else {
      // Unfollow the user
      followSnapshot.docs.forEach(async (followDoc) => {
        await deleteDoc(doc(db, 'follows', followDoc.id));
      });
      followedUsers.delete(userId);
    }
    
    updateFollowButtons();
  } catch (error) {
    console.error('Follow/Unfollow error:', error);
  }
};

// Add styles for improved UX
const style = document.createElement('style');
style.textContent = `
  .bottom-loader {
    padding: 20px;
    display: flex;
    justify-content: center;
  }
  
  .end-of-feed {
    padding: 40px 20px;
    display: flex;
    justify-content: center;
    text-align: center;
    color: #626262;
    animation: fadeIn 0.5s ease-in-out;
  }
  
  .end-of-feed-content {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  .end-of-feed-icon {
    width: 48px;
    height: 48px;
    fill: #626262;
    margin-bottom: 12px;
    opacity: 0.7;
  }
  
  .end-of-feed p {
    margin: 0;
    font-size: 16px;
    font-weight: 500;
  }
  
  .end-of-feed-subtitle {
    font-size: 14px !important;
    opacity: 0.7;
    margin-top: 4px !important;
  }
  
  .image-placeholder {
    background-color: #f0f2f5;
    position: relative;
    overflow: hidden;
    min-height: 100px;
    border-radius: 8px;
  }
  
  .message-image {
    transition: opacity 0.3s ease;
    max-width: 100%;
    border-radius: 8px;
  }
  
  /* Video container styling */
  .video-placeholder {
    background-color: #f0f2f5;
    position: relative;
    overflow: hidden;
    min-height: 150px;
    border-radius: 8px;
    margin-bottom: 8px;
  }
  
  .message-video {
    max-width: 100%;
    border-radius: 8px;
    background-color: #000;
    width: 100%;
    transition: opacity 0.3s ease;
  }
  
  .video-loaded {
    opacity: 1;
  }
  
  .video-error {
    padding: 16px;
    background-color: rgba(0,0,0,0.03);
    color: #ff3b30;
    text-align: center;
    border-radius: 8px;
    font-size: 14px;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .loading-dot {
    width: 8px;
    height: 8px;
    margin: 0 4px;
    border-radius: 50%;
    background-color: #626262;
    display: inline-block;
    animation: waveAnimation 1.5s infinite ease-in-out;
  }
  
  .loading-dot:nth-child(1) { animation-delay: 0s; }
  .loading-dot:nth-child(2) { animation-delay: 0.2s; }
  .loading-dot:nth-child(3) { animation-delay: 0.4s; }
  .loading-dot:nth-child(4) { animation-delay: 0.6s; }
  .loading-dot:nth-child(5) { animation-delay: 0.8s; }
  
  @keyframes waveAnimation {
    0%, 100% { 
      transform: translateY(0) scale(0.8); 
      opacity: 0.5; 
    }
    20% { 
      transform: translateY(-10px) scale(1.1); 
      opacity: 1; 
    }
    40% { 
      transform: translateY(0) scale(0.8); 
      opacity: 0.5; 
    }
  }
  
  /* Twitter-like action buttons with improved visibility */
  .action-buttons {
    display: flex;
    flex-direction: row;
    margin-top: 12px;
    align-items: center;
    justify-content: space-between;
    max-width: 425px;
  }
  
  .action-button {
    display: flex;
    align-items: center;
    background: none;
    border: none;
    padding: 8px;
    margin-right: 6px;
    cursor: pointer;
    border-radius: 50%;
    color: #536471;
    transition: all 0.2s ease;
  }
  
  .action-icon {
    width: 20px; /* Increased from 18px */
    height: 20px; /* Increased from 18px */
    fill: currentColor;
    stroke-width: 1px;
    stroke: currentColor;
  }
  
  .action-count {
    margin-left: 4px;
    font-size: 13px;
    font-weight: 500; /* Added weight */
    color: #536471;
  }
  
  /* Button hover states with stronger effects */
  .like-btn:hover {
    color: #f91880;
    background-color: rgba(249, 24, 128, 0.15);
  }
  
  .reply-btn:hover {
    color: #1d9bf0;
    background-color: rgba(29, 155, 240, 0.15);
  }
  
  .share-btn:hover {
    color: #00ba7c;
    background-color: rgba(0, 186, 124, 0.15);
  }
  
  .bookmark-btn:hover {
    color: #1d9bf0;
    background-color: rgba(29, 155, 240, 0.15);
  }
  
  .viewers-btn:hover {
    color: #1d9bf0;
    background-color: rgba(29, 155, 240, 0.15);
  }
  
  /* New viewer icon styling */
  .viewers-btn .action-icon {
    fill: none;
    stroke: currentColor;
    stroke-width: 1.5px;
  }
  
  /* Center action buttons on large screens */
  @media (min-width: 768px) {
    .action-buttons {
      margin-left: auto;
      margin-right: auto;
    }
  }
`;
document.head.appendChild(style);

// Initialize the app
initApp();
