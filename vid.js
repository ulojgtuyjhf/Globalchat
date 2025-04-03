// Configuration for sections and their content
const sectionConfig = {
  'homeSection': {
    url: './globalchat.html',
    menuId: 'home'
  },
  'exploreSection': {
    url: './feed.html',
    menuId: 'explore'
  },
  'profileSection': {
    url: './profileview.html',
    menuId: 'profile'
  }
};

// Global state for scroll management
window.scrollState = {
  lastScrollY: 0,
  lastScrollTime: Date.now(),
  scrollDirection: null,
  isMenuVisible: true,
  scrollThreshold: 10, // Minimum scroll distance to trigger action
  scrollTimeThreshold: 50, // Time in ms to consider a scroll event relevant
  menuTimer: null,
  menuAutoHideDelay: 3000, // Auto-hide after 3 seconds of inactivity
  disableScrollHandlingTimeout: null,
  isScrolling: false,
  allowSwipe: true,
  snapTimeout: null,
  currentSectionIndex: 0
};

// Function to load iframe with improved error handling
function loadIframe(sectionId, url, maxRetries = 5) {
  const section = document.getElementById(sectionId);
  if (!section) {
    console.error(`Section ${sectionId} not found`);
    return;
  }
  
  const loadingIndicator = section.querySelector('.loading-indicator');
  let retryCount = 0;
  let loadTimeout = null;
  
  // Create a unique loading ID to track this specific load attempt
  const loadId = `load_${sectionId}_${Date.now()}`;
  section.setAttribute('data-loading-id', loadId);
  
  const loadContent = () => {
    if (loadTimeout) {
      clearTimeout(loadTimeout);
    }
    
    if (section.getAttribute('data-loading-id') !== loadId) return;
    
    // Show loading indicator
    if (loadingIndicator) {
      loadingIndicator.style.display = 'flex';
    }
    
    const iframe = document.createElement('iframe');
    
    // Add cache busting to ensure fresh content
    const cacheBustUrl = `${url}${url.includes('?') ? '&' : '?'}_cb=${Date.now()}`;
    iframe.src = cacheBustUrl;
    
    // Set timeout for loading - Twitter-like experience
    loadTimeout = setTimeout(() => {
      if (section.getAttribute('data-loading-id') === loadId) {
        retryLoad('Timeout');
      }
    }, 15000); // 15 second timeout
    
    iframe.onload = () => {
      clearTimeout(loadTimeout);
      
      if (section.getAttribute('data-loading-id') !== loadId) return;
      
      if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
      }
      
      // Set up message listener for communication with iframe content
      setupIframeMessageListener(iframe);
      
      // Verify content loaded correctly
      try {
        const hasContent = iframe.contentDocument && iframe.contentDocument.body;
        if (!hasContent) {
          throw new Error('Empty content');
        }
        // Inject scroll listener into the iframe
        injectScrollListenerIntoIframe(iframe);
      } catch (e) {
        console.log(`${sectionId} loaded (${e.message || 'cross-origin'})`);
      }
    };
    
    iframe.onerror = () => {
      clearTimeout(loadTimeout);
      retryLoad('Load error');
    };
    
    // Clear existing content except loading indicator
    Array.from(section.children).forEach(element => {
      if (!element.classList.contains('loading-indicator')) {
        section.removeChild(element);
      }
    });
    
    section.appendChild(iframe);
  };
  
  const retryLoad = (reason) => {
    if (loadTimeout) {
      clearTimeout(loadTimeout);
    }
    
    if (section.getAttribute('data-loading-id') !== loadId) return;
    
    console.log(`Retrying ${sectionId} (${retryCount + 1}/${maxRetries}): ${reason}`);
    
    retryCount++;
    if (retryCount <= maxRetries) {
      const delay = Math.min(1000 * Math.pow(1.5, retryCount - 1), 8000);
      setTimeout(loadContent, delay);
    } else {
      displayError();
    }
  };
  
  const displayError = () => {
    if (section.getAttribute('data-loading-id') !== loadId) return;
    
    if (loadingIndicator) {
      loadingIndicator.style.display = 'none';
    }
    
    Array.from(section.children).forEach(element => {
      if (!element.classList.contains('loading-indicator')) {
        section.removeChild(element);
      }
    });
    
    const errorContainer = document.createElement('div');
    errorContainer.className = 'error-container';
    errorContainer.innerHTML = `
            <div class="error-icon">⚠️</div>
            <div class="error-message">Hmm...something went wrong. Please try again.</div>
            <button class="retry-button" id="retry-${sectionId}">Retry</button>
        `;
    
    section.appendChild(errorContainer);
    
    document.getElementById(`retry-${sectionId}`).addEventListener('click', () => {
      retryCount = 0;
      loadContent();
    });
  };
  
  loadContent();
}

