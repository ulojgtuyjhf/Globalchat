
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="icon" type="image/png" href="https://firebasestorage.googleapis.com/v0/b/chatnot-e5b4e.firebasestorage.app/o/Black%20and%20Blue%20Initials%20Creative%20Logo_20250214_091517_0000.png?alt=media&token=e420af56-8bd5-4691-b246-b0485c30dccd">
    <title>Manu</title>
    <style>
        /* Global Reset */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        /* Prevent scrolling */
        html, body {
            overflow: hidden;
            height: 100%;
        }

        body {
            display: flex;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #15202b; /* Twitter dark blue background */
            color: #ffffff;
        }

        .container {
            display: flex;
            width: 100%;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            scroll-behavior: smooth;
            -webkit-overflow-scrolling: touch;
            background-color: #15202b;
        }

        .left-section, .middle-section, .right-section {
            display: flex;
            justify-content: center;
            align-items: center;
            position: relative;
            flex-shrink: 0;
            width: 25%;
            height: 100vh;
            scroll-snap-align: center;
            scroll-snap-stop: always;
            overflow: hidden;
            background-color: #15202b;
            border-right: 1px solid #38444d; /* Twitter border color */
        }

        .right-section {
            border-right: none;
        }

        .middle-section {
            width: 50%;
            border-left: 1px solid #38444d;
            border-right: 1px solid #38444d;
        }

        iframe {
            width: 100%;
            height: 100%;
            border: none;
            display: block;
            opacity: 0;
            transition: opacity 0.3s ease;
            background-color: #15202b;
        }

        iframe.loaded {
            opacity: 1;
        }

        /* Twitter-style Loading Spinner */
        .loading-indicator {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 10;
        }

        .loading-spinner {
            width: 30px;
            height: 30px;
            border: 3px solid rgba(29, 155, 240, 0.2);
            border-left: 3px solid #1d9bf0;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }

        .error-state {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #192734;
            padding: 20px;
            border-radius: 16px;
            border: 1px solid #38444d;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            text-align: center;
            display: none;
            color: #ffffff;
        }

        .retry-button {
            margin-top: 16px;
            padding: 10px 20px;
            background: #1d9bf0;
            color: white;
            border: none;
            border-radius: 9999px;
            cursor: pointer;
            transition: background 0.2s ease;
            font-weight: bold;
            font-size: 14px;
        }

        .retry-button:hover {
            background: #1a8cd8;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        /* Mobile Specific Styles */
        @media (max-width: 768px) {
            .left-section, .right-section, .middle-section {
                width: 100%;
                height: 100vh;
                border: none;
            }

            .container {
                scroll-snap-type: x mandatory;
                scroll-behavior: smooth;
            }

            .container::-webkit-scrollbar {
                display: none;
            }

            .container {
                -ms-overflow-style: none;
                scrollbar-width: none;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="left-section" id="leftSection">
            <div class="loading-indicator">
                <div class="loading-spinner"></div>
            </div>
            <div class="error-state">
                <p>Failed to load content</p>
                <button class="retry-button">Retry</button>
            </div>
        </div>
        <div class="middle-section" id="middleSection">
            <div class="loading-indicator">
                <div class="loading-spinner"></div>
            </div>
            <div class="error-state">
                <p>Failed to load content</p>
                <button class="retry-button">Retry</button>
            </div>
        </div>
        <div class="right-section" id="rightSection">
            <div class="loading-indicator">
                <div class="loading-spinner"></div>
            </div>
            <div class="error-state">
                <p>Failed to load content</p>
                <button class="retry-button">Retry</button>
            </div>
        </div>
    </div>

    <script>
document.addEventListener('DOMContentLoaded', () => {
    // SECTION CONFIGURATION
    const sections = [
        { id: 'leftSection', url: './count.html' },
        { id: 'middleSection', url: './globalchat.html' },
        { id: 'rightSection', url: './profileview.html' }
    ];

    // Enhanced iframe loading with connection checking and queuing
    class SectionLoader {
        constructor() {
            this.loadQueue = [];
            this.isLoading = false;
            this.loadAttempts = new Map();
            this.maxRetries = 3;
            this.retryDelay = 2000;
        }

        async checkConnection() {
            try {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 5000);
                
                await fetch('./ping', { 
                    signal: controller.signal,
                    method: 'HEAD'
                });
                clearTimeout(timeout);
                return true;
            } catch (error) {
                console.warn('Connection check failed:', error);
                return false;
            }
        }

        async loadSection(sectionId, url) {
            if (!this.loadAttempts.has(sectionId)) {
                this.loadAttempts.set(sectionId, 0);
            }

            const section = document.getElementById(sectionId);
            if (!section) {
                console.error(`Section not found: ${sectionId}`);
                return;
            }

            const loadingIndicator = section.querySelector('.loading-indicator');
            const errorState = section.querySelector('.error-state');
            
            // Clear previous iframe if it exists
            const existingIframe = section.querySelector('iframe');
            if (existingIframe) {
                existingIframe.remove();
            }

            // Show loading state
            loadingIndicator.style.display = 'flex';
            errorState.style.display = 'none';

            // Create and configure new iframe
            const iframe = document.createElement('iframe');
            iframe.src = url;
            iframe.setAttribute('allow', 'fullscreen');
            iframe.setAttribute('crossorigin', 'anonymous');
            
            // Set up load monitoring
            let loadTimeout;
            let isLoaded = false;

            const cleanup = () => {
                clearTimeout(loadTimeout);
                iframe.onload = null;
                iframe.onerror = null;
            };

            return new Promise((resolve, reject) => {
                const handleSuccess = () => {
                    if (isLoaded) return;
                    isLoaded = true;
                    cleanup();
                    
                    loadingIndicator.style.display = 'none';
                    iframe.classList.add('loaded');
                    this.loadAttempts.set(sectionId, 0);
                    resolve();
                };

                const handleError = async () => {
                    cleanup();
                    const attempts = this.loadAttempts.get(sectionId);
                    
                    if (attempts < this.maxRetries) {
                        this.loadAttempts.set(sectionId, attempts + 1);
                        console.warn(`Retrying ${sectionId}, attempt ${attempts + 1}`);
                        
                        // Check connection before retry
                        const hasConnection = await this.checkConnection();
                        if (hasConnection) {
                            setTimeout(() => {
                                this.loadSection(sectionId, url)
                                    .then(resolve)
                                    .catch(reject);
                            }, this.retryDelay);
                        } else {
                            this.showError(section, sectionId, url);
                            reject(new Error('No connection'));
                        }
                    } else {
                        this.showError(section, sectionId, url);
                        reject(new Error(`Failed to load ${sectionId} after ${this.maxRetries} attempts`));
                    }
                };

                // Set up load monitoring
                loadTimeout = setTimeout(handleError, 10000); // 10 second timeout
                iframe.onload = handleSuccess;
                iframe.onerror = handleError;

                // Add iframe to section
                section.appendChild(iframe);
            });
        }

        showError(section, sectionId, url) {
            const loadingIndicator = section.querySelector('.loading-indicator');
            const errorState = section.querySelector('.error-state');
            
            loadingIndicator.style.display = 'none';
            errorState.style.display = 'block';
            
            const retryButton = errorState.querySelector('.retry-button');
            retryButton.onclick = () => {
                this.loadAttempts.set(sectionId, 0);
                this.loadSection(sectionId, url);
            };
        }

        async loadAllSections() {
            for (const section of sections) {
                try {
                    await this.loadSection(section.id, section.url);
                } catch (error) {
                    console.error(`Error loading section ${section.id}:`, error);
                }
            }
        }
    }

    // Initialize and start loading
    const loader = new SectionLoader();
    loader.loadAllSections();

    // Ensure section heights
    const setSectionHeights = () => {
        document.querySelectorAll(".left-section, .middle-section, .right-section").forEach(section => {
            section.style.height = `${window.innerHeight}px`;
        });
    };
    setSectionHeights();
    window.addEventListener('resize', setSectionHeights);

    // Prevent vertical scrolling
    window.addEventListener('scroll', function() {
        window.scrollTo(0, 0);
    });
});
    </script>