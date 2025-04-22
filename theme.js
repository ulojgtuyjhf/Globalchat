
// Self-executing function to avoid conflicts with global scope
(function() {
  // Configuration with unique identifiers
  const MEDIA_GRID_CLASS = 'gc-media-grid-v4';
  const MEDIA_ITEM_CLASS = 'gc-media-item-v4';
  const VIDEO_PLAYER_CLASS = 'gc-video-player-v4';
  const VIDEO_CONTROLS_CLASS = 'gc-video-controls-v4';
  const STYLE_ID = 'gc-media-grid-styles-v4';
  const MAX_VISIBLE_ITEMS = 4;
  
  // Track currently playing video
  let currentlyPlayingVideo = null;
  
  // Add styles only once
  function addStyles() {
    if (!document.getElementById(STYLE_ID)) {
      const style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = `
        .${MEDIA_GRID_CLASS} {
          display: grid;
          gap: 2px;
          margin-top: 8px;
          width: 100%;
          max-width: 550px;
          border-radius: 12px;
          overflow: hidden;
          background-color: #f0f0f0;
        }
        
        .${MEDIA_ITEM_CLASS} {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
          background-color: #f0f0f0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        /* Skeleton loading animation */
        .${MEDIA_ITEM_CLASS}::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(90deg, #f0f0f0, #e0e0e0, #f0f0f0);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          z-index: 0;
        }
        
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        
        .${MEDIA_ITEM_CLASS} img {
          position: relative;
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          z-index: 1;
        }
        
        /* Single media item */
        .${MEDIA_GRID_CLASS}[data-item-count="1"] {
          grid-template-columns: 1fr;
          height: 400px;
        }
        
        /* Two media items */
        .${MEDIA_GRID_CLASS}[data-item-count="2"] {
          grid-template-columns: repeat(2, 1fr);
          height: 350px;
        }
        
        /* Three media items */
        .${MEDIA_GRID_CLASS}[data-item-count="3"] {
          grid-template-columns: 1fr 1fr;
          grid-template-rows: 1fr 1fr;
          height: 400px;
        }
        
        .${MEDIA_GRID_CLASS}[data-item-count="3"] .${MEDIA_ITEM_CLASS}:first-child {
          grid-row: span 2;
        }
        
        /* Four media items */
        .${MEDIA_GRID_CLASS}[data-item-count="4"] {
          grid-template-columns: repeat(2, 1fr);
          grid-template-rows: repeat(2, 1fr);
          height: 450px;
        }

        /* Custom Video Player */
        .${VIDEO_PLAYER_CLASS} {
          position: relative;
          width: 100%;
          height: 100%;
          background-color: #000;
          z-index: 1;
          cursor: pointer;
        }
        
        .${VIDEO_PLAYER_CLASS} video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          display: block;
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
          z-index: 2;
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
        }
        
        .play-pause-btn:hover {
          transform: scale(1.1);
        }
        
        .play-pause-btn svg {
          width: 16px;
          height: 16px;
          fill: white;
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
        }
        
        .video-time {
          color: white;
          font-size: 12px;
          min-width: 70px;
          text-align: right;
          text-shadow: 1px 1px 1px rgba(0,0,0,0.5);
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
        }
        
        .volume-button svg {
          width: 18px;
          height: 18px;
          fill: white;
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
        }
        
        .overlay-play-btn:hover {
          transform: scale(1.1);
        }
        
        .overlay-play-btn svg {
          width: 24px;
          height: 24px;
          fill: white;
        }
        
        /* Hide skeleton animation once media is loaded */
        .${MEDIA_ITEM_CLASS}.loaded::before {
          display: none;
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .${MEDIA_GRID_CLASS} {
            height: auto !important;
          }
          
          .${MEDIA_GRID_CLASS}[data-item-count="1"] {
            height: 350px !important;
          }
          
          .${MEDIA_GRID_CLASS}[data-item-count="2"],
          .${MEDIA_GRID_CLASS}[data-item-count="3"],
          .${MEDIA_GRID_CLASS}[data-item-count="4"] {
            height: 400px !important;
          }
          
          .${MEDIA_ITEM_CLASS} {
            min-height: 180px;
          }
        }
        
        @media (max-width: 480px) {
          .${MEDIA_GRID_CLASS}[data-item-count="1"] {
            height: 300px !important;
          }
          
          .${MEDIA_GRID_CLASS}[data-item-count="2"],
          .${MEDIA_GRID_CLASS}[data-item-count="3"],
          .${MEDIA_GRID_CLASS}[data-item-count="4"] {
            height: 350px !important;
          }
          
          .${MEDIA_ITEM_CLASS} {
            min-height: 150px;
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
  
  // Create custom video player
  function createVideoPlayer(videoElement) {
    // Create video player container
    const videoPlayer = document.createElement('div');
    videoPlayer.className = VIDEO_PLAYER_CLASS;
    
    // Clone original video but remove controls attribute
    const videoClone = videoElement.cloneNode(true);
    videoClone.removeAttribute('controls');
    videoClone.muted = true;
    videoClone.playsInline = true;
    videoClone.loop = true;
    
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
    
    // Function to toggle play/pause
    function togglePlay(withSound = false) {
      if (videoClone.paused) {
        // If we're playing with sound, pause all other videos
        if (withSound) {
          videoClone.muted = false;
          stopAllVideos(videoClone);
          currentlyPlayingVideo = videoClone;
          
          // Update volume button
          volumeOn.style.display = 'block';
          volumeOff.style.display = 'none';
        }
        
        videoClone.play().catch(error => {
          console.error('Error playing video:', error);
        });
        pauseIcon.style.display = 'block';
        playIcon.style.display = 'none';
        overlay.classList.remove('video-overlay-visible');
      } else {
        videoClone.pause();
        pauseIcon.style.display = 'none';
        playIcon.style.display = 'block';
        overlay.classList.add('video-overlay-visible');
        
        if (currentlyPlayingVideo === videoClone) {
          currentlyPlayingVideo = null;
        }
      }
    }
    
    // Function to toggle volume
    function toggleVolume(e) {
      // Prevent the click from bubbling up to the video player
      e.stopPropagation();
      
      if (videoClone.muted) {
        videoClone.muted = false;
        volumeOn.style.display = 'block';
        volumeOff.style.display = 'none';
        
        // Pause other videos with sound
        stopAllVideos(videoClone);
        currentlyPlayingVideo = videoClone;
        
        // Ensure video is playing when unmuting
        if (videoClone.paused) {
          videoClone.play().catch(error => {
            console.error('Error playing video after unmute:', error);
          });
          pauseIcon.style.display = 'block';
          playIcon.style.display = 'none';
          overlay.classList.remove('video-overlay-visible');
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
      const percent = (videoClone.currentTime / videoClone.duration) * 100;
      progressFilled.style.width = `${percent}%`;
      
      // Format time display with current / total
      const currentTime = formatTime(videoClone.currentTime);
      const duration = formatTime(videoClone.duration || 0);
      videoTime.textContent = `${currentTime} / ${duration}`;
    }
    
    // Handle seeking in the progress bar
    function scrub(e) {
      e.stopPropagation(); // Prevent click from bubbling to video
      const scrubTime = (e.offsetX / progressBar.offsetWidth) * videoClone.duration;
      videoClone.currentTime = scrubTime;
    }
    
    // Update initial time display once metadata is loaded
    videoClone.addEventListener('loadedmetadata', () => {
      const duration = formatTime(videoClone.duration || 0);
      videoTime.textContent = `0:00 / ${duration}`;
    });
    
    // Set up event listeners
    videoClone.addEventListener('click', (e) => {
      e.stopPropagation();
      togglePlay(true);
    });
    
    overlayButton.addEventListener('click', (e) => {
      e.stopPropagation();
      togglePlay(true);
    });
    
    playPauseButton.addEventListener('click', (e) => {
      e.stopPropagation();
      togglePlay(!videoClone.muted);
    });
    
    volumeButton.addEventListener('click', toggleVolume);
    
    videoClone.addEventListener('timeupdate', updateProgress);
    
    progressBar.addEventListener('click', scrub);
    
    // Handle dragging on progress bar
    let mousedown = false;
    progressBar.addEventListener('mousedown', (e) => {
      e.stopPropagation(); // Prevent click from bubbling to video
      mousedown = true;
    });
    
    progressBar.addEventListener('mousemove', (e) => {
      e.stopPropagation(); // Prevent events from bubbling to video
      if (mousedown) scrub(e);
    });
    
    document.addEventListener('mouseup', () => mousedown = false);
    document.addEventListener('mouseleave', () => mousedown = false);
    
    // Handle touch events for mobile
    progressBar.addEventListener('touchstart', (e) => {
      e.stopPropagation();
      const rect = progressBar.getBoundingClientRect();
      const offsetX = e.touches[0].clientX - rect.left;
      scrub({offsetX, stopPropagation: () => {}});
    });
    
    // Handle video playing status
    videoClone.addEventListener('play', () => {
      pauseIcon.style.display = 'block';
      playIcon.style.display = 'none';
      overlay.classList.remove('video-overlay-visible');
    });
    
    videoClone.addEventListener('pause', () => {
      pauseIcon.style.display = 'none';
      playIcon.style.display = 'block';
      overlay.classList.add('video-overlay-visible');
    });
    
    // Show overlay on initial load
    overlay.classList.add('video-overlay-visible');
    
    return videoPlayer;
  }
  
  // Process all media containers
  function initMediaGrids() {
    const mediaContainers = document.querySelectorAll('.media-container:not([data-gc-processed])');
    
    mediaContainers.forEach(container => {
      // Mark as processed
      container.setAttribute('data-gc-processed', 'true');
      
      const mediaItems = Array.from(container.querySelectorAll('img, video'));
      if (mediaItems.length === 0) return;
      
      // Create our grid container
      const grid = document.createElement('div');
      grid.className = MEDIA_GRID_CLASS;
      
      const itemCount = Math.min(mediaItems.length, MAX_VISIBLE_ITEMS);
      grid.setAttribute('data-item-count', itemCount.toString());
      
      // Add each media item to the grid
      for (let i = 0; i < itemCount; i++) {
        const mediaElement = mediaItems[i];
        const gridItem = document.createElement('div');
        gridItem.className = MEDIA_ITEM_CLASS;
        
        if (mediaElement.tagName.toLowerCase() === 'img') {
          // For images
          const imgClone = mediaElement.cloneNode(true);
          
          if (imgClone.complete) {
            gridItem.classList.add('loaded');
          } else {
            imgClone.onload = () => gridItem.classList.add('loaded');
          }
          
          gridItem.appendChild(imgClone);
        } else if (mediaElement.tagName.toLowerCase() === 'video') {
          // For videos - create custom player
          const videoPlayer = createVideoPlayer(mediaElement);
          gridItem.appendChild(videoPlayer);
          
          // Mark as loaded when metadata is loaded
          const video = videoPlayer.querySelector('video');
          if (video.readyState >= 1) {
            gridItem.classList.add('loaded');
          } else {
            video.onloadedmetadata = () => gridItem.classList.add('loaded');
          }
        }
        
        grid.appendChild(gridItem);
      }
      
      // Replace the original container with our grid
      container.innerHTML = '';
      container.appendChild(grid);
    });
  }
  
  // Setup intersection observer for autoplay videos (silent)
  function setupVideoAutoplay() {
    if (!('IntersectionObserver' in window)) return;
    
    const videoObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const videoPlayer = entry.target.closest(`.${VIDEO_PLAYER_CLASS}`);
        if (!videoPlayer) return;
        
        const video = videoPlayer.querySelector('video');
        if (!video) return;
        
        // If video enters viewport and isn't explicitly paused by user
        if (entry.isIntersecting) {
          // Only autoplay if it's not been interacted with and not currently playing with sound
          if (!video.hasAttribute('data-user-paused') && video !== currentlyPlayingVideo) {
            // Ensure it's muted for autoplay
            video.muted = true;
            
            video.play().catch(() => {
              // Handle autoplay restrictions
              console.log('Autoplay prevented by browser');
            });
          }
        } else {
          // Only pause autoplaying videos (muted ones)
          if (video.playing && video.muted && !video.hasAttribute('data-user-paused') && video !== currentlyPlayingVideo) {
            video.pause();
          }
        }
      });
    }, {
      root: null,
      rootMargin: '0px',
      threshold: 0.5 // 50% of the video must be visible
    });
    
    // Observe all videos
    document.querySelectorAll(`.${VIDEO_PLAYER_CLASS}`).forEach(player => {
      videoObserver.observe(player);
      
      // Mark videos that are explicitly paused by user
      const video = player.querySelector('video');
      if (video) {
        video.addEventListener('pause', function() {
          if (this.paused && this.currentTime > 0) {
            this.setAttribute('data-user-paused', 'true');
          }
        });
        
        video.addEventListener('play', function() {
          this.removeAttribute('data-user-paused');
        });
      }
    });
  }
  
  // Set up mutation observer to detect new messages
  function setupObservers() {
    const observer = new MutationObserver(function(mutations) {
      let hasNewContent = false;
      
      mutations.forEach(mutation => {
        if (mutation.addedNodes.length) {
          hasNewContent = true;
        }
      });
      
      if (hasNewContent) {
        initMediaGrids();
        setupVideoAutoplay();
      }
    });
    
    // Start observing the chat container
    const chatContainer = document.getElementById('chatContainer') || document.body;
    if (chatContainer) {
      observer.observe(chatContainer, {
        childList: true,
        subtree: true
      });
    }
  }
  
  // Main initialization
  function init() {
    // Add styles
    addStyles();
    
    // Process existing media
    initMediaGrids();
    
    // Setup autoplay for videos
    setupVideoAutoplay();
    
    // Set up observers
    setupObservers();
    
    // Apply initial processing after a short delay
    setTimeout(() => {
      initMediaGrids();
      setupVideoAutoplay();
    }, 500);
    
    // Periodically check for new media
    setInterval(() => {
      initMediaGrids();
      setupVideoAutoplay();
    }, 2000);
  }
  
  // Run initialization when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
