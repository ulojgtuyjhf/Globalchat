// comments.js
import { getFirestore, collection, doc, setDoc, getDocs, query, orderBy, limit, startAfter, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getDatabase, ref, push, set, onChildAdded, get, update, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// External dependencies (assumed to be available from main.js)
let currentUser = null;
let db = null;
let database = null;
let lastVisibleComment = new Map(); // Track pagination per message
let noMoreComments = new Map(); // Track end of comments per message
const COMMENTS_PER_PAGE = 5;
const MAX_REALTIME_COMMENTS = 1;

// Initialize comments system
export function initComments(firebaseApp, authUser) {
  db = getFirestore(firebaseApp);
  database = getDatabase(firebaseApp);
  currentUser = authUser;
}

// Create comment element
function createCommentElement(comment, commentId, messageId) {
  const commentElement = document.createElement('div');
  commentElement.classList.add('comment');
  commentElement.setAttribute('data-comment-id', commentId);
  commentElement.setAttribute('data-timestamp', comment.timestamp);
  commentElement.setAttribute('data-loaded', 'false');

  const flagUrl = `https://flagcdn.com/w320/${comment.country || 'unknown'}.png`;
  const commentTime = formatTimestamp(comment.timestamp);

  let mediaHTML = '';
  if (comment.media && comment.media.length > 0) {
    mediaHTML = '<div class="comment-media-container">';
    comment.media.forEach(media => {
      if (media && media.url) {
        if (media.type === 'image' || media.type === 'gif') {
          mediaHTML += `<div class="image-placeholder">
            <img data-src="${media.url}" class="comment-image" loading="lazy" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3C/svg%3E">
          </div>`;
        } else if (media.type === 'video') {
          mediaHTML += `<div class="video-placeholder">
            <video data-src="${media.url}" class="comment-video" controls preload="none" poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3C/svg%3E">
              <source data-src="${media.url}" type="${media.mimeType || 'video/mp4'}">
            </video>
          </div>`;
        }
      }
    });
    mediaHTML += '</div>';
  }

  commentElement.innerHTML = `
    <img src="${comment.photoURL}" class="comment-profile-image" alt="Profile" loading="lazy" onerror="this.src='https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png'">
    <div class="comment-content">
      <div class="comment-header">
        <span class="user-name">${comment.name}</span>
        <img src="${flagUrl}" class="country-flag" alt="Flag" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 1 1\'%3E%3C/svg%3E'" loading="lazy">
        <span class="comment-time">${commentTime}</span>
      </div>
      <div class="comment-text">${comment.text || ''}</div>
      ${mediaHTML}
    </div>
  `;

  return commentElement;
}

// Format timestamp (same as main.js)
function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

// Listen for new comments in real-time
export function listenForComments(messageId, commentsContainer) {
  const commentsRef = ref(database, `comments/${messageId}`);
  
  onChildAdded(commentsRef, async (snapshot) => {
    const comment = snapshot.val();
    const commentId = snapshot.key;

    if (document.querySelector(`[data-comment-id="${commentId}"]`)) return;

    const commentElement = createCommentElement(comment, commentId, messageId);
    if (commentsContainer.firstChild) {
      commentsContainer.insertBefore(commentElement, commentsContainer.firstChild);
    } else {
      commentsContainer.appendChild(commentElement);
    }

    // Archive comment to Firestore
    await archiveComment(messageId, commentId, comment);

    // Reset pagination state
    lastVisibleComment.delete(messageId);
    noMoreComments.delete(messageId);

    // Update comment count
    updateCommentCount(messageId);

    // Load initial archived comments
    loadInitialArchivedComments(messageId, commentsContainer);
  });

  // Load archived comments if no real-time comments arrive
  setTimeout(() => {
    if (commentsContainer.childElementCount === 0) {
      loadInitialArchivedComments(messageId, commentsContainer);
    }
  }, 1000);
}

// Load initial archived comments
async function loadInitialArchivedComments(messageId, commentsContainer) {
  try {
    const commentsQuery = query(
      collection(db, 'messages', messageId, 'comments'),
      orderBy('timestamp', 'desc'),
      limit(COMMENTS_PER_PAGE)
    );

    const querySnapshot = await getDocs(commentsQuery);

    if (querySnapshot.empty) return;

    lastVisibleComment.set(messageId, querySnapshot.docs[querySnapshot.docs.length - 1]);

    const fragment = document.createDocumentFragment();
    querySnapshot.forEach(doc => {
      const comment = doc.data();
      const commentId = doc.id;
      if (!document.querySelector(`[data-comment-id="${commentId}"]`)) {
        const commentElement = createCommentElement(comment, commentId, messageId);
        fragment.appendChild(commentElement);
      }
    });

    commentsContainer.appendChild(fragment);

    if (querySnapshot.docs.length < COMMENTS_PER_PAGE) {
      noMoreComments.set(messageId, true);
    }

    setupCommentVirtualScrolling(messageId, commentsContainer);
  } catch (error) {
    console.error('Error loading archived comments:', error);
  }
}

// Archive comment to Firestore
async function archiveComment(messageId, commentId, comment) {
  try {
    await setDoc(doc(db, 'messages', messageId, 'comments', commentId), {
      ...comment,
      archivedAt: Date.now()
    });

    // Ensure only one comment in Realtime DB
    await ensureOnlyOneCommentInRealtime(messageId);
  } catch (error) {
    console.error('Error archiving comment:', error);
  }
}

// Ensure only one comment in Realtime Database
async function ensureOnlyOneCommentInRealtime(messageId) {
  try {
    const commentsRef = ref(database, `comments/${messageId}`);
    const snapshot = await get(commentsRef);
    const comments = [];

    snapshot.forEach(childSnapshot => {
      comments.push({
        key: childSnapshot.key,
        timestamp: childSnapshot.val().timestamp
      });
    });

    if (comments.length > MAX_REALTIME_COMMENTS) {
      comments.sort((a, b) => b.timestamp - a.timestamp);
      const commentsToDelete = comments.slice(MAX_REALTIME_COMMENTS);

      for (const comment of commentsToDelete) {
        const docRef = doc(db, 'messages', messageId, 'comments', comment.key);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          await remove(ref(database, `comments/${messageId}/${comment.key}`));
        }
      }
    }
  } catch (error) {
    console.error('Error ensuring one comment in realtime:', error);
  }
}

