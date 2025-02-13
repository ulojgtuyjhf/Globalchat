import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, query, where, getDocs, addDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getDatabase, ref, push, set, onChildAdded, update, query as dbQuery, limitToLast, startAfter, get, orderByChild } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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
const followedUsers = new Set();
let lastMessageKey = null;
const MESSAGE_LIMIT = 10;
let isLoading = false;
let lastVisibleTimestamp = Date.now();

// Global cooldown variable
let globalLastMessageTime = 0;
const globalTimeRef = ref(database, 'lastMessageTime');

// Styling for Follow Button
const styleTag = document.createElement('style');
styleTag.textContent = `
  .follow-btn {
    background-color: black; /* Purple for Follow */
    color: #fff;
    border: none;
    padding: 4px 8px; /* Smaller size */
    text-align: center;
    text-decoration: none;
    display: inline-block;
    font-size: 10px; /* Very small text */
    margin: 4px 2px;
    cursor: pointer;
    border-radius: 8px; /* Rounded corners */
    box-shadow: 2px 2px 4px #b0b0b0, -2px -2px 4px #ffffff;
    transition: background-color 0.3s, box-shadow 0.3s;
  }
  .follow-btn:active {
    box-shadow: inset 2px 2px 4px #b0b0b0, inset -2px -2px 4px #ffffff;
  }
  .follow-btn.followed {
    background-color: gray; /* Red for Unfollow */
    color: white;
  }
`;
document.head.appendChild(styleTag);

document.querySelectorAll('.follow-btn').forEach(button => {
  button.addEventListener('click', function() {
    this.classList.toggle('followed');
    this.textContent = this.classList.contains('followed') ? 'Unfollow' : 'Follow';
  });
});
document.head.appendChild(styleTag);

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
      // Follow the user
      await addDoc(collection(db, 'follows'), {
        followerUserId: currentUser.uid,
        followedUserId: userId,
        followedUserName: userName,
        timestamp: new Date().toISOString()
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

// Strong Content Moderation Function
function moderateContent(text) {
  const hasBlockedContent = BLOCKED_PATTERNS.some(pattern => pattern.test(text));
  if (hasBlockedContent) {
    alert('Your message contains prohibited content. Please revise and adhere to the content guidelines.');
    return false;
  }
  return true;
}

// Create Loading Animation
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

// Geolocation and Flag Service
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

// Send Message Function with Global Cooldown
window.sendMessage = async (parentMessageId = null) => {
  if (!currentUser) {
    alert('You must log in to continue. Please log in to access this feature.');
    return;
  }

  const messageText = messageInput.value.trim();
  const currentTime = Date.now();

  // Check global cooldown
  if (currentTime - globalLastMessageTime < 4000) {
    alert('Please wait while others are sending messages.');
    return;
  }

  if (!moderateContent(messageText) || messageText === '') return;

  createLoadingAnimation();
  loadingIndicator.style.display = 'flex';

  try {
    // Update global last message time
    await set(globalTimeRef, currentTime);
    globalLastMessageTime = currentTime;

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

    if (parentMessageId) {
      const parentRef = ref(database, `messages/${parentMessageId}`);
      const snapshot = await get(parentRef);
      if (snapshot.exists()) {
        await update(parentRef, {
          replyCount: (snapshot.val().replyCount || 0) + 1
        });
      }
    }
  } catch (error) {
    console.error('Error sending message:', error);
  } finally {
    loadingIndicator.style.display = 'none';
  }
};

// Function to load messages with improved pagination
async function loadMessages() {
  if (isLoading) return;
  isLoading = true;
  loadingIndicator.style.display = 'flex';

  try {
    const messagesQuery = dbQuery(
      chatRef,
      orderByChild('timestamp'),
      limitToLast(MESSAGE_LIMIT)
    );

    const snapshot = await get(messagesQuery);
    if (snapshot.exists()) {
      const messages = [];
      snapshot.forEach(childSnapshot => {
        const message = childSnapshot.val();
        if (new Date(message.timestamp).getTime() < lastVisibleTimestamp) {
          messages.push({
            ...message,
            id: childSnapshot.key
          });
        }
      });

      messages.reverse().forEach(message => {
        appendMessage(message, message.id);
      });

      if (messages.length > 0) {
        lastVisibleTimestamp = new Date(messages[messages.length - 1].timestamp).getTime();
      }
    }
  } catch (error) {
    console.error('Error loading messages:', error);
  } finally {
    isLoading = false;
    loadingIndicator.style.display = 'none';
  }
}

// Function to append a message to the chat container
function appendMessage(message, messageId) {
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
          <button class="follow-btn" data-user-id="${message.userId}" onclick="toggleFollow('${message.userId}', '${message.name}')">Follow</button>
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

// Listen for New Messages
onChildAdded(chatRef, (snapshot) => {
  const message = snapshot.val();
  const messageId = snapshot.key;
  appendMessage(message, messageId);
});

// Listen for Global Last Message Time Updates
onChildAdded(globalTimeRef, (snapshot) => {
  globalLastMessageTime = snapshot.val();
});

// Toggle Reply Input
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

// Send Reply Function
window.sendReply = (parentMessageId) => {
  const replyTextarea = document.querySelector(`[data-message-id="${parentMessageId}"] .reply-textarea`);
  const replyText = replyTextarea.value.trim();
  
  if (replyText === '') return;
  
  const reply = {
    text: replyText,
    timestamp: Date.now(),
    userId: currentUser.uid,
    name: currentUser.displayName,
    photoURL: currentUser.photoURL,
    country: currentUser.country,
    parentMessageId: parentMessageId
  };
  
  // Push the reply to the database
  const newReplyRef = push(ref(database, `messages/${parentMessageId}/replies`));
  set(newReplyRef, reply)
    .then(() => {
      replyTextarea.value = '';
      toggleReplyInput(parentMessageId);
    })
    .catch(error => console.error('Error sending reply:', error));
};

// Expose toggleFollow globally
window.toggleFollow = toggleFollow;

// Scroll Event Listener for Loading More Messages
chatContainer.addEventListener('scroll', () => {
  if (chatContainer.scrollTop === 0 && !isLoading) {
    loadMessages();
  }
});

// Initial Load of Messages
loadMessages();