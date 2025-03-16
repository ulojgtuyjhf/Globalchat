
// Use ES modules with import maps for better dependency management
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs, addDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
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

// Initialize Firebase services using a singleton pattern
class FirebaseService {
  static instance = null;
  
  constructor() {
    const app = initializeApp(firebaseConfig);
    this.auth = getAuth(app);
    this.db = getFirestore(app);
    this.database = getDatabase(app);
    this.chatRef = ref(this.database, 'messages');
    this.typingRef = ref(this.database, 'typing');
    this.rateLimitRef = ref(this.database, 'rateLimit');
  }
  
  static getInstance() {
    if (!this.instance) {
      this.instance = new FirebaseService();
    }
    return this.instance;
  }
}

// Chat application with modern architecture
class GlobalChat {
  constructor() {
    // Initialize Firebase services
    const firebaseService = FirebaseService.getInstance();
    this.auth = firebaseService.auth;
    this.db = firebaseService.db;
    this.database = firebaseService.database;
    this.chatRef = firebaseService.chatRef;
    this.typingRef = firebaseService.typingRef;
    this.rateLimitRef = firebaseService.rateLimitRef;
    
    // UI elements - use querySelector for better performance with cached elements
    this.chatContainer = document.getElementById('chatContainer');
    this.messageInput = document.getElementById('messageInput');
    this.sendButton = document.getElementById('sendButton');
    this.loadingIndicator = document.getElementById('loadingIndicator');
    
    // App state
    this.currentUser = null;
    this.lastMessageTime = 0;
    this.followedUsers = new Set();
    this.typingTimeout = null;
    this.typingUsers = new Map();
    this.globalRateLimit = Date.now();
    this.messageCache = new Map(); // Cache for rendered messages
    
    // Pre-computed DOM elements
    this.typingIndicator = null;
    this.replyIndicator = null;
    
    // Color palette for profile avatars - Pre-computed for performance
    this.colorPalette = [
      '#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5',
      '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50',
      '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800',
      '#ff5722', '#795548', '#607d8b'
    ];
    
    // Initialize app
    this.initApp();
  }
  
