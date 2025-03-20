
// Enhanced Media Viewer for Global Chat - Professional Edition v2.0
(function() {
    // Core variables
    let activeMedia = null;
    let mediaOverlay = null;
    let mediaContainer = null;
    let progressBar = null;
    let progressTrack = null;
    let progressInterval = null;
    let isAnimating = false;
    let isDragging = false;
    let zoomedIn = false;
    let isSeeking = false;
    let lastProcessedMedia = new WeakMap(); // Track already processed media
    
    // Watermark config
    const watermarkConfig = {
        text: "Nmedea",
        opacity: 0.7,
        fontSize: "16px",
        color: "#1da1f2"
    };

    // Initialize when DOM is fully loaded
    document.addEventListener('DOMContentLoaded', initializeMediaViewer);

    function initializeMediaViewer() {
        createMediaOverlayElements();
        enhanceExistingMedia();
        observeNewMediaAdditions();
        addKeyboardSupport();
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
            box-sizing: border-box;
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
            box-sizing: border-box;
        `;
        mediaOverlay.appendChild(mediaContainer);

        // Create controls container
        const controlsContainer = document.createElement('div');
        controlsContainer.className = 'gc-media-controls';
        controlsContainer.style.cssText = `
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            padding: 16px;
            background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%);
            z-index: 10001;
            display: flex;
            flex-direction: column;
            opacity: 1;
            transition: opacity 0.3s ease;
            box-sizing: border-box;
        `;

        // Progress bar container
        progressTrack = document.createElement('div');
        progressTrack.className = 'gc-video-progress-track';
        progressTrack.style.cssText = `
            position: relative;
            width: 100%;
            height: 8px;
            background-color: rgba(255, 255, 255, 0.2);
            border-radius: 4px;
            cursor: pointer;
            margin-bottom: 12px;
            box-sizing: border-box;
        `;
        
        progressBar = document.createElement('div');
        progressBar.className = 'gc-video-progress-bar';
        progressBar.style.cssText = `
            height: 100%;
            width: 0%;
            background-color: #1da1f2;
            border-radius: 4px;
            box-sizing: border-box;
        `;
        
        const progressHandle = document.createElement('div');
        progressHandle.className = 'gc-video-progress-handle';
        progressHandle.style.cssText = `
            position: absolute;
            top: 50%;
            left: 0%;
            width: 16px;
            height: 16px;
            background-color: #ffffff;
            border-radius: 50%;
            transform: translate(-50%, -50%);
            box-shadow: 0 0 6px rgba(0, 0, 0, 0.4);
            opacity: 0;
            transition: opacity 0.2s ease;
            box-sizing: border-box;
        `;
        
        // Make progress track interactive
        progressTrack.appendChild(progressBar);
        progressTrack.appendChild(progressHandle);
        controlsContainer.appendChild(progressTrack);

        // Set up progress track interaction
        setupProgressInteraction(progressTrack, progressHandle);
        
        // Controls row
        const controlsRow = document.createElement('div');
        controlsRow.className = 'gc-controls-row';
        controlsRow.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
            box-sizing: border-box;
        `;
        
        // Left controls
        const leftControls = document.createElement('div');
        leftControls.className = 'gc-left-controls';
        leftControls.style.cssText = `
            display: flex;
            align-items: center;
            gap: 16px;
            box-sizing: border-box;
        `;
        
        // Play/pause button
        const playPauseBtn = document.createElement('button');
        playPauseBtn.className = 'gc-play-pause-btn';
        playPauseBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M8 5V19L19 12L8 5Z" fill="white"/></svg>';
        playPauseBtn.style.cssText = `
            background: none;
            border: none;
            color: white;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            border-radius: 50%;
            transition: background-color 0.2s;
            background-color: rgba(255, 255, 255, 0.1);
            box-sizing: border-box;
        `;
        playPauseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            togglePlayPause();
        });

        // Volume control
        const volumeBtn = document.createElement('button');
        volumeBtn.className = 'gc-volume-btn';
        volumeBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M3 10V14H7L12 19V5L7 10H3Z" fill="white"/><path d="M16.5 12C16.5 10.23 15.48 8.71 14 7.97V16.02C15.48 15.29 16.5 13.77 16.5 12Z" fill="white"/><path d="M14 3.23V5.29C16.89 6.15 19 8.83 19 12C19 15.17 16.89 17.85 14 18.71V20.77C18.01 19.86 21 16.28 21 12C21 7.72 18.01 4.14 14 3.23Z" fill="white"/></svg>';
        volumeBtn.style.cssText = `
            background: none;
            border: none;
            color: white;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            border-radius: 50%;
            transition: background-color 0.2s;
            background-color: rgba(255, 255, 255, 0.1);
            box-sizing: border-box;
        `;
        volumeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (activeMedia && activeMedia.tagName === 'VIDEO') {
                activeMedia.muted = !activeMedia.muted;
                updateVolumeIcon(volumeBtn, activeMedia.muted);
            }
        });
        
        // Time display
        const timeDisplay = document.createElement('div');
        timeDisplay.className = 'gc-time-display';
        timeDisplay.textContent = '0:00 / 0:00';
        timeDisplay.style.cssText = `
            color: white;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            font-size: 14px;
            margin-left: 8px;
            box-sizing: border-box;
        `;
        
        // Right controls
        const rightControls = document.createElement('div');
        rightControls.className = 'gc-right-controls';
        rightControls.style.cssText = `
            display: flex;
            align-items: center;
            gap: 16px;
            box-sizing: border-box;
        `;
        
        // Download button
        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'gc-download-btn';
        downloadBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" fill="white"/></svg>';
        downloadBtn.style.cssText = `
            background: none;
            border: none;
            color: white;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            border-radius: 50%;
            transition: background-color 0.2s;
            background-color: rgba(255, 255, 255, 0.1);
            box-sizing: border-box;
        `;
        downloadBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            downloadMedia();
        });
        
        // Fullscreen button
        const fullscreenBtn = document.createElement('button');
        fullscreenBtn.className = 'gc-fullscreen-btn';
        fullscreenBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" fill="white"/></svg>';
        fullscreenBtn.style.cssText = `
            background: none;
            border: none;
            color: white;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            border-radius: 50%;
            transition: background-color 0.2s;
            background-color: rgba(255, 255, 255, 0.1);
            box-sizing: border-box;
        `;
        fullscreenBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFullscreen();
        });
        
        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'gc-close-btn';
        closeBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" fill="white"/></svg>';
        closeBtn.style.cssText = `
            background: none;
            border: none;
            color: white;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            border-radius: 50%;
            transition: background-color 0.2s;
            background-color: rgba(255, 255, 255, 0.1);
            box-sizing: border-box;
        `;
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeMediaFullscreen();
        });

        // Assemble controls
        leftControls.appendChild(playPauseBtn);
        leftControls.appendChild(volumeBtn);
        leftControls.appendChild(timeDisplay);
        
        rightControls.appendChild(downloadBtn);
        rightControls.appendChild(fullscreenBtn);
        rightControls.appendChild(closeBtn);
        
        controlsRow.appendChild(leftControls);
        controlsRow.appendChild(rightControls);
        controlsContainer.appendChild(controlsRow);
        
        // Add watermark logo
        const watermarkLogo = document.createElement('div');
        watermarkLogo.className = 'gc-watermark-logo';
        watermarkLogo.textContent = watermarkConfig.text;
        watermarkLogo.style.cssText = `
            position: absolute;
            top: 16px;
            left: 16px;
            color: white;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            font-size: ${watermarkConfig.fontSize};
            font-weight: bold;
            opacity: ${watermarkConfig.opacity};
            pointer-events: none;
            text-shadow: 0 1px 2px rgba(0,0,0,0.5);
            box-sizing: border-box;
        `;
        
        // Add elements to overlay
        mediaOverlay.appendChild(controlsContainer);
        mediaOverlay.appendChild(watermarkLogo);
        
        // Add overlay to document body
        document.body.appendChild(mediaOverlay);
        
        // Set up drag gestures
        setupDragDismiss(mediaOverlay);
        
        // Set up click handling on overlay
        mediaOverlay.addEventListener('click', (e) => {
            if (e.target === mediaOverlay) {
                closeMediaFullscreen();
            }
        });
        
        // Set up double-tap zooming
        setupDoubleTapZoom(mediaOverlay);
        
        // Show/hide controls on hover
        mediaOverlay.addEventListener('mousemove', () => {
            showControls();
            startControlsTimer();
        });
    }

    function setupProgressInteraction(track, handle) {
        track.addEventListener('mouseenter', () => {
            handle.style.opacity = '1';
        });
        
        track.addEventListener('mouseleave', () => {
            if (!isSeeking) {
                handle.style.opacity = '0';
            }
        });
        
        track.addEventListener('mousedown', (e) => {
            e.preventDefault();
            isSeeking = true;
            handle.style.opacity = '1';
            
            const rect = track.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            updateSeekPosition(pos);
            
            // Add document-level event listeners for dragging
            document.addEventListener('mousemove', handleSeekDrag);
            document.addEventListener('mouseup', endSeekDrag);
        });
        
        // Touch support for seeking
        track.addEventListener('touchstart', (e) => {
            e.preventDefault();
            isSeeking = true;
            handle.style.opacity = '1';
            
            const rect = track.getBoundingClientRect();
            const touch = e.touches[0];
            const pos = (touch.clientX - rect.left) / rect.width;
            updateSeekPosition(pos);
            
            // Add document-level event listeners for dragging
            document.addEventListener('touchmove', handleTouchSeekDrag);
            document.addEventListener('touchend', endTouchSeekDrag);
        });
        
        function handleSeekDrag(e) {
            if (isSeeking) {
                const rect = track.getBoundingClientRect();
                const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                updateSeekPosition(pos);
            }
        }
        
        function handleTouchSeekDrag(e) {
            if (isSeeking) {
                const rect = track.getBoundingClientRect();
                const touch = e.touches[0];
                const pos = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
                updateSeekPosition(pos);
            }
        }
        
        function endSeekDrag() {
            if (isSeeking) {
                isSeeking = false;
                handle.style.opacity = '0';
                
                // Remove document-level event listeners
                document.removeEventListener('mousemove', handleSeekDrag);
                document.removeEventListener('mouseup', endSeekDrag);
            }
        }
        
        function endTouchSeekDrag() {
            if (isSeeking) {
                isSeeking = false;
                handle.style.opacity = '0';
                
                // Remove document-level event listeners
                document.removeEventListener('touchmove', handleTouchSeekDrag);
                document.removeEventListener('touchend', endTouchSeekDrag);
            }
        }
    }
    
    function updateSeekPosition(position) {
        if (!activeMedia || activeMedia.tagName !== 'VIDEO') return;
        
        // Clamp position between 0 and 1
        position = Math.max(0, Math.min(1, position));
        
        // Update UI
        progressBar.style.width = `${position * 100}%`;
        
        // Update handle position
        const handle = progressTrack.querySelector('.gc-video-progress-handle');
        if (handle) {
            handle.style.left = `${position * 100}%`;
        }
        
        // Update video time
        if (activeMedia && activeMedia.duration) {
            activeMedia.currentTime = position * activeMedia.duration;
            updateTimeDisplay();
        }
    }

    function enhanceExistingMedia() {
        // Find and enhance all media elements that haven't been processed yet
        document.querySelectorAll('.message-video, video').forEach(video => {
            if (!lastProcessedMedia.has(video)) {
                setupVideo(video);
                lastProcessedMedia.set(video, true);
            }
        });
        
        document.querySelectorAll('.message-image, img').forEach(image => {
            if (!lastProcessedMedia.has(image) && shouldEnhanceImage(image)) {
                setupImage(image);
                lastProcessedMedia.set(image, true);
            }
        });
        
        // Create observer for autoplay when in viewport
        const viewportObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.target.tagName === 'VIDEO') {
                    handleVideoVisibility(entry.target, entry.isIntersecting);
                }
            });
        }, { threshold: 0.5 });
        
        // Observe all video elements
        document.querySelectorAll('.message-video, video').forEach(video => {
            viewportObserver.observe(video);
        });
    }
    
    function shouldEnhanceImage(image) {
        // Don't enhance tiny images, icons, or profile pictures
        const rect = image.getBoundingClientRect();
        
        // Skip very small images (likely icons)
        if (rect.width < 50 || rect.height < 50) return false;
        
        // Skip profile pictures or avatars (usually square and small)
        if (image.classList.contains('avatar') || 
            image.classList.contains('profile-pic') || 
            image.src.includes('avatar') || 
            image.src.includes('profile')) {
            return false;
        }
        
        return true;
    }

    function observeNewMediaAdditions() {
        // Watch for new content being added to the chat
        const domObserver = new MutationObserver(mutations => {
            let mediaAdded = false;
            
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) { // Element node
                        // Find and enhance new media
                        const videos = node.querySelectorAll('video, .message-video');
                        const images = node.querySelectorAll('img, .message-image');
                        
                        videos.forEach(video => {
                            if (!lastProcessedMedia.has(video)) {
                                setupVideo(video);
                                lastProcessedMedia.set(video, true);
                                mediaAdded = true;
                            }
                        });
                        
                        images.forEach(image => {
                            if (!lastProcessedMedia.has(image) && shouldEnhanceImage(image)) {
                                setupImage(image);
                                lastProcessedMedia.set(image, true);
                                mediaAdded = true;
                            }
                        });
                    }
                });
            });
            
            // If new media was added, make sure to update any video thumbnails
            if (mediaAdded) {
                document.querySelectorAll('video').forEach(video => {
                    if (video.paused && video.currentTime === 0) {
                        // Try to generate a thumbnail by seeking to the middle
                        video.currentTime = 1;
                    }
                });
            }
        });
        
        // Start watching the entire document for changes
        domObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    function setupVideo(video) {
        if (lastProcessedMedia.has(video)) return;
        
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
        
        // Create overlay play button
        const playOverlay = document.createElement('div');
        playOverlay.className = 'gc-video-play-overlay';
        playOverlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: rgba(0, 0, 0, 0.3);
            opacity: 0;
            transition: opacity 0.2s ease;
            border-radius: 16px;
            pointer-events: none;
        `;
        
        const playIconWrapper = document.createElement('div');
        playIconWrapper.style.cssText = `
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background-color: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        const playIcon = document.createElement('div');
        playIcon.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M8 5V19L19 12L8 5Z" fill="white"/></svg>';
        
        playIconWrapper.appendChild(playIcon);
        playOverlay.appendChild(playIconWrapper);
        
        // Add the overlay if the video has a parent
        if (video.parentNode) {
            // Create a wrapper if needed
            if (!video.parentNode.classList.contains('gc-video-wrapper')) {
                const wrapper = document.createElement('div');
                wrapper.className = 'gc-video-wrapper';
                wrapper.style.cssText = `
                    position: relative;
                    display: inline-block;
                    border-radius: 16px;
                    overflow: hidden;
                `;
                
                // Replace video with wrapper
                video.parentNode.insertBefore(wrapper, video);
                wrapper.appendChild(video);
                wrapper.appendChild(playOverlay);
                
                // Show overlay on hover
                wrapper.addEventListener('mouseenter', () => {
                    playOverlay.style.opacity = '1';
                });
                
                wrapper.addEventListener('mouseleave', () => {
                    playOverlay.style.opacity = '0';
                });
            }
        }
        
        // Try to start playback
        video.play().catch(() => {});
        
        // Mark as processed
        lastProcessedMedia.set(video, true);
    }

    function setupImage(image) {
        if (lastProcessedMedia.has(image) || !shouldEnhanceImage(image)) return;
        
        // Style the image for the chat view
        image.style.cssText = `
            max-width: 100%;
            max-height: 400px;
            border-radius: 16px;
            object-fit: cover;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            transition: transform 0.2s ease;
        `;
        
        // Add hover effect
        image.addEventListener('mouseenter', () => {
            image.style.transform = 'scale(1.02)';
        });
        
        image.addEventListener('mouseleave', () => {
            image.style.transform = 'scale(1)';
        });
        
        // Add click handler for fullscreen
        image.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openMediaFullscreen(image);
        });
        
        // Mark as processed
        lastProcessedMedia.set(image, true);
    }

    function handleVideoVisibility(video, isVisible) {
        if (!video) return;
        
        if (isVisible) {
            if (video.paused && !mediaOverlay.contains(video) && !isDragging) {
                video.play().catch(() => {});
            }
        } else {
            if (!mediaOverlay.contains(video)) {
                video.pause();
            }
        }
    }

    let controlsTimer = null;
    
    function showControls() {
        const controls = mediaOverlay.querySelector('.gc-media-controls');
        if (controls) {
            controls.style.opacity = '1';
        }
    }
    
    function hideControls() {
        const controls = mediaOverlay.querySelector('.gc-media-controls');
        if (controls && !isSeeking && activeMedia && !activeMedia.paused) {
            controls.style.opacity = '0';
        }
    }
    
    function startControlsTimer() {
        clearTimeout(controlsTimer);
        controlsTimer = setTimeout(() => {
            hideControls();
        }, 3000);
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
        
        // Show controls
        showControls();
        startControlsTimer();
        
        // If it's a video, handle specific video behaviors
        if (isVideo) {
            // Set up progress tracking
            setupVideoProgress(activeMedia);
            
            // Enable controls
            setupVideoControls(activeMedia);
            
            // Enable sound
            activeMedia.muted = false;
            
            // Update volume icon
            const volumeBtn = mediaOverlay.querySelector('.gc-volume-btn');
            if (volumeBtn) {
                updateVolumeIcon(volumeBtn, activeMedia.muted);
            }
            
            // Start playback
            activeMedia.play().catch(error => {
                console.log('Playback error:', error);
                // Update play button to show play state
                updatePlayPauseButton(true);
            });
        } else {
            // Hide video-specific controls for images
            const playPauseBtn = mediaOverlay.querySelector('.gc-play-pause-btn');
            const volumeBtn = mediaOverlay.querySelector('.gc-volume-btn');
            const timeDisplay = mediaOverlay.querySelector('.gc-time-display');
            const progressTrack = mediaOverlay.querySelector('.gc-video-progress-track');
            
            if (playPauseBtn) playPauseBtn.style.display = 'none';
            if (volumeBtn) volumeBtn.style.display = 'none';
            if (timeDisplay) timeDisplay.style.display = 'none';
            if (progressTrack) progressTrack.style.display = 'none';
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
            activeMedia.style.borderRadius = '8px';
            
            
            // Release animation lock after transition completes
            setTimeout(() => {
                isAnimating = false;
            }, 300);
        }, 50);
    }

    function setupVideoControls(videoElement) {
        if (!videoElement) return;
        
        const playPauseBtn = mediaOverlay.querySelector('.gc-play-pause-btn');
        const timeDisplay = mediaOverlay.querySelector('.gc-time-display');
        
        // Update play/pause button based on video state
        videoElement.addEventListener('play', () => {
            updatePlayPauseButton(false);
        });
        
        videoElement.addEventListener('pause', () => {
            updatePlayPauseButton(true);
        });
        
        // Update time display
        videoElement.addEventListener('timeupdate', updateTimeDisplay);
        videoElement.addEventListener('durationchange', updateTimeDisplay);
        
        // Initial updates
        updateTimeDisplay();
        updatePlayPauseButton(videoElement.paused);
    }
    
    function updatePlayPauseButton(isPaused) {
        const playPauseBtn = mediaOverlay.querySelector('.gc-play-pause-btn');
        if (!playPauseBtn) return;
        
        if (isPaused) {
            playPauseBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M8 5V19L19 12L8 5Z" fill="white"/></svg>';
        } else {
            playPauseBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" fill="white"/></svg>';
        }
    }
    
    function updateVolumeIcon(volumeBtn, isMuted) {
        if (!volumeBtn) return;
        
        if (isMuted) {
            volumeBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" fill="white"/></svg>';
        } else {
            volumeBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M3 10V14H7L12 19V5L7 10H3Z" fill="white"/><path d="M16.5 12C16.5 10.23 15.48 8.71 14 7.97V16.02C15.48 15.29 16.5 13.77 16.5 12Z" fill="white"/><path d="M14 3.23V5.29C16.89 6.15 19 8.83 19 12C19 15.17 16.89 17.85 14 18.71V20.77C18.01 19.86 21 16.28 21 12C21 7.72 18.01 4.14 14 3.23Z" fill="white"/></svg>';
        }
    }
    
    function togglePlayPause() {
        if (!activeMedia || activeMedia.tagName !== 'VIDEO') return;
        
        if (activeMedia.paused) {
            activeMedia.play()
                .then(() => {
                    updatePlayPauseButton(false);
                    startControlsTimer();
                })
                .catch(error => {
                    console.log('Play error:', error);
                });
        } else {
            activeMedia.pause();
            updatePlayPauseButton(true);
            showControls();
        }
    }
    
    function updateTimeDisplay() {
        if (!activeMedia || activeMedia.tagName !== 'VIDEO') return;
        
        const timeDisplay = mediaOverlay.querySelector('.gc-time-display');
        if (!timeDisplay) return;
        
        const currentTime = formatTime(activeMedia.currentTime);
        const duration = formatTime(activeMedia.duration || 0);
        timeDisplay.textContent = `${currentTime} / ${duration}`;
        
        // Update progress bar if not currently seeking
        if (!isSeeking && progressBar) {
            const progress = (activeMedia.currentTime / activeMedia.duration) * 100;
            progressBar.style.width = `${progress}%`;
            
            // Update handle position
            const handle = progressTrack.querySelector('.gc-video-progress-handle');
            if (handle) {
                handle.style.left = `${progress}%`;
            }
        }
    }
    
    function formatTime(seconds) {
        if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
        
        seconds = Math.floor(seconds);
        const minutes = Math.floor(seconds / 60);
        seconds = seconds % 60;
        
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    function setupVideoProgress(videoElement) {
        // Clear any existing interval
        clearInterval(progressInterval);
        
        // Ensure the time display is initialized
        updateTimeDisplay();
        
        // Use timeupdate event for smoother progress updates
        videoElement.addEventListener('timeupdate', updateTimeDisplay);
        
        // Also check periodically for more consistent updates
        progressInterval = setInterval(() => {
            if (!videoElement || videoElement.paused) return;
            updateTimeDisplay();
        }, 250);
    }

    function closeMediaFullscreen(withAnimation = true) {
        if (isAnimating || !activeMedia) return;
        isAnimating = true;
        
        // Clear progress tracking
        clearInterval(progressInterval);
        
        if (withAnimation) {
            // If video is playing, pause it
            if (activeMedia.tagName === 'VIDEO' && !activeMedia.paused) {
                activeMedia.pause();
            }
            
            // Fade out overlay
            mediaOverlay.style.opacity = '0';
            
            // Wait for animation to complete
            setTimeout(() => {
                mediaOverlay.style.display = 'none';
                mediaContainer.innerHTML = '';
                activeMedia = null;
                isAnimating = false;
                zoomedIn = false;
            }, 300);
        } else {
            // Instant close
            mediaOverlay.style.display = 'none';
            mediaContainer.innerHTML = '';
            activeMedia = null;
            isAnimating = false;
            zoomedIn = false;
        }
    }

    function setupDragDismiss(overlayElement) {
        let startY = 0;
        let startX = 0;
        let currentY = 0;
        let currentX = 0;
        let startScale = 1;
        
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
            if (!activeMedia || isAnimating || isSeeking) return;
            
            // Don't start drag if clicking on a control
            if (e.target.closest('.gc-media-controls') || 
                e.target.closest('button')) {
                return;
            }
            
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
            startScale = zoomedIn ? 1.5 : 1;
            
            if (activeMedia.tagName === 'VIDEO' && !activeMedia.paused) {
                activeMedia.pause();
                updatePlayPauseButton(true);
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
            const scale = Math.max(0.5, startScale - Math.abs(currentY) / 1000);
            activeMedia.style.transform = `translate(calc(-50% + ${currentX}px), calc(-50% + ${currentY}px)) scale(${scale})`;
            
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
                    if (zoomedIn) {
                        activeMedia.style.transform = 'translate(-50%, -50%) scale(1.5)';
                    } else {
                        activeMedia.style.transform = 'translate(-50%, -50%)';
                    }
                }
                overlayElement.style.opacity = '1';
                
                // Resume video playback if it was playing before
                if (activeMedia && activeMedia.tagName === 'VIDEO') {
                    showControls();
                    startControlsTimer();
                }
            }
            
            e.preventDefault();
        }
    }
    
    function setupDoubleTapZoom(overlayElement) {
        let lastTap = 0;
        
        overlayElement.addEventListener('click', function(e) {
            // Don't handle if clicking on a control
            if (e.target.closest('.gc-media-controls') || 
                e.target.closest('button')) {
                return;
            }
            
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;
            
            if (tapLength < 300 && tapLength > 0 && !isDragging && activeMedia) {
                // Double tap detected
                if (activeMedia.tagName === 'VIDEO') {
                    // For videos, double tap toggles play/pause
                    togglePlayPause();
                } else {
                    // For images, double tap zooms in/out
                    if (!zoomedIn) {
                        // Zoom in
                        activeMedia.style.maxWidth = '150vw';
                        activeMedia.style.maxHeight = '150vh';
                        activeMedia.style.transform = 'translate(-50%, -50%) scale(1.5)';
                        zoomedIn = true;
                    } else {
                        // Zoom out
                        activeMedia.style.maxWidth = '95vw';
                        activeMedia.style.maxHeight = '90vh';
                        activeMedia.style.transform = 'translate(-50%, -50%)';
                        zoomedIn = false;
                    }
                }
                e.preventDefault();
            } else if (e.target === overlayElement && !isDragging) {
                // Single tap on overlay background should close
                closeMediaFullscreen();
            }
            
            lastTap = currentTime;
        });
    }
    
    function addKeyboardSupport() {
        document.addEventListener('keydown', (e) => {
            if (!activeMedia || !mediaOverlay.style.display || mediaOverlay.style.display === 'none') return;
            
            switch (e.key) {
                case 'Escape':
                    closeMediaFullscreen();
                    break;
                case ' ':
                case 'k':
                    if (activeMedia.tagName === 'VIDEO') {
                        togglePlayPause();
                        e.preventDefault();
                    }
                    break;
                case 'ArrowRight':
                    if (activeMedia.tagName === 'VIDEO') {
                        activeMedia.currentTime = Math.min(activeMedia.duration, activeMedia.currentTime + 5);
                        showControls();
                        startControlsTimer();
                        e.preventDefault();
                    }
                    break;
                case 'ArrowLeft':
                    if (activeMedia.tagName === 'VIDEO') {
                        activeMedia.currentTime = Math.max(0, activeMedia.currentTime - 5);
                        showControls();
                        startControlsTimer();
                        e.preventDefault();
                    }
                    break;
                case 'm':
                    if (activeMedia.tagName === 'VIDEO') {
                        activeMedia.muted = !activeMedia.muted;
                        updateVolumeIcon(mediaOverlay.querySelector('.gc-volume-btn'), activeMedia.muted);
                        showControls();
                        startControlsTimer();
                        e.preventDefault();
                    }
                    break;
                case 'f':
                    toggleFullscreen();
                    e.preventDefault();
                    break;
            }
        });
    }
    
    function toggleFullscreen() {
        if (!mediaOverlay) return;
        
        if (!document.fullscreenElement) {
            // Enter fullscreen
            if (mediaOverlay.requestFullscreen) {
                mediaOverlay.requestFullscreen().catch(err => console.log('Fullscreen error', err));
            } else if (mediaOverlay.webkitRequestFullscreen) {
                mediaOverlay.webkitRequestFullscreen();
            } else if (mediaOverlay.msRequestFullscreen) {
                mediaOverlay.msRequestFullscreen();
            }
            
            // Update button icon
            const fullscreenBtn = mediaOverlay.querySelector('.gc-fullscreen-btn');
            if (fullscreenBtn) {
                fullscreenBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" fill="white"/></svg>';
            }
        } else {
            // Exit fullscreen
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
            
            // Update button icon
            const fullscreenBtn = mediaOverlay.querySelector('.gc-fullscreen-btn');
            if (fullscreenBtn) {
                fullscreenBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" fill="white"/></svg>';
            }
        }
    }
    
    function downloadMedia() {
        if (!activeMedia) return;
        
        // Create an off-screen canvas to add watermark
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (activeMedia.tagName === 'IMG') {
            // For images
            canvas.width = activeMedia.naturalWidth || activeMedia.width;
            canvas.height = activeMedia.naturalHeight || activeMedia.height;
            
            // Draw the image
            ctx.drawImage(activeMedia, 0, 0, canvas.width, canvas.height);
            
            // Add watermark
            addWatermark(ctx, canvas.width, canvas.height);
            
            // Convert to data URL and trigger download
            try {
                const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
                triggerDownload(dataUrl, 'global-chat-image.jpg');
            } catch (e) {
                console.error('Image download failed', e);
                
                // Fallback for cross-origin images
                const link = document.createElement('a');
                link.href = activeMedia.src;
                link.download = 'global-chat-image.jpg';
                link.target = '_blank';
                link.click();
            }
        } else if (activeMedia.tagName === 'VIDEO') {
            // For videos, download the source directly
            const link = document.createElement('a');
            link.href = activeMedia.src;
            link.download = 'global-chat-video.mp4';
            link.target = '_blank';
            link.click();
        }
    }
    
    function addWatermark(ctx, width, height) {
        ctx.save();
        
        // Set watermark style
        ctx.fillStyle = watermarkConfig.color;
        ctx.globalAlpha = watermarkConfig.opacity;
        ctx.font = `bold ${watermarkConfig.fontSize} Arial, sans-serif`;
        ctx.textAlign = 'start';
        ctx.textBaseline = 'top';
        
        // Add shadow for better visibility
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        
        // Position in bottom right corner
        const padding = 20;
        const text = watermarkConfig.text;
        const textWidth = ctx.measureText(text).width;
        
        // Draw watermark text
        ctx.fillText(text, width - textWidth - padding, height - parseInt(watermarkConfig.fontSize) - padding);
        
        ctx.restore();
    }
    
    function triggerDownload(dataUrl, filename) {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
})();