// Function to set up message listener for communication with iframe content
function setupIframeMessageListener(iframe) {
  window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'scroll') {
      handleScrollFromIframe(event.data);
    }
  });
}

// Function to inject scroll listener script into iframe (for same-origin iframes)
function injectScrollListenerIntoIframe(iframe) {
  try {
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    if (!iframeDoc) return;
    
    // Create script element
    const script = iframeDoc.createElement('script');
    script.textContent = `
            // Using requestAnimationFrame for smooth scroll tracking
            let lastScrollY = 0;
            let scheduled = false;
            
            function trackScroll() {
                const currentScrollY = window.scrollY || document.documentElement.scrollTop;
                const deltaY = currentScrollY - lastScrollY;
                
                if (Math.abs(deltaY) > 5) {
                    window.parent.postMessage({
                        type: 'scroll',
                        scrollY: currentScrollY,
                        deltaY: deltaY,
                        timestamp: Date.now()
                    }, '*');
                    lastScrollY = currentScrollY;
                }
                scheduled = false;
            }
            
            window.addEventListener('scroll', () => {
                if (!scheduled) {
                    scheduled = true;
                    requestAnimationFrame(trackScroll);
                }
            }, { passive: true });
            
            // Track touch events for mobile devices
            let touchStartY = 0;
            window.addEventListener('touchstart', (e) => {
                touchStartY = e.touches[0].clientY;
            }, { passive: true });
            
            window.addEventListener('touchmove', (e) => {
                const currentTouchY = e.touches[0].clientY;
                const deltaY = touchStartY - currentTouchY;
                if (Math.abs(deltaY) > 10) {
                    window.parent.postMessage({
                        type: 'scroll',
                        deltaY: deltaY,
                        timestamp: Date.now(),
                        isTouchMove: true
                    }, '*');
                    touchStartY = currentTouchY;
                }
            }, { passive: true });
            
            // Notify parent that the iframe is ready
            window.parent.postMessage({
                type: 'iframe-ready'
            }, '*');
        `;
    
    if (iframeDoc.body) {
      iframeDoc.body.appendChild(script);
    } else if (iframeDoc.head) {
      iframeDoc.head.appendChild(script);
    }
  } catch (e) {
    console.log('Cannot inject scroll listener into iframe due to cross-origin policy');
  }
}

// Function to handle scroll events from iframes
function handleScrollFromIframe(data) {
    const { deltaY, timestamp, isTouchMove } = data;
    
    // If scroll handling is temporarily disabled, ignore
    if (window.scrollState.disableScrollHandlingTimeout) return;
    
    const currentTime = Date.now();
    const timeSinceLastScroll = currentTime - window.scrollState.lastScrollTime;
    
    // Only register if enough time has passed since last scroll
    if (timeSinceLastScroll > window.scrollState.scrollTimeThreshold) {
        const direction = deltaY > 0 ? 'down' : 'up';
        
        window.scrollState.lastScrollTime = currentTime;
        window.scrollState.scrollDirection = direction;
        
        if (window.innerWidth <= 768) {  // Only on mobile
            if (direction === 'down' && window.scrollState.isMenuVisible) {
                hideMenu();
            } else if (direction === 'up' && !window.scrollState.isMenuVisible) {
                showMenu();
            }
        }
        
        resetMenuTimer();
    }
}

// Function to show the menu with smooth animation
function showMenu() {
    const mobileMenu = document.getElementById('mobileMenu');
    const contentWrapper = document.getElementById('contentWrapper');
    
    if (mobileMenu && contentWrapper) {
        // Apply transitions for smooth animation
        mobileMenu.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        contentWrapper.style.transition = 'margin-bottom 0.3s cubic-bezier(0.4, 0, 0.2, 1), height 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        
        mobileMenu.classList.remove('hidden');
        contentWrapper.classList.remove('full-height');
        window.scrollState.isMenuVisible = true;
        
        // Disable scroll handling briefly to prevent flicker
        window.scrollState.disableScrollHandlingTimeout = setTimeout(() => {
            window.scrollState.disableScrollHandlingTimeout = null;
        }, 500);
        
        // Clean up transition properties on transition end
        mobileMenu.addEventListener('transitionend', function cleanup() {
            mobileMenu.style.transition = '';
            mobileMenu.removeEventListener('transitionend', cleanup);
        });
        contentWrapper.addEventListener('transitionend', function cleanup() {
            contentWrapper.style.transition = '';
            contentWrapper.removeEventListener('transitionend', cleanup);
        });
    }
}

