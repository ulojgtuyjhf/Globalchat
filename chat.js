import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, query, where, getDocs, addDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getDatabase, ref, push, set, onChildAdded, update, query as dbQuery, limitToLast, startAfter, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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
const chatRef = ref(database, 'messages');

const chatContainer = document.getElementById('chatContainer');
const messageInput = document.getElementById('messageInput');
const loadingIndicator = document.getElementById('loadingIndicator');

let currentUser = null;
const activeReplies = new Set();
let lastMessageTime = 0;
const followedUsers = new Set();
let lastMessageKey = null;
const MESSAGE_LIMIT = 20;
const MESSAGE_BATCH_SIZE = 10;
const messageCache = new Map();

// Styling for Follow Button
const styleTag = document.createElement('style');
styleTag.textContent = `
  .follow-btn {
    background-color: black;
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
    box-shadow: 2px 2px 4px #b0b0b0, -2px -2px 4px #ffffff;
    transition: background-color 0.3s, box-shadow 0.3s;
  }
  .follow-btn:active {
    box-shadow: inset 2px 2px 4px #b0b0b0, inset -2px -2px 4px #ffffff;
  }
  .follow-btn.followed {
    background-color: gray;
    color: #fff;
  }
`;
document.head.appendChild(styleTag);

document.querySelectorAll('.follow-btn').forEach(button => {
  button.addEventListener('click', function() {
    this.classList.toggle('followed');
    this.textContent = this.classList.contains('followed') ? 'Unfollow' : 'Follow';
  });
});

// Follow/Unfollow User
async function toggleFollow(userId, userName) {
  if (!currentUser) {
    alert('Please log in first!');
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
      await addDoc(collection(db, 'follows'), {
        followerUserId: currentUser.uid,
        followedUserId: userId,
        followedUserName: userName,
        timestamp: new Date().toISOString()
      });
      followedUsers.add(userId);
     
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
const GLOBAL_RATE_LIMIT_MS = 3000; // 2 seconds
const lastMessageTimeRef = ref(database, 'lastMessageTime'); // Shared reference for last message time

// Function to check and update global rate limit
async function checkAndUpdateGlobalRateLimit() {
  try {
    const snapshot = await get(lastMessageTimeRef);
    const lastMessageTime = snapshot.exists() ? snapshot.val() : 0;
    const currentTime = Date.now();

    if (currentTime - lastMessageTime < GLOBAL_RATE_LIMIT_MS) {
      alert('Please wait 2 seconds before sending your next message. This is a global rate limit.');
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

// Updated Send Message Function with Global Rate Limit
window.sendMessage = async (parentMessageId = null) => {
  if (!currentUser) {
    alert('You must log in to continue.');
    return;
  }

  const messageText = messageInput.value.trim();

  if (!moderateContent(messageText)) return;
  if (messageText === '') return;

  // Check and update global rate limit
  const isAllowed = await checkAndUpdateGlobalRateLimit();
  if (!isAllowed) return;

  createLoadingAnimation();
  loadingIndicator.style.display = 'flex';

  try {
    const newMessageRef = push(chatRef);
    const messageData = {
      userId: currentUser.uid,
      name: currentUser.displayName,
      photoURL: currentUser.photoURL,
      text: messageText,
      timestamp: new Date().toISOString(),
      country: currentUser.country,
      parentMessageId: parentMessageId,
      replyCount: 0,
      isCreator: parentMessageId !== null
    };

    await set(newMessageRef, messageData);
    messageInput.value = '';
  } catch (error) {
    console.error('Error sending message:', error);
  } finally {
    loadingIndicator.style.display = 'none';
  }
};

// Updated Send Reply Function with Global Rate Limit
window.sendReply = async (parentMessageId) => {
  const replyTextarea = document.querySelector(`[data-message-id="${parentMessageId}"] .reply-textarea`);
  const replyText = replyTextarea.value.trim();

  if (replyText === '') return;

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
      isCreator: true
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
  }
};

// Optimized message loading
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

// Optimized real-time listener
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

// Toggle Reply Input Function
window.toggleReplyInput = (messageId) => {
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
    activeReplies.add(messageId);
  }
};

// Expose toggleFollow globally
window.toggleFollow = toggleFollow;

// Implement scroll handler for loading more messages
let scrollTimeout;
chatContainer.addEventListener('scroll', () => {
  if (scrollTimeout) clearTimeout(scrollTimeout);

  scrollTimeout = setTimeout(() => {
    if (chatContainer.scrollTop === 0) {
      loadMoreMessages();
    }
  }, 150);
});

// Initial load of messages
loadMoreMessages();