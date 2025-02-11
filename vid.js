import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, query, orderBy, limit, getDocs, doc, getDoc, updateDoc, arrayUnion, arrayRemove, onSnapshot, startAfter } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDnPz8BWCaXJOazlFVO4Eap8VxdSR2oDFQ",
    authDomain: "globalchat-2d669.firebaseapp.com",
    projectId: "globalchat-2d669",
    storageBucket: "globalchat-2d669.firebasestorage.app",
    messagingSenderId: "178714711978",
    appId: "1:178714711978:web:fb831188be23e62a4bbdd3"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const MESSAGES_PER_PAGE = 20;
let lastVisible = null;
let loading = false;
let realtimeUnsubscribe = null;
let hasMoreMessages = true;

const commonEmojis = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

// Intersection Observer for media loading
const mediaObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const mediaWrapper = entry.target;
            const mediaElement = mediaWrapper.querySelector('img, video');
            
            if (mediaElement && mediaElement.dataset.src) {
                mediaElement.src = mediaElement.dataset.src;
                mediaElement.onload = () => {
                    mediaWrapper.classList.remove('media-loading');
                };
                mediaElement.onerror = () => {
                    mediaWrapper.classList.remove('media-loading');
                    mediaWrapper.classList.add('media-error');
                };
                mediaObserver.unobserve(mediaWrapper);
            }
        }
    });
}, {
    rootMargin: '100px',
    threshold: 0.1
});

// Scroll Observer for Infinite Loading
const scrollObserver = new IntersectionObserver((entries) => {
    const lastEntry = entries[0];
    if (lastEntry.isIntersecting && hasMoreMessages && !loading) {
        loadMessages(false);
    }
}, {
    rootMargin: '200px',
    threshold: 0.1
});

async function getUserProfile(userId) {
    try {
        const userDocRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userDocRef);
        return userDoc.exists() ? userDoc.data() : null;
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return null;
    }
}

function formatTimestamp(timestamp) {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
}

async function toggleReaction(postId, emoji, userId) {
    try {
        const postRef = doc(db, 'posts', postId);
        const postDoc = await getDoc(postRef);
        
        if (!postDoc.exists()) return;
        
        const reactions = postDoc.data().reactions || {};
        const reactionUsers = reactions[emoji] || [];
        
        if (reactionUsers.includes(userId)) {
            await updateDoc(postRef, {
                [`reactions.${emoji}`]: arrayRemove(userId)
            });
        } else {
            await updateDoc(postRef, {
                [`reactions.${emoji}`]: arrayUnion(userId)
            });
        }
    } catch (error) {
        console.error('Error toggling reaction:', error);
    }
}

function createEmojiPicker(postId, userId) {
    const picker = document.createElement('div');
    picker.className = 'emoji-picker';
    
    commonEmojis.forEach(emoji => {
        const option = document.createElement('div');
        option.className = 'emoji-option';
        option.textContent = emoji;
        option.onclick = (e) => {
            e.stopPropagation();
            toggleReaction(postId, emoji, userId);
            picker.remove();
        };
        picker.appendChild(option);
    });
    
    return picker;
}

function renderReactions(reactions = {}, postId, userId) {
    const container = document.createElement('div');
    container.className = 'reactions-container';
    
    Object.entries(reactions).forEach(([emoji, users]) => {
        if (users.length > 0) {
            const reaction = document.createElement('div');
            reaction.className = 'reaction';
            reaction.classList.toggle('user-reacted', users.includes(userId));
            reaction.innerHTML = `
                ${emoji}
                <span class="reaction-count">${users.length}</span>
            `;
            reaction.onclick = () => toggleReaction(postId, emoji, userId);
            container.appendChild(reaction);
        }
    });
    
    const addReaction = document.createElement('div');
    addReaction.className = 'add-reaction';
    addReaction.innerHTML = '😊';
    addReaction.onclick = (e) => {
        e.stopPropagation();
        const existing = document.querySelector('.emoji-picker');
        if (existing) existing.remove();
        
        const picker = createEmojiPicker(postId, userId);
        addReaction.appendChild(picker);
        
        document.addEventListener('click', () => picker.remove(), { once: true });
    };
    
    container.appendChild(addReaction);
    return container;
}

function createMediaElement(post) {
    if (!post.mediaUrl) return null;

    const mediaWrapper = document.createElement('div');
    mediaWrapper.className = 'media-wrapper media-loading';

    const isVideo = post.mediaType?.startsWith('video/') || post.mediaUrl?.match(/\.(mp4|webm|ogg)$/i);
    
    if (isVideo) {
        const video = document.createElement('video');
        video.className = 'post-media post-video';
        video.controls = false;
        video.preload = 'none';
        video.autoplay = true;
        video.muted = true;
        video.dataset.src = post.mediaUrl;
        video.playsInline = true;
        
        if (post.thumbnailUrl) {
            video.poster = post.thumbnailUrl;
        }

        video.onloadeddata = () => {
            mediaWrapper.classList.remove('media-loading');
        };

        mediaWrapper.appendChild(video);
    } else {
        const img = document.createElement('img');
        img.className = 'post-media post-image';
        img.dataset.src = post.mediaUrl;
        img.alt = "Posted image";
        
        mediaWrapper.appendChild(img);
    }

    mediaObserver.observe(mediaWrapper);
    return mediaWrapper;
}

