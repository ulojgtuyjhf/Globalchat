
// Configuration for sections and their content
const sectionConfig = {
    'homeSection': {
        url: './feeds.html',
        menuId: 'home'
    },
    'exploreSection': {
        url: './search.html',
        menuId: 'explore'
    },
    'notificationsSection': {
        url: './notifications.html',
        menuId: 'notifications'
    },
    'messagesSection': {
        url: './messages.html',
        menuId: 'messages'
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
    scrollThreshold: 15,
    scrollTimeThreshold: 100,
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
    domCache.navContainer = document.getElementById('navContainer');
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
    if (!domCache.navContainer || !domCache.contentWrapper) return;
    
    // Use requestAnimationFrame for smoother animation
    requestAnimationFrame(() => {
        // Apply transitions only when needed
        domCache.navContainer.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        domCache.contentWrapper.style.transition = 'margin-top 0.3s cubic-bezier(0.4, 0, 0.2, 1), height 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        
        domCache.navContainer.classList.remove('hidden');
        domCache.contentWrapper.classList.remove('full-height');
        window.scrollState.isMenuVisible = true;
        
        // Temporarily disable scroll handling
        window.scrollState.disableScrollHandlingTimeout = setTimeout(() => {
            window.scrollState.disableScrollHandlingTimeout = null;
            
            // Clean up transitions after animation
            requestAnimationFrame(() => {
                domCache.navContainer.style.transition = '';
                domCache.contentWrapper.style.transition = '';
            });
        }, 350);
    });
}

function hideMenu() {
    if (!domCache.navContainer || !domCache.contentWrapper) return;
    
    // Use requestAnimationFrame for smoother animation
    requestAnimationFrame(() => {
        // Apply transitions only when needed
        domCache.navContainer.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        domCache.contentWrapper.style.transition = 'margin-top 0.3s cubic-bezier(0.4, 0, 0.2, 1), height 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        
        domCache.navContainer.classList.add('hidden');
        domCache.contentWrapper.classList.add('full-height');
        window.scrollState.isMenuVisible = false;
        
        // Temporarily disable scroll handling
        window.scrollState.disableScrollHandlingTimeout = setTimeout(() => {
            window.scrollState.disableScrollHandlingTimeout = null;
            
            // Clean up transitions after animation
            requestAnimationFrame(() => {
                domCache.navContainer.style.transition = '';
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
    const sectionOrder = ['homeSection', 'exploreSection', 'notificationsSection', 'messagesSection', 'profileSection'];
    const targetIndex = sectionOrder.indexOf(targetSectionId);
    window.scrollState.currentSectionIndex = targetIndex;
    
    // Different behavior for mobile/desktop
    window.scrollState.isScrolling = true;
    
    if (window.innerWidth <= 768) {
        // Focus on the target section
        targetSection.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center'
        });
        
        // Reset scrolling state after animation
        setTimeout(() => {
            window.scrollState.isScrolling = false;
        }, 400);
    } else {
        // Show target section
        domCache.sections.forEach(section => {
            if (section.id === targetSectionId) {
                section.classList.add('active');
            } else {
                section.classList.remove('active');
            }
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
        // Show menu if swiping from bottom edge
        if (e.touches[0].clientY > window.innerHeight - 80) {
            updateInteractionTime();
        }
    }, { passive: true });
    
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
    
    // Fix for blue indicator when switching sections
    domCache.menuItems.forEach(item => {
        item.addEventListener('click', () => {
            // Force indicator animation reset
            const indicator = item.querySelector('.menu-indicator::after');
            if (indicator) {
                indicator.style.transition = 'none';
                indicator.offsetHeight; // Force reflow
                indicator.style.transition = '';
            }
        });
    });
}

// Function to handle iframe messages
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
        const sections = Array.from(document.querySelectorAll('.section'));
        
        // Find the section most in view
        let mostVisibleSection = null;
        let maxVisibility = 0;
        
        sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            
            // Calculate how much of section is visible
            const visibleWidth = Math.min(rect.right, viewportWidth) - Math.max(rect.left, 0);
            const visibilityRatio = visibleWidth / rect.width;
            
            if (visibilityRatio > maxVisibility) {
                maxVisibility = visibilityRatio;
                mostVisibleSection = section.id;
            }
        });
        
        return mostVisibleSection;
    } else {
        // On desktop, active section
        const activeSection = document.querySelector('.section.active');
        return activeSection ? activeSection.id : 'homeSection';
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
