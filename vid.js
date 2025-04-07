
// Configuration for sections and their content
const sectionConfig = {
    'homeSection': {
        url: './globalchat.html',
        menuId: 'home'
    },
    'exploreSection': {
        url: './search.html',
        menuId: 'explore'
    },
    'profileSection': {
        url: './profileview.html',
        menuId: 'profile'
    }
};

// Cache DOM elements to avoid repeated queries
const domCache = {};

// Global state for scroll management with optimized defaults
window.scrollState = {
    lastScrollY: 0,
    lastScrollTime: Date.now(),
    scrollDirection: null,
    isMenuVisible: true,
    scrollThreshold: 15, // Increased to reduce processing
    scrollTimeThreshold: 100, // Increased for better performance
    menuTimer: null,
    menuAutoHideDelay: 3000,
    disableScrollHandlingTimeout: null,
    isScrolling: false,
    allowSwipe: true,
    snapTimeout: null,
    currentSectionIndex: 0,
    iframeLoadStates: {} // Track iframe load states
};

// Cache DOM elements for better performance
function cacheDomElements() {
    domCache.mobileMenu = document.getElementById('mobileMenu');
    domCache.contentWrapper = document.getElementById('contentWrapper');
    domCache.menuItems = Array.from(document.querySelectorAll('.menu-item'));
    domCache.sections = Array.from(document.querySelectorAll('.section'));
    
    // Cache section elements
    domCache.sectionElements = {};
    Object.keys(sectionConfig).forEach(sectionId => {
        domCache.sectionElements[sectionId] = document.getElementById(sectionId);
    });
}