// Send comment
export async function sendComment(messageId, commentText, media = []) {
  if (!currentUser) {
    alert('You must log in to comment');
    return;
  }

  if (!commentText.trim() && !media.length) return;

  const currentTime = Date.now();

  try {
    const commentData = {
      userId: currentUser.uid,
      name: currentUser.displayName,
      photoURL: currentUser.photoURL,
      text: commentText,
      media: media,
      timestamp: currentTime,
      country: currentUser.country
    };

    const commentsRef = ref(database, `comments/${messageId}`);
    const newCommentRef = push(commentsRef);
    await set(newCommentRef, commentData);

    // Update comment count in Realtime Database
    const messageRef = ref(database, `messages/${messageId}`);
    const snapshot = await get(messageRef);
    if (snapshot.exists()) {
      await update(messageRef, {
        replyCount: (snapshot.val().replyCount || 0) + 1
      });
    }

  } catch (error) {
    console.error('Error sending comment:', error);
    alert('Failed to send comment. Please try again.');
  }
}

// Update comment count
async function updateCommentCount(messageId) {
  const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
  if (!messageElement) return;

  const replyCountElement = messageElement.querySelector('.reply-btn .action-count');
  const messageRef = ref(database, `messages/${messageId}`);
  const snapshot = await get(messageRef);
  if (snapshot.exists()) {
    const count = snapshot.val().replyCount || 0;
    replyCountElement.textContent = count;
  }
}

// Setup virtual scrolling for comments
function setupCommentVirtualScrolling(messageId, commentsContainer) {
  const visibilityObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const commentElement = entry.target;
      if (entry.isIntersecting && commentElement.getAttribute('data-loaded') !== 'true') {
        const lazyImages = commentElement.querySelectorAll('img[data-src]');
        lazyImages.forEach(img => {
          if (img.dataset.src) {
            img.src = img.dataset.src;
            delete img.dataset.src;
          }
        });

        const lazyVideos = commentElement.querySelectorAll('video[data-src]');
        lazyVideos.forEach(video => {
          if (video.dataset.src) {
            video.src = video.dataset.src;
            const sources = video.querySelectorAll('source[data-src]');
            sources.forEach(source => {
              if (source.dataset.src) {
                source.src = source.dataset.src;
                delete source.dataset.src;
              }
            });
            delete video.dataset.src;
          }
        });

        commentElement.setAttribute('data-loaded', 'true');
      }
    });
  }, {
    root: null,
    rootMargin: '500px',
    threshold: 0.01
  });

  commentsContainer.querySelectorAll('.comment:not([data-observed="true"])').forEach(comment => {
    visibilityObserver.observe(comment);
    comment.setAttribute('data-observed', 'true');
  });
}

// Add styles for comments
const commentStyles = document.createElement('style');
commentStyles.textContent = `
  .comments-section {
    display: none;
    margin-top: 12px;
    padding: 12px;
    background: #f8f9fa;
    border-radius: 8px;
    animation: slideIn 0.3s ease-out;
  }

  .comments-section.active {
    display: block;
  }

  .comment {
    display: flex;
    padding: 8px 0;
    border-bottom: 1px solid #e1e8ed;
  }

  .comment-profile-image {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    margin-right: 8px;
  }

  .comment-content {
    flex: 1;
  }

  .comment-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
  }

  .comment-time {
    color: #536471;
  }

  .comment-text {
    font-size: 14px;
    margin: 4px 0;
  }

  .comment-media-container {
    margin-top: 8px;
  }

  .comment-image, .comment-video {
    max-width: 100%;
    border-radius: 8px;
  }

  .comment-input-container {
    display: flex;
    align-items: center;
    margin-bottom: 12px;
    gap: 8px;
  }

  .comment-input {
    flex: 1;
    padding: 8px;
    border: 1px solid #e1e8ed;
    border-radius: 8px;
    resize: none;
    font-size: 14px;
    min-height: 40px;
    max-height: 120px;
  }

  .comment-gif-button {
    padding: 8px;
    background: none;
    border: none;
    cursor: pointer;
  }

  .comment-gif-button svg {
    width: 20px;
    height: 20px;
    fill: #1d9bf0;
  }

  .comment-send-button {
    padding: 8px 16px;
    background: #1d9bf0;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
  }

  .comment-send-button:disabled {
    background: #b0c4de;
    cursor: not-allowed;
  }

  @keyframes slideIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;
document.head.appendChild(commentStyles);