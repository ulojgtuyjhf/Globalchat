// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, query, orderBy, getDocs, addDoc, serverTimestamp, onSnapshot, updateDoc, doc, arrayUnion, arrayRemove, getDoc, where, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

// Appwrite Configuration
const APPWRITE_ENDPOINT = "https://cloud.appwrite.io/v1";
const APPWRITE_PROJECT_ID = "67d98c24003a405ab6a0"; 
const APPWRITE_BUCKET_ID = "67dba33e000399dc8641"; 
const APPWRITE_API_KEY = "standard_6f65a2d8e8c270ba9556f844789c1eae72c7fa71f64b95409ac20b6127c483454d1e4b9f8c13f82c09168ed1dfebd2d4e7e02494bee254252f9713675beea4d645a960879aaada1c6c98cb7651ec6c6bf4357e4c2c8b8d666c0166203ec43694b9a49ec8ee08161edf3fd5dea94e46c165316122f44f96c44933121be214b80c";

// Initialize Appwrite SDK
const appwrite = {
    sdk: null,
    init: function() {
        this.sdk = new Appwrite();
        this.sdk.setEndpoint(APPWRITE_ENDPOINT);
        this.sdk.setProject(APPWRITE_PROJECT_ID);
        return this.sdk;
    },
    storage: function() {
        if (!this.sdk) this.init();
        return this.sdk.storage;
    }
};

// DOM Elements
const gallery = document.getElementById('gallery');
const loadingContainer = document.getElementById('loadingContainer');
const fullscreenModal = document.getElementById('fullscreenModal');
const modalMedia = document.getElementById('modalMedia');
const commentsList = document.getElementById('commentsList');
const commentsCount = document.getElementById('commentsCount');
const commentInput = document.getElementById('commentInput');
const submitComment = document.getElementById('submitComment');
const backButton = document.getElementById('backButton');
const gifButton = document.getElementById('gifButton');
const gifSelector = document.getElementById('gifSelector');
const gifSearch = document.getElementById('gifSearch');
const gifResults = document.getElementById('gifResults');
const postHeader = document.getElementById('postHeader');
const postUserAvatar = document.getElementById('postUserAvatar');
const postUserName = document.getElementById('postUserName');
const postUserFlag = document.getElementById('postUserFlag');
const likePostButton = document.getElementById('likePostButton');
const likePostCount = document.getElementById('likePostCount');
const followButton = document.getElementById('followButton');
const replyPreview = document.getElementById('replyPreview');
const replyPreviewText = document.getElementById('replyPreviewText');
const replyPreviewClose = document.getElementById('replyPreviewClose');
const profileModal = document.getElementById('profileModal');
const profileBackButton = document.getElementById('profileBackButton');
const profileIframe = document.getElementById('profileIframe');

// Current user state
let currentUser = null;
let currentPostId = null;
let currentPostData = null;
let commentsUnsubscribe = null;
let selectedGif = null;
let currentVideo = null;
let currentReplyTo = null;
const followedUsers = new Set();

// Initialize app
function init() {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
            if (window.innerWidth <= 767) {
                setTimeout(() => {
                    loadingContainer.classList.remove('start');
                    loadingContainer.classList.add('move-to-top');
                }, 500);
            }
            
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            const userData = userDoc.data() || {};
            
            let country = userData.country;
            if (!country) {
                try {
                    const response = await fetch('https://ipapi.co/json/');
                    const data = await response.json();
                    country = data.country_code.toLowerCase();
                    await updateDoc(doc(db, 'users', user.uid), {
                        country: country
                    });
                } catch (error) {
                    console.error('Error fetching country:', error);
                    country = 'unknown';
                }
            }
            
            currentUser = {
                ...user,
                country: country,
                photoURL: user.photoURL || userData.photoURL || 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png',
                displayName: user.displayName || userData.displayName || 'User'
            };
            
            await fetchFollowedUsers();
            fetchPosts();
            setupEventListeners();
        } else {
            loadingContainer.classList.add('hidden');
            setTimeout(() => {
                loadingContainer.style.display = 'none';
            }, 300);
            gallery.innerHTML = '<div style="text-align: center; padding: 20px;">Please sign in to view content</div>';
        }
    });
}

