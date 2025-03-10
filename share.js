
// Social Media Link Preview Generator
(function() {
  // Function to extract video ID from various social media URLs
  function extractVideoID(url) {
    // TikTok
    let tiktokMatch = url.match(/tiktok\.com\/@[\w.-]+\/video\/(\d+)/i) || 
                      url.match(/vm\.tiktok\.com\/(\w+)/i);
    if (tiktokMatch) return { platform: 'tiktok', id: tiktokMatch[1] };
    
    // YouTube
    let youtubeMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
    if (youtubeMatch) return { platform: 'youtube', id: youtubeMatch[1] };
    
    // Instagram
    let instagramMatch = url.match(/instagram\.com\/(?:p|reel)\/([^\/?#&]+)/i);
    if (instagramMatch) return { platform: 'instagram', id: instagramMatch[1] };
    
    // Twitter/X
    let twitterMatch = url.match(/twitter\.com\/\w+\/status\/(\d+)/i) || 
                       url.match(/x\.com\/\w+\/status\/(\d+)/i);
    if (twitterMatch) return { platform: 'twitter', id: twitterMatch[1] };
    
    // Facebook
    let fbMatch = url.match(/facebook\.com\/(?:watch\/\?v=|[\w.]+\/videos\/)(\d+)/i) ||
                  url.match(/fb\.watch\/([^\/]+)/i);
    if (fbMatch) return { platform: 'facebook', id: fbMatch[1] };
    
    // WhatsApp - Note: WhatsApp doesn't have public embed APIs, but we'll include for UI consistency
    let whatsappMatch = url.match(/chat\.whatsapp\.com\/([^\/?#&]+)/i);
    if (whatsappMatch) return { platform: 'whatsapp', id: whatsappMatch[1] };
    
    return null;
  }
  
  // Generate preview HTML based on platform and ID
  function generatePreviewHTML(platform, id, originalUrl) {
    const playIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>`;
    
    // Common template structure
    const template = (logoSvg, platformName, embedUrl, thumbnailUrl = null, isRestricted = false) => `
      <div class="link-preview ${platform}-preview">
        <div class="preview-header">
          ${logoSvg}
          <span>${platformName}${isRestricted ? ' (Opens in new window)' : ''}</span>
        </div>
        <div class="preview-content" data-original-url="${originalUrl}" data-embed-url="${embedUrl}" ${isRestricted ? 'data-restricted="true"' : ''}>
          <div class="preview-placeholder">
            ${thumbnailUrl ? `<img src="${thumbnailUrl}" alt="${platformName} Thumbnail" onerror="this.onerror=null;this.style.display='none';">` : ''}
            <div class="skeleton-loader">
              <div class="skeleton-shimmer"></div>
            </div>
            <button class="play-button">${isRestricted ? '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M19 19H5V5h7V3H5a2 2 0 00-2 2v14a2 2 0 002 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>' : playIcon}</button>
          </div>
        </div>
      </div>
    `;
    
    switch(platform) {
      case 'tiktok':
        return template(
          `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M9 0h1.98c.144.715.54 1.617 1.235 2.512C12.895 3.389 13.797 4 15 4v2c-1.753 0-3.07-.814-4-1.829V11a5 5 0 1 1-5-5v2a3 3 0 1 0 3 3V0Z"/>
          </svg>`,
          'TikTok',
          `https://www.tiktok.com/embed/v2/${id}`,
          null,
          true // TikTok embeds often restricted, open in new window
        );
      
      case 'youtube':
        return template(
          `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="red">
            <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
          </svg>`,
          'YouTube',
          `https://www.youtube.com/embed/${id}?autoplay=1`,
          `https://img.youtube.com/vi/${id}/maxresdefault.jpg`
        );
      
      case 'instagram':
        return template(
          `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="url(#instagram-gradient)">
            <defs>
              <linearGradient id="instagram-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" style="stop-color:#FFDC80" />
                <stop offset="25%" style="stop-color:#FCAF45" />
                <stop offset="50%" style="stop-color:#F77737" />
                <stop offset="75%" style="stop-color:#F56040" />
                <stop offset="100%" style="stop-color:#FD1D1D" />
              </linearGradient>
            </defs>
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>`,
          'Instagram',
          `https://www.instagram.com/p/${id}/embed/captioned/`,
          null,
          true // Instagram embeds often restricted, open in new window
        );
      
      case 'twitter':
        return template(
          `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#1DA1F2">
            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
          </svg>`,
          'Twitter',
          `https://platform.twitter.com/embed/Tweet.html?id=${id}`,
          null,
          true // Twitter embeds often restricted, open in new window
        );
        
      case 'facebook':
        return template(
          `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#1877F2">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>`,
          'Facebook',
          `https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Fvideo.php%3Fv%3D${id}`,
          null,
          true // Facebook embeds often restricted, open in new window
        );
        
      case 'whatsapp':
        return template(
          `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#25D366">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
          </svg>`,
          'WhatsApp',
          `https://chat.whatsapp.com/${id}`,
          null,
          true // WhatsApp links always open in new window
        );
      
      default:
        return '';
    }
  }

  // Fetch thumbnails for social media platforms
  async function fetchThumbnail(platform, url, elementToUpdate) {
    try {
      const placeholder = elementToUpdate.querySelector('.preview-placeholder');
      if (!placeholder) return;

      // Different strategies based on platform
      switch(platform) {
        case 'youtube':
          // YouTube thumbnail is direct and reliable
          const videoId = extractVideoID(url).id;
          const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
          const fallbackUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
          
          // Try higher quality first, fall back to standard quality
          const img = new Image();
          img.onload = function() {
            if (img.height > 90) { // If not the "no thumbnail available" image
              updateThumbnail(placeholder, thumbnailUrl, 'YouTube Video Thumbnail');
            } else {
              updateThumbnail(placeholder, fallbackUrl, 'YouTube Video Thumbnail');
            }
          };
          img.onerror = function() {
            updateThumbnail(placeholder, fallbackUrl, 'YouTube Video Thumbnail');
          };
          img.src = thumbnailUrl;
          break;
          
        case 'tiktok':
        case 'instagram':
        case 'twitter':
        case 'facebook':
        case 'whatsapp':
          // For platforms with restricted API access, we'll just use the play button UI
          // Hide skeleton loader after a short timeout to simulate loading
          setTimeout(() => {
            const skeletonLoader = placeholder.querySelector('.skeleton-loader');
            if (skeletonLoader) {
              skeletonLoader.style.display = 'none';
            }
          }, 1000);
          break;
      }
    } catch (error) {
      console.error(`Error fetching ${platform} thumbnail:`, error);
      // Hide skeleton loader on error
      const skeletonLoader = elementToUpdate.querySelector('.skeleton-loader');
      if (skeletonLoader) {
        skeletonLoader.style.display = 'none';
      }
    }
  }
  
  // Helper function to update thumbnail image
  function updateThumbnail(placeholder, imageUrl, altText) {
    const existingImg = placeholder.querySelector('img');
    const skeletonLoader = placeholder.querySelector('.skeleton-loader');
    
    if (existingImg) {
      existingImg.src = imageUrl;
      existingImg.alt = altText;
      existingImg.style.display = '';
      
      // Hide skeleton loader when image loads
      existingImg.onload = () => {
        if (skeletonLoader) {
          skeletonLoader.style.display = 'none';
        }
      };
    } else {
      const thumbnail = document.createElement('img');
      thumbnail.src = imageUrl;
      thumbnail.alt = altText;
      
      // Hide skeleton loader when image loads
      thumbnail.onload = () => {
        if (skeletonLoader) {
          skeletonLoader.style.display = 'none';
        }
      };
      
      placeholder.appendChild(thumbnail);
    }
  }

  // Add CSS styles for link previews
  const style = document.createElement('style');
  style.textContent = `
    .link-preview {
      margin: 10px 0;
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.1);
      background: rgba(0, 0, 0, 0.6);
      max-width: 480px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.3);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .link-preview:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0,0,0,0.4);
    }
    
    .preview-header {
      display: flex;
      align-items: center;
      padding: 12px 16px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      font-size: 14px;
      font-weight: 600;
      color: #fff;
    }
    
    .preview-header svg {
      margin-right: 8px;
      flex-shrink: 0;
    }
    
    .preview-content {
      position: relative;
      width: 100%;
      cursor: pointer;
    }
    
    .preview-placeholder {
      position: relative;
      width: 100%;
      height: 0;
      padding-bottom: 56.25%; /* 16:9 aspect ratio */
      background: #1a1a1a;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    
    .preview-placeholder img {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s;
    }
    
    .preview-content:hover .preview-placeholder img {
      transform: scale(1.05);
    }
    
    /* Skeleton loader animation */
    .skeleton-loader {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, #1a1a1a 25%, #2a2a2a 50%, #1a1a1a 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      z-index: 1;
    }
    
    .skeleton-shimmer {
      width: 100%;
      height: 100%;
    }
    
    @keyframes shimmer {
      0% {
        background-position: -200% 0;
      }
      100% {
        background-position: 200% 0;
      }
    }
    
    .play-button {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.7);
      border: 2px solid rgba(255, 255, 255, 0.8);
      cursor: pointer;
      z-index: 2;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s, transform 0.2s;
    }
    
    .play-button:hover {
      background: rgba(230, 30, 30, 0.9);
      transform: translate(-50%, -50%) scale(1.1);
    }
    
    .preview-iframe-container {
      position: relative;
      padding-bottom: 56.25%; /* 16:9 aspect ratio */
      height: 0;
      width: 100%;
    }
    
    .preview-iframe {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border: none;
    }
    
    /* Fullscreen mode */
    .preview-fullscreen {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .preview-fullscreen .preview-iframe-container {
      width: 90%;
      max-width: 1200px;
      padding-bottom: 50.625%; /* 16:9 but a bit smaller */
    }
    
    .close-fullscreen {
      position: absolute;
      top: 20px;
      right: 20px;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.5);
      border: 2px solid #fff;
      color: #fff;
      font-size: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 10000;
      transition: background 0.2s;
    }
    
    .close-fullscreen:hover {
      background: rgba(255, 0, 0, 0.7);
    }
    
    /* Mobile optimizations */
    @media (max-width: 768px) {
      .link-preview {
        max-width: 100%;
        margin: 10px 0;
      }
      
      .play-button {
        width: 50px;
        height: 50px;
      }
      
      .preview-fullscreen .preview-iframe-container {
        width: 95%;
        padding-bottom: 56.25%;
      }
    }
  `;
  document.head.appendChild(style);

  // Process messages to find and convert links
  function processMessages() {
    const messages = document.querySelectorAll('.message-text');
    
    messages.forEach(message => {
      if (message.getAttribute('data-processed')) return;
      
      // Mark as processed to avoid duplicate processing
      message.setAttribute('data-processed', 'true');
      
      const text = message.innerHTML;
      
      // Find URLs in text
      const urlRegex = /(https?:\/\/[^\s<]+)/g;
      const urls = text.match(urlRegex) || [];
      
      urls.forEach(url => {
        const videoData = extractVideoID(url);
        if (videoData) {
          const previewHTML = generatePreviewHTML(videoData.platform, videoData.id, url);
          
          if (previewHTML) {
            // Add preview after message
            const messageContent = message.closest('.message-content') || message.parentNode;
            let mediaContainer = messageContent.querySelector('.media-container');
            
            if (!mediaContainer) {
              mediaContainer = document.createElement('div');
              mediaContainer.classList.add('media-container');
              message.after(mediaContainer);
            }
            
            // Check if preview for this URL already exists
            const existingPreview = Array.from(mediaContainer.querySelectorAll('.preview-content')).find(
              elem => elem.dataset.originalUrl === url
            );
            
            if (!existingPreview) {
              const tempDiv = document.createElement('div');
              tempDiv.innerHTML = previewHTML;
              const previewElement = tempDiv.firstElementChild;
              mediaContainer.appendChild(previewElement);
              
              // Fetch thumbnails for platforms that need it
              fetchThumbnail(videoData.platform, url, previewElement);
            }
          }
        }
      });
    });
  }

  // Handle preview clicks to load embedded content or open external links
  function handlePreviewClicks() {
    // Full screen mode state
    let isFullscreen = false;
    let fullscreenContainer = null;
    
    document.addEventListener('click', function(e) {
      const previewContent = e.target.closest('.preview-content');
      const playButton = e.target.closest('.play-button');
      const closeButton = e.target.closest('.close-fullscreen');
      
      // Handle close button click
      if (closeButton && isFullscreen) {
        fullscreenContainer.remove();
        isFullscreen = false;
        document.body.style.overflow = '';
        return;
      }
      
      // Handle preview or play button click
      if (previewContent || playButton) {
        const contentElem = previewContent || playButton.closest('.preview-content');
        const embedUrl = contentElem.getAttribute('data-embed-url');
        const originalUrl = contentElem.getAttribute('data-original-url');
        const isRestricted = contentElem.getAttribute('data-restricted') === 'true';
        
        // For restricted platforms, open in new window
        if (isRestricted) {
          window.open(originalUrl, '_blank');
          return;
        }
        
        if (embedUrl) {
          // Create iframe container
          const iframeContainer = document.createElement('div');
          iframeContainer.className = 'preview-iframe-container';
          
          // Create iframe
          const iframe = document.createElement('iframe');
          iframe.src = embedUrl;
          iframe.className = 'preview-iframe';
          iframe.setAttribute('allowfullscreen', '');
          iframe.setAttribute('allow', 'autoplay; encrypted-media');
          
          iframeContainer.appendChild(iframe);
          
          // Check if fullscreen button was pressed
          if (e.shiftKey || e.ctrlKey || window.innerWidth < 768) {
            // Create fullscreen container
            fullscreenContainer = document.createElement('div');
            fullscreenContainer.className = 'preview-fullscreen';
            
            // Add close button
            const closeBtn = document.createElement('button');
            closeBtn.className = 'close-fullscreen';
            closeBtn.innerHTML = '×';
            closeBtn.setAttribute('aria-label', 'Close fullscreen');
            
            fullscreenContainer.appendChild(closeBtn);
            fullscreenContainer.appendChild(iframeContainer);
            document.body.appendChild(fullscreenContainer);
            
            document.body.style.overflow = 'hidden';
            isFullscreen = true;
          } else {
            // Replace placeholder with iframe
            const placeholder = contentElem.querySelector('.preview-placeholder');
            if (placeholder) {
              contentElem.replaceChild(iframeContainer, placeholder);
            } else {
              contentElem.appendChild(iframeContainer);
            }
          }
          
          // Video fallback - if iframe fails to load, open original URL
          iframe.onerror = function() {
            window.open(originalUrl, '_blank');
          };
          
          // Check if iframe loaded correctly
          setTimeout(() => {
            try {
              if (iframe.contentDocument && 
                  iframe.contentDocument.body && 
                  iframe.contentDocument.body.innerHTML === '') {
                window.open(originalUrl, '_blank');
                
                if (isFullscreen) {
                  fullscreenContainer.remove();
                  isFullscreen = false;
                  document.body.style.overflow = '';
                } else {
                  // Replace iframe with placeholder again
                  const placeholder = document.createElement('div');
                  placeholder.className = 'preview-placeholder';
                  placeholder.innerHTML = `
                    <div class="skeleton-loader" style="display: none;">
                      <div class="skeleton-shimmer"></div>
                    </div>
                    <button class="play-button">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white">
                        <path d="M19 19H5V5h7V3H5a2 2 0 00-2 2v14a2 2 0 002 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
                      </svg>
                    </button>
                  `;
                  
                  
                  if (iframeContainer.parentNode) {
                    iframeContainer.parentNode.replaceChild(placeholder, iframeContainer);
                    
                    // Update data attribute to mark as restricted
                    contentElem.setAttribute('data-restricted', 'true');
                  }
                }
              }
            } catch (error) {
              console.error("Error checking iframe content:", error);
              // If we can't access the iframe content due to CORS, assume it loaded
            }
          }, 3000);
        }
      }
      
      // Close fullscreen when clicking outside iframe
      if (isFullscreen && e.target === fullscreenContainer) {
        fullscreenContainer.remove();
        isFullscreen = false;
        document.body.style.overflow = '';
      }
    });
    
    // Listen for escape key to exit fullscreen
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && isFullscreen) {
        fullscreenContainer.remove();
        isFullscreen = false;
        document.body.style.overflow = '';
      }
    });
  }

  // Process existing messages
  processMessages();
  
  // Set up observers to detect new messages
  function setupObservers() {
    // Try different selectors that might contain the chat container
    const possibleContainers = [
      document.getElementById('chatContainer'),
      document.querySelector('.chat-container'),
      document.querySelector('.message-list'),
      document.querySelector('.conversation'),
      document.body // Fallback to body if no specific container found
    ];
    
    const chatContainer = possibleContainers.find(container => container !== null);
    
    if (chatContainer) {
      // Create a mutation observer to watch for new messages
      const observer = new MutationObserver(function(mutations) {
        let shouldProcess = false;
        
        mutations.forEach(function(mutation) {
          if (mutation.addedNodes.length) {
            shouldProcess = true;
          }
        });
        
        if (shouldProcess) {
          setTimeout(processMessages, 100); // Small delay to ensure DOM is updated
        }
      });
      
      // Start observing
      observer.observe(chatContainer, { childList: true, subtree: true });
    }
  }
  
  // Also look for input area to process links as they're typed
  function setupInputObserver() {
    const possibleInputs = [
      document.querySelector('textarea'),
      document.querySelector('input[type="text"]'),
      document.querySelector('.chat-input'),
      document.querySelector('.message-input')
    ];
    
    const inputElement = possibleInputs.find(input => input !== null);
    
    if (inputElement) {
      // Process URLs as they're typed
      inputElement.addEventListener('input', function() {
        const inputText = inputElement.value;
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const urls = inputText.match(urlRegex) || [];
        
        // Find or create preview area
        let inputPreviewArea = document.querySelector('.input-preview-area');
        
        if (!inputPreviewArea) {
          inputPreviewArea = document.createElement('div');
          inputPreviewArea.className = 'input-preview-area';
          inputPreviewArea.style.cssText = 'margin-top: 10px; max-height: 150px; overflow-y: auto; display: none;';
          inputElement.parentNode.insertBefore(inputPreviewArea, inputElement.nextSibling);
        }
        
        
        // Clear existing previews
        inputPreviewArea.innerHTML = '';
        
        // Generate previews for any URLs
        if (urls.length > 0) {
          inputPreviewArea.style.display = 'block';
          
          urls.forEach(url => {
            const videoData = extractVideoID(url);
            if (videoData) {
              const previewHTML = generatePreviewHTML(videoData.platform, videoData.id, url);
              
              if (previewHTML) {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = previewHTML;
                const previewElement = tempDiv.firstElementChild;
                
                // Make these previews smaller
                previewElement.style.maxWidth = '320px';
                previewElement.style.margin = '5px 0';
                
                inputPreviewArea.appendChild(previewElement);
                
                // Fetch thumbnails
                fetchThumbnail(videoData.platform, url, previewElement);
              }
            }
          });
        } else {
          inputPreviewArea.style.display = 'none';
        }
      });
    }
  }
  
  // Handle preview clicks
  handlePreviewClicks();
  
  // Setup observers
  setupObservers();
  setupInputObserver();
  
  // Add a global event listener to also process when the page changes (for SPAs)
  window.addEventListener('load', processMessages);
  window.addEventListener('popstate', processMessages);
  
  // Process messages periodically to catch any we might have missed
  setInterval(processMessages, 2000);
  
  console.log('Social Media Link Preview Generator initialized');
})();
