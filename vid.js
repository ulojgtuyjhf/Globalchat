
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

// Global state for scroll management with improved performance parameters
window.scrollState = {
    lastScrollY: 0,
    lastScrollTime: Date.now(),
    scrollDirection: null,
    isMenuVisible: true,
    scrollThreshold: 5, // Reduced for more sensitivity
    scrollTimeThreshold: 30, // Reduced for more immediate response
    menuTimer: null,
    menuAutoHideDelay: 3000,
    disableScrollHandlingTimeout: null,
    isScrolling: false,
    allowSwipe: true,
    snapTimeout: null,
    currentSectionIndex: 0,
    menuAnimationInProgress: false, // Flag to track menu animation
    scrollStartPosition: 0, // Track scroll start position for parallax effect
    lastTouchY: 0, // Track last touch position for smooth menu movement
    menuTransitionSpeed: 0.4, // Seconds for menu transition (increased for smoothness)
    contentTransitionSpeed: 0.5 // Seconds for content transition (increased for smoothness)
};

// Optimized function to load iframe with better performance during loading
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

    // Preload optimization function
    const preloadResources = () => {
        // Create a hidden preload iframe to warm up connections
        const preloadFrame = document.createElement('iframe');
        preloadFrame.style.width = '1px';
        preloadFrame.style.height = '1px';
        preloadFrame.style.position = 'absolute';
        preloadFrame.style.top = '-9999px';
        preloadFrame.style.left = '-9999px';
        preloadFrame.src = url;
        
        // Remove preload frame after 2 seconds
        document.body.appendChild(preloadFrame);
        setTimeout(() => {
            if (document.body.contains(preloadFrame)) {
                document.body.removeChild(preloadFrame);
            }
        }, 2000);
    };

    const loadContent = () => {
        // Clear any existing timeout
        if (loadTimeout) {
            clearTimeout(loadTimeout);
        }
        
        // Only proceed if this is still the current load attempt
        if (section.getAttribute('data-loading-id') !== loadId) return;
        
        // Show loading indicator with fade-in animation
        if (loadingIndicator) {
            loadingIndicator.style.opacity = '0';
            loadingIndicator.style.display = 'flex';
            
            // Force reflow to enable transition
            loadingIndicator.offsetHeight;
            
            // Fade in
            loadingIndicator.style.transition = 'opacity 0.3s ease-in';
            loadingIndicator.style.opacity = '1';
        }
        
        // Pre-warm connections for better loading experience
        preloadResources();
        
        // Create and configure iframe with progressive loading
        const iframe = document.createElement('iframe');
        
        // Set initial opacity to 0 for fade-in effect
        iframe.style.opacity = '0';
        iframe.style.transition = 'opacity 0.5s ease-in';
        
        // Add cache busting for fresh content but with a shared cache key for related resources
        const cacheKey = Math.floor(Date.now() / 10000); // Changes every 10 seconds
        const cacheBustUrl = `${url}${url.includes('?') ? '&' : '?'}_cb=${cacheKey}`;
        iframe.src = cacheBustUrl;

        // Set loading attribute for better browser handling
        iframe.loading = "eager";
        iframe.importance = "high";

        // Set timeout for loading with progressive extension
        let timeoutDuration = 10000; // Initial 10 second timeout
        loadTimeout = setTimeout(() => {
            // Extend timeout once before considering it an error
            if (section.getAttribute('data-loading-id') === loadId) {
                console.log(`Extending timeout for ${sectionId} loading...`);
                loadTimeout = setTimeout(() => {
                    if (section.getAttribute('data-loading-id') === loadId) {
                        retryLoad('Timeout after extension');
                    }
                }, 10000); // Additional 10 seconds
            }
        }, timeoutDuration);

        iframe.onload = () => {
            clearTimeout(loadTimeout);
            
            // Only update if this is still the current load attempt
            if (section.getAttribute('data-loading-id') !== loadId) return;
            
            // Fade out loading indicator
            if (loadingIndicator) {
                loadingIndicator.style.transition = 'opacity 0.3s ease-out';
                loadingIndicator.style.opacity = '0';
                setTimeout(() => {
                    loadingIndicator.style.display = 'none';
                }, 300);
            }
            
            // Fade in the iframe
            setTimeout(() => {
                iframe.style.opacity = '1';
            }, 50);
            
            // Setup message listener for communication with iframe content
            setupIframeMessageListener(iframe);
            
            // Apply performance optimizations to iframe content
            optimizeIframeContent(iframe);
            
            // Verify content loaded correctly with improved detection
            try {
                // This will throw an error for cross-origin iframes
                const hasContent = iframe.contentDocument && 
                                  iframe.contentDocument.body;
                
                // For same-origin iframes, we can check content
                if (!hasContent) {
                    throw new Error('Empty content');
                }
                
                // Inject scroll listener into the iframe with improved performance
                injectScrollListenerIntoIframe(iframe);
            } catch (e) {
                // For cross-origin restrictions, we'll assume successful load
                console.log(`${sectionId} loaded (${e.message || 'cross-origin'})`);
            }
        };

        iframe.onerror = () => {
            clearTimeout(loadTimeout);
            retryLoad('Load error');
        };

        // Clear existing content except loading indicator with smooth transition
        const currentContents = Array.from(section.children);
        currentContents.forEach(element => {
            if (!element.classList.contains('loading-indicator')) {
                // Fade out before removing
                element.style.transition = 'opacity 0.3s ease-out';
                element.style.opacity = '0';
                
                setTimeout(() => {
                    if (section.contains(element)) {
                        section.removeChild(element);
                    }
                }, 300);
            }
        });
        
        // Add the iframe
        section.appendChild(iframe);
    };

    const retryLoad = (reason) => {
        // Clear any existing timeout
        if (loadTimeout) {
            clearTimeout(loadTimeout);
        }
        
        // Only retry if this is still the current load attempt
        if (section.getAttribute('data-loading-id') !== loadId) return;
        
        console.log(`Retrying ${sectionId} (${retryCount + 1}/${maxRetries}): ${reason}`);
        
        retryCount++;
        if (retryCount <= maxRetries) {
            // Exponential backoff for retries with jitter for better performance
            const baseDelay = Math.min(1000 * Math.pow(1.5, retryCount - 1), 8000);
            const jitter = Math.random() * 1000; // Add randomness to prevent thundering herd
            const delay = baseDelay + jitter;
            
            setTimeout(loadContent, delay);
        } else {
            displayError();
        }
    };

    const displayError = () => {
        // Only display error if this is still the current load attempt
        if (section.getAttribute('data-loading-id') !== loadId) return;
        
        // Hide loading indicator with fade out
        if (loadingIndicator) {
            loadingIndicator.style.transition = 'opacity 0.3s ease-out';
            loadingIndicator.style.opacity = '0';
            setTimeout(() => {
                loadingIndicator.style.display = 'none';
            }, 300);
        }
        
        // Remove all content except loading indicator with transition
        const currentContents = Array.from(section.children);
        currentContents.forEach(element => {
            if (!element.classList.contains('loading-indicator')) {
                // Fade out before removing
                element.style.transition = 'opacity 0.3s ease-out';
                element.style.opacity = '0';
                
                setTimeout(() => {
                    if (section.contains(element)) {
                        section.removeChild(element);
                    }
                }, 300);
            }
        });
        
        // Create Twitter-style error message with animation
        const errorContainer = document.createElement('div');
        errorContainer.className = 'error-container';
        errorContainer.style.opacity = '0';
        errorContainer.style.transition = 'opacity 0.4s ease-in';
        errorContainer.innerHTML = `
            <div class="error-icon">⚠️</div>
            <div class="error-message">Hmm...something went wrong. Please try again.</div>
            <button class="retry-button" id="retry-${sectionId}">Retry</button>
        `;
        
        section.appendChild(errorContainer);
        
        // Trigger fade in
        setTimeout(() => {
            errorContainer.style.opacity = '1';
        }, 50);
        
        // Add retry button handler with improved feedback
        setTimeout(() => {
            const retryButton = document.getElementById(`retry-${sectionId}`);
            if (retryButton) {
                retryButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    
                    // Visual feedback
                    retryButton.textContent = 'Retrying...';
                    retryButton.disabled = true;
                    
                    // Reset retry count and reload
                    retryCount = 0;
                    loadContent();
                });
            }
        }, 400);
    };

    // Apply optimization techniques for better loading performance
    const optimizeIframeContent = (iframe) => {
        try {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            if (!iframeDoc) return;
            
            // Add performance optimization script
            const perfScript = iframeDoc.createElement('script');
            perfScript.textContent = `
                // Optimize rendering performance
                document.body.style.backfaceVisibility = 'hidden';
                document.body.style.perspective = '1000px';
                document.body.style.transform = 'translate3d(0,0,0)';
                
                // Prioritize visible content
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.target.tagName === 'IMG') {
                            if (entry.isIntersecting) {
                                entry.target.loading = 'eager';
                                if (entry.target.dataset.src) {
                                    entry.target.src = entry.target.dataset.src;
                                    delete entry.target.dataset.src;
                                }
                            } else {
                                entry.target.loading = 'lazy';
                            }
                        }
                    });
                });
                
                // Observe images for better loading
                document.querySelectorAll('img').forEach(img => {
                    observer.observe(img);
                });
                
                // Optimize scroll performance
                let scrollTicking = false;
                document.addEventListener('scroll', () => {
                    if (!scrollTicking) {
                        window.requestAnimationFrame(() => {
                            // Apply performance optimizations during scroll
                            scrollTicking = false;
                        });
                        scrollTicking = true;
                    }
                }, { passive: true });
            `;
            
            // Append to body or head
            if (iframeDoc.body) {
                iframeDoc.body.appendChild(perfScript);
            } else if (iframeDoc.head) {
                iframeDoc.head.appendChild(perfScript);
            }
        } catch (e) {
            // Error accessing iframe content - likely cross-origin restrictions
            console.log('Cannot optimize iframe content due to cross-origin policy');
        }
    };

    loadContent();
}

