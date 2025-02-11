// Create and append styles
const styleSheet = document.createElement('style');
styleSheet.textContent = `
.media-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.95);
    z-index: 9999;
    opacity: 0;
    pointer-events: none;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.media-modal.active {
    opacity: 1;
    pointer-events: all;
}

.media-container {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.media-content {
    position: absolute;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: grab;
}

.media-content.dragging {
    cursor: grabbing;
    transition: none;
}

.media-content img,
.media-content video {
    width: 100%;
    height: 100%;
    object-fit: contain;
    border-radius: 8px;
}

.video-controls {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
    padding: 20px;
    display: flex;
    align-items: center;
    gap: 15px;
    opacity: 0;
    transition: opacity 0.2s ease;
}

.media-content:hover .video-controls {
    opacity: 1;
}

.video-progress {
    flex-grow: 1;
    height: 4px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 2px;
    cursor: pointer;
    position: relative;
}

.video-progress-bar {
    height: 100%;
    background: #ffffff;
    border-radius: 2px;
    position: absolute;
    top: 0;
    left: 0;
    transition: width 0.1s linear;
}

.video-button {
    background: none;
    border: none;
    color: white;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: transform 0.2s ease;
}

.video-button:hover {
    transform: scale(1.1);
}

.video-button svg {
    width: 24px;
    height: 24px;
}

.video-time {
    color: white;
    font-size: 14px;
    font-family: monospace;
}

.media-reactions {
    position: absolute;
    bottom: 20px;
    left: 0;
    width: 100%;
    display: flex;
    justify-content: center;
    gap: 10px;
    padding: 10px;
    transform: translateY(100px);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.media-modal.active .media-reactions {
    transform: translateY(0);
}

.reaction-item {
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(8px);
    padding: 8px 16px;
    border-radius: 20px;
    color: white;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 6px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    animation: fadeInUp 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    opacity: 0;
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.reaction-icon {
    width: 18px;
    height: 18px;
    fill: currentColor;
}

.reaction-count {
    color: rgba(255, 255, 255, 0.9);
}

@media (max-width: 768px) {
    .media-reactions {
        overflow-x: auto;
        justify-content: flex-start;
        padding: 10px 20px;
        -webkit-overflow-scrolling: touch;
        scroll-snap-type: x mandatory;
    }
    
    .reaction-item {
        scroll-snap-align: start;
        flex-shrink: 0;
    }
}
`;
document.head.appendChild(styleSheet);

// Create modal HTML
const modal = document.createElement('div');
modal.className = 'media-modal';
modal.innerHTML = `
    <div class="media-container">
        <div class="media-content">
            <div class="video-controls">
                <button class="video-button play-pause">
                    <svg viewBox="0 0 24 24"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>
                </button>
                <div class="video-progress">
                    <div class="video-progress-bar"></div>
                </div>
                <span class="video-time">0:00 / 0:00</span>
                <button class="video-button volume">
                    <svg viewBox="0 0 24 24"><path fill="currentColor" d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
                </button>
            </div>
        </div>
        <div class="media-reactions"></div>
    </div>
`;
document.body.appendChild(modal);