// Performance optimized throttle function
function throttle(func, limit) {
    let inThrottle = false;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Optimized debounce function
function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// Optimized iframe loading with caching and resource management
function loadIframe(sectionId, url, maxRetries = 3) {
    const section = domCache.sectionElements[sectionId];
    if (!section) return;
    
    // Check if we already have a loading attempt in progress
    if (window.scrollState.iframeLoadStates[sectionId] === 'loading') return;
    
    const loadingIndicator = section.querySelector('.loading-indicator');
    let retryCount = 0;
    
    // Create a unique loading ID
    const loadId = `load_${sectionId}_${Date.now()}`;
    section.setAttribute('data-loading-id', loadId);
    window.scrollState.iframeLoadStates[sectionId] = 'loading';
    
    const loadContent = () => {
        // Show loading indicator
        if (loadingIndicator) loadingIndicator.style.display = 'flex';
        
        // Check for existing iframe and remove if necessary
        const existingIframe = section.querySelector('iframe');
        if (existingIframe) {
            // Clean up event listeners to prevent memory leaks
            if (existingIframe.contentWindow) {
                try {
                    existingIframe.contentWindow.onunload = null;
                    existingIframe.onload = null;
                    existingIframe.onerror = null;
                } catch (e) {
                    // Ignore cross-origin errors
                }
            }
            section.removeChild(existingIframe);
        }
        
        const iframe = document.createElement('iframe');
        
        // Use timestamp for cache busting but limit frequency
        const cacheBuster = Math.floor(Date.now() / 60000); // Changes every minute
        const cacheBustUrl = `${url}${url.includes('?') ? '&' : '?'}_cb=${cacheBuster}`;
        iframe.src = cacheBustUrl;

        // Set up load handlers
        const onLoadTimeout = setTimeout(() => {
            if (section.getAttribute('data-loading-id') === loadId) {
                handleLoadError('Timeout');
            }
        }, 12000); // Reduced timeout for better UX

        iframe.onload = () => {
            clearTimeout(onLoadTimeout);
            
            if (section.getAttribute('data-loading-id') !== loadId) return;
            
            if (loadingIndicator) loadingIndicator.style.display = 'none';
            
            // Verify content loaded correctly
            try {
                // Basic check for content
                const hasContent = iframe.contentDocument && iframe.contentDocument.body;
                if (!hasContent) throw new Error('Empty content');
                
                // Light-weight scroll listener injection
                injectScrollListenerIntoIframe(iframe);
                
                // Mark as successfully loaded
                window.scrollState.iframeLoadStates[sectionId] = 'loaded';
            } catch (e) {
                // For cross-origin, assume success
                window.scrollState.iframeLoadStates[sectionId] = 'loaded';
            }
        };

        iframe.onerror = () => {
            clearTimeout(onLoadTimeout);
            handleLoadError('Load error');
        };

        // Add the iframe
        section.appendChild(iframe);
    };

    const handleLoadError = (reason) => {
        if (section.getAttribute('data-loading-id') !== loadId) return;
        
        retryCount++;
        if (retryCount <= maxRetries) {
            console.log(`Retrying ${sectionId} (${retryCount}/${maxRetries}): ${reason}`);
            
            // Exponential backoff with max delay
            const delay = Math.min(1000 * Math.pow(1.5, retryCount - 1), 5000);
            setTimeout(loadContent, delay);
        } else {
            displayError();
            window.scrollState.iframeLoadStates[sectionId] = 'error';
        }
    };

    const displayError = () => {
        if (section.getAttribute('data-loading-id') !== loadId) return;
        
        if (loadingIndicator) loadingIndicator.style.display = 'none';
        
        // Clean up existing content except loading indicator
        Array.from(section.children).forEach(element => {
            if (!element.classList.contains('loading-indicator')) {
                section.removeChild(element);
            }
        });
        
        // Create error message with minimal DOM operations
        const errorContainer = document.createElement('div');
        errorContainer.className = 'error-container';
        errorContainer.innerHTML = `
            <div class="error-icon">⚠️</div>
            <div class="error-message">Hmm...something went wrong.</div>
            <button class="retry-button" id="retry-${sectionId}">Retry</button>
        `;
        
        section.appendChild(errorContainer);
        
        // Add retry button handler
        document.getElementById(`retry-${sectionId}`).addEventListener('click', () => {
            retryCount = 0;
            loadContent();
        });
    };

    loadContent();
}

// Optimized scroll listener injection
function injectScrollListenerIntoIframe(iframe) {
    try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        if (!iframeDoc) return;
        
        // Create script element with optimized code
        const script = iframeDoc.createElement('script');
        script.textContent = `
            // Optimized scroll detection
            let lastScrollY = 0;
            let ticking = false;
            
            // Throttled scroll handler
            function handleScroll() {
                if (!ticking) {
                    requestAnimationFrame(() => {
                        const currentScrollY = window.scrollY || document.documentElement.scrollTop;
                        const deltaY = currentScrollY - lastScrollY;
                        
                        // Only send significant scrolls
                        if (Math.abs(deltaY) > 10) {
                            window.parent.postMessage({
                                type: 'scroll',
                                deltaY: deltaY,
                                timestamp: Date.now()
                            }, '*');
                            
                            lastScrollY = currentScrollY;
                        }
                        ticking = false;
                    });
                    ticking = true;
                }
            }
            
            // Use passive event listener for better performance
            window.addEventListener('scroll', handleScroll, { passive: true });
            
            // Optimized touch handling
            let touchStartY = 0;
            let touchActive = false;
            
            window.addEventListener('touchstart', (e) => {
                touchStartY = e.touches[0].clientY;
                touchActive = true;
            }, { passive: true });
            
            window.addEventListener('touchmove', (e) => {
                if (!touchActive) return;
                
                const currentTouchY = e.touches[0].clientY;
                const deltaY = touchStartY - currentTouchY;
                
                // Only send significant movements
                if (Math.abs(deltaY) > 15) {
                    window.parent.postMessage({
                        type: 'scroll',
                        deltaY: deltaY,
                        timestamp: Date.now(),
                        isTouchMove: true
                    }, '*');
                    
                    // Update for next move
                    touchStartY = currentTouchY;
                }
            }, { passive: true });
            
            window.addEventListener('touchend', () => {
                touchActive = false;
            }, { passive: true });
            
            // Send ready message
            window.parent.postMessage({ type: 'iframe-ready' }, '*');
        `;
        
        // Append to body or head
        if (iframeDoc.body) {
            iframeDoc.body.appendChild(script);
        } else if (iframeDoc.head) {
            iframeDoc.head.appendChild(script);
        }
    } catch (e) {
        // Ignore cross-origin restrictions
    }
}