// Function to set up message listener for communication with iframe content
function setupIframeMessageListener(iframe) {
    window.addEventListener('message', (event) => {
        // Message throttling to prevent performance issues
        const processMessage = throttle(() => {
            if (event.data && event.data.type === 'scroll') {
                handleScrollFromIframe(event.data);
            }
        }, 16); // ~60fps
        
        processMessage();
    });
}

// Throttle function for performance
function throttle(callback, limit) {
    let waiting = false;
    return function() {
        if (!waiting) {
            callback.apply(this, arguments);
            waiting = true;
            setTimeout(() => {
                waiting = false;
            }, limit);
        }
    };
}

// Function to inject scroll listener script into iframe with improved performance
function injectScrollListenerIntoIframe(iframe) {
    try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        
        if (!iframeDoc) return;
        
        // Create script element with optimized event handling
        const script = iframeDoc.createElement('script');
        script.textContent = `
            // Optimized scroll detection with requestAnimationFrame
            let lastScrollY = 0;
            let lastScrollTime = Date.now();
            let scrollTimeout = null;
            let ticking = false;
            
            // Throttle function using requestAnimationFrame for better performance
            function optimizedThrottle(callback) {
                if (!ticking) {
                    window.requestAnimationFrame(() => {
                        callback();
                        ticking = false;
                    });
                    ticking = true;
                }
            }
            
            // Function to track scroll and send to parent with performance optimizations
            function trackScroll() {
                const currentScrollY = window.scrollY || document.documentElement.scrollTop;
                const currentTime = Date.now();
                const deltaY = currentScrollY - lastScrollY;
                
                // Only register significant scrolls and limit message frequency
                if (Math.abs(deltaY) > 2 && (currentTime - lastScrollTime) > 16) {
                    // Calculate scroll velocity for smoother animations
                    const velocity = Math.abs(deltaY) / (currentTime - lastScrollTime);
                    
                    // Send message to parent window with velocity data
                    window.parent.postMessage({
                        type: 'scroll',
                        scrollY: currentScrollY,
                        deltaY: deltaY,
                        velocity: velocity,
                        timestamp: currentTime
                    }, '*');
                    
                    lastScrollY = currentScrollY;
                    lastScrollTime = currentTime;
                }
            }
            
            // Add optimized scroll event listener
            window.addEventListener('scroll', () => {
                optimizedThrottle(trackScroll);
            }, { passive: true });
            
            // Enhanced touch tracking for smoother experience
            let touchStartY = 0;
            let touchLastY = 0;
            let touchVelocity = 0;
            let touchLastTime = 0;
            
            window.addEventListener('touchstart', (e) => {
                touchStartY = e.touches[0].clientY;
                touchLastY = touchStartY;
                touchLastTime = Date.now();
                
                // Report touch start to parent
                window.parent.postMessage({
                    type: 'touchStart',
                    position: touchStartY,
                    timestamp: touchLastTime
                }, '*');
            }, { passive: true });
            
            window.addEventListener('touchmove', (e) => {
                const currentTouchY = e.touches[0].clientY;
                const currentTime = Date.now();
                const deltaY = touchLastY - currentTouchY;
                const deltaTime = currentTime - touchLastTime;
                
                // Calculate velocity (pixels per ms)
                if (deltaTime > 0) {
                    touchVelocity = deltaY / deltaTime;
                }
                
                // Send progressive touch move as scroll event
                if (Math.abs(deltaY) > 1) {
                    window.parent.postMessage({
                        type: 'scroll',
                        deltaY: deltaY,
                        velocity: touchVelocity,
                        timestamp: currentTime,
                        isTouchMove: true,
                        touchY: currentTouchY,
                        screenHeight: window.innerHeight
                    }, '*');
                    
                    // Update for next move
                    touchLastY = currentTouchY;
                    touchLastTime = currentTime;
                }
            }, { passive: true });
            
            window.addEventListener('touchend', (e) => {
                // Report touch end with final velocity for momentum effects
                window.parent.postMessage({
                    type: 'touchEnd',
                    endY: e.changedTouches[0].clientY,
                    startY: touchStartY,
                    velocity: touchVelocity,
                    timestamp: Date.now()
                }, '*');
            }, { passive: true });
            
            // Send initial ready message to parent
            window.parent.postMessage({
                type: 'iframe-ready'
            }, '*');
            
            // Add performance optimizations
            document.addEventListener('DOMContentLoaded', () => {
                // Force hardware acceleration for smoother scrolling
                document.body.style.transform = 'translateZ(0)';
                document.body.style.backfaceVisibility = 'hidden';
                
                // Optimize images and other resources
                const images = document.querySelectorAll('img');
                images.forEach(img => {
                    if (!img.loading) {
                        img.loading = 'lazy';
                    }
                });
            });
        `;
        
        // Append to body or head
        if (iframeDoc.body) {
            iframeDoc.body.appendChild(script);
        } else if (iframeDoc.head) {
            iframeDoc.head.appendChild(script);
        }
    } catch (e) {
        // Error accessing iframe content - likely cross-origin restrictions
        console.log('Cannot inject scroll listener into iframe due to cross-origin policy');
    }
}

