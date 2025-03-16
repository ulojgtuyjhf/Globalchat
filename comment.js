(function() {
    // Core variables
    let activeMedia = null;
    let mediaOverlay = null;
    let mediaContainer = null;
    let progressBar = null;
    let progressInterval = null;
    let isAnimating = false;

    // Initialize when DOM is fully loaded
    document.addEventListener('DOMContentLoaded', initializeMediaViewer);

    function initializeMediaViewer() {
        createMediaOverlayElements();
        enhanceExistingMedia();
        observeNewMediaAdditions();
    }

    function createMediaOverlayElements() {
        // Main overlay that covers the screen
        mediaOverlay = document.createElement('div');
        mediaOverlay.className = 'gc-media-fullscreen-overlay';
        mediaOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.95);
            z-index: 10000;
            display: none;
            opacity: 0;
            transition: opacity 0.3s ease;
            cursor: grab;
            user-select: none;
        `;

        // Container for the media content
        mediaContainer = document.createElement('div');
        mediaContainer.className = 'gc-media-container';
        mediaContainer.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: auto;
            height: auto;
            max-width: 95%;
            max-height: 90%;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        mediaOverlay.appendChild(mediaContainer);

        // Progress bar for videos
        const progressContainer = document.createElement('div');
        progressContainer.className = 'gc-video-progress-container';
        progressContainer.style.cssText = `
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 4px;
            background-color: rgba(255, 255, 255, 0.2);
            z-index: 10001;
            display: none;
        `;
        
        progressBar = document.createElement('div');
        progressBar.className = 'gc-video-progress-bar';
        progressBar.style.cssText = `
            height: 100%;
            width: 0%;
            background-color: #1da1f2;
            transition: width 0.1s linear;
        `;
        
        progressContainer.appendChild(progressBar);
        mediaOverlay.appendChild(progressContainer);

        // Add overlay to document body
        document.body.appendChild(mediaOverlay);
        
        // Set up drag gestures
        setupDragDismiss(mediaOverlay);
    }

    function enhanceExistingMedia() {
        // Enhance all existing videos
        document.querySelectorAll('.message-video').forEach(setupVideo);
        
        // Create observer for autoplay when in viewport
        const viewportObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.target.tagName === 'VIDEO') {
                    handleVideoVisibility(entry.target, entry.isIntersecting);
                }
            });
        }, { threshold: 0.5 });
        
        // Observe all video elements
        document.querySelectorAll('.message-video').forEach(media => {
            viewportObserver.observe(media);
        });
    }

    function observeNewMediaAdditions() {
        // Watch for new content being added to the chat
        const domObserver = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) { // Element node
                        // Find and enhance new videos
                        node.querySelectorAll('.message-video').forEach(setupVideo);
                    }
                });
            });
        });
        
        // Start watching the chat container
        const chatContainer = document.getElementById('chatContainer');
        if (chatContainer) {
            domObserver.observe(chatContainer, {
                childList: true,
                subtree: true
            });
        }
    }

    function setupVideo(video) {
        // Style the video for the chat view
        video.style.cssText = `
            max-width: 100%;
            max-height: 400px;
            border-radius: 16px;
            object-fit: cover;
            background-color: #000;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            aspect-ratio: 16/9; 
            transition: transform 0.2s ease;
        `;
        
        // Remove controls, mute for autoplay, and enable loop
        video.removeAttribute('controls');
        video.muted = true;
        video.loop = true;
        video.playsInline = true; // Important for iOS
        
        // Add hover effect
        video.addEventListener('mouseenter', () => {
            video.style.transform = 'scale(1.02)';
        });
        
        video.addEventListener('mouseleave', () => {
            video.style.transform = 'scale(1)';
        });
        
        // Add click handler for fullscreen
        video.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openMediaFullscreen(video);
        });
        
        // Try to start playback
        video.play().catch(() => {});
    }

    function handleVideoVisibility(video, isVisible) {
        if (isVisible) {
            if (video.paused && !mediaOverlay.contains(video)) {
                video.play().catch(() => {});
            }
        } else {
            video.pause();
        }
    }

    function openMediaFullscreen(mediaElement) {
        if (isAnimating) return;
        isAnimating = true;
        
        // Clear any existing content
        mediaContainer.innerHTML = '';
        
        // Get original position and size for animation
        const rect = mediaElement.getBoundingClientRect();
        const isVideo = mediaElement.tagName === 'VIDEO';
        
        // Clone the media element
        activeMedia = mediaElement.cloneNode(true);
        
        // Set initial position and size to match original
        activeMedia.style.cssText = `
            position: absolute;
            width: ${rect.width}px;
            height: ${rect.height}px;
            border-radius: 16px;
            object-fit: contain;
            transform-origin: center;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
            transition: all 0.3s cubic-bezier(0.2, 0, 0.2, 1);
        `;
        
        // Add to container
        mediaContainer.appendChild(activeMedia);
        
        // Show overlay but transparent
        mediaOverlay.style.display = 'flex';
        mediaOverlay.style.opacity = '0';
        
        // Force reflow
        void mediaOverlay.offsetWidth;
        
        // Fade in the overlay
        mediaOverlay.style.opacity = '1';
        
        // If it's a video, handle specific video behaviors
        if (isVideo) {
            // Show progress bar
            const progressContainer = mediaOverlay.querySelector('.gc-video-progress-container');
            progressContainer.style.display = 'block';
            
            // Set up progress tracking
            setupVideoProgress(activeMedia);
            
            // Enable sound
            activeMedia.muted = false;
            
            // Add play/pause toggle
            activeMedia.addEventListener('click', (e) => {
                e.stopPropagation();
                if (activeMedia.paused) {
                    activeMedia.play();
                } else {
                    activeMedia.pause();
                }
            });
            
            // Start playback
            activeMedia.play().catch(error => {
                console.log('Playback error:', error);
            });
        }
        
        // Animate to full size after a short delay
        setTimeout(() => {
            activeMedia.style.width = 'auto';
            activeMedia.style.height = 'auto';
            activeMedia.style.maxWidth = '95vw';
            activeMedia.style.maxHeight = '90vh';
            activeMedia.style.left = '50%';
            activeMedia.style.top = '50%';
            activeMedia.style.transform = 'translate(-50%, -50%)';
            
            // Release animation lock after transition completes
            setTimeout(() => {
                isAnimating = false;
            }, 300);
        }, 50);
    }

    function setupVideoProgress(videoElement) {
        // Clear any existing interval
        clearInterval(progressInterval);
        
        // Update progress bar every 100ms
        progressInterval = setInterval(() => {
            if (!videoElement || videoElement.paused) return;
            
            const progress = (videoElement.currentTime / videoElement.duration) * 100;
            progressBar.style.width = `${progress}%`;
        }, 100);
    }

    function closeMediaFullscreen(withAnimation = true) {
        if (isAnimating || !activeMedia) return;
        isAnimating = true;
        
        // Clear progress tracking
        clearInterval(progressInterval);
        
        if (withAnimation) {
            // Fade out overlay
            mediaOverlay.style.opacity = '0';
            
            // Wait for animation to complete
            setTimeout(() => {
                mediaOverlay.style.display = 'none';
                mediaContainer.innerHTML = '';
                activeMedia = null;
                isAnimating = false;
            }, 300);
        } else {
            // Instant close
            mediaOverlay.style.display = 'none';
            mediaContainer.innerHTML = '';
            activeMedia = null;
            isAnimating = false;
        }
    }

    function setupDragDismiss(overlayElement) {
        let startY = 0;
        let startX = 0;
        let currentY = 0;
        let currentX = 0;
        let isDragging = false;
        
        // Touch events
        overlayElement.addEventListener('touchstart', startDrag);
        overlayElement.addEventListener('touchmove', moveDrag);
        overlayElement.addEventListener('touchend', endDrag);
        
        // Mouse events
        overlayElement.addEventListener('mousedown', startDrag);
        overlayElement.addEventListener('mousemove', moveDrag);
        overlayElement.addEventListener('mouseup', endDrag);
        overlayElement.addEventListener('mouseleave', endDrag);
        
        function startDrag(e) {
            if (!activeMedia || isAnimating) return;
            
            isDragging = true;
            overlayElement.style.cursor = 'grabbing';
            
            // Get starting position
            if (e.type.includes('mouse')) {
                startY = e.clientY;
                startX = e.clientX;
            } else {
                startY = e.touches[0].clientY;
                startX = e.touches[0].clientX;
            }
            
            currentY = 0;
            currentX = 0;
            
            if (activeMedia.tagName === 'VIDEO' && !activeMedia.paused) {
                activeMedia.pause();
            }
            
            // Disable transitions during drag
            activeMedia.style.transition = 'none';
            
            e.preventDefault();
        }
        
        function moveDrag(e) {
            if (!isDragging || !activeMedia) return;
            
            // Calculate movement
            if (e.type.includes('mouse')) {
                currentY = e.clientY - startY;
                currentX = e.clientX - startX;
            } else {
                currentY = e.touches[0].clientY - startY;
                currentX = e.touches[0].clientX - startX;
            }
            
            // Move the media with finger/mouse
            activeMedia.style.transform = `translate(calc(-50% + ${currentX}px), calc(-50% + ${currentY}px))`;
            
            // Adjust overlay opacity based on distance
            const distance = Math.sqrt(currentY * currentY + currentX * currentX);
            const opacity = Math.max(0, 1 - distance / 300);
            overlayElement.style.opacity = opacity.toString();
            
            e.preventDefault();
        }
        
        function endDrag(e) {
            if (!isDragging) return;
            isDragging = false;
            overlayElement.style.cursor = 'grab';
            
            // Enable transitions again
            if (activeMedia) {
                activeMedia.style.transition = 'all 0.3s cubic-bezier(0.2, 0, 0.2, 1)';
            }
            
            // Calculate total movement
            const distance = Math.sqrt(currentY * currentY + currentX * currentX);
            
            // If moved far enough, dismiss
            if (distance > 150) {
                // Continue movement in the direction of drag for dismissal animation
                const angle = Math.atan2(currentY, currentX);
                const exitDistance = Math.max(window.innerWidth, window.innerHeight) * 1.5;
                const exitX = Math.cos(angle) * exitDistance;
                const exitY = Math.sin(angle) * exitDistance;
                
                if (activeMedia) {
                    activeMedia.style.transform = `translate(calc(-50% + ${exitX}px), calc(-50% + ${exitY}px)) scale(0.5)`;
                }
                
                overlayElement.style.opacity = '0';
                
                setTimeout(() => {
                    closeMediaFullscreen(false);
                }, 300);
            } else {
                // Snap back
                if (activeMedia) {
                    activeMedia.style.transform = 'translate(-50%, -50%)';
                }
                overlayElement.style.opacity = '1';
                
                // Resume video playback
                if (activeMedia && activeMedia.tagName === 'VIDEO') {
                    activeMedia.play().catch(() => {});
                }
            }
            
            e.preventDefault();
        }
    }
    
    // Close button
    const closeButton = document.createElement('div');
    closeButton.className = 'gc-media-close-btn';
    closeButton.innerHTML = '×';
    closeButton.style.cssText = `
        position: absolute;
        top: 20px;
        right: 20px;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background-color: rgba(0, 0, 0, 0.5);
        color: white;
        font-size: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 10002;
        line-height: 1;
    `;
    closeButton.addEventListener('click', (e) => {
        e.stopPropagation();
        closeMediaFullscreen();
    });
    mediaOverlay.appendChild(closeButton);
})();