// Optimized scroll handler using requestAnimationFrame
function handleScrollFromIframe(data) {
    const { deltaY, timestamp } = data;
    
    // If scroll handling is disabled, ignore
    if (window.scrollState.disableScrollHandlingTimeout) return;
    
    const currentTime = Date.now();
    const timeSinceLastScroll = currentTime - window.scrollState.lastScrollTime;
    
    // Only process if enough time has passed
    if (timeSinceLastScroll > window.scrollState.scrollTimeThreshold) {
        // Determine scroll direction
        const direction = deltaY > 0 ? 'down' : 'up';
        
        // Update scroll state
        window.scrollState.lastScrollTime = currentTime;
        window.scrollState.scrollDirection = direction;
        
        // Only change menu visibility on mobile
        if (window.innerWidth <= 768) {
            if (direction === 'down' && window.scrollState.isMenuVisible) {
                requestAnimationFrame(hideMenu);
            } else if (direction === 'up' && !window.scrollState.isMenuVisible) {
                requestAnimationFrame(showMenu);
            }
        }
        
        // Reset auto-hide timer
        resetMenuTimer();
    }
}

// Optimized menu show/hide with requestAnimationFrame for better performance
function showMenu() {
    if (!domCache.mobileMenu || !domCache.contentWrapper) return;
    
    // Use requestAnimationFrame for smoother animation
    requestAnimationFrame(() => {
        // Apply transitions only when needed
        domCache.mobileMenu.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        domCache.contentWrapper.style.transition = 'margin-bottom 0.3s cubic-bezier(0.4, 0, 0.2, 1), height 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        
        domCache.mobileMenu.classList.remove('hidden');
        domCache.contentWrapper.classList.remove('full-height');
        window.scrollState.isMenuVisible = true;
        
        // Temporarily disable scroll handling
        window.scrollState.disableScrollHandlingTimeout = setTimeout(() => {
            window.scrollState.disableScrollHandlingTimeout = null;
            
            // Clean up transitions after animation
            requestAnimationFrame(() => {
                domCache.mobileMenu.style.transition = '';
                domCache.contentWrapper.style.transition = '';
            });
        }, 350);
    });
}

function hideMenu() {
    if (!domCache.mobileMenu || !domCache.contentWrapper) return;
    
    // Use requestAnimationFrame for smoother animation
    requestAnimationFrame(() => {
        // Apply transitions only when needed
        domCache.mobileMenu.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        domCache.contentWrapper.style.transition = 'margin-bottom 0.3s cubic-bezier(0.4, 0, 0.2, 1), height 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        
        domCache.mobileMenu.classList.add('hidden');
        domCache.contentWrapper.classList.add('full-height');
        window.scrollState.isMenuVisible = false;
        
        // Temporarily disable scroll handling
        window.scrollState.disableScrollHandlingTimeout = setTimeout(() => {
            window.scrollState.disableScrollHandlingTimeout = null;
            
            // Clean up transitions after animation
            requestAnimationFrame(() => {
                domCache.mobileMenu.style.transition = '';
                domCache.contentWrapper.style.transition = '';
            });
        }, 350);
    });
}

// Optimized timer reset
function resetMenuTimer() {
    if (window.scrollState.menuTimer) {
        clearTimeout(window.scrollState.menuTimer);
        window.scrollState.menuTimer = null;
    }
    
    // Only set timer on mobile
    if (window.innerWidth <= 768) {
        window.scrollState.menuTimer = setTimeout(() => {
            if (window.scrollState.isMenuVisible) {
                hideMenu();
            }
        }, window.scrollState.menuAutoHideDelay);
    }
}