// Improved function to handle scroll events from iframes with parallax effect
function handleScrollFromIframe(data) {
    const { deltaY, timestamp, isTouchMove, velocity = 0, touchY, screenHeight } = data;
    
    // If scroll handling is temporarily disabled, ignore
    if (window.scrollState.disableScrollHandlingTimeout) return;
    
    const currentTime = Date.now();
    const timeSinceLastScroll = currentTime - window.scrollState.lastScrollTime;
    
    // Process with improved timing for smoother experience
    if (timeSinceLastScroll > window.scrollState.scrollTimeThreshold || isTouchMove) {
        // Determine scroll direction
        const direction = deltaY > 0 ? 'down' : 'up';
        
        // Use velocity for more natural menu movement
        let effectiveVelocity = velocity || Math.abs(deltaY) / timeSinceLastScroll;
        effectiveVelocity = Math.min(Math.max(effectiveVelocity, 0.1), 1.0);
        
        // Update scroll state
        window.scrollState.lastScrollTime = currentTime;
        window.scrollState.scrollDirection = direction;
        
        // Store touch position for menu parallax effect
        if (isTouchMove && touchY !== undefined) {
            window.scrollState.lastTouchY = touchY;
        }
        
        // Handle menu visibility with improved smoothness based on scroll direction
        if (window.innerWidth <= 768) {  // Only on mobile
            if (direction === 'down' && window.scrollState.isMenuVisible) {
                // Use velocity for more natural transition
                hideMenuWithParallax(effectiveVelocity);
            } else if (direction === 'up' && !window.scrollState.isMenuVisible) {
                // Use velocity for more natural transition
                showMenuWithParallax(effectiveVelocity);
            }
        }
        
        // Reset auto-hide timer
        resetMenuTimer();
    }
}