async function fetchFollowedUsers() {
    if (!currentUser) return;
    
    try {
        const followQuery = query(
            collection(db, 'follows'),
            where('followerUserId', '==', currentUser.uid)
        );
        
        const followSnapshot = await getDocs(followQuery);
        followedUsers.clear();
        
        followSnapshot.forEach(doc => {
            followedUsers.add(doc.data().followedUserId);
        });
        
        updateFollowButtons();
    } catch (error) {
        console.error('Error fetching followed users:', error);
    }
}

async function toggleFollow(userId, userName) {
    if (!currentUser) return;
    
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
                timestamp: serverTimestamp()
            });
            followedUsers.add(userId);
        } else {
            followSnapshot.forEach(async doc => {
                await deleteDoc(doc.ref);
            });
            followedUsers.delete(userId);
        }
        
        updateFollowButtons();
    } catch (error) {
        console.error('Error toggling follow:', error);
    }
}

function updateFollowButtons() {
    if (currentPostData && currentPostData.userId !== currentUser?.uid) {
        followButton.textContent = followedUsers.has(currentPostData.userId) ? 'Following' : 'Follow';
        followButton.classList.toggle('followed', followedUsers.has(currentPostData.userId));
    }
}

function setupEventListeners() {
    backButton.addEventListener('click', closeModal);
    
    commentInput.addEventListener('input', () => {
        submitComment.disabled = commentInput.value.trim() === '' && !selectedGif;
    });
    
    submitComment.addEventListener('click', addComment);
    
    gifButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        gifSelector.classList.toggle('active');
        if (gifSelector.classList.contains('active')) {
            loadGifs();
            gifSearch.focus();
        }
    });
    
    gifSearch.addEventListener('input', debounce(() => {
        loadGifs(gifSearch.value);
    }, 500));
    
    document.addEventListener('click', (e) => {
        if (gifSelector.classList.contains('active') && 
            !gifSelector.contains(e.target) && 
            e.target !== gifButton) {
            gifSelector.classList.remove('active');
        }
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && fullscreenModal.classList.contains('active')) {
            closeModal();
        } else if (e.key === 'Escape' && profileModal.classList.contains('active')) {
            closeProfileModal();
        }
    });

    likePostButton.addEventListener('click', async () => {
        if (!currentUser || !currentPostId) return;
        
        try {
            const postRef = doc(db, 'recence', currentPostId);
            const postDoc = await getDoc(postRef);
            
            if (postDoc.exists()) {
                const postData = postDoc.data();
                const isLiked = postData.likes && postData.likes.includes(currentUser.uid);
                
                if (isLiked) {
                    await updateDoc(postRef, {
                        likes: arrayRemove(currentUser.uid)
                    });
                    likePostButton.classList.remove('liked');
                } else {
                    await updateDoc(postRef, {
                        likes: arrayUnion(currentUser.uid)
                    });
                    likePostButton.classList.add('liked');
                }
            }
        } catch (error) {
            console.error('Error toggling post like:', error);
        }
    });

    followButton.addEventListener('click', (e) => {
        e.stopPropagation();
        if (currentPostData) {
            toggleFollow(currentPostData.userId, currentPostData.name);
        }
    });

    replyPreviewClose.addEventListener('click', () => {
        currentReplyTo = null;
        replyPreview.style.display = 'none';
    });

    profileBackButton.addEventListener('click', closeProfileModal);

    // Listen for messages from iframe
    window.addEventListener('message', (event) => {
        if (event.data === 'closeProfileModal') {
            closeProfileModal();
        } else if (event.data.type === 'openPost') {
            closeProfileModal();
            // Implement opening the post modal here if needed
        }
    });
}

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

