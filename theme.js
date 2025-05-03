// Self-executing function to avoid conflicts with global scope
(function() {
  // Configuration with unique identifiers
  const VIDEO_PLAYER_CLASS = 'gc-video-player-v4';
  const VIDEO_CONTROLS_CLASS = 'gc-video-controls-v4';
  const STYLE_ID = 'gc-media-grid-styles-v4';
  
  // Track currently playing video
  let currentlyPlayingVideo = null;
  
  // Track visibility of videos
  const videoVisibilityMap = new Map();
  
  // Add styles only once
  function addStyles() {
    if (!document.getElementById(STYLE_ID)) {
      const style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = `
        /* Custom Video Player for Fullscreen Modal */
        .${VIDEO_PLAYER_CLASS} {
          position: relative;
          width: 100%;
          height: 100%;
          background-color: #000;
          z-index: 1;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        .${VIDEO_PLAYER_CLASS} video {
          width: 100%;
          height: 100%;
          object-fit: contain;
          display: block;
          cursor: pointer;
          border-radius: 10px;
        }
        
        .${VIDEO_CONTROLS_CLASS} {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 44px;
          background: linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0));
          display: flex;
          align-items: center;
          padding: 0 12px;
          opacity: 0;
          transition: opacity 0.2s ease;
          z-index: 10;
          border-bottom-left-radius: 12px;
          border-bottom-right-radius: 12px;
        }
        
        .${VIDEO_PLAYER_CLASS}:hover .${VIDEO_CONTROLS_CLASS} {
          opacity: 1;
        }
        
        .play-pause-btn {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          border: none;
          background: linear-gradient(
            135deg,  
            #0f0f0f 0%,  
            #1c1c1c 15%,  
            #3a3a3a 30%,  
            #4d4d4d 45%,  
            #626262 60%,  
            #787878 75%,  
            #8f8f8f 90%,  
            #a6a6a6 100%
          );
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 5px rgba(0,0,0,0.3);
          transition: transform 0.2s ease;
          z-index: 20;
        }
        
        .play-pause-btn:hover {
          transform: scale(1.1);
        }
        
        .play-pause-btn svg {
          width: 16px;
          height: 16px;
          fill: white;
          pointer-events: none;
        }
        
        .progress-bar {
          height: 4px;
          flex-grow: 1;
          background-color: rgba(255,255,255,0.3);
          margin: 0 10px;
          border-radius: 3px;
          position: relative;
          overflow: hidden;
          cursor: pointer;
          z-index: 20;
        }
        
        .progress-filled {
          height: 100%;
          background: linear-gradient(
            90deg,  
            #0f0f0f 0%,  
            #3a3a3a 30%,  
            #626262 60%,  
            #a6a6a6 100%
          );
          width: 0%;
          position: absolute;
          top: 0;
          left: 0;
          pointer-events: none;
        }
        
        .video-time {
          color: white;
          font-size: 12px;
          min-width: 70px;
          text-align: right;
          text-shadow: 1px 1px 1px rgba(0,0,0,0.5);
          z-index: 20;
        }
        
        .volume-button {
          width: 30px;
          height: 30px;
          background: transparent;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-left: 8px;
          z-index: 20;
        }
        
        .volume-button svg {
          width: 18px;
          height: 18px;
          fill: white;
          pointer-events: none;
        }
        
        .video-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s ease;
          z-index: 3;
          border-radius: 12px;
        }
        
        .video-overlay-visible {
          opacity: 1;
        }
        
        .overlay-play-btn {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          border: none;
          background: linear-gradient(
            135deg,  
            #0f0f0f 0%,  
            #1c1c1c 15%,  
            #3a3a3a 30%,  
            #4d4d4d 45%,  
            #626262 60%,  
            #787878 75%,  
            #8f8f8f 90%,  
            #a6a6a6 100%
          );
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 15px rgba(0,0,0,0.5);
          transition: transform 0.2s ease;
          z-index: 5;
        }
        
        .overlay-play-btn:hover {
          transform: scale(1.1);
        }
        
        .overlay-play-btn svg {
          width: 24px;
          height: 24px;
          fill: white;
          pointer-events: none;
        }
        
        /* Video loading spinner - using your branded animation */
        .video-loading {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          background-color: rgba(0, 0, 0, 0.7);
          z-index: 4;
          border-radius: 12px;
        }
        
        .video-spinner {
          width: 30px;
          height: 30px;
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        
        .video-spinner::before,
        .video-spinner::after {
          content: '';
          position: absolute;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: linear-gradient(
            135deg,  
            #0f0f0f 0%,  
            #1c1c1c 15%,  
            #3a3a3a 30%,  
            #4d4d4d 45%,  
            #626262 60%,  
            #787878 75%,  
            #8f8f8f 90%,  
            #a6a6a6 100%
          );
          animation: spin-pulse 1s infinite ease-in-out;
        }
        
        .video-spinner::before {
          animation-delay: 0s;
        }
        
        .video-spinner::after {
          animation-delay: 0.5s;
        }
        
        @keyframes spin-pulse {
          0% {
            transform: scale(1) translateY(0);
            opacity: 1;
          }
          50% {
            transform: scale(1.5) translateY(-15px);
            opacity: 0.5;
          }
          100% {
            transform: scale(1) translateY(0);
            opacity: 1;
          }
        }
        
        /* Responsive adjustments for fullscreen modal */
        @media (min-width: 768px) {
          .media-container {
            aspect-ratio: 9/16;
            max-height: 90vh;
            border-radius: 12px;
            overflow: hidden;
          }
          
          .media-container video {
            object-fit: contain;
            border-radius: 10px;
          }
        }
        
        @media (max-width: 767px) {
          .media-container {
            height: 35vh;
            min-height: 250px;
            border-radius: 12px;
            overflow: hidden;
          }
          
          .media-container video {
            object-fit: contain;
            border-radius: 10px;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }
  
  // Format time from seconds
  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${minutes}:${secs}`;
  }
  
  // Stop all playing videos
  function stopAllVideos(exceptVideo = null) {
    document.querySelectorAll(`.${VIDEO_PLAYER_CLASS} video`).forEach(video => {
      if (video !== exceptVideo) {
        video.pause();
        
        // Update UI on other videos
        const videoPlayer = video.closest(`.${VIDEO_PLAYER_CLASS}`);
        if (videoPlayer) {
          const overlay = videoPlayer.querySelector('.video-overlay');
          const playIcon = videoPlayer.querySelector('.play-icon');
          const pauseIcon = videoPlayer.querySelector('.pause-icon');
          
          if (overlay) overlay.classList.add('video-overlay-visible');
          if (playIcon) playIcon.style.display = 'block';
          if (pauseIcon) pauseIcon.style.display = 'none';
        }
      }
    });
  }
  
  // Check if an element is visible in viewport
  function isElementVisible(el) {
    if (!el) return false;
    
    const rect = el.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    const windowWidth = window.innerWidth || document.documentElement.clientWidth;
    
    // Element must be mostly visible (>70% of its area)
    const visibleArea = (
      Math.min(rect.right, windowWidth) - 
      Math.max(rect.left, 0)
    ) * (
      Math.min(rect.bottom, windowHeight) - 
      Math.max(rect.top, 0)
    );
    
    const totalArea = rect.width * rect.height;
    return visibleArea > (totalArea * 0.7);
  }
  
  // Create custom video player for fullscreen modal
  function createVideoPlayer(videoElement) {
    // Create video player container
    const videoPlayer = document.createElement('div');
    videoPlayer.className = VIDEO_PLAYER_CLASS;
    
    // Generate unique ID for this video player
    const videoId = 'video-player-' + Math.random().toString(36).substr(2, 9);
    videoPlayer.id = videoId;
    
    // Clone original video but remove controls attribute
    const videoClone = videoElement.cloneNode(true);
    videoClone.removeAttribute('controls');
    videoClone.playsInline = true;
    videoClone.dataset.videoId = videoId;
    
    // Ensure video has proper source
    if (!videoClone.src && videoClone.querySelector('source')) {
      videoClone.src = videoClone.querySelector('source').src;
    }
    
    // Create overlay for play/pause when video is stopped
    const overlay = document.createElement('div');
    overlay.className = 'video-overlay';
    overlay.innerHTML = `
      <button class="overlay-play-btn">
        <svg viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z"/>
        </svg>
      </button>
    `;
    
    // Create loading spinner
    const loadingSpinner = document.createElement('div');
    loadingSpinner.className = 'video-loading';
    loadingSpinner.innerHTML = `
      <div class="video-spinner"></div>
    `;
    
    // Create custom controls
    const controls = document.createElement('div');
    controls.className = VIDEO_CONTROLS_CLASS;
    controls.innerHTML = `
      <button class="play-pause-btn">
        <svg viewBox="0 0 24 24" class="pause-icon">
          <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
        </svg>
        <svg viewBox="0 0 24 24" class="play-icon" style="display: none;">
          <path d="M8 5v14l11-7z"/>
        </svg>
      </button>
      <div class="progress-bar">
        <div class="progress-filled"></div>
      </div>
      <span class="video-time">0:00 / 0:00</span>
      <button class="volume-button">
        <svg viewBox="0 0 24 24" class="volume-on">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
        </svg>
        <svg viewBox="0 0 24 24" class="volume-off" style="display: none;">
          <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
        </svg>
      </button>
    `;
    
    // Append elements to video player
    videoPlayer.appendChild(videoClone);
    videoPlayer.appendChild(loadingSpinner); // Add loading spinner before overlay
    videoPlayer.appendChild(overlay);
    videoPlayer.appendChild(controls);
    
    // Cache elements for event handling
    const overlayButton = overlay.querySelector('.overlay-play-btn');
    const playPauseButton = controls.querySelector('.play-pause-btn');
    const playIcon = playPauseButton.querySelector('.play-icon');
    const pauseIcon = playPauseButton.querySelector('.pause-icon');
    const progressBar = controls.querySelector('.progress-bar');
    const progressFilled = controls.querySelector('.progress-filled');
    const videoTime = controls.querySelector('.video-time');
    const volumeButton = controls.querySelector('.volume-button');
    const volumeOn = volumeButton.querySelector('.volume-on');
    const volumeOff = volumeButton.querySelector('.volume-off');
    
    // Add to visibility tracking
    videoVisibilityMap.set(videoId, {
      element: videoPlayer,
      isVisible: false,
      isPlaying: false
    });
    
    // Function to toggle play/pause
    function togglePlay(withSound = false) {
      // Only allow playing if video is visible
      if (!videoVisibilityMap.get(videoId)?.isVisible && !videoClone.paused) {
        videoClone.pause();
        pauseIcon.style.display = 'none';
        playIcon.style.display = 'block';
        overlay.classList.add('video-overlay-visible');
        return;
      }
      
      if (videoClone.paused) {
        // Show loading spinner while buffering
        loadingSpinner.style.display = 'flex';
        
        // If we're playing with sound, pause all other videos
        if (withSound) {
          videoClone.muted = false;
          stopAllVideos(videoClone);
          currentlyPlayingVideo = videoClone;
          
          // Update volume button
          volumeOn.style.display = 'block';
          volumeOff.style.display = 'none';
        }
        
        // Check if video is visible before playing
        if (videoVisibilityMap.get(videoId)?.isVisible) {
          videoClone.play().catch(error => {
            console.error('Error playing video:', error);
            loadingSpinner.style.display = 'none';
          });
        }
      } else {
        videoClone.pause();
        pauseIcon.style.display = 'none';
        playIcon.style.display = 'block';
        overlay.classList.add('video-overlay-visible');
        videoVisibilityMap.get(videoId).isPlaying = false;
        
        if (currentlyPlayingVideo === videoClone) {
          currentlyPlayingVideo = null;
        }
      }
    }
    
    // Function to toggle volume
    function toggleVolume() {
      if (videoClone.muted) {
        videoClone.muted = false;
        volumeOn.style.display = 'block';
        volumeOff.style.display = 'none';
        
        // Pause other videos with sound
        stopAllVideos(videoClone);
        currentlyPlayingVideo = videoClone;
        
        // Ensure video is playing when unmuting only if it's visible
        if (videoClone.paused && videoVisibilityMap.get(videoId)?.isVisible) {
          loadingSpinner.style.display = 'flex';
          videoClone.play().catch(error => {
            console.error('Error playing video after unmute:', error);
            loadingSpinner.style.display = 'none';
          });
        }
      } else {
        videoClone.muted = true;
        volumeOn.style.display = 'none';
        volumeOff.style.display = 'block';
        
        if (currentlyPlayingVideo === videoClone) {
          currentlyPlayingVideo = null;
        }
      }
    }
    
    // Update progress and time display
    function updateProgress() {
      if (!videoClone.duration) return;
      
      const percent = (videoClone.currentTime / videoClone.duration) * 100;
      progressFilled.style.width = `${percent}%`;
      
      // Format time display with current / total
      const currentTime = formatTime(videoClone.currentTime);
      const duration = formatTime(videoClone.duration || 0);
      videoTime.textContent = `${currentTime} / ${duration}`;
    }
    
    // Handle seeking in the progress bar
    function scrub(e) {
      if (!videoClone.duration) return;
      
      const progressRect = progressBar.getBoundingClientRect();
      const percent = (e.clientX - progressRect.left) / progressRect.width;
      videoClone.currentTime = percent * videoClone.duration;
    }
    
    // Update initial time display once metadata is loaded
    videoClone.addEventListener('loadedmetadata', () => {
      const duration = formatTime(videoClone.duration || 0);
      videoTime.textContent = `0:00 / ${duration}`;
      
      // Force video poster to display properly if available
      if (videoClone.poster) {
        const poster = videoClone.poster;
        videoClone.poster = '';
        setTimeout(() => {
          videoClone.poster = poster;
        }, 50);
      }
    });
    
    // VIDEO PLAYER - use delegation pattern for clean event handling
    videoPlayer.addEventListener('click', (e) => {
      // Check if click is directly on video or overlay play button
      const isVideoClickTarget = e.target === videoClone || e.target === overlay || e.target === overlayButton;
      
      // Only handle video background clicks here, not control clicks
      if (isVideoClickTarget) {
        togglePlay(true);
        e.stopPropagation();
      }
    });
    
    // DIRECT EVENT HANDLERS - completely separate from video clicks
    // Play/Pause button handler
    playPauseButton.addEventListener('click', (e) => {
      togglePlay(!videoClone.muted);
      e.stopPropagation(); // Prevent event from reaching video
    });
    
    // Volume button handler
    volumeButton.addEventListener('click', (e) => {
      toggleVolume();
      e.stopPropagation(); // Prevent event from reaching video
    });
    
    // Progress bar click handler with proper event handling
    progressBar.addEventListener('click', (e) => {
      scrub(e);
      e.stopPropagation(); // Prevent event from reaching video
    });
    
    // Overlay button handler (big play button)
    overlayButton.addEventListener('click', (e) => {
      togglePlay(true);
      e.stopPropagation(); // Just to be safe
    });
    
    // VIDEO EVENT LISTENERS
    videoClone.addEventListener('timeupdate', updateProgress);
    
    // Handle video playing status
    videoClone.addEventListener('play', () => {
      pauseIcon.style.display = 'block';
      playIcon.style.display = 'none';
      overlay.classList.remove('video-overlay-visible');
      videoVisibilityMap.get(videoId).isPlaying = true;
      
      // Hide loading spinner when video starts playing
      setTimeout(() => {
        loadingSpinner.style.display = 'none';
      }, 300);
    });
    
    videoClone.addEventListener('playing', () => {
      // Hide loading spinner when video actually starts playing
      loadingSpinner.style.display = 'none';
    });
    
    videoClone.addEventListener('waiting', () => {
      // Show loading spinner when video is buffering
      if (!videoClone.paused) {
        loadingSpinner.style.display = 'flex';
      }
    });
    
    videoClone.addEventListener('pause', () => {
      pauseIcon.style.display = 'none';
      playIcon.style.display = 'block';
      overlay.classList.add('video-overlay-visible');
      videoVisibilityMap.get(videoId).isPlaying = false;
      loadingSpinner.style.display = 'none';
    });
    
    videoClone.addEventListener('ended', () => {
      pauseIcon.style.display = 'none';
      playIcon.style.display = 'block';
      overlay.classList.add('video-overlay-visible');
      videoVisibilityMap.get(videoId).isPlaying = false;
      loadingSpinner.style.display = 'none';
      
      if (currentlyPlayingVideo === videoClone) {
        currentlyPlayingVideo = null;
      }
    });
    
    // Handle errors
    videoClone.addEventListener('error', (e) => {
      console.error('Video error:', e);
      overlay.classList.add('video-overlay-visible');
      loadingSpinner.style.display = 'none';
      
      // Create an error message in the overlay
      const errorMsg = document.createElement('div');
      errorMsg.style.color = 'white';
      errorMsg.style.background = 'rgba(0,0,0,0.7)';
      errorMsg.style.padding = '10px';
      errorMsg.style.borderRadius = '5px';
      errorMsg.textContent = 'Error loading video';
      
      // Replace play button with error message
      if (overlayButton.parentNode) {
        overlayButton.parentNode.replaceChild(errorMsg, overlayButton);
      }
    });
    
    // Show loading spinner and overlay on initial load
    loadingSpinner.style.display = 'flex';
    overlay.classList.add('video-overlay-visible');
    
    // Hide loading spinner when video can play through
    videoClone.addEventListener('canplaythrough', () => {
      if (videoClone.paused) {
        loadingSpinner.style.display = 'none';
      }
    });
    
    return videoPlayer;
  }
  
  // Process video elements in the fullscreen modal
  function initVideoPlayers() {
    const modalMedia = document.getElementById('modalMedia');
    if (!modalMedia) return;
    
    // Check if we need to force re-processing
    const videoElements = modalMedia.querySelectorAll('video');
    if (videoElements.length === 0) return;
    
    // Reset the processed flag to force reprocessing if videos are still direct video elements
    if (videoElements.length > 0 && modalMedia.dataset.videoPlayerProcessed) {
      const hasUnprocessedVideos = Array.from(videoElements).some(video => 
        !video.closest(`.${VIDEO_PLAYER_CLASS}`)
      );
      
      if (hasUnprocessedVideos) {
        modalMedia.dataset.videoPlayerProcessed = false;
      }
    }
    
    // Check if we've already processed this modal
    if (modalMedia.dataset.videoPlayerProcessed === 'true') return;
    modalMedia.dataset.videoPlayerProcessed = 'true';
    
    // Replace each video with our custom player
    videoElements.forEach(video => {
      // Only replace if not already in a player
      if (!video.closest(`.${VIDEO_PLAYER_CLASS}`)) {
        const videoPlayer = createVideoPlayer(video);
        video.replaceWith(videoPlayer);
      }
    });
    
    // After setup, check visibility of all videos
    checkAllVideoVisibility();
  }
  
  // Check visibility of all videos and pause those not visible
  function checkAllVideoVisibility() {
    for (const [videoId, data] of videoVisibilityMap.entries()) {
      const wasVisible = data.isVisible;
      data.isVisible = isElementVisible(data.element);
      
      // If video became invisible but was playing, pause it
      if (wasVisible && !data.isVisible && data.isPlaying) {
        const video = data.element.querySelector('video');
        if (video && !video.paused) {
          video.pause();
          
          // Update UI
          const overlay = data.element.querySelector('.video-overlay');
          const playIcon = data.element.querySelector('.play-icon');
          const pauseIcon = data.element.querySelector('.pause-icon');
          const loadingSpinner = data.element.querySelector('.video-loading');
          
          if (overlay) overlay.classList.add('video-overlay-visible');
          if (playIcon) playIcon.style.display = 'block';
          if (pauseIcon) pauseIcon.style.display = 'none';
          if (loadingSpinner) loadingSpinner.style.display = 'none';
          
          data.isPlaying = false;
          
          if (currentlyPlayingVideo === video) {
            currentlyPlayingVideo = null;
          }
        }
      }
    }
  }
  
  // Set up mutation observer to detect when modal opens
  function setupObservers() {
    // Observer for modal opening
    const modalObserver = new MutationObserver(function(mutations) {
      mutations.forEach(mutation => {
        if (mutation.attributeName === 'class') {
          const fullscreenModal = document.getElementById('fullscreenModal');
          if (fullscreenModal && fullscreenModal.classList.contains('active')) {
            // Modal opened, initialize video players with retry mechanism
            let attempts = 0;
            const maxAttempts = 5;
            
            function attemptInit() {
              if (attempts >= maxAttempts) return;
              attempts++;
              
              initVideoPlayers();
              
              // Verify if all videos were processed
              const modalMedia = document.getElementById('modalMedia');
              if (modalMedia) {
                const unprocessedVideos = modalMedia.querySelectorAll('video:not([data-video-id])');
                if (unprocessedVideos.length > 0) {
                  // Retry after a delay
                  setTimeout(attemptInit, 200);
                }
              }
            }
            
            setTimeout(attemptInit, 100);
          }
        }
      });
    });
    
    // Observer for content changes inside modal
    const contentObserver = new MutationObserver(function(mutations) {
      // Re-initialize on content changes
      initVideoPlayers();
    });
    
    // Start observing the fullscreen modal
    const fullscreenModal = document.getElementById('fullscreenModal');
    if (fullscreenModal) {
      modalObserver.observe(fullscreenModal, {
        attributes: true,
        attributeFilter: ['class']
      });
      
      // Also observe content changes inside modalMedia
      const modalMedia = document.getElementById('modalMedia');
      if (modalMedia) {
        contentObserver.observe(modalMedia, {
          childList: true,
          subtree: true
        });
      }
    }
    
    // Setup scroll and resize listeners for visibility checking
    ['scroll', 'resize', 'orientationchange'].forEach(event => {
      window.addEventListener(event, checkAllVideoVisibility, { passive: true });
    });
    
    // Setup interval to periodically check video visibility (as fallback)
    setInterval(checkAllVideoVisibility, 1000);
  }
  
  // Main initialization
  function init() {
    // Add styles
    addStyles();
    
    // Set up observers
    setupObservers();
    
    // Check if modal is already open (e.g., on page refresh)
    const fullscreenModal = document.getElementById('fullscreenModal');
    if (fullscreenModal && fullscreenModal.classList.contains('active')) {
      setTimeout(() => {
        initVideoPlayers();
        // Force a visibility check
        setTimeout(checkAllVideoVisibility, 300);
      }, 100);
    }
    
    // Add a global event listener for dynamic content
    document.addEventListener('DOMNodeInserted', function(e) {
      if (e.target.nodeName === 'VIDEO' || e.target.querySelector && e.target.querySelector('video')) {
        // New video element detected, check if we need to process it
        const modalMedia = document.getElementById('modalMedia');
        if (modalMedia && modalMedia.contains(e.target)) {
          setTimeout(initVideoPlayers, 100);
        }
      }
    });
  }
  
  // Run initialization when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();