// New function for parallax menu hiding effect that follows body scroll
function hideMenuWithParallax(velocity = 0.5) {
    const mobileMenu = document.getElementById('mobileMenu');
    const contentWrapper = document.getElementById('contentWrapper');
    
    if (mobileMenu && contentWrapper && !window.scrollState.menuAnimationInProgress) {
        // Set flag to prevent multiple animations
        window.scrollState.menuAnimationInProgress = true;
        
        // Adjust transition duration based on velocity for natural feel
        // Slower velocity = longer animation to match content scroll
        const adjustedDuration = window.scrollState.menuTransitionSpeed / Math.max(velocity, 0.3);
        
        // Add transition with easing that matches natural scroll
        mobileMenu.style.transition = `transform ${adjustedDuration}s cubic-bezier(0.23, 0.82, 0.36, 1)`;
        contentWrapper.style.transition = `margin-bottom ${adjustedDuration}s cubic-bezier(0.23, 0.82, 0.36, 1), height ${adjustedDuration}s cubic-bezier(0.23, 0.82, 0.36, 1)`;
        
        // Apply transition
        mobileMenu.classList.add('hidden');
        contentWrapper.classList.add('full-height');
        window.scrollState.isMenuVisible = false;
        
        // Reset animation flag after transition completes
        setTimeout(() => {
            window.scrollState.menuAnimationInProgress = false;
            
            // Remove transition after animation completes for better performance
            mobileMenu.style.transition = '';
            contentWrapper.style.transition = '';
        }, adjustedDuration * 1000);
        
        // Temporarily disable scroll handling to prevent flicker
        window.scrollState.disableScrollHandlingTimeout = setTimeout(() => {
            window.scrollState.disableScrollHandlingTimeout = null;
        }, adjustedDuration * 1000);
    }
}

// New function for parallax menu showing effect that follows body scroll
function showMenuWithParallax(velocity = 0.5) {
    const mobileMenu = document.getElementById('mobileMenu');
    const contentWrapper = document.getElementById('contentWrapper');
    
    if (mobileMenu && contentWrapper && !window.scrollState.menuAnimationInProgress) {
        // Set flag to prevent multiple animations
        window.scrollState.menuAnimationInProgress = true;
        
        // Adjust transition duration based on velocity for natural feel
        // Slower velocity = longer animation to match content scroll
        const adjustedDuration = window.scrollState.menuTransitionSpeed / Math.max(velocity, 0.3);
        
        // Add transition with easing that matches natural scroll
        mobileMenu.style.transition = `transform ${adjustedDuration}s cubic-bezier(0.23, 0.82, 0.36, 1)`;
        contentWrapper.style.transition = `margin-bottom ${adjustedDuration}s cubic-bezier(0.23, 0.82, 0.36, 1), height ${adjustedDuration}s cubic-bezier(0.23, 0.82, 0.36, 1)`;
        
        // Apply transition
        mobileMenu.classList.remove('hidden');
        contentWrapper.classList.remove('full-height');
        window.scrollState.isMenuVisible = true;
        
        // Reset animation flag after transition completes
        setTimeout(() => {
            window.scrollState.menuAnimationInProgress = false;
            
            // Remove transition after animation completes for better performance
            mobileMenu.style.transition = '';
            contentWrapper.style.transition = '';
        }, adjustedDuration * 1000);
        
        // Temporarily disable scroll handling to prevent flicker
        window.scrollState.disableScrollHandlingTimeout = setTimeout(() => {
            window.scrollState.disableScrollHandlingTimeout = null;
        }, adjustedDuration * 1000);
    }
}

// Legacy function for compatibility - defaults to parallax version
function showMenu() {
    showMenuWithParallax(0.5);
}

// Legacy function for compatibility - defaults to parallax version
function hideMenu() {
    hideMenuWithParallax(0.5);
}

// Function to reset menu auto-hide timer with improved handling
function resetMenuTimer() {
    if (window.scrollState.menuTimer) {
        clearTimeout(window.scrollState.menuTimer);
    }
    
    // Auto-hide menu after delay (only on mobile)
    if (window.innerWidth <= 768) {
        window.scrollState.menuTimer = setTimeout(() => {
            if (window.scrollState.isMenuVisible && !window.scrollState.menuAnimationInProgress) {
                hideMenuWithParallax(0.3); // Slower, more natural hide when automatic
            }
        }, window.scrollState.menuAutoHideDelay);
    }
}