// Function to hide the menu with smooth animation
function hideMenu() {
    const mobileMenu = document.getElementById('mobileMenu');
    const contentWrapper = document.getElementById('contentWrapper');
    
    if (mobileMenu && contentWrapper) {
        mobileMenu.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        contentWrapper.style.transition = 'margin-bottom 0.3s cubic-bezier(0.4, 0, 0.2, 1), height 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        
        mobileMenu.classList.add('hidden');
        contentWrapper.classList.add('full-height');
        window.scrollState.isMenuVisible = false;
        
        window.scrollState.disableScrollHandlingTimeout = setTimeout(() => {
            window.scrollState.disableScrollHandlingTimeout = null;
        }, 500);
        
        mobileMenu.addEventListener('transitionend', function cleanup() {
            mobileMenu.style.transition = '';
            mobileMenu.removeEventListener('transitionend', cleanup);
        });
        contentWrapper.addEventListener('transitionend', function cleanup() {
            contentWrapper.style.transition = '';
            contentWrapper.removeEventListener('transitionend', cleanup);
        });
    }
}

// Function to reset menu auto-hide timer
function resetMenuTimer() {
    if (window.scrollState.menuTimer) {
        clearTimeout(window.scrollState.menuTimer);
    }
    
    if (window.innerWidth <= 768) {
        window.scrollState.menuTimer = setTimeout(() => {
            if (window.scrollState.isMenuVisible) {
                hideMenu();
            }
        }, window.scrollState.menuAutoHideDelay);
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    const mobileMenu = document.getElementById('mobileMenu');
    const contentWrapper = document.getElementById('contentWrapper');
    const menuItems = document.querySelectorAll('.menu-item');
    const sections = document.querySelectorAll('.section');
    
    if (contentWrapper && window.innerWidth <= 768) {
        contentWrapper.style.scrollSnapType = 'x mandatory';
        contentWrapper.style.scrollBehavior = 'smooth';
        sections.forEach(section => {
            section.style.scrollSnapAlign = 'center';
            section.style.scrollSnapStop = 'always';
        });
    }
    
    window.scrollState.isMenuVisible = true;
    
    Object.entries(sectionConfig).forEach(([sectionId, config]) => {
        loadIframe(sectionId, config.url, 10);
    });
    
    const updateInteractionTime = () => {
        if (!window.scrollState.isMenuVisible) {
            showMenu();
        }
        resetMenuTimer();
    };
    
    const activateSection = (sectionType) => {
        if (window.scrollState.isScrolling) return;
        
        let targetSectionId = null;
        Object.entries(sectionConfig).forEach(([sectionId, config]) => {
            if (config.menuId === sectionType) {
                targetSectionId = sectionId;
            }
        });
        
        if (!targetSectionId) return;
        
        menuItems.forEach(item => {
            if (item.getAttribute('data-section') === sectionType) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
        
        const sectionOrder = ['homeSection', 'exploreSection', 'profileSection'];
        const targetIndex = sectionOrder.indexOf(targetSectionId);
        window.scrollState.currentSectionIndex = targetIndex;
        
        window.scrollState.isScrolling = true;
        
        if (window.innerWidth <= 768) {
            targetSection.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'center'
            });
            
            clearTimeout(window.scrollState.snapTimeout);
            window.scrollState.snapTimeout = setTimeout(() => {
                const containerWidth = contentWrapper.clientWidth;
                const targetPosition = targetIndex * containerWidth;
                
                contentWrapper.scrollTo({
                    left: targetPosition,
                    behavior: 'smooth'
                });
                
                setTimeout(() => {
                    window.scrollState.isScrolling = false;
                }, 400);
            }, 50);
        } else {
            targetSection.scrollIntoView({
                behavior: 'auto',
                block: 'nearest',
                inline: 'start'
            });
            window.scrollState.isScrolling = false;
        }
        
        const iframe = targetSection.querySelector('iframe');
        if (!iframe || !iframe.contentWindow) {
            loadIframe(targetSectionId, sectionConfig[targetSectionId].url, 10);
        }
    };
    
    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            const sectionType = item.getAttribute('data-section');
            activateSection(sectionType);
            updateInteractionTime();
        });
    });
    
    resetMenuTimer();
    
    document.addEventListener('touchstart', updateInteractionTime);
    document.addEventListener('click', updateInteractionTime);
    
    // Enhanced swipe detection with requestAnimationFrame for smoother physics
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    let touchMoved = false;
    let initialScrollLeft = 0;
    
    document.addEventListener('touchstart', (e) => {
        if (window.scrollState.isScrolling || !window.scrollState.allowSwipe) return;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchStartTime = Date.now();
        touchMoved = false;
        if (contentWrapper) {
            initialScrollLeft = contentWrapper.scrollLeft;
        }
    }, { passive: true });
    
    document.addEventListener('touchmove', (e) => {
        if (window.scrollState.isScrolling || !window.scrollState.allowSwipe) return;
        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;
        const diffX = touchStartX - currentX;
        const diffY = touchStartY - currentY;
        
        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 10) {
            touchMoved = true;
            if (Math.abs(diffX) > 10) {
                e.preventDefault();
                if (contentWrapper && window.innerWidth <= 768) {
                    const containerWidth = contentWrapper.clientWidth;
                    const numSections = 3;
                    const maxScroll = containerWidth * (numSections - 1);
                    
                    let newScrollLeft = initialScrollLeft + diffX;
                    if (newScrollLeft < 0) {
                        newScrollLeft = diffX / 3;
                    } else if (newScrollLeft > maxScroll) {
                        newScrollLeft = maxScroll + (diffX - (maxScroll - initialScrollLeft)) / 3;
                    }
                    
                    // Use requestAnimationFrame for a smoother scroll update
                    requestAnimationFrame(() => {
                        contentWrapper.scrollLeft = newScrollLeft;
                    });
                }
            }
        }
    }, { passive: false });
    
    document.addEventListener('touchend', (e) => {
        if (window.scrollState.isScrolling) return;
        
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const diffX = touchStartX - touchEndX;
        const diffY = touchStartY - touchEndY;
        const elapsedTime = Date.now() - touchStartTime;
        
        if (touchMoved && Math.abs(diffX) > Math.abs(diffY)) {
            const velocity = Math.abs(diffX) / elapsedTime;
            const isQuickSwipe = velocity > 0.5 && Math.abs(diffX) > 30;
            const direction = diffX > 0 ? 'left' : 'right';
            const sectionOrder = ['homeSection', 'exploreSection', 'profileSection'];
            let currentIndex = window.scrollState.currentSectionIndex;
            
            if (currentIndex < 0 || currentIndex >= sectionOrder.length) {
                const scrollRatio = contentWrapper.scrollLeft / contentWrapper.scrollWidth;
                currentIndex = Math.round(scrollRatio * sectionOrder.length);
                window.scrollState.currentSectionIndex = currentIndex;
            }
            
            let targetIndex;
            if (isQuickSwipe) {
                targetIndex = direction === 'left' ? 
                    Math.min(sectionOrder.length - 1, currentIndex + 1) : 
                    Math.max(0, currentIndex - 1);
            } else {
                const containerWidth = contentWrapper.clientWidth;
                const threshold = containerWidth / 3;
                if (Math.abs(diffX) > threshold) {
                    targetIndex = direction === 'left' ? 
                        Math.min(sectionOrder.length - 1, currentIndex + 1) : 
                        Math.max(0, currentIndex - 1);
                } else {
                    targetIndex = currentIndex;
                }
            }
            
            if (targetIndex !== currentIndex || !isQuickSwipe) {
                const targetSectionId = sectionOrder[targetIndex];
                if (targetSectionId) {
                    const menuId = sectionConfig[targetSectionId].menuId;
                    window.scrollState.allowSwipe = false;
                    window.scrollState.currentSectionIndex = targetIndex;
                    activateSection(menuId);
                    setTimeout(() => {
                        window.scrollState.allowSwipe = true;
                    }, 500);
                }
            }
            
            updateInteractionTime();
        }
        
        if (Math.abs(diffY) > 50 && touchStartY > window.innerHeight - 100 && diffY < 0) {
            showMenu();
            resetMenuTimer();
        }
    }, { passive: true });
    
    // Improved current visible section determination using snap percentages
    const getCurrentVisibleSection = () => {
        if (window.innerWidth <= 768) {
            const scrollLeft = contentWrapper.scrollLeft;
            const containerWidth = contentWrapper.clientWidth;
            const sectionOrder = ['homeSection', 'exploreSection', 'profileSection'];
            let maxVisibleRatio = 0;
            let mostVisibleIndex = 0;
            
            for (let i = 0; i < sectionOrder.length; i++) {
                const sectionStart = i * containerWidth;
                const sectionEnd = (i + 1) * containerWidth;
                const visibleStart = Math.max(sectionStart, scrollLeft);
                const visibleEnd = Math.min(sectionEnd, scrollLeft + containerWidth);
                const visibleWidth = Math.max(0, visibleEnd - visibleStart);
                const visibleRatio = visibleWidth / containerWidth;
                if (visibleRatio > maxVisibleRatio) {
                    maxVisibleRatio = visibleRatio;
                    mostVisibleIndex = i;
                }
            }
            
            return sectionOrder[mostVisibleIndex] || sectionOrder[0];
        } else {
            return 'homeSection';
        
    }
};
    
    // Improved scroll handler with debounce for better performance
    let scrollDebounceTimer = null;
    contentWrapper.addEventListener('scroll', () => {
        if (window.innerWidth <= 768) {
            // Skip if scrolling animation is in progress
            if (window.scrollState.isScrolling) return;
            
            // Update menu based on current visible section
            if (scrollDebounceTimer) clearTimeout(scrollDebounceTimer);
            
            scrollDebounceTimer = setTimeout(() => {
                const currentSectionId = getCurrentVisibleSection();
                if (currentSectionId && sectionConfig[currentSectionId]) {
                    const menuId = sectionConfig[currentSectionId].menuId;
                    
                    // Get section order and update current index
                    const sectionOrder = ['homeSection', 'exploreSection', 'profileSection'];
                    window.scrollState.currentSectionIndex = sectionOrder.indexOf(currentSectionId);
                    
                    // Update menu UI without scrolling
                    menuItems.forEach(item => {
                        if (item.getAttribute('data-section') === menuId) {
                            item.classList.add('active');
                        } else {
                            item.classList.remove('active');
                        }
                    });
                }
                
                updateInteractionTime();
                
                // Add snap effect when user stops scrolling
                const containerWidth = contentWrapper.clientWidth;
                const currentIndex = window.scrollState.currentSectionIndex;
                const expectedPosition = currentIndex * containerWidth;
                const currentPosition = contentWrapper.scrollLeft;
                
                // If not at expected position, snap to it
                if (Math.abs(currentPosition - expectedPosition) > 10) {
                    contentWrapper.scrollTo({
                        left: expectedPosition,
                        behavior: 'smooth'
                    });
                }
            }, 100);
        }
    }, { passive: true });
    
    // Improved resize handler
    window.addEventListener('resize', () => {
        // Recalculate layout for responsive design
        if (window.innerWidth <= 768) {
            // Re-apply snap scroll properties
            contentWrapper.style.scrollSnapType = 'x mandatory';
            contentWrapper.style.scrollBehavior = 'smooth';
            
            sections.forEach(section => {
                section.style.scrollSnapAlign = 'center';
                section.style.scrollSnapStop = 'always';
            });
            
            // Make sure the current section is properly scrolled into view
            const currentIndex = window.scrollState.currentSectionIndex;
            const containerWidth = contentWrapper.clientWidth;
            const targetPosition = currentIndex * containerWidth;
            
            // Use instant scroll to avoid animation on resize
            contentWrapper.scrollLeft = targetPosition;
        } else {
            // Remove snap scroll on desktop
            contentWrapper.style.scrollSnapType = '';
            contentWrapper.style.scrollBehavior = '';
            
            sections.forEach(section => {
                section.style.scrollSnapAlign = '';
                section.style.scrollSnapStop = '';
            });
        }
    });
    
    // Add scroll end detection for better snap effect
    let scrollEndTimer = null;
    contentWrapper.addEventListener('scroll', () => {
        if (window.innerWidth <= 768 && !window.scrollState.isScrolling) {
            // Clear previous timer
            if (scrollEndTimer) clearTimeout(scrollEndTimer);
            
            // Set new timer to detect when scrolling stops
            scrollEndTimer = setTimeout(() => {
                // Apply snap effect
                const containerWidth = contentWrapper.clientWidth;
                const scrollPosition = contentWrapper.scrollLeft;
                const currentIndex = Math.round(scrollPosition / containerWidth);
                
                // Update current section index
                window.scrollState.currentSectionIndex = currentIndex;
                
                // Calculate exact position
                const targetPosition = currentIndex * containerWidth;
                
                // Only snap if not already at target position
                if (Math.abs(scrollPosition - targetPosition) > 5) {
                    window.scrollState.isScrolling = true;
                    
                    contentWrapper.scrollTo({
                        left: targetPosition,
                        behavior: 'smooth'
                    });
                    
                    // Reset scrolling state after animation completes
                    setTimeout(() => {
                        window.scrollState.isScrolling = false;
                    }, 400);
                }
                
                // Update menu indicators
                const sectionOrder = ['homeSection', 'exploreSection', 'profileSection'];
                if (currentIndex >= 0 && currentIndex < sectionOrder.length) {
                    const currentSectionId = sectionOrder[currentIndex];
                    const menuId = sectionConfig[currentSectionId].menuId;
                    
                    menuItems.forEach(item => {
                        if (item.getAttribute('data-section') === menuId) {
                            item.classList.add('active');
                        } else {
                            item.classList.remove('active');
                        }
                    });
                }
            }, 150); // Adjust timing for best snap feel
        }
    }, { passive: true });
    
    // Periodically check for broken iframes and reload if needed
    setInterval(() => {
        Object.entries(sectionConfig).forEach(([sectionId, config]) => {
            const section = document.getElementById(sectionId);
            if (!section) return;
            
            const iframe = section.querySelector('iframe');
            
            // Check if iframe is missing or broken
            let needsReload = false;
            
            if (!iframe) {
                needsReload = true;
            } else {
                try {
                    
                    // Try to access iframe properties - will fail if broken
                    if (!iframe.contentWindow || iframe.contentWindow.document === null) {
                        needsReload = true;
                    }
                } catch (e) {
                    // Cross-origin restrictions will cause error - that's normal
                    // We only reload if we can detect it's actually broken
                    if (e.name !== 'SecurityError') {
                        needsReload = true;
                    }
                }
            }
            
            if (needsReload) {
                console.log(`Reloading broken iframe in ${sectionId}`);
                loadIframe(sectionId, config.url, 10);
            }
        });
    }, 60000); // Check every minute
});