async function loadGifs(searchTerm = '') {
    try {
        gifResults.innerHTML = '<div style="text-align: center; padding: 10px;">Loading GIFs...</div>';
        
        const apiKey = 'GlVGYHkr3WSBnllca54iNt0yFbjz7L65';
        const endpoint = searchTerm 
            ? `https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${searchTerm}&limit=15`
            : `https://api.giphy.com/v1/gifs/trending?api_key=${apiKey}&limit=15`;
        
        const response = await fetch(endpoint);
        const data = await response.json();
        
        gifResults.innerHTML = '';
        
        if (data.data.length === 0) {
            gifResults.innerHTML = '<div style="text-align: center; padding: 10px;">No GIFs found</div>';
            return;
        }
        
        data.data.forEach(gif => {
            const gifItem = document.createElement('img');
            gifItem.src = gif.images.fixed_height_small.url;
            gifItem.className = 'gif-item';
            gifItem.dataset.originalUrl = gif.images.fixed_height.url;
            
            gifItem.addEventListener('click', () => {
                selectedGif = gif.images.fixed_height.url;
                submitComment.disabled = false;
                gifSelector.classList.remove('active');
                
                const existingPreview = document.querySelector('.gif-preview');
                if (existingPreview) existingPreview.remove();
                
                const previewGif = document.createElement('div');
                previewGif.className = 'gif-preview';
                previewGif.innerHTML = `<img src="${selectedGif}" style="max-height: 60px; border-radius: 4px; margin-right: 10px;">`;
                previewGif.style.display = 'inline-block';
                commentInput.parentNode.insertBefore(previewGif, commentInput);
            });
            
            gifResults.appendChild(gifItem);
        });
    } catch (error) {
        console.error('Error loading GIFs:', error);
        gifResults.innerHTML = '<div style="text-align: center; padding: 10px;">Error loading GIFs</div>';
    }
}

function setupLazyLoading() {
    const lazyElements = document.querySelectorAll('.lazy-load');
    
    if ('IntersectionObserver' in window) {
        const lazyObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const lazyElement = entry.target;
                    
                    if (lazyElement.dataset.src) {
                        lazyElement.src = lazyElement.dataset.src;
                        lazyElement.removeAttribute('data-src');
                        
                        if (lazyElement.tagName === 'VIDEO') {
                            lazyElement.muted = true;
                            lazyElement.playsInline = true;
                            lazyElement.loop = true;
                            lazyElement.autoplay = true;
                            
                            lazyElement.addEventListener('loadeddata', () => {
                                lazyElement.play().catch(e => console.log("Video play prevented:", e));
                            });
                        }
                        
                        setTimeout(() => {
                            lazyElement.classList.add('loaded');
                        }, 50);
                        
                        lazyObserver.unobserve(lazyElement);
                    }
                }
            });
        }, {
            rootMargin: '200px 0px',
            threshold: 0.01
        });
        
        lazyElements.forEach(lazyElement => {
            lazyObserver.observe(lazyElement);
        });
    } else {
        lazyElements.forEach(lazyElement => {
            if (lazyElement.dataset.src) {
                lazyElement.src = lazyElement.dataset.src;
                lazyElement.classList.add('loaded');
            }
        });
    }
}