// Initialize page with performance optimizations
document.addEventListener('DOMContentLoaded', () => {
    const mobileMenu = document.getElementById('mobileMenu');
    const contentWrapper = document.getElementById('contentWrapper');
    const menuItems = document.querySelectorAll('.menu-item');
    const sections = document.querySelectorAll('.section');
    
    // Apply performance optimizations
    document.body.style.transform = 'translateZ(0)';
    document.body.style.backfaceVisibility = 'hidden';
    
    // Enhanced content wrapper for smooth scrolling
    if (contentWrapper && window.innerWidth <= 768) {
        // Apply optimized scrolling properties
        contentWrapper.style.scrollSnapType = 'x mandatory';
        contentWrapper.style.scrollBehavior = 'smooth';
        contentWrapper.style.webkitOverflowScrolling = 'touch'; // For iOS smoothness
        contentWrapper.style.overscrollBehavior = 'contain'; // Prevent navigation gestures
        
        // Configure sections for improved snap scrolling
        sections.forEach(section => {
            section.style.scrollSnapAlign = 'center';
            section.style.scrollSnapStop = 'always';
            
            // Apply hardware acceleration for smoother rendering
            section.style.transform = 'translateZ(0)';
            section.style.backfaceVisibility = 'hidden';
        });
    }
    
    // Initialize menu state
    window.scrollState.isMenuVisible = true;
    
    // Load initial content with progressive strategy
    const loadSectionsProgressively = () => {
        // First load the visible section immediately
        const visibleSectionId = 'homeSection'; // Assume starting with home
        loadIframe(visibleSectionId, sectionConfig[visibleSectionId].url, 10);
        
        // Then load others with delay to prioritize visible content
        setTimeout(() => {
            Object.entries(sectionConfig).forEach(([sectionId, config]) => {
                if (sectionId !== visibleSectionId) {
                    loadIframe(sectionId, config.url, 10);
                }
            });
        }, 1000);
    };
    
    loadSectionsProgressively();
    
    // Function to update interaction time and show menu with improved feedback
    const updateInteractionTime = () => {
        // Show menu if it was hidden, with gentle animation
        if (!window.scrollState.isMenuVisible) {
            showMenuWithParallax(0.4); // Medium speed for user interaction
        }
        
        // Reset the timer
        resetMenuTimer();
    };
    
    // Improved section activation with adaptive transitions based on device performance
    const activateSection = (sectionType) => {
        // Prevent activation during animation
        if (window.scrollState.isScrolling) return;
        
        // Find section ID from menu ID
        let targetSectionId = null;
        Object.entries(sectionConfig).forEach(([sectionId, config]) => {
            if (config.menuId === sectionType) {
                targetSectionId = sectionId;
            }
        });
        
        if (!targetSectionId) return;
        
        // Get target section
        const targetSection = document.getElementById(targetSectionId);
        if (!targetSection) return;
        
        // Update menu highlighting with visual feedback
        menuItems.forEach(item => {
            if (item.getAttribute('data-section') === sectionType) {
                item.classList.add('active');
                
                // Add subtle animation for better feedback
                item.style.transform = 'scale(1.05)';
                setTimeout(() => {
                    item.style.transform = '';
                }, 300);
            } else {
                item.classList.remove('active');
            }
        });
        
        // Get section order for tracking
        const sectionOrder = ['homeSection', 'exploreSection', 'profileSection'];
        const targetIndex = sectionOrder.indexOf(targetSectionId);
        const currentIndex = window.scrollState.currentSectionIndex;
        window.scrollState.currentSectionIndex = targetIndex;
        
        // Calculate animation duration based on distance
        const distance = Math.abs(targetIndex - currentIndex);
        const baseDuration = 400; // base animation time in ms
        const duration = Math.min(baseDuration * distance, 600); // cap at 600ms
        
        // Apply smooth scrolling effect with improved animation
        window.scrollState.isScrolling = true;
        
        // Enhanced scroll with adaptive easing for mobile
        if (window.innerWidth <= 768) {
            // Update content navigation state for transition
            contentWrapper.style.scrollBehavior = 'smooth';
            
            // Apply progressive scroll enhancement based on performance capability
            if ('requestIdleCallback' in window) {
                // For high-performance devices, use smoother animation
                requestIdleCallback(() => {
                    // Apply smooth scrolling to the section
                    targetSection.scrollIntoView({
                        behavior: 'smooth',
                        block: 'nearest',
                        inline: 'center'
                    });
                });
            } else {
                // For lower-performance devices, use simpler animation
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                    inline: 'center'
                });
            }
            
            // Add adaptive snap effect after scrolling animation
            clearTimeout(window.scrollState.snapTimeout);
            window.scrollState.snapTimeout = setTimeout(() => {
                // Calculate container dimensions
                const containerWidth = contentWrapper.clientWidth;
                const targetPosition = targetIndex * containerWidth;
                
                // Use requestAnimationFrame for smoother animation
                requestAnimationFrame(() => {
                    // Use optimized scroll to final position
                    contentWrapper.scrollTo({
                        left: targetPosition,
                        behavior: 'smooth'
                    });
                    
                    // Reset scrolling state with progressive timing
                    setTimeout(() => {
                        window.scrollState.isScrolling = false;
                        
                        // Return to auto scroll behavior after complete
                        setTimeout(() => {
                            contentWrapper.style.scrollBehavior = 'auto';
                        }, 200);
                    }, duration);
                });
            }, 50);
        
        } else {
            // For desktop, optimize for instant response
            requestAnimationFrame(() => {
                targetSection.scrollIntoView({
                    behavior: 'auto',
                    block: 'nearest',
                    inline: 'start'
                });
                window.scrollState.isScrolling = false;
            });
        }
        
        // Ensure content is loaded with progressive enhancement
        const iframe = targetSection.querySelector('iframe');
        if (!iframe || !iframe.contentWindow) {
            // Prioritize this section's loading
            loadIframe(targetSectionId, sectionConfig[targetSectionId].url, 10);
        } else {
            // If iframe exists but might be stale, refresh in background
            const currentTime = Date.now();
            const iframeCreationTime = parseInt(targetSection.getAttribute('data-loading-id')?.split('_').pop() || '0');
            
            // Refresh content if it's older than 5 minutes
            if (currentTime - iframeCreationTime > 300000) { // 5 minutes
                setTimeout(() => {
                    loadIframe(targetSectionId, sectionConfig[targetSectionId].url, 10);
                }, 500); // Slight delay to prioritize animation
            }
        }
    };
    
    // Mobile menu item click handlers with improved feedback
    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            const sectionType = item.getAttribute('data-section');
            
            // Provide tactile feedback via animation
            item.style.transform = 'scale(0.95)';
            setTimeout(() => {
                item.style.transform = '';
                activateSection(sectionType);
            }, 100);
            
            updateInteractionTime();
        });
        
        // Add touch feedback for better interaction
        item.addEventListener('touchstart', () => {
            item.style.opacity = '0.8';
        }, { passive: true });
        
        item.addEventListener('touchend', () => {
            item.style.opacity = '1';
        }, { passive: true });
    });
    
    // Start the menu auto-hide timer
    resetMenuTimer();
    
    // Track user interactions to reset the timer with passive listeners for performance
    document.addEventListener('touchstart', updateInteractionTime, { passive: true });
    document.addEventListener('click', updateInteractionTime, { passive: true });
    
    // Enhanced swipe detection with improved physics and momentum
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    let touchMoved = false;
    let initialScrollLeft = 0;
    let touchMoveHistory = []; // Track touch positions for momentum calculation
    
    // Function to calculate swipe velocity based on history
    const calculateSwipeVelocity = () => {
        if (touchMoveHistory.length < 2) return 0;
        
        // Get recent touch points for velocity calculation
        const recentTouches = touchMoveHistory.slice(-5);
        if (recentTouches.length < 2) return 0;
        
        // Calculate velocity using recent points
        const oldestTouch = recentTouches[0];
        const newestTouch = recentTouches[recentTouches.length - 1];
        
        const distance = newestTouch.x - oldestTouch.x;
        const time = newestTouch.time - oldestTouch.time;
        
        return time > 0 ? distance / time : 0; // pixels per ms
    };
    
    document.addEventListener('touchstart', (e) => {
        // Skip if scrolling animation is in progress
        if (window.scrollState.isScrolling || !window.scrollState.allowSwipe) return;
        
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchStartTime = Date.now();
        touchMoved = false;
        touchMoveHistory = []; // Reset history
        
        // Record initial touch
        touchMoveHistory.push({
            x: touchStartX,
            y: touchStartY,
            time: touchStartTime
        });
        
        if (contentWrapper) {
            initialScrollLeft = contentWrapper.scrollLeft;
            
            // Apply momentum scrolling properties
            contentWrapper.style.scrollBehavior = 'auto';
        }
    }, { passive: true });
    
    document.addEventListener('touchmove', (e) => {
        // Skip if scrolling animation is in progress
        if (window.scrollState.isScrolling || !window.scrollState.allowSwipe) return;
        
        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;
        const diffX = touchStartX - currentX;
        const diffY = touchStartY - currentY;
        const currentTime = Date.now();
        
        // Record touch movement for velocity calculation
        touchMoveHistory.push({
            x: currentX,
            y: currentY,
            time: currentTime
        });
        
        // Keep history at reasonable size
        if (touchMoveHistory.length > 10) {
            touchMoveHistory.shift();
        }
        
        // Only handle horizontal swipes with improved angle detection
        if (Math.abs(diffX) > Math.abs(diffY) * 1.2 && Math.abs(diffX) > 8) {
            touchMoved = true;
            
            // Optimize performance by preventing default only when necessary
            e.preventDefault();
            
            // Apply physics-based scrolling with improved resistance for natural feel
            if (contentWrapper && window.innerWidth <= 768) {
                const containerWidth = contentWrapper.clientWidth;
                const numSections = 3; // home, explore, profile
                const maxScroll = containerWidth * (numSections - 1);
                
                let newScrollLeft = initialScrollLeft + diffX;
                
                // Add progressive resistance at boundaries for more natural feel
                if (newScrollLeft < 0) {
                    // Progressive resistance that increases as you pull further
                    const overscroll = Math.abs(newScrollLeft);
                    const resistanceFactor = Math.min(0.3, 0.1 + (overscroll / containerWidth) * 0.2);
                    newScrollLeft = -overscroll * resistanceFactor;
                } else if (newScrollLeft > maxScroll) {
                    // Progressive resistance for overscroll at end
                    const overscroll = newScrollLeft - maxScroll;
                    const resistanceFactor = Math.min(0.3, 0.1 + (overscroll / containerWidth) * 0.2);
                    newScrollLeft = maxScroll + overscroll * resistanceFactor;
                }
                
                // Apply scroll with hardware acceleration
                requestAnimationFrame(() => {
                    contentWrapper.scrollLeft = newScrollLeft;
                });
            }
        }
    }, { passive: false });
    
    document.addEventListener('touchend', (e) => {
        // Skip if scrolling animation is in progress
        if (window.scrollState.isScrolling) return;
        
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const diffX = touchStartX - touchEndX;
        const diffY = touchStartY - touchEndY;
        const elapsedTime = Date.now() - touchStartTime;
        
        // Calculate velocity with improved algorithm
        const velocity = calculateSwipeVelocity(); // pixels per ms
        const absVelocity = Math.abs(velocity);
        const isQuickSwipe = absVelocity > 0.7 && Math.abs(diffX) > 20;
        
        // Only handle horizontal swipes that moved
        if (touchMoved && Math.abs(diffX) > Math.abs(diffY)) {
            // Determine direction
            const direction = diffX > 0 ? 'left' : 'right';
            
            // Get section order and current index
            const sectionOrder = ['homeSection', 'exploreSection', 'profileSection'];
            let currentIndex = window.scrollState.currentSectionIndex;
            
            // Fallback determination if index is invalid
            if (currentIndex < 0 || currentIndex >= sectionOrder.length) {
                const scrollRatio = contentWrapper.scrollLeft / contentWrapper.scrollWidth;
                currentIndex = Math.round(scrollRatio * sectionOrder.length);
                window.scrollState.currentSectionIndex = currentIndex;
            }
            
            let targetIndex;
            
            // Determine target based on swipe velocity and direction
            if (isQuickSwipe) {
                // Quick swipe - change section with momentum consideration
                const momentumFactor = Math.min(Math.floor(absVelocity / 0.7), 2); // Allow multi-section jumps for very fast swipes
                targetIndex = direction === 'left' ? 
                    Math.min(sectionOrder.length - 1, currentIndex + momentumFactor) : 
                    Math.max(0, currentIndex - momentumFactor);
            } else {
                // Slower swipe - check adaptive threshold
                const containerWidth = contentWrapper.clientWidth;
                const threshold = Math.min(containerWidth / 3, 120); // Smaller threshold for easier navigation
                
                if (Math.abs(diffX) > threshold) {
                    // Moved enough to change section
                    targetIndex = direction === 'left' ? 
                        Math.min(sectionOrder.length - 1, currentIndex + 1) : 
                        Math.max(0, currentIndex - 1);
                } else {
                    // Return to current section with animation
                    targetIndex = currentIndex;
                }
            }
            
            // Activate target section with optimized animation
            if (targetIndex !== currentIndex || !isQuickSwipe) {
                const targetSectionId = sectionOrder[targetIndex];
                if (targetSectionId) {
                    const menuId = sectionConfig[targetSectionId].menuId;
                    
                    // Temporarily disable swipe to prevent interference
                    window.scrollState.allowSwipe = false;
                    
                    // Apply smooth scrolling for the transition
                    contentWrapper.style.scrollBehavior = 'smooth';
                    
                    // Update state and activate section
                    window.scrollState.currentSectionIndex = targetIndex;
                    activateSection(menuId);
                    
                    // Re-enable swipe after animation completes with dynamic timing
                    const animationTime = isQuickSwipe ? 300 : 500;
                    setTimeout(() => {
                        window.scrollState.allowSwipe = true;
                        contentWrapper.style.scrollBehavior = 'auto';
                    }, animationTime);
                }
            }
            
            updateInteractionTime();
        }
        
        // Enhanced detection for bottom edge swipe with progressive feedback
        const bottomEdgeThreshold = window.innerHeight * 0.85;
        const isBottomEdgeSwipe = touchStartY > bottomEdgeThreshold && diffY < -40;
        
        if (isBottomEdgeSwipe) {
            // Calculate swipe strength for adaptive animation
            const swipeStrength = Math.min(Math.abs(diffY) / 100, 1.0);
            showMenuWithParallax(swipeStrength); 
            resetMenuTimer();
        }
    }, { passive: true });
    
    // Improved function to determine current visible section with optimization
    const getCurrentVisibleSection = () => {
        if (window.innerWidth <= 768) {
            // Use requestAnimationFrame for smoother calculation
            return new Promise(resolve => {
                requestAnimationFrame(() => {
                    // On mobile, use scroll position with optimized calculation
                    const scrollLeft = contentWrapper.scrollLeft;
                    const containerWidth = contentWrapper.clientWidth;
                    
                    // Calculate which section is most visible using optimized method
                    const sectionOrder = ['homeSection', 'exploreSection', 'profileSection'];
                    
                    // Fast path - check if exactly on a section boundary
                    const exactIndex = Math.round(scrollLeft / containerWidth);
                    if (exactIndex >= 0 && exactIndex < sectionOrder.length && 
                        Math.abs(scrollLeft - (exactIndex * containerWidth)) < 10) {
                        resolve(sectionOrder[exactIndex]);
                        return;
                    }
                    
                    // Calculate the visible ratio for each section with optimization
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
                    
                    resolve(sectionOrder[mostVisibleIndex] || sectionOrder[0]);
                });
            });
        } else {
            // On desktop, just return the first section immediately
            return Promise.resolve('homeSection');
        }
    };
    
    // Improved scroll handler with optimized performance
    let isUpdatingFromScroll = false;
    let lastScrollUpdateTime = 0;
    
    contentWrapper.addEventListener('scroll', () => {
        // Skip excessive updates for better performance
        const now = Date.now();
        if (now - lastScrollUpdateTime < 16) return; // ~60fps max
        lastScrollUpdateTime = now;
        
        if (window.innerWidth <= 768) {
            // Skip if scrolling animation is in progress
            if (window.scrollState.isScrolling) return;
            
            // Avoid recursive scroll updates
            if (isUpdatingFromScroll) return;
            isUpdatingFromScroll = true;
            
            // Update menu based on current visible section using requestAnimationFrame
            requestAnimationFrame(async () => {
                try {
                    const currentSectionId = await getCurrentVisibleSection();
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
                } finally {
                    isUpdatingFromScroll = false;
                }
            });
        }
    }, { passive: true });
    
    // Apply smooth snap scrolling when user stops scrolling
    let snapScrollTimer = null;
    contentWrapper.addEventListener('scroll', () => {
        // Skip if any animation is in progress
        if (window.scrollState.isScrolling || isUpdatingFromScroll) return;
        
        // Clear previous timer
        if (snapScrollTimer) clearTimeout(snapScrollTimer);
        
        // Set a timer to detect when scrolling stops
        snapScrollTimer = setTimeout(() => {
            // Skip if animations in progress
            if (window.scrollState.isScrolling || isUpdatingFromScroll) return;
            
            // Apply snap effect using requestAnimationFrame for better performance
            requestAnimationFrame(() => {
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
                    
                    // Apply smooth scrolling for the snap
                    contentWrapper.style.scrollBehavior = 'smooth';
                    
                    contentWrapper.scrollTo({
                        left: targetPosition,
                        behavior: 'smooth'
                    });
                    
                    // Reset scrolling state after animation completes
                    setTimeout(() => {
                        window.scrollState.isScrolling = false;
                        contentWrapper.style.scrollBehavior = 'auto';
                    }, 400);
                    
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
                }
            });
        }, 100); // Adjust timing for best snap feel
    }, { passive: true });
    
    // Improved resize handler with debounce
    let resizeTimer = null;
    window.addEventListener('resize', () => {
        // Clear previous timer
        if (resizeTimer) clearTimeout(resizeTimer);
        
        // Set timer to prevent excessive updates
        resizeTimer = setTimeout(() => {
            // Recalculate layout for responsive design
            if (window.innerWidth <= 768) {
                // Re-apply optimized snap scroll properties
                requestAnimationFrame(() => {
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
                });
            } else {
                // Remove snap scroll on desktop with performance optimization
                requestAnimationFrame(() => {
                    contentWrapper.style.scrollSnapType = '';
                    contentWrapper.style.scrollBehavior = '';
                    
                    sections.forEach(section => {
                        section.style.scrollSnapAlign = '';
                        section.style.scrollSnapStop = '';
                    });
                });
            }
        }, 100);
    });
    
    // Periodically check for broken iframes and reload if needed using requestIdleCallback
    const scheduleIframeCheck = () => {
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => {
                checkIframes();
                setTimeout(scheduleIframeCheck, 60000); // Schedule next check
            }, { timeout: 5000 });
        } else {
            setTimeout(() => {
                checkIframes();
                setTimeout(scheduleIframeCheck, 60000); // Schedule next check
            }, 60000);
        }
    };
    
    const checkIframes = () => {
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
    };
    
    // Start iframe health checks
    scheduleIframeCheck();
    
    // Apply performance optimizations for better scrolling and animation
    if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
            // Apply hardware acceleration to critical elements
            document.querySelectorAll('.section, #mobileMenu, #contentWrapper').forEach(element => {
                element.style.transform = 'translateZ(0)';
                element.style.backfaceVisibility = 'hidden';
            });
        });
    }
});

