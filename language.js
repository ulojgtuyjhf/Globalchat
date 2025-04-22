
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs, addDoc, deleteDoc, orderBy, limit, startAfter, Timestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getDatabase, ref, push, set, onChildAdded, onValue, update, get, onDisconnect } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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

const chatContainer = document.getElementById('chatContainer');
const loadingIndicator = document.getElementById('loadingIndicator');

let currentUser = null;
const followedUsers = new Set();
let initialLoadComplete = false;
let isLoading = false;
let lastVisibleMessage = null;
let noMoreMessages = false;
const PAGE_SIZE = 3; // Start with just 3 messages for speed

// Initialize app
function initApp() {
  // Show loading indicator immediately when app starts
  loadingIndicator.style.display = 'flex';
  
  // Listen for new messages
  listenForMessages();
  
  // Add scroll event for pagination
  chatContainer.addEventListener('scroll', handleScroll);
}

// Format timestamp
function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

// Listen for messages with real-time updates
function listenForMessages() {
  // Keep loading indicator visible until messages are loaded
  loadingIndicator.style.display = 'flex';
  
  // Listen for new messages in real-time
  onChildAdded(chatRef, (snapshot) => {
    const message = snapshot.val();
    const messageId = snapshot.key;
    
    // Don't re-render existing messages
    if (document.querySelector(`[data-message-id="${messageId}"]`)) {
      return;
    }
    
    const messageElement = createMessageElement(message, messageId);
    
    // Save to Firestore archive
    saveMessageToFirestore(message, messageId);
    
    // Insert at the beginning for newest-first display
    if (chatContainer.firstChild) {
      chatContainer.insertBefore(messageElement, chatContainer.firstChild);
    } else {
      chatContainer.appendChild(messageElement);
    }
    
    // Hide loading indicator once we have at least one message
    loadingIndicator.style.display = 'none';
    initialLoadComplete = true;
  });
  
  // If no messages received within 3 seconds, load from Firestore archive
  setTimeout(() => {
    if (!initialLoadComplete) {
      loadMessagesFromFirestore();
    }
  }, 3000);
}

// Save message to Firestore
async function saveMessageToFirestore(message, messageId) {
  try {
    await setDoc(doc(db, 'messagesArchive', messageId), {
      ...message,
      firestoreTimestamp: Timestamp.fromMillis(message.timestamp)
    });
  } catch (error) {
    console.error('Error saving message to Firestore:', error);
  }
}

// Load messages from Firestore archive
async function loadMessagesFromFirestore() {
  if (isLoading) return;
  
  try {
    isLoading = true;
    loadingIndicator.style.display = 'flex';
    
    let messagesQuery;
    if (lastVisibleMessage) {
      messagesQuery = query(
        collection(db, 'messagesArchive'),
        orderBy('firestoreTimestamp', 'desc'),
        startAfter(lastVisibleMessage),
        limit(PAGE_SIZE)
      );
    } else {
      messagesQuery = query(
        collection(db, 'messagesArchive'),
        orderBy('firestoreTimestamp', 'desc'),
        limit(PAGE_SIZE)
      );
    }
    
    const messagesSnapshot = await getDocs(messagesQuery);
    
    if (messagesSnapshot.empty) {
      noMoreMessages = true;
      isLoading = false;
      loadingIndicator.style.display = 'none';
      return;
    }
    
    const fragment = document.createDocumentFragment();
    
    messagesSnapshot.forEach(doc => {
      const message = doc.data();
      const messageId = doc.id;
      
      // Skip if message already exists in DOM
      if (document.querySelector(`[data-message-id="${messageId}"]`)) {
        return;
      }
      
      const messageElement = createMessageElement(message, messageId);
      fragment.appendChild(messageElement);
    });
    
    // Store reference to last visible message for pagination
    lastVisibleMessage = messagesSnapshot.docs[messagesSnapshot.docs.length - 1];
    
    // Append new messages to container
    chatContainer.appendChild(fragment);
    
    isLoading = false;
    loadingIndicator.style.display = 'none';
    initialLoadComplete = true;
    
  } catch (error) {
    console.error('Error loading messages from Firestore:', error);
    isLoading = false;
    loadingIndicator.style.display = 'none';
  }
}

// Create message element
function createMessageElement(message, messageId) {
  const messageElement = document.createElement('div');
  messageElement.classList.add('message');
  messageElement.setAttribute('data-message-id', messageId);
  messageElement.setAttribute('data-timestamp', message.timestamp);
  
  const flagUrl = `https://flagcdn.com/w320/${message.country || 'unknown'}.png`;
  const messageTime = formatTimestamp(message.timestamp);
  const isFollowing = followedUsers.has(message.userId);
  const followBtnDisplay = message.userId === currentUser?.uid ? 'none' : 'inline-block';
  
  let mediaHTML = '';
  if (message.media && message.media.length > 0) {
    mediaHTML = '<div class="media-container">';
    message.media.forEach(media => {
      if (media && media.url) {
        if (media.type === 'image') {
          mediaHTML += `<img src="${media.url}" class="message-image" loading="lazy">`;
        } else if (media.type === 'video') {
          mediaHTML += `<video src="${media.url}" class="message-video" controls preload="metadata"></video>`;
        }
      }
    });
    mediaHTML += '</div>';
  }
  
  messageElement.innerHTML = `
    <img src="${message.photoURL}" class="profile-image" alt="Profile" loading="lazy">
    <div class="message-content">
      <div class="message-header">
        <span class="user-name">${message.name}</span>
        <img src="${flagUrl}" class="country-flag" alt="Flag" onerror="this.src='default-flag.png'" loading="lazy">
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
  
  return messageElement;
}

// Handle scroll events for pagination
function handleScroll() {
  if (isLoading || noMoreMessages) return;
  
  const scrollPosition = chatContainer.scrollTop + chatContainer.clientHeight;
  const scrollThreshold = chatContainer.scrollHeight - 200;
  
  if (scrollPosition >= scrollThreshold) {
    loadMessagesFromFirestore();
  }
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

// Initialize the app
initApp();
