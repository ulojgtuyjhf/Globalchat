
// Configuration for sections and their content
const sectionConfig = {
    'homeSection': {
        url: './menu.html',
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

// Global state for section management
window.appState = {
    currentSectionIndex: 0,
    isScrolling: false,
    allowSwipe: true,
    snapTimeout: null
};

// Function to load iframe with optimized performance
function loadIframe(sectionId, url, maxRetries = 3) {
    const section = document.getElementById(sectionId);
    if (!section) return;
    
    const loadingIndicator = section.querySelector('.loading-indicator');
    let retryCount = 0;
    let loadTimeout = null;

    // Create a unique loading ID to track this specific load attempt
    const loadId = `load_${sectionId}_${Date.now()}`;
    section.setAttribute('data-loading-id', loadId);

    const loadContent = () => {
        if (loadTimeout) clearTimeout(loadTimeout);
        
        // Only proceed if this is still the current load attempt
        if (section.getAttribute('data-loading-id') !== loadId) return;
        
        if (loadingIndicator) loadingIndicator.style.display = 'flex';
        
        const iframe = document.createElement('iframe');
        iframe.setAttribute('loading', 'eager'); // Use browser's eager loading
        iframe.setAttribute('importance', 'high'); // Signal high importance to browser
        
        // Add cache busting to ensure fresh content
        const cacheBustUrl = `${url}${url.includes('?') ? '&' : '?'}_cb=${Date.now()}`;
        iframe.src = cacheBustUrl;

        // Set timeout for loading
        loadTimeout = setTimeout(() => {
            if (section.getAttribute('data-loading-id') === loadId) {
                retryLoad('Timeout');
            }
        }, 15000);

        iframe.onload = () => {
            clearTimeout(loadTimeout);
            
            if (section.getAttribute('data-loading-id') !== loadId) return;
            
            if (loadingIndicator) loadingIndicator.style.display = 'none';
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
        
        // Add the iframe
        section.appendChild(iframe);
    };

    const retryLoad = (reason) => {
        if (loadTimeout) clearTimeout(loadTimeout);
        
        if (section.getAttribute('data-loading-id') !== loadId) return;
        
        console.log(`Retrying ${sectionId}: ${reason}`);
        
        retryCount++;
        if (retryCount <= maxRetries) {
            const delay = Math.min(1000 * Math.pow(1.5, retryCount - 1), 5000);
            setTimeout(loadContent, delay);
        } else {
            displayError();
        }
    };

    const displayError = () => {
        if (section.getAttribute('data-loading-id') !== loadId) return;
        
        if (loadingIndicator) loadingIndicator.style.display = 'none';
        
        Array.from(section.children).forEach(element => {
            if (!element.classList.contains('loading-indicator')) {
                section.removeChild(element);
            }
        });
        
        const errorContainer = document.createElement('div');
        errorContainer.className = 'error-container';
        errorContainer.innerHTML = `
            <div class="error-icon">⚠️</div>
            <div class="error-message">Something went wrong. Please try again.</div>
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

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    const mobileMenu = document.getElementById('mobileMenu');
    const contentWrapper = document.getElementById('contentWrapper');
    const menuItems = document.querySelectorAll('.menu-item');
    const sections = document.querySelectorAll('.section');
    
    // Configure perfect layout
    if (contentWrapper) {
        // Perfect snap scrolling setup
        contentWrapper.style.scrollSnapType = 'x mandatory';
        contentWrapper.style.scrollBehavior = 'smooth';
        contentWrapper.style.webkitOverflowScrolling = 'touch'; // For iOS
        
        // Configure sections for perfect alignment
        sections.forEach(section => {
            section.style.scrollSnapAlign = 'center';
            section.style.scrollSnapStop = 'always';
            section.style.width = '100%';
            section.style.flexShrink = '0';
        });
    }
    
    // Make sure menu is properly fixed
    if (mobileMenu) {
        mobileMenu.style.position = 'fixed';
        mobileMenu.style.bottom = '0';
        mobileMenu.style.left = '0';
        mobileMenu.style.right = '0';
        mobileMenu.style.zIndex = '100';
        mobileMenu.style.background = '#fff'; // Ensure it has a background
        
        // Make sure content has proper spacing
        if (contentWrapper) {
            contentWrapper.style.paddingBottom = `${mobileMenu.offsetHeight}px`;
        }
    }
    
    // Load initial content for all sections - optimized for performance
    Object.entries(sectionConfig).forEach(([sectionId, config]) => {
        // Prioritize loading the currently visible section first
        const priority = sectionId === 'homeSection' ? 0 : (sectionId === 'exploreSection' ? 50 : 100);
        setTimeout(() => {
            loadIframe(sectionId, config.url, 3);
        }, priority);
    });
    
    // Function to activate a section with perfect animation
    const activateSection = (sectionType) => {
        if (window.appState.isScrolling) return;
        
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
        
        // Update menu highlighting
        menuItems.forEach(item => {
            if (item.getAttribute('data-section') === sectionType) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
        
        // Get section order for tracking
        const sectionOrder = ['homeSection', 'exploreSection', 'profileSection'];
        const targetIndex = sectionOrder.indexOf(targetSectionId);
        window.appState.currentSectionIndex = targetIndex;
        
        // Apply perfect scrolling animation
        window.appState.isScrolling = true;
        
        // Perfect scrolling to the section
        targetSection.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center'
        });
        
        // Add snap effect for perfect alignment
        clearTimeout(window.appState.snapTimeout);
        window.appState.snapTimeout = setTimeout(() => {
            // Force snap to exact position for perfect alignment
            const containerWidth = contentWrapper.clientWidth;
            const targetPosition = targetIndex * containerWidth;
            
            contentWrapper.scrollTo({
                left: targetPosition,
                behavior: 'smooth'
            });
            
            setTimeout(() => {
                window.appState.isScrolling = false;
            }, 400);
        }, 50);
        
        // Ensure content is loaded if needed
        const iframe = targetSection.querySelector('iframe');
        if (!iframe || !iframe.contentWindow) {
            loadIframe(targetSectionId, sectionConfig[targetSectionId].url, 3);
        }
    };
    
    // Menu item click handlers - simplified for better performance
    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            const sectionType = item.getAttribute('data-section');
            activateSection(sectionType);
        });
    });
    
    // Optimized swipe detection
    let touchStartX = 0;
    let touchStartTime = 0;
    let touchMoved = false;
    let initialScrollLeft = 0;
    
    document.addEventListener('touchstart', (e) => {
        if (window.appState.isScrolling || !window.appState.allowSwipe) return;
        
        touchStartX = e.touches[0].clientX;
        touchStartTime = Date.now();
        touchMoved = false;
        
        if (contentWrapper) {
            initialScrollLeft = contentWrapper.scrollLeft;
        }
    }, { passive: true });
    
    document.addEventListener('touchmove', (e) => {
        if (window.appState.isScrolling || !window.appState.allowSwipe) return;
        
        const diffX = touchStartX - e.touches[0].clientX;
        
        // Only handle significant horizontal swipes
        if (Math.abs(diffX) > 10) {
            touchMoved = true;
            
            // For smooth direct manipulation feeling
            if (contentWrapper) {
                contentWrapper.scrollLeft = initialScrollLeft + diffX;
            }
        }
    }, { passive: true });
    
    document.addEventListener('touchend', (e) => {
        if (window.appState.isScrolling) return;
        
        const touchEndX = e.changedTouches[0].clientX;
        const diffX = touchStartX - touchEndX;
        const elapsedTime = Date.now() - touchStartTime;
        
        // Only handle horizontal swipes that moved
        if (touchMoved && Math.abs(diffX) > 30) {
            // Calculate velocity for momentum effect
            const velocity = Math.abs(diffX) / elapsedTime;
            const isQuickSwipe = velocity > 0.5;
            
            // Get section order and current index
            const sectionOrder = ['homeSection', 'exploreSection', 'profileSection'];
            let currentIndex = window.appState.currentSectionIndex;
            
            // Determine target based on swipe direction
            const direction = diffX > 0 ? 'left' : 'right';
            const targetIndex = direction === 'left' ? 
                Math.min(sectionOrder.length - 1, currentIndex + 1) : 
                Math.max(0, currentIndex - 1);
            
            // Only change section if needed
            if (targetIndex !== currentIndex) {
                const targetSectionId = sectionOrder[targetIndex];
                if (targetSectionId) {
                    const menuId = sectionConfig[targetSectionId].menuId;
                    
                    // Temporarily disable swipe to prevent interference
                    window.appState.allowSwipe = false;
                    
                    // Update state and activate section
                    window.appState.currentSectionIndex = targetIndex;
                    activateSection(menuId);
                    
                    // Re-enable swipe after animation completes
                    setTimeout(() => {
                        window.appState.allowSwipe = true;
                    }, 500);
                }
            }
        }
    }, { passive: true });
    
    // Add scroll end detection for perfect alignment
    let scrollEndTimer = null;
    contentWrapper.addEventListener('scroll', () => {
        if (!window.appState.isScrolling) {
            // Clear previous timer
            if (scrollEndTimer) clearTimeout(scrollEndTimer);
            
            // Set new timer to detect when scrolling stops
            scrollEndTimer = setTimeout(() => {
                // Apply snap effect for perfect alignment
                const containerWidth = contentWrapper.clientWidth;
                const scrollPosition = contentWrapper.scrollLeft;
                const currentIndex = Math.round(scrollPosition / containerWidth);
                
                // Update current section index
                window.appState.currentSectionIndex = currentIndex;
                
                // Calculate exact position
                const targetPosition = currentIndex * containerWidth;
                
                // Only snap if not already at target position
                if (Math.abs(scrollPosition - targetPosition) > 5) {
                    window.appState.isScrolling = true;
                    
                    contentWrapper.scrollTo({
                        left: targetPosition,
                        behavior: 'smooth'
                    });
                    
                    setTimeout(() => {
                        window.appState.isScrolling = false;
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
            }, 150);
        }
    }, { passive: true });
    
    // Perfect resize handler
    window.addEventListener('resize', () => {
        // Recalculate layout for perfect responsive design
        if (contentWrapper && mobileMenu) {
            // Update content padding for perfect alignment with fixed menu
            contentWrapper.style.paddingBottom = `${mobileMenu.offsetHeight}px`;
            
            // Make sure the current section is perfectly aligned
            const currentIndex = window.appState.currentSectionIndex;
            const containerWidth = contentWrapper.clientWidth;
            const targetPosition = currentIndex * containerWidth;
            
            // Immediate scroll for perfect alignment on resize
            contentWrapper.scrollLeft = targetPosition;
        }
    });
    
    // Periodically check for broken iframes (every 2 minutes)
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
                    // Try to access iframe - will fail if broken
                    if (!iframe.contentWindow) {
                        needsReload = true;
                    }
                } catch (e) {
                    if (e.name !== 'SecurityError') {
                        needsReload = true;
                    }
                }
            }
            
            if (needsReload) {
                console.log(`Reloading iframe in ${sectionId}`);
                loadIframe(sectionId, config.url, 3);
            }
        });
    }, 120000);
});