// Add global methods for iframe communication with performance optimizations
window.parentInterface = {
    notifyScroll: throttle(function(deltaY) {
        handleScrollFromIframe({
            deltaY: deltaY, 
            timestamp: Date.now()
        });
    }, 16), // 60fps throttle
    
    showMenu: function() {
        showMenuWithParallax(0.5); // Medium speed for explicit action
        resetMenuTimer();
    },
    
    hideMenu: function() {
        hideMenuWithParallax(0.5); // Medium speed for explicit action
    },
    
    // New method for progressive loading
    notifyContentLoaded: function(contentSize) {
        // Adjust auto-hide time based on content size
        if (contentSize && contentSize.height) {
            // For larger content, give more time before auto-hiding menu
            const baseDelay = window.scrollState.menuAutoHideDelay;
            const adjustedDelay = Math.min(baseDelay + (contentSize.height / 1000) * 500, 5000);
            window.scrollState.menuAutoHideDelay = adjustedDelay;
            resetMenuTimer();
        }
    }
};

// Enhanced swipe detection for menu showing with adaptive feedback
let touchStartY = 0;

// Add event listener for swipe up from bottom of screen with improved detection
document.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
    
    // Store state for parallax effects
    window.scrollState.scrollStartPosition = window.scrollY || document.documentElement.scrollTop;
}, { passive: true });