// Add global methods for iframe communication
window.parentInterface = {
    notifyScroll: function(deltaY) {
        handleScrollFromIframe({
            deltaY: deltaY, 
            timestamp: Date.now()
        });
    },
    showMenu: function() {
        showMenu();
        resetMenuTimer();
    },
    hideMenu: function() {
        hideMenu();
    }
};

// Swipe detection variables
let touchStartY = 0;

// Add event listener for swipe up from bottom of screen
document.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
}, { passive: true });

document.addEventListener('touchend', (e) => {
    const touchEndY = e.changedTouches[0].clientY;
    const diffY = touchStartY - touchEndY;
    
    // If swiping up from bottom of screen
    if (diffY < -70 && touchStartY > window.innerHeight - 100) {
        showMenu();
        resetMenuTimer();
    }
}, { passive: true });

// Add global scroll handler for the main document
document.addEventListener('scroll', (e) => {
    const currentScrollY = window.scrollY || document.documentElement.scrollTop;
    const deltaY = currentScrollY - window.scrollState.lastScrollY;
    
    // Only register significant scrolls
    if (Math.abs(deltaY) > window.scrollState.scrollThreshold) {
        const direction = deltaY > 0 ? 'down' : 'up';
        window.scrollState.scrollDirection = direction;
        window.scrollState.lastScrollY = currentScrollY;
        window.scrollState.lastScrollTime = Date.now();
        
        // Handle menu visibility based on scroll direction
        if (window.innerWidth <= 768) {  // Only on mobile
            if (direction === 'down' && window.scrollState.isMenuVisible) {
                hideMenu();
            } else if (direction === 'up' && !window.scrollState.isMenuVisible) {
                showMenu();
            }
        }
        
        // Reset auto-hide timer
        resetMenuTimer();
    }
}, { passive: true }); 