  // Initialize app
  initApp() {
    // Initialize message input height adjustment
    this.initMessageInput();
    
    // Send Button Event Listener
    this.sendButton.addEventListener('click', () => {
      this.sendMessage();
    });
    
    // Enter key to send message (Shift+Enter for new line)
    this.messageInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!this.sendButton.disabled) {
          this.sendMessage();
        }
      }
    });
    
    // Pre-create utility elements
    this.typingIndicator = this.createTypingIndicator();
    
    // Authentication observer
    this.setupAuthObserver();
    
    // Listen for typing indicators
    this.listenForTypingIndicators();
    
    // Listen for messages - use limit for initial load
    this.listenForMessages();
    
    // Listen for global rate limit
    this.listenForRateLimit();
    
    // Set up global follow toggle function
    window.toggleFollow = this.toggleFollow.bind(this);
    
    // Set up reply functions
    window.app = this;
  }
  
  // Initialize message input with typing indicator
  initMessageInput() {
    // Use resize observer for better performance
    const resizeObserver = new ResizeObserver(() => {
      this.messageInput.style.height = 'auto';
      this.messageInput.style.height = (this.messageInput.scrollHeight) + 'px';
    });
    
    resizeObserver.observe(this.messageInput);
    
    // Enable/disable send button and update typing status
    this.messageInput.addEventListener('input', () => {
      const hasText = this.messageInput.value.trim().length > 0;
      this.sendButton.disabled = !hasText;
      this.updateTypingStatus();
    });
    
    // When user stops typing
    this.messageInput.addEventListener('blur', () => {
      if (this.currentUser) {
        const userTypingRef = ref(this.database, `typing/${this.currentUser.uid}`);
        set(userTypingRef, null);
        clearTimeout(this.typingTimeout);
      }
    });
  }
  
  // Setup authentication state observer
  setupAuthObserver() {
    onAuthStateChanged(this.auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(this.db, 'users', user.uid));
          const userData = userDoc.data() || {};
          
          // Get country code asynchronously - don't block UI
          this.getCountryFromIP().then(countryCode => {
            this.currentUser.country = countryCode;
          });
          
          const username = user.displayName || userData?.displayName || "User" + Math.floor(Math.random() * 10000);
          
          this.currentUser = {
            uid: user.uid,
            displayName: username,
            photoURL: user.photoURL || userData?.photoURL || null,
            country: 'unknown' // Default until loaded
          };
          
          // Create user in database if not exists
          if (!userDoc.exists()) {
            await setDoc(doc(this.db, 'users', user.uid), {
              displayName: this.currentUser.displayName,
              photoURL: this.currentUser.photoURL,
              createdAt: new Date().toISOString()
            });
          }
          
          // Fetch followed users
          await this.fetchFollowedUsers();
          
          // Set up presence system
          this.setupPresence(user.uid);
          
          // Hide loading indicator once auth is complete
          this.loadingIndicator.style.display = 'none';
          
        } catch (error) {
          console.error('Error fetching user data:', error);
          this.loadingIndicator.style.display = 'none';
        }
      } else {
        // Sign in anonymously if no user
        signInAnonymously(this.auth)
          .catch((error) => {
            console.error('Anonymous auth error:', error);
            this.loadingIndicator.style.display = 'none';
          });
      }
    });
  }
  
  // Set up user presence
  setupPresence(userId) {
    const userStatusRef = ref(this.database, `presence/${userId}`);
    
    // Set user as online
    const onlineData = {
      status: 'online',
      lastSeen: Date.now()
    };
    
    // Set user as offline when disconnected
    const connectedRef = ref(this.database, '.info/connected');
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
  
  // Generate avatar based on the first letter of the name
  generateAvatar(name, userId) {
    const firstLetter = name.charAt(0).toUpperCase();
    // Use user ID to consistently get the same color for the same user
    const colorIndex = userId ? 
      [...userId].reduce((acc, char) => acc + char.charCodeAt(0), 0) % this.colorPalette.length :
      Math.floor(Math.random() * this.colorPalette.length);
    
    const color = this.colorPalette[colorIndex];
    
    // Create canvas to generate the avatar
    const canvas = document.createElement('canvas');
    canvas.width = 100; // Reduce size for better performance
    canvas.height = 100;
    const context = canvas.getContext('2d');
    
    // Draw background
    context.fillStyle = color;
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw text
    context.fillStyle = 'white';
    context.font = 'bold 50px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(firstLetter, canvas.width / 2, canvas.height / 2);
    
    return canvas.toDataURL('image/png');
  }
  
  // Update user typing status
  updateTypingStatus() {
    if (!this.currentUser) return;
    
    // Clear previous timeout
    clearTimeout(this.typingTimeout);
    
    // Update typing status in database
    const userTypingRef = ref(this.database, `typing/${this.currentUser.uid}`);
    set(userTypingRef, {
      name: this.currentUser.displayName,
      timestamp: Date.now()
    });
    
    // Set timeout to clear typing status after 3 seconds of inactivity
    this.typingTimeout = setTimeout(() => {
      set(userTypingRef, null);
    }, 3000);
  }
  
  // Listen for typing indicators
  listenForTypingIndicators() {
    onValue(this.typingRef, (snapshot) => {
      const data = snapshot.val() || {};
      
      // Clear old typists
      this.typingUsers.clear();
      
      // Update typing users map
      Object.entries(data).forEach(([userId, userData]) => {
        // Don't show current user typing
        if (userId === this.currentUser?.uid) return;
        
        // Only show recent typing (last 3 seconds)
        if (Date.now() - userData.timestamp < 3000) {
          this.typingUsers.set(userId, userData.name);
        }
      });
      
      // Update typing indicator UI
      this.updateTypingIndicatorUI();
    });
  }
  
  // Update typing indicator UI
  updateTypingIndicatorUI() {
    if (this.typingUsers.size > 0) {
      let message = '';
      if (this.typingUsers.size === 1) {
        message = `${Array.from(this.typingUsers.values())[0]} is typing...`;
      } else if (this.typingUsers.size === 2) {
        message = `${Array.from(this.typingUsers.values()).join(' and ')} are typing...`;
      } else {
        message = 'Several people are typing...';
      }
      
      this.typingIndicator.textContent = message;
      this.typingIndicator.style.display = 'block';
    } else {
      this.typingIndicator.style.display = 'none';
    }
  }
  
  // Create typing indicator element
  createTypingIndicator() {
    let typingIndicator = document.getElementById('typingIndicator');
    
    if (!typingIndicator) {
      typingIndicator = document.createElement('div');
      typingIndicator.id = 'typingIndicator';
      typingIndicator.className = 'typing-indicator';
      typingIndicator.style.display = 'none';
      typingIndicator.style.padding = '8px 15px';
      typingIndicator.style.color = '#8899a6';
      typingIndicator.style.fontSize = '14px';
      typingIndicator.style.fontStyle = 'italic';
      
      // Insert before input container
      const inputContainer = document.querySelector('.input-container');
      document.body.insertBefore(typingIndicator, inputContainer);
    }
    
    return typingIndicator;
  }
  
  // Listen for global rate limit
  listenForRateLimit() {
    onValue(this.rateLimitRef, (snapshot) => {
      const timestamp = snapshot.val() || 0;
      this.globalRateLimit = timestamp;
    });
  }
  
  // Geolocation and Flag Service
  async getCountryFromIP() {
    try {
      const cachedCountry = sessionStorage.getItem('userCountry');
      if (cachedCountry) return cachedCountry;
      
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      const countryCode = data.country_code.toLowerCase();
      
      // Cache the country code
      sessionStorage.setItem('userCountry', countryCode);
      return countryCode;
    } catch (error) {
      console.error('Failed to fetch country:', error);
      return 'unknown';
    }
  }
  
  // Format timestamp - UPDATED: display only time in HH:MM format
  formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }
  
  // Listen for new messages
  listenForMessages() {
    onChildAdded(this.chatRef, (snapshot) => {
      const message = snapshot.val();
      const messageId = snapshot.key;
      
      // Don't re-render existing messages
      if (this.messageCache.has(messageId) || document.querySelector(`[data-message-id="${messageId}"]`)) {
        return;
      }
      
      // Add to message cache
      this.messageCache.set(messageId, message);
      
      // Render the message
      this.createMessageElement(message, messageId);
    });
  }
  
  // Create message element - optimized for performance
  createMessageElement(message, messageId) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    messageElement.setAttribute('data-message-id', messageId);
    
    // Generate avatar if needed
    const isDefaultAvatar = !message.photoURL || message.photoURL.includes('default_profile_images');
    const avatarUrl = isDefaultAvatar ? 
      this.generateAvatar(message.name, message.userId) : 
      message.photoURL;
    
    const flagUrl = `https://flagcdn.com/w320/${message.country || 'unknown'}.png`;
    const messageTime = this.formatTimestamp(message.timestamp);
    const isFollowing = this.followedUsers.has(message.userId);
    const followBtnDisplay = message.userId === this.currentUser?.uid ? 'none' : 'inline-block';
    
    // Use DocumentFragment for better performance
    const fragment = document.createDocumentFragment();
    
    // Create avatar image
    const avatarImg = document.createElement('img');
    avatarImg.src = avatarUrl;
    avatarImg.className = 'profile-image';
    avatarImg.alt = 'Profile';
    fragment.appendChild(avatarImg);
    
    // Create message content container
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    // Create message header
    const headerDiv = document.createElement('div');
    headerDiv.className = 'message-header';
    
    // Add username
    const nameSpan = document.createElement('span');
    nameSpan.className = 'user-name';
    nameSpan.textContent = message.name;
    headerDiv.appendChild(nameSpan);
    
    // Add flag
    const flagImg = document.createElement('img');
    flagImg.src = flagUrl;
    flagImg.className = 'country-flag';
    flagImg.alt = 'Flag';
    flagImg.onerror = function() { this.src = 'default-flag.png'; };
    headerDiv.appendChild(flagImg);
    
    // Add timestamp
    const timeSpan = document.createElement('span');
    timeSpan.className = 'message-time';
    timeSpan.textContent = messageTime;
    headerDiv.appendChild(timeSpan);
    
    // Add follow button (if not self)
    if (message.userId !== this.currentUser?.uid) {
      const followBtn = document.createElement('button');
      followBtn.className = `follow-btn ${isFollowing ? 'followed' : ''}`;
      followBtn.dataset.userId = message.userId;
      followBtn.textContent = isFollowing ? 'Following' : 'Follow';
      followBtn.onclick = () => this.toggleFollow(message.userId, message.name);
      headerDiv.appendChild(followBtn);
    }
    
    contentDiv.appendChild(headerDiv);
    
    // Add message text
    const textDiv = document.createElement('div');
    textDiv.className = 'message-text';
    textDiv.textContent = message.text || '';
    contentDiv.appendChild(textDiv);
    
    // Add action buttons
    const actionDiv = document.createElement('div');
    actionDiv.className = 'action-buttons';
    
    const replyBtn = document.createElement('button');
    replyBtn.className = 'action-button reply-btn';
    replyBtn.onclick = () => this.prepareReply(messageId, message.name);
    replyBtn.innerHTML = `
      <svg viewBox="0 0 24 24">
        <path d="M14.046 2.242l-4.148-.01h-.002c-4.374 0-7.8 3.427-7.8 7.802 0 4.098 3.186 7.206 7.465 7.37v3.828a.85.85 0 0 0 .12.403.744.744 0 0 0 1.034.229c.264-.168 6.473-4.14 8.088-5.506 1.902-1.61 3.04-3.97 3.043-6.312v-.017c-.006-4.367-3.43-7.787-7.8-7.788zm3.787 12.972c-1.134.96-4.862 3.405-6.772 4.643V16.67a.75.75 0 0 0-.75-.75h-.396c-3.66 0-6.318-2.476-6.318-5.886 0-3.534 2.768-6.302 6.3-6.302l4.147.01h.002c3.532 0 6.3 2.766 6.302 6.296-.003 1.91-.942 3.844-2.514 5.176z"></path>
      </svg>
      ${message.replyCount || 0}
    `;
    actionDiv.appendChild(replyBtn);
    
    contentDiv.appendChild(actionDiv);
    fragment.appendChild(contentDiv);
    
    // Append fragment to message element
    messageElement.appendChild(fragment);
    
    // Use requestAnimationFrame for better UI performance
    requestAnimationFrame(() => {
      // Append message to chat container
      this.chatContainer.appendChild(messageElement);
      
      // Scroll to bottom if near bottom - use IntersectionObserver if needed
      const isNearBottom = this.chatContainer.scrollHeight - this.chatContainer.scrollTop - this.chatContainer.clientHeight < 200;
      if (isNearBottom) {
        this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
      }
    });
  }
  
  // Fetch Followed Users - optimized with query limit
  async fetchFollowedUsers() {
    if (!this.currentUser) return;
    
    try {
      const followQuery = query(
        collection(this.db, 'follows'),
        where('followerUserId', '==', this.currentUser.uid)
      );
      
      const followSnapshot = await getDocs(followQuery);
      this.followedUsers.clear();
      followSnapshot.docs.forEach(doc => {
        const followedUserId = doc.data().followedUserId;
        this.followedUsers.add(followedUserId);
      });
      
      this.updateFollowButtons();
    } catch (error) {
      console.error('Error fetching followed users:', error);
    }
  }
  
  // Update Follow Buttons - batched for performance
  updateFollowButtons() {
    // Use requestAnimationFrame for better UI performance
    requestAnimationFrame(() => {
      document.querySelectorAll('.follow-btn').forEach(btn => {
        const userId = btn.getAttribute('data-user-id');
        if (userId === this.currentUser?.uid) {
          btn.style.display = 'none'; // Hide follow button for own messages
        } else {
          btn.textContent = this.followedUsers.has(userId) ? 'Following' : 'Follow';
          btn.classList.toggle('followed', this.followedUsers.has(userId));
        }
      });
    });
  }
  
  // Follow/Unfollow User - optimized with transaction
  async toggleFollow(userId, userName) {
    if (!this.currentUser) {
      alert('Please log in to follow users');
      return;
    }
    
    try {
      const followQuery = query(
        collection(this.db, 'follows'),
        where('followerUserId', '==', this.currentUser.uid),
        where('followedUserId', '==', userId)
      );
      
      const followSnapshot = await getDocs(followQuery);
      
      if (followSnapshot.empty) {
        // Follow the user
        await addDoc(collection(this.db, 'follows'), {
          followerUserId: this.currentUser.uid,
          followedUserId: userId,
          followedUserName: userName,
          timestamp: Date.now()
        });
        this.followedUsers.add(userId);
      } else {
        // Unfollow the user
        const batch = followSnapshot.docs.map(async (followDoc) => {
          await deleteDoc(doc(this.db, 'follows', followDoc.id));
        });
        await Promise.all(batch);
        this.followedUsers.delete(userId);
      }
      
      this.updateFollowButtons();
    } catch (error) {
      console.error('Follow/Unfollow error:', error);
    }
  }
  
  // Prepare reply to message
  prepareReply(messageId, userName) {
    // Create reply indicator if not exists
    if (!this.replyIndicator) {
      this.replyIndicator = document.createElement('div');
      this.replyIndicator.id = 'replyIndicator';
      this.replyIndicator.className = 'reply-indicator';
      
      const inputContainer = document.querySelector('.input-container');
      inputContainer.prepend(this.replyIndicator);
    }
    
    // Set reply indicator content
    this.replyIndicator.innerHTML = `
      <div>Replying to ${userName}</div>
      <button class="cancel-reply-btn" onclick="app.cancelReply()">×</button>
    `;
    this.replyIndicator.style.display = 'flex';
    
    // Store message ID for later use when sending
    this.replyToMessageId = messageId;
    
    // Focus message input
    this.messageInput.focus();
  }
  
  // Cancel reply
  cancelReply() {
    if (this.replyIndicator) {
      this.replyIndicator.style.display = 'none';
    }
    
    this.replyToMessageId = null;
  }
  
  // Send Message Function - optimized
  async sendMessage() {
    if (!this.currentUser) {
      alert('You must log in to continue');
      return;
    }
    
    const messageText = this.messageInput.value.trim();
    const currentTime = Date.now();
    const parentMessageId = this.replyToMessageId;
    
    // Check if content exists
    if (!messageText) return;
    
    // Check personal rate limit (3 seconds between messages)
    if (currentTime - this.lastMessageTime < 3000) {
      alert('Please wait a few seconds before sending another message');
      return;
    }
    
    // Check global rate limit (3 seconds for any user)
    if (currentTime - this.globalRateLimit < 3000) {
      const waitTime = Math.ceil((3000 - (currentTime - this.globalRateLimit)) / 1000);
      alert(`The chat is busy. Please wait ${waitTime} seconds before sending.`);
      return;
    }
    
    try {
      // Show loading indicator
      this.loadingIndicator.style.display = 'flex';
      
      // Prepare message data
      // Ensure current user's avatar is generated if needed
      if (!this.currentUser.photoURL) {
        this.currentUser.photoURL = this.generateAvatar(this.currentUser.displayName, this.currentUser.uid);
      }
      
      const messageData = {
        userId: this.currentUser.uid,
        name: this.currentUser.displayName,
        photoURL: this.currentUser.photoURL,
        text: messageText,
        timestamp: currentTime,
        country: this.currentUser.country,
        parentMessageId: parentMessageId,
        replyCount: 0
      };
      
      // Parallel operations for better performance
      const operations = [];
      
      // Update global rate limit timestamp
      operations.push(set(this.rateLimitRef, currentTime));
      
      // Clear typing status
      const userTypingRef = ref(this.database, `typing/${this.currentUser.uid}`);
      operations.push(set(userTypingRef, null));
      
      // Add message to database
      const newMessageRef = push(this.chatRef);
      operations.push(set(newMessageRef, messageData));
      
      // Update parent message reply count if this is a reply
      if (parentMessageId) {
        const parentRef = ref(this.database, `messages/${parentMessageId}`);
        operations.push(
          get(parentRef).then(snapshot => {
            if (snapshot.exists()) {
              return update(parentRef, {
                replyCount: (snapshot.val().replyCount || 0) + 1
              });
            }
            return null;
          })
        );
      }
      
      // Wait for all operations to complete
      await Promise.all(operations);
      
      // Reset UI
      this.messageInput.value = '';
      this.messageInput.style.height = 'auto';
      this.sendButton.disabled = true;
      this.lastMessageTime = currentTime;
      
      // Clear reply if needed
      if (parentMessageId) {
        this.cancelReply();
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      this.loadingIndicator.style.display = 'none';
    }
  }
}

// Initialize the app using DOMContentLoaded for better performance
document.addEventListener('DOMContentLoaded', () => {
  window.app = new GlobalChat();
});