async function fetchPosts() {
    try {
        const recenceCollection = collection(db, 'recence');
        const q = query(recenceCollection, orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(q);

        loadingContainer.classList.add('hidden');
        setTimeout(() => {
            loadingContainer.style.display = 'none';
        }, 300);

        if (querySnapshot.empty) {
            gallery.innerHTML = '<div style="text-align: center; padding: 20px;">No posts found</div>';
            return;
        }

        querySnapshot.forEach((doc) => {
            const postData = doc.data();
            const pinElement = createPinElement(postData, doc.id);
            if (pinElement) {
                gallery.appendChild(pinElement);
            }
        });

        setupLazyLoading();
    } catch (error) {
        console.error('Error fetching posts:', error);
        loadingContainer.classList.add('hidden');
        setTimeout(() => {
            loadingContainer.style.display = 'none';
        }, 300);
        gallery.innerHTML = '<div style="text-align: center; padding: 20px;">Error loading content. Please try again later.</div>';
    }
}

function createPinElement(postData, postId) {
    if (!postData.media || postData.media.length === 0) return null;

    const pinContainer = document.createElement('div');
    pinContainer.className = 'pin-container';
    pinContainer.dataset.postId = postId;

    const galleryItem = document.createElement('div');
    galleryItem.className = 'gallery-item';

    const mediaItem = postData.media[0];
    const mediaElement = createMediaElement(mediaItem);
    if (mediaElement) {
        galleryItem.appendChild(mediaElement);
    }

    const profileInfo = document.createElement('div');
    profileInfo.className = 'profile-info';

    const profileLeft = document.createElement('div');
    profileLeft.className = 'profile-left';

    const profileImage = document.createElement('img');
    profileImage.className = 'lazy-load';
    profileImage.dataset.src = postData.photoURL || 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png';
    profileImage.alt = 'Profile';
    profileImage.onerror = function() {
        this.src = 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png';
    };
    profileImage.addEventListener('click', (e) => {
        e.stopPropagation();
        viewProfile(postData.userId);
    });

    const nameSpan = document.createElement('span');
    nameSpan.textContent = postData.name || 'User';
    nameSpan.addEventListener('click', (e) => {
        e.stopPropagation();
        viewProfile(postData.userId);
    });

    profileLeft.appendChild(profileImage);
    profileLeft.appendChild(nameSpan);

    const options = document.createElement('div');
    options.className = 'options';
    for (let i = 0; i < 3; i++) {
        const dot = document.createElement('span');
        options.appendChild(dot);
    }

    profileInfo.appendChild(profileLeft);
    profileInfo.appendChild(options);

    pinContainer.appendChild(galleryItem);
    pinContainer.appendChild(profileInfo);

    pinContainer.addEventListener('click', () => {
        openModal(postData, postId);
    });

    return pinContainer;
}

function createMediaElement(mediaItem) {
    if (!mediaItem || !mediaItem.url) return null;

    const isVideo = mediaItem.type === 'video' || mediaItem.contentType?.startsWith('video/');
    
    if (isVideo) {
        const video = document.createElement('video');
        video.className = 'lazy-load';
        video.dataset.src = mediaItem.url;
        video.alt = 'Video content';
        video.muted = true;
        video.controls = false;
        video.playsInline = true;
        video.loop = true;
        video.autoplay = false;

        video.onerror = function() {
            if (this.parentNode && this.parentNode.parentNode) {
                this.parentNode.parentNode.remove();
            }
            return null;
        };

        return video;
    } else {
        const img = document.createElement('img');
        img.className = 'lazy-load';
        img.dataset.src = mediaItem.url;
        img.alt = 'Post image';

        img.onerror = function() {
            if (this.parentNode && this.parentNode.parentNode) {
                this.parentNode.parentNode.remove();
            }
            return null;
        };

        return img;
    }
}

function openModal(postData, postId) {
    currentPostId = postId;
    currentPostData = postData;
    
    modalMedia.innerHTML = '';
    commentsList.innerHTML = '';
    commentsCount.textContent = '0 comments';
    commentInput.value = '';
    submitComment.disabled = true;
    selectedGif = null;
    currentReplyTo = null;
    replyPreview.style.display = 'none';
    
    postUserAvatar.src = postData.photoURL || 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png';
    postUserAvatar.onerror = function() {
        this.src = 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png';
    };
    postUserAvatar.addEventListener('click', (e) => {
        e.stopPropagation();
        viewProfile(postData.userId);
    });
    
    postUserName.textContent = postData.name || 'User';
    postUserName.addEventListener('click', (e) => {
        e.stopPropagation();
        viewProfile(postData.userId);
    });
    
    postUserFlag.src = `https://flagcdn.com/w20/${postData.country || 'unknown'}.png`;
    postUserFlag.onerror = function() {
        this.style.display = 'none';
    };
    
    if (postData.userId === currentUser?.uid) {
        followButton.style.display = 'none';
    } else {
        followButton.style.display = 'inline-block';
        followButton.textContent = followedUsers.has(postData.userId) ? 'Following' : 'Follow';
        followButton.classList.toggle('followed', followedUsers.has(postData.userId));
    }
    
    likePostButton.classList.toggle('liked', postData.likes && postData.likes.includes(currentUser?.uid));
    likePostCount.textContent = postData.likes ? postData.likes.length : 0;
    
    const mediaItem = postData.media[0];
    const isVideo = mediaItem.type === 'video' || mediaItem.contentType?.startsWith('video/');
    
    if (isVideo) {
        const video = document.createElement('video');
        video.src = mediaItem.url;
        video.controls = true;
        video.autoplay = true;
        video.loop = true;
        video.muted = false;
        currentVideo = video;
        modalMedia.appendChild(video);
    } else {
        const img = document.createElement('img');
        img.src = mediaItem.url;
        img.alt = 'Post image';
        modalMedia.appendChild(img);
        currentVideo = null;
    }
    
    fullscreenModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    loadComments(postId);
}

function viewProfile(userId) {
    // Show loading animation
    loadingContainer.classList.remove('hidden');
    loadingContainer.style.display = 'flex';
    
    profileIframe.src = `profile.html?userId=${userId}`;
    
    profileModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    profileIframe.onload = () => {
        loadingContainer.classList.add('hidden');
        setTimeout(() => {
            loadingContainer.style.display = 'none';
        }, 300);
    };
}

function closeProfileModal() {
    profileModal.classList.remove('active');
    document.body.style.overflow = '';
    
    // Delay clearing the iframe src to allow for transition animation
    setTimeout(() => {
        profileIframe.src = 'about:blank';
    }, 300);
    
    // Re-open the post modal if we came from there
    if (currentPostId) {
        setTimeout(() => {
            fullscreenModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }, 50);
    }
}

function closeModal() {
    if (currentVideo) {
        currentVideo.pause();
        currentVideo.currentTime = 0;
        currentVideo = null;
    }
    
    fullscreenModal.classList.remove('active');
    document.body.style.overflow = '';
    
    if (commentsUnsubscribe) {
        commentsUnsubscribe();
        commentsUnsubscribe = null;
    }
    
    currentPostId = null;
    currentPostData = null;
    
    gifSelector.classList.remove('active');
    selectedGif = null;
    
    const previewGif = document.querySelector('.gif-preview');
    if (previewGif) {
        previewGif.remove();
    }
}

function loadComments(postId) {
    commentsList.innerHTML = `
        <div class="comment-loading" style="display: flex; justify-content: center; padding: 20px;">
            <div class="spinner" style="width: 20px; height: 20px;"></div>
        </div>
    `;
    
    const commentsRef = collection(db, 'recence', postId, 'comments');
    const q = query(commentsRef, orderBy('timestamp', 'asc'));
    
    commentsUnsubscribe = onSnapshot(q, (snapshot) => {
        commentsList.innerHTML = '';
        
        if (snapshot.empty) {
            commentsCount.textContent = '0 comments';
            return;
        }
        
        commentsCount.textContent = `${snapshot.size} comment${snapshot.size !== 1 ? 's' : ''}`;
        
        const comments = {};
        const rootComments = [];
        
        snapshot.forEach((doc) => {
            const commentData = doc.data();
            commentData.id = doc.id;
            
            if (commentData.parentId) {
                if (!comments[commentData.parentId]) {
                    comments[commentData.parentId] = [];
                }
                comments[commentData.parentId].push(commentData);
            } else {
                rootComments.push(commentData);
            }
        });
        
        rootComments.forEach(comment => {
            const commentElement = createCommentElement(comment, comments[comment.id] || []);
            commentsList.appendChild(commentElement);
        });
    }, (error) => {
        console.error("Error loading comments:", error);
        commentsList.innerHTML = '<div style="text-align: center; padding: 10px;">Error loading comments</div>';
    });
}

function createCommentElement(commentData, replies = []) {
    const comment = document.createElement('div');
    comment.className = 'comment';
    comment.dataset.commentId = commentData.id;
    
    const avatar = document.createElement('img');
    avatar.className = 'comment-avatar';
    avatar.src = commentData.userPhotoURL || 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png';
    avatar.onerror = function() {
        this.src = 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png';
    };
    avatar.addEventListener('click', (e) => {
        e.stopPropagation();
        viewProfile(commentData.userId);
    });
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'comment-content';
    
    const author = document.createElement('div');
    author.className = 'comment-author';
    author.textContent = commentData.userName || 'Anonymous';
    author.style.cursor = 'pointer';
    author.addEventListener('click', (e) => {
        e.stopPropagation();
        viewProfile(commentData.userId);
    });
    
    if (commentData.country) {
        const flag = document.createElement('img');
        flag.className = 'comment-flag';
        flag.src = `https://flagcdn.com/w20/${commentData.country}.png`;
        flag.alt = commentData.country;
        flag.onerror = function() {
            this.style.display = 'none';
        };
        author.appendChild(flag);
    }
    
    if (currentPostData && commentData.userId === currentPostData.userId) {
        const creatorBadge = document.createElement('span');
        creatorBadge.textContent = ' (Creator)';
        creatorBadge.style.color = '#0095f6';
        creatorBadge.style.fontSize = '12px';
        creatorBadge.style.marginLeft = '4px';
        author.appendChild(creatorBadge);
    }
    
    contentDiv.appendChild(author);
    
    if (commentData.text && commentData.text.trim() !== '') {
        const text = document.createElement('div');
        text.className = 'comment-text';
        text.textContent = commentData.text;
        contentDiv.appendChild(text);
    }
    
    if (commentData.gifUrl) {
        const gif = document.createElement('img');
        gif.className = 'comment-gif';
        gif.src = commentData.gifUrl;
        gif.loading = 'lazy';
        contentDiv.appendChild(gif);
    }
    
    const actions = document.createElement('div');
    actions.className = 'comment-actions';
    
    const likeButton = document.createElement('button');
    likeButton.className = 'like-button';
    if (commentData.likes && commentData.likes.includes(currentUser?.uid)) {
        likeButton.classList.add('liked');
    }

    likeButton.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>
        Like
    `;

    const likeCount = document.createElement('span');
    likeCount.className = 'like-count';
    likeCount.textContent = commentData.likes ? commentData.likes.length : 0;

    likeButton.addEventListener('click', async (e) => {
        e.stopPropagation();
        
        const commentRef = doc(db, 'recence', currentPostId, 'comments', commentData.id);
        
        try {
            const isLiked = likeButton.classList.contains('liked');
            
            if (isLiked) {
                await updateDoc(commentRef, {
                    likes: arrayRemove(currentUser.uid)
                });
                likeButton.classList.remove('liked');
            } else {
                await updateDoc(commentRef, {
                    likes: arrayUnion(currentUser.uid)
                });
                likeButton.classList.add('liked');
            }
        } catch (error) {
            console.error('Error updating like:', error);
        }
    });

    const replyButton = document.createElement('button');
    replyButton.className = 'reply-btn';
    replyButton.textContent = 'Reply';

    replyButton.addEventListener('click', (e) => {
        e.stopPropagation();
        currentReplyTo = {
            id: commentData.id,
            name: commentData.userName
        };
        replyPreviewText.textContent = `Replying to ${commentData.userName}`;
        replyPreview.style.display = 'flex';
        commentInput.focus();
    });

    const timestamp = document.createElement('span');
    timestamp.className = 'comment-time';

    if (commentData.timestamp && commentData.timestamp.toDate) {
        const date = commentData.timestamp.toDate();
        timestamp.textContent = formatTimestamp(date);
    } else {
        timestamp.textContent = 'Just now';
    }

    actions.appendChild(likeButton);
    actions.appendChild(likeCount);
    actions.appendChild(replyButton);
    actions.appendChild(timestamp);

    contentDiv.appendChild(actions);

    if (replies.length > 0) {
        const repliesContainer = document.createElement('div');
        repliesContainer.className = 'replies-container';
        
        const viewRepliesBtn = document.createElement('button');
        viewRepliesBtn.className = 'view-replies-btn';
        viewRepliesBtn.textContent = `View ${replies.length} repl${replies.length === 1 ? 'y' : 'ies'}`;
        
        const repliesList = document.createElement('div');
        repliesList.style.display = 'none';
        
        replies.forEach(reply => {
            const replyElement = createCommentElement(reply);
            repliesList.appendChild(replyElement);
        });
        
        viewRepliesBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (repliesList.style.display === 'none') {
                repliesList.style.display = 'block';
                viewRepliesBtn.textContent = 'Hide replies';
            } else {
                repliesList.style.display = 'none';
                viewRepliesBtn.textContent = `View ${replies.length} repl${replies.length === 1 ? 'y' : 'ies'}`;
            }
        });
        
        repliesContainer.appendChild(viewRepliesBtn);
        repliesContainer.appendChild(repliesList);
        contentDiv.appendChild(repliesContainer);
    }

    comment.appendChild(avatar);
    comment.appendChild(contentDiv);

    return comment;
}

function formatTimestamp(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffSec < 60) {
        return 'Just now';
    } else if (diffMin < 60) {
        return `${diffMin}m ago`;
    } else if (diffHour < 24) {
        return `${diffHour}h ago`;
    } else if (diffDay < 7) {
        return `${diffDay}d ago`;
    } else {
        return date.toLocaleDateString();
    }
}

async function addComment() {
    if (!currentUser || !currentPostId) return;
    
    const text = commentInput.value.trim();
    if (text === '' && !selectedGif) return;
    
    submitComment.disabled = true;
    
    try {
        const commentData = {
            userId: currentUser.uid,
            userName: currentUser.displayName || 'User',
            userPhotoURL: currentUser.photoURL,
            text: text,
            timestamp: serverTimestamp(),
            likes: [],
            country: currentUser.country
        };
        
        if (currentReplyTo) {
            commentData.parentId = currentReplyTo.id;
            commentData.parentUserName = currentReplyTo.name;
        }
        
        if (selectedGif) {
            commentData.gifUrl = selectedGif;
        }
        
        const commentsRef = collection(db, 'recence', currentPostId, 'comments');
        await addDoc(commentsRef, commentData);
        
        commentInput.value = '';
        selectedGif = null;
        currentReplyTo = null;
        replyPreview.style.display = 'none';
        
        const previewGif = document.querySelector('.gif-preview');
        if (previewGif) {
            previewGif.remove();
        }
        
        submitComment.disabled = true;
        
        const postRef = doc(db, 'recence', currentPostId);
        const postDoc = await getDoc(postRef);
        
        if (postDoc.exists()) {
            const postData = postDoc.data();
            const currentCount = postData.commentCount || 0;
            
            await updateDoc(postRef, {
                commentCount: currentCount + 1
            });
        }
    } catch (error) {
        console.error('Error adding comment:', error);
        alert('Failed to add comment. Please try again.');
    } finally {
        submitComment.disabled = commentInput.value.trim() === '' && !selectedGif;
    }
}

// Initialize the app
init();