document.addEventListener('touchmove', (e) => {
    const currentTouchY = e.touches[0].clientY;
    const diffY = touchStartY - currentTouchY;
    
    // Store last touch position for parallax menu effects
    window.scrollState.lastTouchY = currentTouchY;
    
    // If near bottom of screen, provide subtle feedback during drag
    if (touchStartY > window.innerHeight * 0.8 && diffY < -20) {
        // Calculate progress for visual feedback (e.g., could adjust opacity)
        const progress = Math.min(Math.abs(diffY) / 100, 1);
        
        // Could apply progressive visual feedback here
        if (progress > 0.3 && !window.scrollState.isMenuVisible && !window.scrollState.menuAnimationInProgress) {
            // Show menu with strength based on swipe
            showMenuWithParallax(progress * 0.5);
        }
    }
}, { passive: true });

document.addEventListener('touchend', (e) => {
    const touchEndY = e.changedTouches[0].clientY;
    const diffY = touchStartY - touchEndY;
    
    // Detect swipe from bottom with progressive trigger
    const bottomThreshold = window.innerHeight * 0.85;
    
    if (touchStartY > bottomThreshold && diffY < -50) {
        // Calculate swipe velocity for natural animation
        const touchDuration = Date.now() - window.scrollState.lastScrollTime;
        const velocity = Math.abs(diffY) / Math.max(touchDuration, 100);
        
        showMenuWithParallax(Math.min(velocity * 2, 1.0));
        resetMenuTimer();
    }
}, { passive: true });

// Add global scroll handler for the main document with improved performance
document.addEventListener('scroll', throttle((e) => {
    const currentScrollY = window.scrollY || document.documentElement.scrollTop;
    const deltaY = currentScrollY - window.scrollState.lastScrollY;
    
    // Only register significant scrolls
    if (Math.abs(deltaY) > window.scrollState.scrollThreshold) {
        const direction = deltaY > 0 ? 'down' : 'up';
        window.scrollState.scrollDirection = direction;
        window.scrollState.lastScrollY = currentScrollY;
        window.scrollState.lastScrollTime = Date.now();
        
        // Calculate velocity for more natural animations
        const velocity = Math.min(Math.abs(deltaY) / 50, 1.0);
        
        // Handle menu visibility based on scroll direction with velocity-based animation
        if (window.innerWidth <= 768) {  // Only on mobile
            if (direction === 'down' && window.scrollState.isMenuVisible) {
                hideMenuWithParallax(velocity);
            } else if (direction === 'up' && !window.scrollState.isMenuVisible) {
                showMenuWithParallax(velocity);
            }
        }
        
        // Reset auto-hide timer
        resetMenuTimer();
    }
}, 16), { passive: true }); // 60fps throttle
