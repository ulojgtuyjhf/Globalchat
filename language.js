
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
          mediaHTML += `<video data-src="${media.url}" class="message-video" controls preload="none" poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3C/svg%3E"></video>`;
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
        <button class="action-button reply-btn">
          <svg viewBox="0 0 24 24">
            <path d="M14.046 2.242l-4.148-.01h-.002c-4.374 0-7.8 3.427-7.8 7.802 0 4.098 3.186 7.206 7.465 7.37v3.828a.85.85 0 0 0 .12.403.744.744 0 0 0 1.034.229c.264-.168 6.473-4.14 8.088-5.506 1.902-1.61 3.04-3.97 3.043-6.312v-.017c-.006-4.367-3.43-7.787-7.8-7.788zm3.787 12.972c-1.134.96-4.862 3.405-6.772 4.643V16.67a.75.75 0 0 0-.75-.75h-.396c-3.66 0-6.318-2.476-6.318-5.886 0-3.534 2.768-6.302 6.3-6.302l4.147.01h.002c3.532 0 6.3 2.766 6.302 6.296-.003 1.91-.942 3.844-2.514 5.176z"></path>
          </svg>
          ${message.replyCount || 0}
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
          
          // Load lazy videos
          const lazyVideos = messageElement.querySelectorAll('video[data-src]');
          lazyVideos.forEach(video => {
            if (video.dataset.src) {
              video.src = video.dataset.src;
              delete video.dataset.src;
            }
          });
          
          messageElement.setAttribute('data-loaded', 'true');
        }
      } else {
        // Element is out of view, could potentially unload heavy content
        // This is optional and depends on memory constraints
        if (messageElement.getAttribute('data-loaded') === 'true' && 
            Math.abs(entry.boundingClientRect.y) > 2000) {
          // Far out of view, could unload media to save memory
          // This is an advanced optimization that might not be needed
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
  
  .message-video {
    max-width: 100%;
    border-radius: 8px;
    background-color: #f0f2f5;
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
    animation: dotPulse 1.4s infinite ease-in-out;
  }
  
  .loading-dot:nth-child(1) { animation-delay: 0s; }
  .loading-dot:nth-child(2) { animation-delay: 0.2s; }
  .loading-dot:nth-child(3) { animation-delay: 0.4s; }
  
  @keyframes dotPulse {
    0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
    40% { transform: scale(1.2); opacity: 1; }
  }
`;
document.head.appendChild(style);

// Initialize the app
initApp();