// Optimized section activation
function activateSection(sectionType) {
    // Prevent activation during animation
    if (window.scrollState.isScrolling) return;
    
    // Find section ID from menu ID
    let targetSectionId = null;
    for (const [sectionId, config] of Object.entries(sectionConfig)) {
        if (config.menuId === sectionType) {
            targetSectionId = sectionId;
            break;
        }
    }
    
    if (!targetSectionId) return;
    
    // Get target section
    const targetSection = domCache.sectionElements[targetSectionId];
    if (!targetSection) return;
    
    // Update menu highlighting efficiently
    domCache.menuItems.forEach(item => {
        if (item.getAttribute('data-section') === sectionType) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    // Get section order and target index
    const sectionOrder = ['homeSection', 'exploreSection', 'profileSection'];
    const targetIndex = sectionOrder.indexOf(targetSectionId);
    window.scrollState.currentSectionIndex = targetIndex;
    
    // Different behavior for mobile/desktop
    window.scrollState.isScrolling = true;
    
    if (window.innerWidth <= 768) {
        // Get exact position for scroll
        const containerWidth = domCache.contentWrapper.clientWidth;
        const targetPosition = targetIndex * containerWidth;
        
        // Use requestAnimationFrame for smoother scrolling
        requestAnimationFrame(() => {
            domCache.contentWrapper.scrollTo({
                left: targetPosition,
                behavior: 'smooth'
            });
            
            // Reset scrolling state after animation
            setTimeout(() => {
                window.scrollState.isScrolling = false;
            }, 400);
        });
    } else {
        // Instant scroll for desktop
        targetSection.scrollIntoView({
            behavior: 'auto',
            block: 'nearest',
            inline: 'start'
        });
        window.scrollState.isScrolling = false;
    }
    
    // Ensure content is loaded if needed
    if (window.scrollState.iframeLoadStates[targetSectionId] !== 'loaded') {
        loadIframe(targetSectionId, sectionConfig[targetSectionId].url, 3);
    }
}

// Initialize page with optimized loading
function initializePage() {
    // Cache DOM elements first
    cacheDomElements();
    
    // Initialize menu state
    window.scrollState.isMenuVisible = true;
    
    // Configure sections for mobile/desktop
    if (domCache.contentWrapper && window.innerWidth <= 768) {
        // Add smooth scrolling properties
        domCache.contentWrapper.style.scrollSnapType = 'x mandatory';
        domCache.contentWrapper.style.scrollBehavior = 'smooth';
        
        // Configure sections for snap scrolling
        domCache.sections.forEach(section => {
            section.style.scrollSnapAlign = 'center';
            section.style.scrollSnapStop = 'always';
        });
    }
    
    // Load initial content more efficiently
    let loadDelay = 0;
    Object.entries(sectionConfig).forEach(([sectionId, config], index) => {
        // Stagger loads to improve performance
        setTimeout(() => {
            if (index === 0 || window.innerWidth > 768) {
                // Load immediately for first section or on desktop
                loadIframe(sectionId, config.url, 3);
            } else {
                // Mark as not loaded but don't load yet
                window.scrollState.iframeLoadStates[sectionId] = 'not_loaded';
            }
        }, loadDelay);
        loadDelay += 200; // Stagger loads to reduce CPU spikes
    });
    
    // Set up event listeners
    setupEventListeners();
    
    // Start the menu auto-hide timer
    resetMenuTimer();
    
    // Set up message listener for iframe communication
    window.addEventListener('message', handleIframeMessage, false);
    
    // Set up check for broken iframes
    setInterval(checkForBrokenIframes, 120000); // Reduced check frequency
}

// Centralized event handler setup
function setupEventListeners() {
    // Optimized touch handlers
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    let initialScrollLeft = 0;
    let isTouchActive = false;
    
    // Menu item click handlers
    domCache.menuItems.forEach(item => {
        item.addEventListener('click', () => {
            const sectionType = item.getAttribute('data-section');
            activateSection(sectionType);
            updateInteractionTime();
        });
    });
    
    // Interaction handlers
    const updateInteractionTime = () => {
        if (!window.scrollState.isMenuVisible) {
            showMenu();
        }
        resetMenuTimer();
    };
    
    // Use passive listeners for better performance
    document.addEventListener('touchstart', (e) => {
        if (window.scrollState.isScrolling || !window.scrollState.allowSwipe) return;
        
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchStartTime = Date.now();
        isTouchActive = true;
        
        if (domCache.contentWrapper) {
            initialScrollLeft = domCache.contentWrapper.scrollLeft;
        }
        
        // Show menu if swiping from bottom edge
        if (touchStartY > window.innerHeight - 80) {
            updateInteractionTime();
        }
    }, { passive: true });
    
    // Optimized touch move handler with throttling
    const handleTouchMove = throttle((e) => {
        if (!isTouchActive || window.scrollState.isScrolling || !window.scrollState.allowSwipe) return;
        
        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;
        const diffX = touchStartX - currentX;
        const diffY = touchStartY - currentY;
        
        // Only handle significant horizontal movements
        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 15 && window.innerWidth <= 768) {
            // Calculate new position with resistance
            if (domCache.contentWrapper) {
                const containerWidth = domCache.contentWrapper.clientWidth;
                const numSections = 3;
                const maxScroll = containerWidth * (numSections - 1);
                
                let newScrollLeft = initialScrollLeft + diffX;
                
                // Add resistance at boundaries
                if (newScrollLeft < 0) {
                    newScrollLeft = diffX / 3;
                } else if (newScrollLeft > maxScroll) {
                    newScrollLeft = maxScroll + (diffX - (maxScroll - initialScrollLeft)) / 3;
                }
                
                // Apply scroll with requestAnimationFrame
                requestAnimationFrame(() => {
                    domCache.contentWrapper.scrollLeft = newScrollLeft;
                });
            }
        }
    }, 16); // 60fps throttle
    
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    
    document.addEventListener('touchend', (e) => {
        if (!isTouchActive) return;
        isTouchActive = false;
        
        if (window.scrollState.isScrolling) return;
        
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const diffX = touchStartX - touchEndX;
        const diffY = touchStartY - touchEndY;
        const elapsedTime = Date.now() - touchStartTime;
        
        // Handle horizontal swipes
        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 30 && window.innerWidth <= 768) {
            // Calculate velocity
            const velocity = Math.abs(diffX) / elapsedTime;
            const isQuickSwipe = velocity > 0.5 && Math.abs(diffX) > 30;
            
            // Determine direction
            const direction = diffX > 0 ? 'left' : 'right';
            
            // Get section order and indices
            const sectionOrder = ['homeSection', 'exploreSection', 'profileSection'];
            let currentIndex = window.scrollState.currentSectionIndex;
            
            // Fallback determination if index is invalid
            if (currentIndex < 0 || currentIndex >= sectionOrder.length) {
                const scrollRatio = domCache.contentWrapper.scrollLeft / domCache.contentWrapper.scrollWidth;
                currentIndex = Math.round(scrollRatio * sectionOrder.length);
                window.scrollState.currentSectionIndex = currentIndex;
            }
            
            // Determine target section
            let targetIndex;
            
            if (isQuickSwipe) {
                targetIndex = direction === 'left' ? 
                    Math.min(sectionOrder.length - 1, currentIndex + 1) : 
                    Math.max(0, currentIndex - 1);
            } else {
                // Check if moved enough (33% of screen)
                const containerWidth = domCache.contentWrapper.clientWidth;
                const threshold = containerWidth / 3;
                
                if (Math.abs(diffX) > threshold) {
                    targetIndex = direction === 'left' ? 
                        Math.min(sectionOrder.length - 1, currentIndex + 1) : 
                        Math.max(0, currentIndex - 1);
                } else {
                    targetIndex = currentIndex;
                }
            }
            
            // Activate section if changed or needs snap
            if (targetIndex !== currentIndex || !isQuickSwipe) {
                const targetSectionId = sectionOrder[targetIndex];
                if (targetSectionId) {
                    const menuId = sectionConfig[targetSectionId].menuId;
                    
                    // Temporarily disable swipe
                    window.scrollState.allowSwipe = false;
                    
                    // Update state and activate
                    window.scrollState.currentSectionIndex = targetIndex;
                    activateSection(menuId);
                    
                    // Re-enable swipe after animation
                    setTimeout(() => {
                        window.scrollState.allowSwipe = true;
                    }, 400);
                }
            }
            
            updateInteractionTime();
        }
        
        // Detect swipe from bottom edge to show menu
        if (Math.abs(diffY) > 50 && touchStartY > window.innerHeight - 100 && diffY < 0) {
            showMenu();
            resetMenuTimer();
        }
    }, { passive: true });
    
    // Efficient scroll handler using requestAnimationFrame
    const handleContentScroll = debounce(() => {
        if (window.innerWidth <= 768 && !window.scrollState.isScrolling) {
            // Get current visible section
            const currentSectionId = getCurrentVisibleSection();
            if (currentSectionId && sectionConfig[currentSectionId]) {
                const menuId = sectionConfig[currentSectionId].menuId;
                
                // Update section index
                const sectionOrder = ['homeSection', 'exploreSection', 'profileSection'];
                window.scrollState.currentSectionIndex = sectionOrder.indexOf(currentSectionId);
                
                // Update menu UI
                domCache.menuItems.forEach(item => {
                    if (item.getAttribute('data-section') === menuId) {
                        item.classList.add('active');
                    } else {
                        item.classList.remove('active');
                    }
                });
                
                // Load content if needed
                if (window.scrollState.iframeLoadStates[currentSectionId] !== 'loaded' && 
                    window.scrollState.iframeLoadStates[currentSectionId] !== 'loading') {
                    loadIframe(currentSectionId, sectionConfig[currentSectionId].url, 3);
                }
            }
            
            updateInteractionTime();
        }
    }, 100);
    
    // Add scroll end detection with better performance
    const handleScrollEnd = debounce(() => {
        if (window.innerWidth <= 768 && !window.scrollState.isScrolling) {
            // Apply snap effect
            const containerWidth = domCache.contentWrapper.clientWidth;
            const scrollPosition = domCache.contentWrapper.scrollLeft;
            const currentIndex = Math.round(scrollPosition / containerWidth);
            
            // Update current section index
            window.scrollState.currentSectionIndex = currentIndex;
            
            // Calculate exact position
            const targetPosition = currentIndex * containerWidth;
            
            // Only snap if not already at target position
            if (Math.abs(scrollPosition - targetPosition) > 5) {
                window.scrollState.isScrolling = true;
                
                requestAnimationFrame(() => {
                    domCache.contentWrapper.scrollTo({
                        left: targetPosition,
                        behavior: 'smooth'
                    });
                    
                    // Reset scrolling state after animation
                    setTimeout(() => {
                        window.scrollState.isScrolling = false;
                    }, 400);
                });
            }
            
            // Update menu indicators
            const sectionOrder = ['homeSection', 'exploreSection', 'profileSection'];
            if (currentIndex >= 0 && currentIndex < sectionOrder.length) {
                const currentSectionId = sectionOrder[currentIndex];
                const menuId = sectionConfig[currentSectionId].menuId;
                
                domCache.menuItems.forEach(item => {
                    if (item.getAttribute('data-section') === menuId) {
                        item.classList.add('active');
                    } else {
                        item.classList.remove('active');
                    }
                });
            }
        }
    }, 150);
    
    // Combine scroll handlers
    if (domCache.contentWrapper) {
        domCache.contentWrapper.addEventListener('scroll', () => {
            handleContentScroll();
            handleScrollEnd();
        }, { passive: true });
    }
    
    // Optimized resize handler with debounce
    const handleResize = debounce(() => {
        // Recalculate layout for responsive design
        if (window.innerWidth <= 768) {
            // Apply snap scroll properties
            domCache.contentWrapper.style.scrollSnapType = 'x mandatory';
            domCache.contentWrapper.style.scrollBehavior = 'smooth';
            
            domCache.sections.forEach(section => {
                section.style.scrollSnapAlign = 'center';
                section.style.scrollSnapStop = 'always';
            });
            
            // Make sure the current section is properly scrolled into view
            const currentIndex = window.scrollState.currentSectionIndex;
            const containerWidth = domCache.contentWrapper.clientWidth;
            const targetPosition = currentIndex * containerWidth;
            
            // Use instant scroll to avoid animation on resize
            domCache.contentWrapper.scrollLeft = targetPosition;
        } else {
            // Remove snap scroll on desktop
            domCache.contentWrapper.style.scrollSnapType = '';
            domCache.contentWrapper.style.scrollBehavior = '';
            
            domCache.sections.forEach(section => {
                section.style.scrollSnapAlign = '';
                section.style.scrollSnapStop = '';
            });
        }
    }, 250);
    
    window.addEventListener('resize', handleResize, { passive: true });
    
    // Global scroll handler
    document.addEventListener('scroll', throttle((e) => {
        const currentScrollY = window.scrollY || document.documentElement.scrollTop;
        const deltaY = currentScrollY - window.scrollState.lastScrollY;
        
        // Only register significant scrolls
        if (Math.abs(deltaY) > window.scrollState.scrollThreshold) {
            const direction = deltaY > 0 ? 'down' : 'up';
            window.scrollState.scrollDirection = direction;
            window.scrollState.lastScrollY = currentScrollY;
            window.scrollState.lastScrollTime = Date.now();
            
            // Handle menu visibility on mobile
            if (window.innerWidth <= 768) {
                if (direction === 'down' && window.scrollState.isMenuVisible) {
                    hideMenu();
                } else if (direction === 'up' && !window.scrollState.isMenuVisible) {
                    showMenu();
                }
            }
            
            resetMenuTimer();
        }
    }, 100), { passive: true });
    
    // Add interaction handlers
    document.addEventListener('touchstart', updateInteractionTime, { passive: true });
    document.addEventListener('click', updateInteractionTime, { passive: true });
}


