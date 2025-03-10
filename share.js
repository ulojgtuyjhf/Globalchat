
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
    
    return null;
  }
  
  // Generate preview HTML based on platform and ID
  function generatePreviewHTML(platform, id, originalUrl) {
    const playIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>`;
    
    switch(platform) {
      case 'tiktok':
        return `
          <div class="link-preview tiktok-preview">
            <div class="preview-header">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M9 0h1.98c.144.715.54 1.617 1.235 2.512C12.895 3.389 13.797 4 15 4v2c-1.753 0-3.07-.814-4-1.829V11a5 5 0 1 1-5-5v2a3 3 0 1 0 3 3V0Z"/>
              </svg>
              <span>TikTok</span>
            </div>
            <div class="preview-content" data-original-url="${originalUrl}" data-embed-url="https://www.tiktok.com/embed/v2/${id}">
              <div class="preview-placeholder">
                <div class="preview-loader"></div>
                <button class="play-button">${playIcon}</button>
              </div>
            </div>
          </div>
        `;
      
      case 'youtube':
        return `
          <div class="link-preview youtube-preview">
            <div class="preview-header">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="red">
                <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
              </svg>
              <span>YouTube</span>
            </div>
            <div class="preview-content" data-original-url="${originalUrl}" data-embed-url="https://www.youtube.com/embed/${id}?autoplay=1">
              <div class="preview-placeholder">
                <img src="https://img.youtube.com/vi/${id}/maxresdefault.jpg" onerror="this.onerror=null;this.src='https://img.youtube.com/vi/${id}/hqdefault.jpg';" alt="YouTube Thumbnail">
                <button class="play-button">${playIcon}</button>
              </div>
            </div>
          </div>
        `;
      
      case 'instagram':
        return `
          <div class="link-preview instagram-preview">
            <div class="preview-header">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="url(#instagram-gradient)">
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
              </svg>
              <span>Instagram</span>
            </div>
            <div class="preview-content" data-original-url="${originalUrl}" data-embed-url="https://www.instagram.com/p/${id}/embed/captioned/">
              <div class="preview-placeholder">
                <div class="preview-loader"></div>
                <button class="play-button">${playIcon}</button>
              </div>
            </div>
          </div>
        `;
      
      case 'twitter':
        return `
          <div class="link-preview twitter-preview">
            <div class="preview-header">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#1DA1F2">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
              </svg>
              <span>Twitter</span>
            </div>
            <div class="preview-content" data-original-url="${originalUrl}" data-embed-url="https://platform.twitter.com/embed/Tweet.html?id=${id}">
              <div class="preview-placeholder">
                <div class="preview-loader"></div>
                <button class="play-button">${playIcon}</button>
              </div>
            </div>
          </div>
        `;
      
      default:
        return '';
    }
  }

  // Fetch TikTok thumbnail
  async function fetchTikTokThumbnail(url, elementToUpdate) {
    try {
      // Use a CORS proxy to fetch the thumbnail
      // Note: In a production environment, you should set up your own proxy
      const corsProxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
      const response = await fetch(corsProxyUrl);
      const html = await response.text();
      
      // Extract thumbnail URL from HTML meta tags
      const thumbnailMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
      if (thumbnailMatch && thumbnailMatch[1]) {
        const thumbnail = document.createElement('img');
        thumbnail.src = thumbnailMatch[1];
        thumbnail.alt = "TikTok Thumbnail";
        
        // Replace loader with actual thumbnail
        const placeholder = elementToUpdate.querySelector('.preview-placeholder');
        if (placeholder) {
          const loader = placeholder.querySelector('.preview-loader');
          if (loader) {
            placeholder.replaceChild(thumbnail, loader);
          } else {
            placeholder.prepend(thumbnail);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching TikTok thumbnail:', error);
    }
  }

  // Add CSS styles for link previews
  const style = document.createElement('style');
  style.textContent = `
    .link-preview {
      margin: 10px 0;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #38444d;
      background: #192734;
      max-width: 100%;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }
    
    .preview-header {
      display: flex;
      align-items: center;
      padding: 10px 12px;
      border-bottom: 1px solid #38444d;
      font-size: 14px;
      font-weight: 500;
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
      background: #0f1419;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .preview-placeholder img {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .preview-loader {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(255,255,255,0.3);
      border-radius: 50%;
      border-top-color: #1da1f2;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
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
      border: none;
      cursor: pointer;
      z-index: 2;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s, transform 0.2s;
    }
    
    .play-button:hover {
      background: rgba(29, 161, 242, 0.9);
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
            const messageContent = message.closest('.message-content');
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
              if (videoData.platform === 'tiktok') {
                fetchTikTokThumbnail(url, previewElement);
              } else if (videoData.platform === 'instagram') {
                // For Instagram, let's try to use the oEmbed API via a CORS proxy
                fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(`https://api.instagram.com/oembed/?url=${url}`)}`)
                  .then(response => response.json())
                  .then(data => {
                    if (data.thumbnail_url) {
                      const thumbnail = document.createElement('img');
                      thumbnail.src = data.thumbnail_url;
                      thumbnail.alt = "Instagram Preview";
                      
                      const placeholder = previewElement.querySelector('.preview-placeholder');
                      if (placeholder) {
                        const loader = placeholder.querySelector('.preview-loader');
                        if (loader) {
                          placeholder.replaceChild(thumbnail, loader);
                        } else {
                          placeholder.prepend(thumbnail);
                        }
                      }
                    }
                  })
                  .catch(err => console.error('Error fetching Instagram data:', err));
              } else if (videoData.platform === 'twitter') {
                // For Twitter, try to use the oEmbed API
                fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(`https://publish.twitter.com/oembed?url=${url}`)}`)
                  .then(response => response.json())
                  .then(data => {
                    if (data.thumbnail_url) {
                      const thumbnail = document.createElement('img');
                      thumbnail.src = data.thumbnail_url;
                      thumbnail.alt = "Tweet Preview";
                      
                      const placeholder = previewElement.querySelector('.preview-placeholder');
                      if (placeholder) {
                        const loader = placeholder.querySelector('.preview-loader');
                        if (loader) {
                          placeholder.replaceChild(thumbnail, loader);
                        } else {
                          placeholder.prepend(thumbnail);
                        }
                      }
                    }
                  })
                  .catch(err => console.error('Error fetching Twitter data:', err));
              }
            }
          }
        }
      });
    });
  }

  // Handle preview clicks to load embedded content
  function handlePreviewClicks() {
    document.addEventListener('click', function(e) {
      const previewContent = e.target.closest('.preview-content');
      const playButton = e.target.closest('.play-button');
      
      if (previewContent || playButton) {
        const contentElem = previewContent || playButton.closest('.preview-content');
        const embedUrl = contentElem.getAttribute('data-embed-url');
        const originalUrl = contentElem.getAttribute('data-original-url');
        
        if (embedUrl && !contentElem.querySelector('.preview-iframe')) {
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
          
          // Replace placeholder with iframe
          const placeholder = contentElem.querySelector('.preview-placeholder');
          if (placeholder) {
            contentElem.replaceChild(iframeContainer, placeholder);
          } else {
            contentElem.appendChild(iframeContainer);
          }
          
          // For direct playback fallback - open in new tab
          iframe.onerror = function() {
            window.open(originalUrl, '_blank');
          };
          
          // Video fallback
          setTimeout(() => {
            if (iframe.contentDocument && iframe.contentDocument.body.innerHTML === '') {
              window.open(originalUrl, '_blank');
            }
          }, 3000);
        }
      }
    });
  }

  // Process existing messages
  processMessages();
  
  // Set up observers to detect new messages
  const chatContainer = document.getElementById('chatContainer');
  
  if (chatContainer) {
    // Create a mutation observer to watch for new messages
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.addedNodes.length) {
          setTimeout(processMessages, 100); // Small delay to ensure DOM is updated
        }
      });
    });
    
    // Start observing
    observer.observe(chatContainer, { childList: true, subtree: true });
    
    // Handle preview clicks
    handlePreviewClicks();
  }
})();