// Variables for handling interactions
let startY = 0;
let currentY = 0;
let startX = 0;
let currentX = 0;
let isDragging = false;
let originalRect = null;
let sourceElement = null;
let currentVideo = null;

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    seconds = Math.floor(seconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function setupVideoControls(video) {
    const controls = modal.querySelector('.video-controls');
    const playPauseBtn = controls.querySelector('.play-pause');
    const progressBar = controls.querySelector('.video-progress-bar');
    const progress = controls.querySelector('.video-progress');
    const timeDisplay = controls.querySelector('.video-time');
    const volumeBtn = controls.querySelector('.volume');

    // Update play/pause button
    function updatePlayButton() {
        playPauseBtn.innerHTML = video.paused ? 
            '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>' :
            '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>';
    }

    // Play/Pause toggle
    playPauseBtn.addEventListener('click', () => {
        if (video.paused) video.play();
        else video.pause();
    });

    // Progress bar updates
    video.addEventListener('timeupdate', () => {
        const progress = (video.currentTime / video.duration) * 100;
        progressBar.style.width = `${progress}%`;
        timeDisplay.textContent = `${formatTime(video.currentTime)} / ${formatTime(video.duration)}`;
    });

    // Click to seek
    progress.addEventListener('click', (e) => {
        const rect = progress.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        video.currentTime = pos * video.duration;
    });

    // Volume toggle
    volumeBtn.addEventListener('click', () => {
        video.muted = !video.muted;
        volumeBtn.innerHTML = video.muted ?
            '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>' :
            '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>';
    });

    // Event listeners for play/pause updates
    video.addEventListener('play', updatePlayButton);
    video.addEventListener('pause', updatePlayButton);
}

function showMedia(element, info) {
    sourceElement = element;
    originalRect = element.getBoundingClientRect();
    const modalContent = modal.querySelector('.media-content');
    
    // Clone media and hide original
    const clone = element.cloneNode(true);
    sourceElement.style.visibility = 'hidden';
    
    if (clone.tagName === 'VIDEO') {
        clone.controls = false;
        clone.muted = false;
        clone.playsInline = true;
        clone.autoplay = true;
        
        modalContent.innerHTML = `
            <div class="video-controls">
                <button class="video-button play-pause">
                    <svg viewBox="0 0 24 24"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>
                </button>
                <div class="video-progress">
                    <div class="video-progress-bar"></div>
                </div>
                <span class="video-time">0:00 / 0:00</span>
                <button class="video-button volume">
                    <svg viewBox="0 0 24 24"><path fill="currentColor" d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
                </button>
            </div>
        `;
        modalContent.appendChild(clone);
        currentVideo = clone;
        setupVideoControls(clone);
        
        // Handle video visibility
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    clone.play();
                } else {
                    clone.pause();
                }
            });
        }, { threshold: 0.8 });
        
        observer.observe(clone);
    } else {
        modalContent.innerHTML = '';
        modalContent.appendChild(clone);
    }

    // Set initial position
    modalContent.style.width = `${originalRect.width}px`;
    modalContent.style.height = `${originalRect.height}px`;
    modalContent.style.transform = `translate(${originalRect.left}px, ${originalRect.top}px)`;

    // Show modal
    modal.classList.add('active');

    // Animate to center
    requestAnimationFrame(() => {
        const targetWidth = Math.min(window.innerWidth * 0.9, 1200);
        const targetHeight = window.innerHeight * 0.8;
        modalContent.style.width = `${targetWidth}px`;
        modalContent.style.height = `${targetHeight}px`;
        modalContent.style.transform = 'translate(0, 0)';
    });

    // Update reactions with SVG icons instead of emojis
    const mediaReactions = modal.querySelector('.media-reactions');
    mediaReactions.innerHTML = info.reactions.map((reaction, index) => `
        <div class="reaction-item" style="animation-delay: ${index * 0.1}s">
            <svg class="reaction-icon" viewBox="0 0 24 24">${reaction.icon}</svg>
            <span class="reaction-count">${reaction.count}</span>
        </div>
    `).join('');
}

// Touch and mouse event handlers
function handleStart(e) {
    const touch = e.touches ? e.touches[0] : e;
    startY = touch.clientY;
    startX = touch.clientX;
    isDragging = true;
    modal.querySelector('.media-content').classList.add('dragging');
}

function handleMove(e) {
    if (!isDragging) return;
    
    const touch = e.touches ? e.touches[0] : e;
    currentY = touch.clientY;
    currentX = touch.clientX;
    
    const deltaY = currentY - startY;
    const deltaX = currentX - startX;
    const rotation = deltaX * 0.1;
    
    const content = modal.querySelector('.media-content');
    const scale = Math.max(0.5, 1 - (Math.abs(deltaY) / window.innerHeight) * 0.5);
    const opacity = 1 - (Math.abs(deltaY) / window.innerHeight);
    
    modal.style.background = `rgba(0, 0, 0, ${opacity * 0.95})`;
    content.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(${scale}) rotate(${rotation}deg)`;
}

function handleEnd() {
    if (!isDragging) return;
    
    const deltaY = currentY - startY;
    const content = modal.querySelector('.media-content');
    content.classList.remove('dragging');
    content.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    
    if (Math.abs(deltaY) > window.innerHeight / 4) {
        closeModal();
    } else {
        // Spring back animation
        modal.style.background = '';
        content.style.transform = '';
    }
    isDragging = false;
}

function closeModal() {
    const content = modal.querySelector('.media-content');
    
    // Animate back to original position
    content.style.transform = `
        translate(${originalRect.left}px, ${originalRect.top}px) 
        scale(${originalRect.width / content.offsetWidth})
    `;
    modal.style.background = 'rgba(0, 0, 0, 0)';
    
    setTimeout(() => {
        modal.classList.remove('active');
        content.innerHTML = '';
        if (sourceElement) {
            sourceElement.style.visibility = 'visible';
            sourceElement = null;
        }
        if (currentVideo) {
            currentVideo.pause();
            currentVideo = null;
        }
        document.body.style.overflow = '';
    }, 300);
}

// Event listeners
modal.addEventListener('mousedown', handleStart);
modal.addEventListener('touchstart', handleStart);
modal.addEventListener('mousemove', handleMove);
modal.addEventListener('touchmove', handleMove);
modal.addEventListener('mouseup', handleEnd);
modal.addEventListener('touchend', handleEnd);
modal.addEventListener('mouseleave', handleEnd);

// Handle media clicks
document.addEventListener('click', (e) => {
    const mediaElement = e.target.closest('.post-media');
    if (!mediaElement) return;

    const post = mediaElement.closest('.message');
    if (!post) return;

    // Use SVG icons instead of emojis for reactions
    const reactions = Array.from(post.querySelectorAll('.reaction')).map(reaction => ({
        icon: reaction.querySelector('svg')?.innerHTML || '<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>',
        count: reaction.querySelector('.reaction-count').textContent
    }));

    showMedia(mediaElement, { reactions });
});

// Close on escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeModal();
    }
});