// Function to handle iframe messages (continued)
function handleIframeMessage(event) {
    if (event.data && event.data.type === 'scroll') {
        handleScrollFromIframe(event.data);
    } else if (event.data && event.data.type === 'iframe-ready') {
        // Handle iframe ready message
        console.log('Iframe is ready');
    }
}

// Get current visible section more efficiently
function getCurrentVisibleSection() {
    if (window.innerWidth <= 768) {
        const scrollLeft = domCache.contentWrapper.scrollLeft;
        const containerWidth = domCache.contentWrapper.clientWidth;
        
        // Calculate section index based on scroll position
        const sectionIndex = Math.round(scrollLeft / containerWidth);
        
        // Map to section ID
        const sectionOrder = ['homeSection', 'exploreSection', 'profileSection'];
        return sectionOrder[sectionIndex] || sectionOrder[0];
    } else {
        // On desktop, just return the first section
        return 'homeSection';
    }
}

// Check for broken iframes periodically with reduced frequency
function checkForBrokenIframes() {
    Object.entries(sectionConfig).forEach(([sectionId, config]) => {
        const section = domCache.sectionElements[sectionId];
        if (!section) return;
        
        const iframe = section.querySelector('iframe');
        
        // Skip sections that are not currently visible
        if (window.innerWidth <= 768) {
            const currentVisible = getCurrentVisibleSection();
            if (currentVisible !== sectionId) return;
        }
        
        // Check if iframe is broken or missing
        let needsReload = false;
        
        if (!iframe) {
            needsReload = true;
        } else {
            try {
                // Try to access iframe properties
                if (!iframe.contentWindow) {
                    needsReload = true;
                }
            } catch (e) {
                // Only reload if it's not a security error
                if (e.name !== 'SecurityError') {
                    needsReload = true;
                }
            }
        }
        
        if (needsReload && window.scrollState.iframeLoadStates[sectionId] !== 'loading') {
            console.log(`Reloading iframe in ${sectionId}`);
            loadIframe(sectionId, config.url, 3);
        }
    });
}

// Parent interface for iframe communication
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

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initializePage);