async function createMessageElement(post, userId) {
    const userProfile = await getUserProfile(post.userId);
    const username = userProfile?.displayName || `User ${post.userId.slice(0, 4)}`;
    const profilePic = userProfile?.photoURL || "/api/placeholder/40/40";

    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';
    messageDiv.dataset.postId = post.id;
    
    const messageContent = `
        <img src="${profilePic}" alt="Profile" class="profile-pic">
        <div class="message-bubble">
            <div class="message-header">
                <div class="status-indicator"></div>
                <span class="username">${username}</span>
                <span class="timestamp">${formatTimestamp(post.createdAt)}</span>
            </div>
            <div class="message-content">
                ${post.text ? `<p class="text-content">${post.text}</p>` : ''}
            </div>
        </div>
    `;
    
    messageDiv.innerHTML = messageContent;
    
    if (post.mediaUrl) {
        const mediaElement = createMediaElement(post);
        if (mediaElement) {
            messageDiv.querySelector('.message-content').appendChild(mediaElement);
        }
    }

    const messageBubble = messageDiv.querySelector('.message-bubble');
    messageBubble.appendChild(renderReactions(post.reactions, post.id, userId));

    return messageDiv;
}

function updateMessage(post, userId) {
    const existingMessage = document.querySelector(`.message[data-post-id="${post.id}"]`);
    if (existingMessage) {
        const messageBubble = existingMessage.querySelector('.message-bubble');
        const oldReactions = messageBubble.querySelector('.reactions-container');
        if (oldReactions) {
            oldReactions.replaceWith(renderReactions(post.reactions, post.id, userId));
        }
    }
}

function createLoadingSpinner() {
    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';
    spinner.innerHTML = `
        <div class="spinner-inner">
            <div class="spinner-circle"></div>
        </div>
    `;
    return spinner;
}

async function loadMessages(initial = true) {
    if (loading || (!initial && !hasMoreMessages)) return;
    loading = true;

    const container = document.getElementById('chat-container');
    const loadingSpinner = createLoadingSpinner();
    
    if (initial) {
        container.innerHTML = '';
        container.appendChild(loadingSpinner);
        
        if (realtimeUnsubscribe) {
            realtimeUnsubscribe();
        }
    } else {
        container.appendChild(loadingSpinner);
    }

    try {
        let messagesQuery = query(
            collection(db, 'posts'),
            orderBy('createdAt', 'desc'),
            limit(MESSAGES_PER_PAGE)
        );

        if (!initial && lastVisible) {
            messagesQuery = query(
                collection(db, 'posts'),
                orderBy('createdAt', 'desc'),
                startAfter(lastVisible),
                limit(MESSAGES_PER_PAGE)
            );
        }

        const snapshot = await getDocs(messagesQuery);
        
        if (snapshot.empty || snapshot.docs.length < MESSAGES_PER_PAGE) {
            hasMoreMessages = false;
        }

        if (snapshot.empty) {
            loadingSpinner.remove();
            loading = false;
            return;
        }

        lastVisible = snapshot.docs[snapshot.docs.length - 1];

        if (initial) {
            container.innerHTML = '';
            
            realtimeUnsubscribe = onSnapshot(
                query(collection(db, 'posts'), orderBy('createdAt', 'desc')),
                (snapshot) => {
                    const currentUser = auth.currentUser;
                    snapshot.docChanges().forEach((change) => {
                        const post = { id: change.doc.id, ...change.doc.data() };
                        if (change.type === 'modified') {
                            updateMessage(post, currentUser.uid);
                        }
                    });
                }
            );
        }

        const currentUser = auth.currentUser;
        const fragment = document.createDocumentFragment();
        
        for (const doc of snapshot.docs) {
            const post = { id: doc.id, ...doc.data() };
            const messageElement = await createMessageElement(post, currentUser.uid);
            fragment.appendChild(messageElement);
        }

        loadingSpinner.remove();
        container.appendChild(fragment);

        if (hasMoreMessages) {
            const lastMessage = container.lastElementChild;
            if (lastMessage) {
                scrollObserver.observe(lastMessage);
            }
        }

    } catch (error) {
        console.error('Messages loading error:', error);
        loadingSpinner.remove();
        if (initial) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error';
            errorDiv.textContent = 'Error loading messages';
            container.appendChild(errorDiv);
        }
    }

    loading = false;
}

// Initialize the chat
onAuthStateChanged(auth, (user) => {
    if (user) {
        loadMessages(true);
    } else {
        window.location.href = 'login.html';
    }
});

// Clean up
window.addEventListener('unload', () => {
    if (realtimeUnsubscribe) {
        realtimeUnsubscribe();
    }
    mediaObserver.disconnect();
    scrollObserver.disconnect();
});