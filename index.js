// ── DEFAULT THEME: light (chat.js will override if user has saved preference) ──
(function() {
  var saved = localStorage.getItem('nmedea_theme') || localStorage.getItem('theme') || localStorage.getItem('appTheme');
  var theme = saved || 'theme-light';
  // Normalize: if saved value is just 'light'/'dim'/'dark' prefix with 'theme-'
  if (theme && !theme.startsWith('theme-')) theme = 'theme-' + theme;
  document.body.classList.remove('theme-light', 'theme-dim', 'theme-dark');
  document.body.classList.add(theme);
})();

// Wrong device guard — send back to half.html which will load desktop
if (window === window.top && !window.matchMedia('(max-width: 899px)').matches) {
    window.location.replace('half.html');
}

// ════════════════════════════════════════════

// ── Gallery: CSS snaps, IntersectionObserver plays/pauses ──
    (function() {
        var gallery = document.getElementById('gallery');
        if (!gallery) return;

        // ── Global interaction flag — one source of truth for the whole app ──
        window._userInteracted = false;
        window._globalMuted = true; // starts muted, first tap unmutes
        function markInteracted() {
            if (window._userInteracted) return;
            window._userInteracted = true;
            window._globalMuted = false;
            var active = window._galleryCurrentPin;
            if (active) {
                var av = active.querySelector('video');
                if (av) {
                    av.muted = false;
                    av.play().catch(function(){ av.muted = true; av.play().catch(function(){}); });
                    // Flash the sound icon so user sees audio just unlocked
                    var pi = active.querySelector('.pause-indicator');
                    if (pi) {
                        pi.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="#fff" stroke="none"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>';
                        pi.classList.add('show');
                        setTimeout(function() { pi.classList.remove('show'); }, 700);
                    }
                }
            }
        }
        // touchend so _galleryCurrentPin is already set when we unmute
        document.addEventListener('touchend', markInteracted, { once: true, passive: true });
        document.addEventListener('click',    markInteracted, { once: true });

        window._galleryCurrentPin = null;

        function playActive(v) {
            v.muted = false; // play with sound by default
            var p = v.play();
            if (p && p.catch) p.catch(function() {
                // Browser blocked even muted — shouldn't happen, but handle gracefully
                v.muted = true;
                v.play().catch(function(){});
            });
        }

        // ── Video src cache — keeps loaded src in memory so browser never re-downloads ──
        // Once a video is loaded we store its URL here. If the browser evicts v.src
        // (rare but happens on low-memory devices) we restore from this map, not from
        // data-src, so no network request happens again.
        var _srcCache = new Map(); // postId → url

        function _ensureSrc(v, pin) {
            var pid = pin.dataset.postId;
            // Already has src — nothing to do
            if (v.src && v.src !== window.location.href) return false;
            // Try cache first (no network hit)
            var cached = _srcCache.get(pid);
            if (!cached) cached = v.dataset.savedSrc || v.dataset.src || null;
            if (!cached) return false;
            v.src = cached;
            v.preload = 'auto';
            v.load();
            return true; // needed reload
        }

        function _cacheSrc(v, pin) {
            var pid = pin.dataset.postId;
            if (pid && v.src && v.src !== window.location.href) {
                _srcCache.set(pid, v.src);
            }
        }

        var obs = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                var pin = entry.target;
                var v   = pin.querySelector('video');
                if (!v) return;

                if (entry.isIntersecting && entry.intersectionRatio >= 0.85) {
                    // ── This pin is now fully visible ──
                    var isNewPin = window._galleryCurrentPin !== pin;

                    // Hard stop the previous pin — no ghost audio ever
                    var prev = window._galleryCurrentPin;
                    if (prev && prev !== pin) {
                        prev.classList.add('leaving');
                        var pv = prev.querySelector('video');
                        if (pv) {
                            pv.pause();
                            pv.muted = true;
                            // Cache src before anything can clear it
                            _cacheSrc(pv, prev);
                        }
                        var _p = prev;
                        setTimeout(function() { _p.classList.remove('leaving'); }, 380);
                    }
                    window._galleryCurrentPin = pin;

                    // Restore src from cache if needed — avoids re-download
                    var needed = _ensureSrc(v, pin);
                    // Cache it immediately once confirmed loaded
                    _cacheSrc(v, pin);

                    // Only reset to beginning when genuinely switching to a new pin
                    // NOT when returning to a pin already in view (e.g. closing comments)
                    if (isNewPin) { v.currentTime = 0; }

                    // If src had to reload, wait for it — otherwise play immediately
                    if (needed) {
                        v.addEventListener('canplay', function onCp() {
                            v.removeEventListener('canplay', onCp);
                            playActive(v);
                        }, { once: true });
                    } else {
                        playActive(v);
                    }

                    pin.classList.add('entering');
                    setTimeout(function() { pin.classList.remove('entering'); }, 350);

                    // Apply global UI-hidden state to incoming pin
                    pin.classList.toggle('ui-hidden', !!window._uiHidden);
                    if (typeof pin._applyUIState === 'function') pin._applyUIState();

                    var pid = pin.dataset.postId;
                    if (pid && typeof trackPresence === 'function') trackPresence(pid);

                    // Preload neighbours — only load src, don't play
                    var all = Array.prototype.slice.call(gallery.querySelectorAll('.pin-container'));
                    var idx = all.indexOf(pin);
                    [-1, 1].forEach(function(d) {
                        var nb = all[idx + d];
                        if (!nb) return;
                        var nv = nb.querySelector('video');
                        if (!nv) return;
                        // Use cache first, then data-src
                        var nbPid = nb.dataset.postId;
                        var nbSrc = _srcCache.get(nbPid) || nv.dataset.savedSrc || nv.dataset.src;
                        if (nbSrc && (!nv.src || nv.src === window.location.href)) {
                            nv.src = nbSrc;
                            nv.muted = true;
                            nv.preload = 'auto';
                            nv.load();
                            _srcCache.set(nbPid, nbSrc);
                        }
                    });

                } else if (!entry.isIntersecting) {
                    // ── Fully out of view — pause only, KEEP src so no reload on return ──
                    _cacheSrc(v, pin); // save before any possible eviction
                    v.pause();
                    v.muted = true;
                    // DO NOT clear v.src or set currentTime=0 here —
                    // keeping src means instant resume with zero network cost
                }
                // isIntersecting=true but ratio<0.85 = mid-scroll — do nothing,
                // let CSS snap finish before acting
            });
        }, { root: gallery, threshold: [0, 0.85] });

        function observePin(pin) { obs.observe(pin); }
        gallery.querySelectorAll('.pin-container').forEach(observePin);

        var mutObs = new MutationObserver(function(mutations) {
            mutations.forEach(function(m) {
                m.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1 && node.classList.contains('pin-container')) observePin(node);
                });
            });
        });
        mutObs.observe(gallery, { childList: true });
        window._galleryObservePin = observePin;
        // Expose obs so back button can pause/resume cleanly
        window._galleryObs = obs;

        // ── Autoplay first video muted — browser requires muted for autoplay ──
        // Sound unlocks automatically on first swipe via markInteracted()
        setTimeout(function() {
            var firstPin = gallery.querySelector('.pin-container');
            var first    = firstPin && firstPin.querySelector('video');
            if (!first) return;
            if (firstPin.dataset.postId && typeof trackPresence === 'function') {
                trackPresence(firstPin.dataset.postId);
            }
            if (!first.src && first.dataset.savedSrc) { first.src = first.dataset.savedSrc; first.load(); }
            first.muted = true;  // browser rule: first autoplay must be muted
            first.play().catch(function(){});
            window._galleryCurrentPin = firstPin;
        }, 500);

        // ── Comment sheet: YouTube-style mini-player (real video, no clone) ──
        var commentSheet = document.getElementById('commentSheet');
        if (commentSheet) {
            var _cmpVid       = null;
            var _cmpParent    = null;
            var _cmpNext      = null;
            var _cmpProgWrap  = null;
            var _cmpOrigVid   = null;
            var _cmpPaused    = false;

            var miniPlayer = document.getElementById('comments-mini-player');
            var pauseIcon  = document.getElementById('cmp-pause-icon');
            var pauseSvg   = document.getElementById('cmp-icon-svg');

            var PAUSE_BARS = '<rect x="5" y="3" width="4" height="18" rx="1"/><rect x="15" y="3" width="4" height="18" rx="1"/>';
            var PLAY_TRI   = '<polygon points="6,3 20,12 6,21"/>';

            function setCmpIcon(playing) {
                if (pauseSvg) pauseSvg.innerHTML = playing ? PAUSE_BARS : PLAY_TRI;
                if (pauseIcon) {
                    pauseIcon.classList.add('show');
                    clearTimeout(pauseIcon._t);
                    if (playing) {
                        // auto-hide after 1s when playing
                        pauseIcon._t = setTimeout(function(){ pauseIcon.classList.remove('show'); }, 1000);
                    }
                }
            }

            // Tap mini-player = toggle pause/play
            var _cmpControlsTimer = null;
            function showCmpControls() {
                var bar = document.getElementById('cmp-progress-bar');
                var muteBtn = document.getElementById('cmp-mute-btn');
                if (bar) bar.classList.add('visible');
                if (muteBtn) muteBtn.style.opacity = '1';
                clearTimeout(_cmpControlsTimer);
                _cmpControlsTimer = setTimeout(function() {
                    if (bar) bar.classList.remove('visible');
                    if (muteBtn) muteBtn.style.opacity = '0';
                }, 2000);
            }
            function hideCmpControls() {
                var bar = document.getElementById('cmp-progress-bar');
                var muteBtn = document.getElementById('cmp-mute-btn');
                if (bar) bar.classList.remove('visible');
                if (muteBtn) muteBtn.style.opacity = '0';
                clearTimeout(_cmpControlsTimer);
            }

            if (miniPlayer) {
                miniPlayer.addEventListener('click', function(e) {
                    if (!_cmpVid) return;

                    // Tapped mute button
                    if (e.target && e.target.closest && e.target.closest('#cmp-mute-btn')) {
                        _cmpVid.muted = !_cmpVid.muted;
                        window._globalMuted = _cmpVid.muted;
                        var muteBtn = document.getElementById('cmp-mute-btn');
                        var muteSvg = document.getElementById('cmp-mute-svg');
                        if (muteSvg) {
                            muteSvg.innerHTML = _cmpVid.muted
                                ? '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="#fff" stroke="none"/><line x1="23" y1="9" x2="17" y2="15" stroke="#fff" stroke-width="2" stroke-linecap="round"/><line x1="17" y1="9" x2="23" y2="15" stroke="#fff" stroke-width="2" stroke-linecap="round"/>'
                                : '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="#fff" stroke="none"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07" stroke="#fff" stroke-width="2" stroke-linecap="round" fill="none"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14" stroke="#fff" stroke-width="2" stroke-linecap="round" fill="none"/>';
                        }
                        showCmpControls();
                        return;
                    }

                    var bar = document.getElementById('cmp-progress-bar');
                    var controlsVisible = bar && bar.classList.contains('visible');

                    // Tapped the pause/play icon — toggle playback
                    if (e.target && e.target.closest && e.target.closest('#cmp-pause-icon')) {
                        if (_cmpVid.paused) {
                            _cmpVid.play().catch(function(){ _cmpVid.muted=true; _cmpVid.play().catch(function(){}); });
                            _cmpPaused = false;
                            setCmpIcon(true);
                            _cmpStartRaf && _cmpStartRaf();
                        } else {
                            _cmpVid.pause();
                            _cmpPaused = true;
                            setCmpIcon(false);
                            _cmpStopRaf && _cmpStopRaf();
                        }
                        showCmpControls(); // reset auto-hide timer
                        return;
                    }

                    // Tapped the progress bar — reset auto-hide timer
                    if (e.target && e.target.closest && e.target.closest('#cmp-progress-bar')) {
                        showCmpControls();
                        return;
                    }

                    // Tapped the video area: toggle controls visibility
                    if (controlsVisible) {
                        // Controls showing — hide them
                        hideCmpControls();
                        if (pauseIcon) pauseIcon.classList.remove('show');
                    } else {
                        // Controls hidden — show them + show pause/play icon
                        showCmpControls();
                        setCmpIcon(!_cmpVid.paused);
                    }
                });
            }

            // ── Dedicated progress bar elements ──
            var cmpProgressTrack = document.getElementById('cmp-progress-track');
            var cmpProgressFill  = document.getElementById('cmp-progress-fill');
            var cmpProgressThumb = document.getElementById('cmp-progress-thumb');
            var cmpTimeCurrent   = document.getElementById('cmp-time-current');
            var cmpTimeTotal     = document.getElementById('cmp-time-total');
            var _cmpRafId        = null;
            var _cmpScrubbing    = false;

            function _fmtTime(s) {
                if (!isFinite(s) || s < 0) return '0:00';
                var m = Math.floor(s / 60);
                var sec = Math.floor(s % 60);
                return m + ':' + (sec < 10 ? '0' : '') + sec;
            }

            function _cmpUpdateBar() {
                if (!_cmpVid || _cmpScrubbing) return;
                var dur = _cmpVid.duration;
                var cur = _cmpVid.currentTime;
                var pct = (dur && isFinite(dur)) ? (cur / dur) * 100 : 0;
                if (cmpProgressFill)  cmpProgressFill.style.width  = pct + '%';
                if (cmpProgressThumb) cmpProgressThumb.style.left  = pct + '%';
                if (cmpTimeCurrent) cmpTimeCurrent.textContent = _fmtTime(cur);
                if (cmpTimeTotal && dur && isFinite(dur)) cmpTimeTotal.textContent = _fmtTime(dur);
            }

            function _cmpStartRaf() {
                if (_cmpRafId) return;
                function _tick() {
                    _cmpUpdateBar();
                    if (_cmpVid && !_cmpVid.paused && !_cmpVid.ended) {
                        _cmpRafId = requestAnimationFrame(_tick);
                    } else {
                        _cmpRafId = null;
                    }
                }
                _cmpRafId = requestAnimationFrame(_tick);
            }

            function _cmpStopRaf() {
                if (_cmpRafId) { cancelAnimationFrame(_cmpRafId); _cmpRafId = null; }
            }

            // Scrub on progress track
            if (cmpProgressTrack) {
                function _cmpSeek(e) {
                    if (!_cmpVid) return;
                    var rect = cmpProgressTrack.getBoundingClientRect();
                    var clientX = e.touches ? e.touches[0].clientX : e.clientX;
                    var ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
                    var dur = _cmpVid.duration;
                    if (dur && isFinite(dur)) {
                        _cmpVid.currentTime = ratio * dur;
                        if (cmpProgressFill)  cmpProgressFill.style.width = (ratio * 100) + '%';
                        if (cmpProgressThumb) cmpProgressThumb.style.left  = (ratio * 100) + '%';
                        if (cmpTimeCurrent) cmpTimeCurrent.textContent = _fmtTime(_cmpVid.currentTime);
                    }
                }
                cmpProgressTrack.addEventListener('mousedown',  function(e){ _cmpScrubbing=true; _cmpSeek(e); });
                cmpProgressTrack.addEventListener('touchstart', function(e){ _cmpScrubbing=true; _cmpSeek(e); }, { passive: true });
                document.addEventListener('mousemove',  function(e){ if(_cmpScrubbing) _cmpSeek(e); });
                document.addEventListener('touchmove',  function(e){ if(_cmpScrubbing) _cmpSeek(e); }, { passive: true });
                document.addEventListener('mouseup',  function(){ _cmpScrubbing=false; _cmpStartRaf(); });
                document.addEventListener('touchend', function(){ _cmpScrubbing=false; _cmpStartRaf(); });
            }

            new MutationObserver(function() {
                var isOpen = commentSheet.classList.contains('open');

                if (isOpen) {
                    // OPEN: move real video into mini-player (keeps sound + state, no reload)
                    var activePin = window._galleryCurrentPin || gallery.querySelector('.pin-container');
                    var origVid = activePin ? activePin.querySelector('video') : null;
                    if (!origVid) { document.body.classList.add('comments-open'); return; }

                    _cmpOrigVid = origVid;
                    _cmpParent  = origVid.parentNode;
                    _cmpNext    = origVid.nextSibling;

                    // Use the play state captured BEFORE sheet.classList.add('open') was called.
                    // By the time this MutationObserver fires, origVid.paused may already be true
                    // (browser can pause during the classList mutation), so we rely on the flag
                    // set in openModal() — default true so video always keeps playing.
                    var _wasPlaying = (window._cmpWasPlayingBeforeOpen !== false);
                    window._cmpWasPlayingBeforeOpen = undefined; // consume the flag

                    // Style to fill mini-player
                    origVid.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:contain;opacity:1;display:block;z-index:2;visibility:visible;filter:none;background:#000;';
                    origVid.setAttribute('data-cmp-moved', '1');

                    // Physically move video into mini-player
                    miniPlayer.insertBefore(origVid, miniPlayer.firstChild);
                    _cmpVid    = origVid;
                    _cmpPaused = false;
                    if (pauseIcon) pauseIcon.classList.remove('show');
                    document.body.classList.add('comments-open');
                    hideCmpControls(); // controls hidden until user taps

                    // Defer play() — browser needs one tick to settle after the DOM move.
                    // Calling play() synchronously here is silently ignored on some browsers
                    // because the element is mid-reparent. The setTimeout gives it a clean frame.
                    setTimeout(function() {
                        if (!_cmpVid) return;
                        _cmpVid.play().catch(function() {
                            _cmpVid.muted = true;
                            _cmpVid.play().catch(function(){});
                        });
                    }, 50);

                    // Start progress bar RAF (tracks time even if playing)
                    _cmpStopRaf();
                    _cmpStartRaf();
                    if (origVid.duration && isFinite(origVid.duration) && cmpTimeTotal) {
                        cmpTimeTotal.textContent = _fmtTime(origVid.duration);
                    }

                } else {
                    // CLOSE: move the real video back to its original pin
                    _cmpStopRaf();
                    hideCmpControls(); // ensure controls are hidden when closing
                    document.body.classList.remove('comments-open');
                    _cmpPaused = false;
                    if (pauseIcon) pauseIcon.classList.remove('show');

                    setTimeout(function() {
                        var vid  = _cmpOrigVid;
                        var par  = _cmpParent;
                        var nxt  = _cmpNext;
                        if (vid && par) {
                            vid.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
                            vid.removeAttribute('data-cmp-moved');
                            if (nxt && nxt.parentNode === par) {
                                par.insertBefore(vid, nxt);
                            } else {
                                par.appendChild(vid);
                            }
                            // Defer play — same DOM-settle reason as on open
                            setTimeout(function() {
                                if (!vid) return;
                                vid.play().catch(function(){ vid.muted = true; vid.play().catch(function(){}); });
                            }, 50);
                        }
                        _cmpVid = null; _cmpParent = null; _cmpNext = null;
                        _cmpProgWrap = null; _cmpOrigVid = null;
                    }, 460);
                }
            }).observe(commentSheet, { attributes: true, attributeFilter: ['class'] });
        }
    })();

    // buttons are now built directly inside createPinElement in the module script

    // ── Comment sheet close button ──
    (function() {
        var btn = document.getElementById('csClose');
        var ov  = document.getElementById('csOverlay');
        var sh  = document.getElementById('commentSheet');
        function close() {
            if (sh) sh.classList.remove('open');
            if (ov) ov.classList.remove('open');
            // MutationObserver on commentSheet handles the restore + body class removal
        }
        if (btn) btn.addEventListener('click', close);
        if (ov)  ov.addEventListener('click', close);
    })();

    // ── Profile panel close — definitive handler ──
    (function() {
        function closeFpPanel() {
            var panel = document.getElementById('followingPanel');
            var ov    = document.getElementById('fpOverlay');
            if (panel) { panel.classList.remove('open'); panel.style.display = 'none'; }
            if (ov)    { ov.classList.remove('open'); ov.style.display = 'none'; ov.style.pointerEvents = 'none'; }
            document.body.style.overflow = '';
            document.body.style.touchAction = '';
        }
        // Use capture phase so it fires before any blocking handlers
        document.getElementById('fpBack').addEventListener('click', function(e) {
            e.stopPropagation();
            closeFpPanel();
        }, true);
        document.getElementById('fpOverlay').addEventListener('click', closeFpPanel);
        document.getElementById('fpOverlay').addEventListener('touchmove', function(e){ e.preventDefault(); }, { passive: false });
        // Expose globally so IIFE closePanel can also call it
        window._closeFpPanel = closeFpPanel;
    })();

    // ── Nav — mobile 5-button nav ──
    (function() {
        var home    = document.getElementById('navHome');
        var top     = document.getElementById('navTop');
        var up      = document.getElementById('navUpload');
        var liked   = document.getElementById('navLiked');
        var profile = document.getElementById('navProfile');
        var gal     = document.getElementById('gallery');

        // Track current section so we know if we're "coming back"
        window._mobSection = 'home';

        function setActive(btn) {
            document.querySelectorAll('.nav-btn').forEach(function(b){ b.classList.remove('active'); });
            if (btn) btn.classList.add('active');
        }

        function pauseAllVideos() {
            document.querySelectorAll('video').forEach(function(v) {
                v.muted = true;
                v.pause();
            });
        }

        function resumeHomeVideo() {
            // Hard stop everything first
            document.querySelectorAll('video').forEach(function(v){ v.pause(); v.muted = true; });
            // Then only play the known visible gallery pin
            var activePin = window._galleryCurrentPin;
            if (!activePin && gal) {
                var pins = gal.querySelectorAll('.pin-container');
                var idx  = Math.round(gal.scrollTop / window.innerHeight);
                activePin = pins[Math.max(0, idx)] || null;
            }
            if (!activePin) return;
            var v = activePin.querySelector('video');
            if (!v) return;
            v.muted = !window._userInteracted;
            v.play().catch(function(){ v.muted = true; v.play().catch(function(){}); });
        }

        // ── Transition animation helper ──
        // Shows spinner overlay on transEl for ~500ms then calls cb
        function showTransition(transEl, cb) {
            if (!transEl) { cb(); return; }
            transEl.style.opacity = '1';
            // Never block pointer events — just visual
            setTimeout(function() {
                cb();
                setTimeout(function() {
                    transEl.style.opacity = '0';
                }, 480);
            }, 320);
        }

        // ── Section switcher ──
        function goHome() {
            if (window._mobSection === 'home') return;
            setActive(home);
            var ls = document.getElementById('liked-section');
            var ps = document.getElementById('profile-section');
            // Fade out then hide
            if (ls) { ls.style.opacity='0'; setTimeout(function(){ ls.style.display='none'; ls.style.opacity='1'; }, 200); }
            if (ps) { ps.style.opacity='0'; setTimeout(function(){ ps.style.display='none'; ps.style.opacity='0'; }, 200); }
            document.body.style.overflow = '';
            window._mobSection = 'home';
            resumeHomeVideo();
        }

        function goLiked() {
            if (window._mobSection === 'liked') return;
            pauseAllVideos();
            setActive(liked);
            // Hide other sections first
            var ps = document.getElementById('profile-section');
            if (ps) { ps.style.opacity='0'; ps.style.display='none'; }
            var ls = document.getElementById('liked-section');
            if (!ls) return;
            ls.style.opacity = '0';
            ls.style.display = 'flex';
            // Show guest wall if not logged in
            var gwall = document.getElementById('liked-guest-wall');
            var lgrid = document.getElementById('liked-grid');
            var lhead = document.getElementById('liked-header');
            var lempty = document.getElementById('liked-empty');
            if (!window._currentUser) {
                if (gwall)  gwall.style.display = 'flex';
                if (lgrid)  lgrid.style.display = 'none';
                if (lempty) lempty.style.display = 'none';
            } else {
                if (gwall)  gwall.style.display = 'none';
                if (lgrid)  lgrid.style.display = '';
                if (lempty) lempty.style.display = '';
            }
            var trans = document.getElementById('liked-trans');
            requestAnimationFrame(function() {
                ls.style.transition = 'opacity 0.22s ease';
                ls.style.opacity = '1';
                if (window._currentUser) {
                    if (!window._likedSectionLoaded) {
                        showTransition(trans, function() { loadLikedGrid(); window._likedSectionLoaded = true; });
                    } else {
                        if (trans) { trans.style.opacity='0'; }
                    }
                } else {
                    if (trans) { trans.style.opacity='0'; }
                }
            });
            window._mobSection = 'liked';
        }

        function goProfile() {
            pauseAllVideos();
            setActive(profile);
            var ls = document.getElementById('liked-section');
            if (ls) { ls.style.display='none'; }
            var ps = document.getElementById('profile-section');
            if (!ps) return;
            ps.style.opacity = '0';
            ps.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            requestAnimationFrame(function() {
                ps.style.transition = 'opacity 0.22s ease';
                ps.style.opacity = '1';
            });
            // Show guest wall if not logged in
            var gwall = document.getElementById('profile-guest-wall');
            var profHead = document.getElementById('mob-prof-head');
            var profCover = document.getElementById('mob-prof-cover');
            var profGrid = document.getElementById('mob-prof-grid');
            var profTabs = document.getElementById('mob-prof-tabs');
            if (!window._currentUser) {
                if (gwall) gwall.style.display = 'flex';
                if (profHead) profHead.style.display = 'none';
                if (profCover) profCover.style.display = 'none';
                if (profGrid) profGrid.style.display = 'none';
            } else {
                if (gwall) gwall.style.display = 'none';
                if (profHead) profHead.style.display = 'block';
                if (profCover) profCover.style.display = 'block';
                if (profGrid) profGrid.style.display = 'block';
                // Init profile data on first open
                if (!window._mobProfileInited) {
                    window._mobProfileInited = true;
                    _initMobProfile();
                } else {
                    // Resume — restore scroll + rebuild grid from cache
                    _resumeMobProfile();
                }
            }
            window._mobSection = 'profile';
        }
        // Expose so openProfilePanel alias works outside IIFE
        window._goProfile = goProfile;
        window._goHome    = function() { goHome(); };

        // ── Home ──
        if (home) home.addEventListener('click', function() { goHome(); });

        // ── Feed tabs: For You / Top ──
        var tabForYou = document.getElementById('mobTabForYou');
        var tabTop    = document.getElementById('mobTabTop');
        // For You always default active
        if (tabForYou) tabForYou.classList.add('active');
        if (tabTop) tabTop.classList.remove('active');

        if (tabForYou) tabForYou.addEventListener('click', function() {
            tabForYou.classList.add('active');
            if (tabTop) tabTop.classList.remove('active');
            if (gal) gal.scrollTo({ top: 0, behavior: 'smooth' });
        });
        if (tabTop) tabTop.addEventListener('click', function() {
            // Briefly activate Top underline while scrolling, then revert to For You
            tabTop.classList.add('active');
            if (tabForYou) tabForYou.classList.remove('active');
            var cards = document.querySelectorAll('.pin-container');
            var best = null, bestN = -1;
            cards.forEach(function(c){ var n=parseInt(c.dataset.superlikeCount||0); if(n>bestN){bestN=n;best=c;} });
            if (best && gal) gal.scrollTo({ top: best.offsetTop, behavior: 'smooth' });
            // Revert to For You after scroll settles
            setTimeout(function() {
                if (tabForYou) tabForYou.classList.add('active');
                if (tabTop) tabTop.classList.remove('active');
            }, 800);
        });

        // ── Top nav (bell): open updates panel ──
        if (top) top.addEventListener('click', function() {
            openUpdatesPanel();
        });

        // Load superlike strip after posts load
        window._loadSuperlikeStrip = function(posts) {
            var strip = document.getElementById('superlike-strip');
            var items = document.getElementById('superlike-strip-items');
            if (!strip || !items) return;
            // Get posts sorted by superlike count (top 5)
            var hot = posts
                .filter(function(p){ return p.data && p.data.superlikes && p.data.superlikes.length > 0; })
                .sort(function(a,b){ return (b.data.superlikes.length||0)-(a.data.superlikes.length||0); })
                .slice(0, 6);
            if (!hot.length) return;
            items.innerHTML = '';
            hot.forEach(function(p) {
                var btn = document.createElement('button');
                btn.style.cssText = 'flex-shrink:0;width:44px;height:44px;border-radius:12px;overflow:hidden;border:2px solid transparent;background:var(--brand-gradient);padding:2px;cursor:pointer;position:relative;-webkit-tap-highlight-color:transparent;transition:transform 0.18s cubic-bezier(0.34,1.56,0.64,1);';
                var vid = document.createElement('video');
                vid.src = p.data.media[0].url;
                vid.muted = true; vid.playsInline = true; vid.preload = 'metadata';
                vid.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:10px;display:block;';
                vid.addEventListener('loadedmetadata', function(){ vid.currentTime = 0.5; }, {once:true});
                btn.appendChild(vid);
                // superlike count badge
                var badge = document.createElement('div');
                badge.style.cssText = 'position:absolute;bottom:2px;right:2px;background:rgba(0,0,0,0.65);color:#fff;font-size:8px;font-weight:800;padding:1px 4px;border-radius:4px;font-family:var(--font);display:flex;align-items:center;gap:2px;';
                badge.innerHTML = '<svg width="7" height="7" viewBox="0 0 28 24" fill="#fff"><path d="M13 5.5a3.5 3.5 0 0 0-3.5 3.5c0 4 3.5 7 7 9.5C20 16 23.5 13 23.5 9a3.5 3.5 0 0 0-7 0 3.5 3.5 0 0 0-3.5-3.5z"/></svg>' + p.data.superlikes.length;
                btn.appendChild(badge);
                btn.addEventListener('mouseenter', function(){ btn.style.transform='scale(1.1)'; });
                btn.addEventListener('mouseleave', function(){ btn.style.transform='scale(1)'; });
                btn.addEventListener('click', function() {
                    // Scroll to this video in the gallery
                    var pinEl = document.querySelector('.pin-container[data-post-id="'+p.id+'"]');
                    if (pinEl && gal) {
                        gal.scrollTo({ top: pinEl.offsetTop, behavior: 'smooth' });
                        setTimeout(function(){ strip.style.opacity='0'; setTimeout(function(){ strip.style.display='none'; strip.style.opacity='1'; }, 300); }, 400);
                    }
                });
                items.appendChild(btn);
            });
            strip.style.display = 'block';
            setTimeout(function(){ strip.style.opacity='0'; setTimeout(function(){ strip.style.display='none'; strip.style.opacity='1'; }, 3000); }, 6000);
        };

        // ── Upload: ONLY section that slides up hiding nav ──
        if (up) up.addEventListener('click', function() {
            if (!window._currentUser) {
                // Allow into section but show login wall inside
                pauseAllVideos();
                openUploadPanel();
                return;
            }
            pauseAllVideos();
            openUploadPanel();
        });

        // ── Liked: persistent gallery section ──
        if (liked) liked.addEventListener('click', function() { goLiked(); });

        // ── Profile: persistent iframe section ──
        if (profile) profile.addEventListener('click', function() {
            if (!window._currentUser) {
                // Allow into section but show login wall inside
                goProfile();
                return;
            }
            goProfile();
        });

        // Back button for upload panel — handle bar tap closes it
        var uploadBack = document.getElementById('uploadPanelBack');
        if (uploadBack) uploadBack.addEventListener('click', function() {
            closeUploadPanel();
            if (window._mobSection === 'liked') { setActive(liked); }
            else if (window._mobSection === 'profile') { setActive(profile); }
            else { setActive(home); resumeHomeVideo(); }
        });
        // Also close if post.html sends a message
        window.addEventListener('message', function(e) {
            if (e.data === 'closeUpload' || e.data === 'uploadDone') {
                closeUploadPanel();
                setActive(home); resumeHomeVideo();
            }
        });
    })();

    // ── UPDATES / NOTIFICATIONS — full system ──
    (function(){
        var panel     = document.getElementById('updates-panel');
        var overlay   = document.getElementById('updates-overlay');
        var list      = document.getElementById('updates-list');
        var empty     = document.getElementById('updates-empty');
        var badge     = document.getElementById('updates-count-badge');
        var deskBadge = document.getElementById('updBadgeDesk');
        var mobBadge  = document.getElementById('updatesBadge');

        var _notifs   = [];
        var _currentFilter = 'all';
        var _firestoreListeners = [];

        function timeAgo(ms) {
            var d = Date.now() - ms;
            if (d < 60000)    return 'just now';
            if (d < 3600000)  return Math.floor(d/60000)+'m ago';
            if (d < 86400000) return Math.floor(d/3600000)+'h ago';
            return Math.floor(d/86400000)+'d ago';
        }

        function refreshBadge() {
            var n = _notifs.filter(function(x){ return !x.read; }).length;
            var label = n > 0 ? (n > 99 ? '99+' : String(n)) : '';
            [mobBadge, deskBadge].forEach(function(el) {
                if (!el) return;
                if (n > 0) { el.textContent = label; el.style.display = 'flex'; el.classList.add('show'); }
                else { el.style.display = 'none'; el.classList.remove('show'); }
            });
            if (badge) {
                if (n > 0) { badge.textContent = n+' new'; badge.classList.add('show'); }
                else badge.classList.remove('show');
            }
        }

        function typeIcon(type) {
            var map = {
                comment:   { bg:'#2563eb', svg:'<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" fill="white" stroke="none"/>' },
                like:      { bg:'#dc2626', svg:'<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill="white" stroke="none"/>' },
                superlike: { bg:'#d97706', svg:'<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="white" stroke="none"/>' },
                follow:    { bg:'#059669', svg:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"/><circle cx="9" cy="7" r="4" fill="white"/><line x1="19" y1="8" x2="19" y2="14" stroke="white" stroke-width="2.5" stroke-linecap="round"/><line x1="22" y1="11" x2="16" y2="11" stroke="white" stroke-width="2.5" stroke-linecap="round"/>' }
            };
            return map[type] || map.comment;
        }

        function pushNotif(n) {
            if (_notifs.find(function(x){ return x.id === n.id; })) return;
            _notifs.unshift(n);
            if (_notifs.length > 200) _notifs.pop();
            refreshBadge();
            if (panel && panel.classList.contains('open')) renderList();
        }

        function buildRow(n, delay) {
            var icon = typeIcon(n.type);
            var letter = ((n.actorName||'?')[0]).toUpperCase();
            var hue = (letter.charCodeAt(0)*43)%360;
            var row = document.createElement('div');
            row.className = 'upd-row'+(n.read?'':' unread');
            row.dataset.notifId = n.id; row.dataset.type = n.type;
            row.style.animationDelay = (delay||0)+'ms';

            // Avatar
            var av = document.createElement('div');
            av.className = 'upd-av';
            av.style.background = 'hsl('+hue+',48%,40%)';
            av.innerHTML = n.actorPhoto
                ? '<img src="'+n.actorPhoto+'" onerror="this.style.display=\'none\'">'
                : letter;
            var tb = document.createElement('div');
            tb.className = 'upd-type-badge'; tb.style.background = icon.bg;
            tb.innerHTML = '<svg viewBox="0 0 24 24">'+icon.svg+'</svg>';
            av.appendChild(tb); row.appendChild(av);

            // Body
            var body = document.createElement('div'); body.className = 'upd-body';
            var txt = document.createElement('div'); txt.className = 'upd-body-text'; txt.innerHTML = n.text||'';
            var time = document.createElement('div'); time.className = 'upd-time'; time.textContent = timeAgo(n.ts);
            body.appendChild(txt); body.appendChild(time); row.appendChild(body);

            // Thumb
            if (n.postThumb) {
                var th = document.createElement('div'); th.className = 'upd-thumb';
                th.innerHTML = '<img src="'+n.postThumb+'" onerror="this.style.display=\'none\'">';
                row.appendChild(th);
            }

            // Unread dot
            if (!n.read) { var dot = document.createElement('div'); dot.className = 'upd-unread-dot'; row.appendChild(dot); }

            // Click to navigate
            row.addEventListener('click', function(){
                n.read = true; row.classList.remove('unread');
                var d2 = row.querySelector('.upd-unread-dot'); if(d2) d2.remove();
                refreshBadge();
                if (n.postId) {
                    closeUpdatesPanel();
                    setTimeout(function(){
                        if (n.type === 'comment') {
                            var pin = document.querySelector('.pin-container[data-post-id="'+n.postId+'"]');
                            if (pin) {
                                var g = document.getElementById('gallery'); if(g) g.scrollTo({top:pin.offsetTop,behavior:'smooth'});
                                setTimeout(function(){ if(typeof window._openCommentSheet==='function') window._openCommentSheet(n.postId); }, 400);
                            }
                        } else {
                            var dc = document.querySelector('.desktop-card[data-post-id="'+n.postId+'"]');
                            if (dc) { dc.scrollIntoView({behavior:'smooth',block:'center'}); dc.style.outline='2px solid #111'; dc.style.outlineOffset='3px'; setTimeout(function(){ dc.style.outline=''; dc.style.outlineOffset=''; },1800); }
                            else { var pin2 = document.querySelector('.pin-container[data-post-id="'+n.postId+'"]'); if(pin2){ var g2=document.getElementById('gallery'); if(g2) g2.scrollTo({top:pin2.offsetTop,behavior:'smooth'}); } }
                        }
                    }, 320);
                }
            });
            return row;
        }

        function renderList() {
            list.innerHTML = ''; list.appendChild(empty);
            var filtered = _notifs.filter(function(n){ return _currentFilter==='all' || n.type===_currentFilter; });
            filtered.sort(function(a,b){ return b.ts-a.ts; });
            if (!filtered.length) { empty.style.display='flex'; return; }
            empty.style.display='none';
            filtered.forEach(function(n,i){ list.appendChild(buildRow(n, i*45)); });
        }

        // Filter tab clicks
        document.querySelectorAll('.upd-tab').forEach(function(tab){
            tab.addEventListener('click', function(){
                document.querySelectorAll('.upd-tab').forEach(function(t){ t.classList.remove('active'); });
                tab.classList.add('active');
                _currentFilter = tab.dataset.filter;
                renderList();
            });
        });

        // Attach Firestore realtime listeners
        function attachListeners(uid) {
            _firestoreListeners.forEach(function(u){ try{u();}catch(e){} });
            _firestoreListeners = [];
            var fns = window._fbFirestoreFns; var db = window._fbDb;
            if (!fns || !db) return;
            var { collection, query, where, orderBy, limit, onSnapshot, getDocs, getDoc, doc } = fns;
            var startAt = Date.now();

            // Watch posts owned by this user for comments, likes, superlikes
            getDocs(query(collection(db,'recence'), where('uid','==',uid), orderBy('timestamp','desc'), limit(20)))
            .then(function(snap){
                snap.forEach(function(postDoc){
                    var pd = postDoc.data(), postId = postDoc.id;
                    var thumb = pd.thumbnail||(pd.media&&pd.media[0]&&pd.media[0].url)||'';

                    // Comments
                    var unsubC = onSnapshot(query(collection(db,'recence',postId,'comments'), orderBy('createdAt','desc'), limit(50)), function(cs){
                        cs.docChanges().forEach(function(ch){
                            if(ch.type!=='added') return;
                            var c = ch.doc.data();
                            var ms = c.createdAt?(c.createdAt.seconds?c.createdAt.seconds*1000:Date.now()):Date.now();
                            if(ms < startAt-5000) return;
                            if((c.uid||c.userId)===uid) return;
                            pushNotif({ id:'cmt_'+ch.doc.id, type:'comment',
                                actorName: c.userName||c.name||'Someone', actorPhoto: c.userPhoto||c.photoURL||'',
                                text: '<strong>'+(c.userName||'Someone')+'</strong> commented on your video: "'+(c.text||'').slice(0,60)+'"',
                                postId, postThumb: thumb, ts: ms, read: false });
                        });
                    });
                    _firestoreListeners.push(unsubC);

                    // Likes & superlikes via post doc snapshot
                    var prevLikes = new Set(pd.likes||[]);
                    var prevSL    = new Set(pd.superlikes||[]);
                    var unsubP = onSnapshot(postDoc.ref, function(ds){
                        if(!ds.exists()) return;
                        var d = ds.data();
                        (d.likes||[]).forEach(function(luid){
                            if(luid===uid||prevLikes.has(luid)) return;
                            prevLikes.add(luid);
                            getDoc(doc(db,'users',luid)).then(function(ud){
                                var nm=ud.exists()?(ud.data().displayName||ud.data().name||'Someone'):'Someone';
                                var ph=ud.exists()?(ud.data().photoURL||''):'';
                                pushNotif({id:'like_'+postId+'_'+luid,type:'like',actorName:nm,actorPhoto:ph,text:'<strong>'+nm+'</strong> liked your video',postId,postThumb:thumb,ts:Date.now(),read:false});
                            }).catch(function(){ pushNotif({id:'like_'+postId+'_'+luid,type:'like',actorName:'Someone',actorPhoto:'',text:'<strong>Someone</strong> liked your video',postId,postThumb:thumb,ts:Date.now(),read:false}); });
                        });
                        (d.superlikes||[]).forEach(function(sluid){
                            if(sluid===uid||prevSL.has(sluid)) return;
                            prevSL.add(sluid);
                            getDoc(doc(db,'users',sluid)).then(function(ud){
                                var nm=ud.exists()?(ud.data().displayName||ud.data().name||'Someone'):'Someone';
                                var ph=ud.exists()?(ud.data().photoURL||''):'';
                                pushNotif({id:'sl_'+postId+'_'+sluid,type:'superlike',actorName:nm,actorPhoto:ph,text:'<strong>'+nm+'</strong> super liked your video',postId,postThumb:thumb,ts:Date.now(),read:false});
                            }).catch(function(){ pushNotif({id:'sl_'+postId+'_'+sluid,type:'superlike',actorName:'Someone',actorPhoto:'',text:'<strong>Someone</strong> super liked your video',postId,postThumb:thumb,ts:Date.now(),read:false}); });
                        });
                    });
                    _firestoreListeners.push(unsubP);
                });
            }).catch(function(e){ console.warn('upd:posts',e); });

            // Follows
            try {
                var unsubF = onSnapshot(query(collection(db,'follows'), where('followedUserId','==',uid), orderBy('timestamp','desc'), limit(30)), function(fs){
                    fs.docChanges().forEach(function(ch){
                        if(ch.type!=='added') return;
                        var f=ch.doc.data();
                        var fms=f.timestamp?(f.timestamp.seconds?f.timestamp.seconds*1000:Date.now()):Date.now();
                        if(fms<startAt-5000) return;
                        getDoc(doc(db,'users',f.followerUserId||'x')).then(function(ud){
                            var nm=ud.exists()?(ud.data().displayName||ud.data().name||'Someone'):'Someone';
                            var ph=ud.exists()?(ud.data().photoURL||''):'';
                            pushNotif({id:'follow_'+ch.doc.id,type:'follow',actorName:nm,actorPhoto:ph,text:'<strong>'+nm+'</strong> started following you',postId:null,postThumb:null,ts:fms,read:false});
                        }).catch(function(){ pushNotif({id:'follow_'+ch.doc.id,type:'follow',actorName:'Someone',actorPhoto:'',text:'<strong>Someone</strong> started following you',postId:null,postThumb:null,ts:fms,read:false}); });
                    });
                });
                _firestoreListeners.push(unsubF);
            }catch(e){}
        }

        // Wait for auth
        var _att=0;
        function tryAttach(){
            if(window._fbAuth&&window._fbAuth.currentUser){ attachListeners(window._fbAuth.currentUser.uid); return; }
            if(_att++<20) setTimeout(tryAttach,500);
        }
        setTimeout(tryAttach,800);

        // Open / Close
        window.openUpdatesPanel = function(){
            if(!panel) return;
            // Show guest wall if not logged in
            var gwall = document.getElementById('updates-guest-wall');
            var ulist = document.getElementById('updates-list');
            var utabs = document.querySelector('.upd-tabs');
            if (!window._currentUser) {
                if (gwall) gwall.style.display = 'flex';
                if (ulist) ulist.style.display = 'none';
                if (utabs) utabs.style.display = 'none';
            } else {
                if (gwall) gwall.style.display = 'none';
                if (ulist) ulist.style.display = 'flex';
                if (utabs) utabs.style.display = 'flex';
            }
            panel.classList.add('open');
            if(overlay) overlay.classList.add('open');
            document.body.classList.add('updates-open');
            document.querySelectorAll('.nav-btn').forEach(function(b){ b.classList.remove('active'); });
            var nb=document.getElementById('navTop'); if(nb) nb.classList.add('active');
            setTimeout(function(){
                _notifs.forEach(function(n){ n.read=true; }); refreshBadge();
                list.querySelectorAll('.upd-unread-dot').forEach(function(d){ d.remove(); });
                list.querySelectorAll('.upd-row.unread').forEach(function(r){ r.classList.remove('unread'); });
            }, 2000);
            renderList();
        };
        window.closeUpdatesPanel = function(){
            if(!panel) return;
            panel.classList.remove('open');
            if(overlay) overlay.classList.remove('open');
            document.body.classList.remove('updates-open');
            document.querySelectorAll('.nav-btn').forEach(function(b){ b.classList.remove('active'); });
            var nh=document.getElementById('navHome'); if(nh) nh.classList.add('active');
        };
        window._pushNotification = pushNotif;
    })();

    // ── TOP toast — small branded label top-right ──
    function _showTopToast() {
        var el = document.getElementById('top-toast');
        if (!el) {
            el = document.createElement('div');
            el.id = 'top-toast';
            el.style.cssText = 'position:fixed;top:env(safe-area-inset-top,12px);right:14px;z-index:9999;display:flex;flex-direction:column;align-items:flex-end;pointer-events:none;';
            el.innerHTML = '<div style="background:#fff;border-radius:10px;padding:5px 12px;box-shadow:0 2px 16px rgba(0,0,0,0.14);display:flex;flex-direction:column;align-items:center;gap:2px;"><span style=\"font-size:12px;font-weight:900;color:#111;letter-spacing:0.08em;font-family:var(--font);\">TOP</span><div style=\"width:28px;height:2.5px;border-radius:2px;background:var(--brand-gradient);\"></div></div>';
            document.body.appendChild(el);
        }
        el.style.opacity = '1'; el.style.transform = 'translateY(0)';
        el.style.transition = 'none';
        requestAnimationFrame(function(){
            el.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            setTimeout(function(){
                el.style.opacity = '0'; el.style.transform = 'translateY(-8px)';
            }, 1000);
        });
    }
    window._showTopToast = _showTopToast;

    if (!document.getElementById('upd-kf')) {
        var _ks=document.createElement('style'); _ks.id='upd-kf';
        _ks.textContent='@keyframes updFadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}';
        document.head.appendChild(_ks);
    }
    // Load updates count after a short delay once auth is ready
    setTimeout(function(){ if(currentUser) loadUpdates(); }, 4000);

    function openUploadPanel() {
        var panel = document.getElementById('upload-panel');
        var nav   = document.getElementById('bottom-nav');
        if (!panel) return;
        // Show guest wall if not logged in
        var gwall  = document.getElementById('upload-guest-wall');
        var iframe = document.getElementById('upload-panel-frame');
        if (!window._currentUser) {
            if (gwall)  gwall.style.display = 'flex';
            if (iframe) iframe.style.display = 'none';
        } else {
            if (gwall)  gwall.style.display = 'none';
            if (iframe) iframe.style.display = 'block';
        }
        panel.style.transform = 'translateY(0)';
        if (nav) nav.style.transform = 'translateY(100%)';
    }
    function closeUploadPanel() {
        var panel = document.getElementById('upload-panel');
        var nav   = document.getElementById('bottom-nav');
        if (panel) panel.style.transform = 'translateY(100%)';
        if (nav) nav.style.transform = '';
    }
    // Legacy aliases
    function openProfilePanel()  { if (window._goProfile) window._goProfile(); }
    function closeProfilePanel() { /* profile is now a persistent section */ }
    window.openUploadPanel  = openUploadPanel;
    window.closeUploadPanel = closeUploadPanel;
    window.openProfilePanel = openProfilePanel;
    window.closeProfilePanel = closeProfilePanel;

    // ── Following tab panel — slides up, TikTok feed of followed users ──
    (function() {
        var tabFollowing = document.getElementById('tabFollowing');
        var tabForYou    = document.getElementById('tabForYou');
        var panel        = document.getElementById('followingPanel');
        var ov           = document.getElementById('fpOverlay');
        var fpBack       = document.getElementById('fpBack');
        var fpFeedEl     = document.getElementById('fpFeed');
        var fpFeedLoaded = false;
        var fpCurrent = 0, fpTimer, fpSettling = false;

        function closePanel() {
            if (typeof window._closeFpPanel === 'function') { window._closeFpPanel(); }
            if (fpFeedEl) fpFeedEl.querySelectorAll('video').forEach(function(v){ v.pause(); v.currentTime = 0; });
        }

        // snap scroll inside fpFeed with sleep effect
        if (fpFeedEl) {
            fpFeedEl.addEventListener('scroll', function() {
                clearTimeout(fpTimer);
                fpTimer = setTimeout(fpSettle, 60);
            }, { passive: true });
        }

        function fpSettle() {
            if (fpSettling) return;
            var slides = fpFeedEl ? fpFeedEl.querySelectorAll('.fp-slide') : [];
            if (!slides.length) return;
            var h = fpFeedEl.clientHeight;
            var idx = Math.round(fpFeedEl.scrollTop / h);
            idx = Math.max(0, Math.min(idx, slides.length - 1));
            if (idx === fpCurrent) return;
            fpSettling = true;
            var leaving = slides[fpCurrent];
            if (leaving) { leaving.classList.add('leaving'); setTimeout(function(){ leaving.classList.remove('leaving'); }, 320); }
            var entering2 = slides[current];
            if (entering2) { entering2.classList.add('entering'); setTimeout(function(){ entering2.classList.remove('entering'); }, 420); }
            fpCurrent = idx;
            slides.forEach(function(s, i) {
                var v = s.querySelector('video');
                if (!v) return;
                if (i === fpCurrent) { v.muted = false; v.play().catch(function(){}); }
                else { v.pause(); v.currentTime = 0; }
            });
            setTimeout(function(){ fpSettling = false; }, 400);
        }

        function buildFpSlide(post) {
            var media = post.media && post.media[0];
            if (!media) return null;
            var isVid = media.type === 'video' || (media.contentType && media.contentType.startsWith('video/'));
            var slide = document.createElement('div');
            slide.className = 'fp-slide';
            if (isVid) {
                var v = document.createElement('video');
                v.src = media.url; v.muted = true; v.loop = true; v.playsInline = true;
                slide.appendChild(v);
            } else {
                var img = document.createElement('img');
                img.src = media.url; img.loading = 'lazy';
                slide.appendChild(img);
            }
            // overlay: avatar + name
            var ov2 = document.createElement('div');
            ov2.className = 'fp-slide-overlay';
            var _sName = post.name || post.displayName || 'U';
            var _sLetter = _sName[0].toUpperCase();
            var _sHue = (_sLetter.charCodeAt(0)*37)%360;
            var _sAvEl;
            if (post.photoURL && !post.photoURL.includes('default_profile')) {
                _sAvEl = '<img src="'+post.photoURL+'" style="width:28px;height:28px;border-radius:50%;object-fit:cover;" onerror="this.outerHTML=\'<div style=&quot;width:28px;height:28px;border-radius:50%;background:hsl('+_sHue+',50%,44%);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:900;color:#fff;&quot;>'+_sLetter+'</div>\'">';
            } else {
                _sAvEl = '<div style="width:28px;height:28px;border-radius:50%;background:hsl('+_sHue+',50%,44%);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:900;color:#fff;">'+_sLetter+'</div>';
            }
            ov2.innerHTML = '<div class="fp-slide-name">'+_sAvEl+'<span>'+_sName+'</span></div>';
            slide.appendChild(ov2);
            return slide;
        }

        if (tabFollowing) {
            tabFollowing.addEventListener('click', function() {
                tabFollowing.classList.add('active');
                tabForYou.classList.remove('active');
                // hide profile card, show feed
                var card = document.getElementById('fpProfileCard');
                var fpTitle = document.getElementById('fpTitle');
                if (card) card.style.display = 'none';
                if (fpFeedEl) fpFeedEl.style.display = 'block';
                if (fpTitle) fpTitle.textContent = 'Following';
                if (panel) panel.classList.add('open');
                if (ov) ov.classList.add('open');
                document.body.style.overflow = 'hidden';
                // load posts from followed users (fired to module)
                if (!fpFeedLoaded) {
                    fpFeedEl.innerHTML = '<div class="fp-empty-feed">Loading...</div>';
                    document.dispatchEvent(new CustomEvent('loadFollowingFeed', { detail: { buildSlide: buildFpSlide } }));
                    fpFeedLoaded = true;
                } else {
                    // autoplay first on re-open
                    var first = fpFeedEl.querySelector('.fp-slide video');
                    if (first) { first.muted = false; first.play().catch(function(){}); }
                }
            });
        }
        if (tabForYou)  tabForYou.addEventListener('click', closePanel);

        // receive posts from module and build feed
        document.addEventListener('fpFeedReady', function(e) {
            if (!fpFeedEl) return;
            fpFeedEl.innerHTML = '';
            fpCurrent = 0; fpSettling = false;
            var posts = e.detail.posts;
            if (!posts || !posts.length) {
                fpFeedEl.innerHTML = '<div class="fp-empty-feed">Follow people to see their posts here</div>';
                return;
            }
            posts.forEach(function(p) {
                var s = buildFpSlide(p);
                if (s) fpFeedEl.appendChild(s);
            });
            // autoplay first
            setTimeout(function() {
                var first = fpFeedEl.querySelector('.fp-slide video');
                if (first) { first.muted = false; first.play().catch(function(){}); }
            }, 300);
        });
    })();

// ════════════════════════════════════════════

// ══════════════════════════════════════
// LIKED PANEL — open/close + load liked videos
// ══════════════════════════════════════
// ═══════════════════════════════════════════════
// LIKED / SAVED  — Pinterest masonry grid + fullscreen viewer
// ═══════════════════════════════════════════════
window._likedSectionLoaded = false;
window._savedPosts = [];   // in-memory cache

async function loadLikedGrid() {
    var grid  = document.getElementById('liked-grid');
    var empty = document.getElementById('liked-empty');
    var badge = document.getElementById('liked-count-badge');
    if (!grid) return;

    grid.innerHTML = '';
    if (empty) empty.style.display = 'none';

    var saved = [];
    try {
        var favPosts = JSON.parse(localStorage.getItem('favouritePosts') || '[]');
        saved = favPosts.slice();
    } catch(e) {}

    // Also pull Firestore liked videos if signed in
    try {
        var db3 = window._fbDb;
        var fns = window._fbFirestoreFns;
        if (db3 && fns && window._currentUser) {
            var snap = await fns.getDocs(fns.query(
                fns.collection(db3, 'recence'),
                fns.where('likes', 'array-contains', window._currentUser.uid),
                fns.orderBy('timestamp', 'desc'),
                fns.limit(60)
            ));
            snap.forEach(function(d) {
                var p = d.data(); p._id = d.id;
                if (!saved.find(function(s){ return s._id === d.id; })) saved.push(p);
            });
        }
    } catch(e) { console.warn('liked grid fetch:', e); }

    window._savedPosts = saved;
    if (badge) badge.textContent = saved.length;

    if (!saved.length) {
        if (empty) { empty.style.display = 'flex'; }
        return;
    }

    // ── Build Pinterest masonry grid ──
    // Alternate aspect ratios for visual variety
    var ratios = [1.6, 1.2, 1.8, 1.4, 2.0, 1.3, 1.7, 1.5];

    saved.forEach(function(p, idx) {
        var media = p.media && p.media[0];
        if (!media || !media.url) return;
        // Hard skip expired posts — never show them
        var _ets = p.timestamp;
        var _eupMs = _ets ? (typeof _ets.seconds==='number' ? _ets.seconds*1000 : (_ets.toDate ? _ets.toDate().getTime() : null)) : null;
        if (_eupMs && (Date.now() - _eupMs) > 24*60*60*1000) return;

        (function(i, post, m) {
            var ratio = ratios[i % ratios.length];
            var cell = document.createElement('div');
            cell.className = 'liked-cell';

            var vid = document.createElement('video');
            vid.src = m.url;
            vid.muted = true;
            vid.playsInline = true;
            vid.preload = 'metadata';
            // Set height via aspect ratio on the video
            vid.style.cssText = 'width:100%;aspect-ratio:9/'+(16*ratio/ratios[0]).toFixed(1)+';object-fit:cover;display:block;pointer-events:none;';
            vid.addEventListener('loadedmetadata', function() { vid.currentTime = 0.01; }, {once:true});
            cell.appendChild(vid);

            // Duration badge
            vid.addEventListener('loadedmetadata', function() {
                var dur = Math.round(vid.duration || 0);
                if (dur > 0) {
                    var db2 = document.createElement('div');
                    db2.className = 'liked-cell-dur';
                    db2.textContent = Math.floor(dur/60)+':'+(dur%60<10?'0':'')+(dur%60);
                    cell.appendChild(db2);
                }
            });

            // Overlay with creator name + time-ago
            var overlay = document.createElement('div');
            overlay.className = 'liked-cell-overlay';
            var nameEl = document.createElement('div');
            nameEl.className = 'liked-cell-name';
            nameEl.textContent = '@' + (post.name || post.userName || 'creator');
            overlay.appendChild(nameEl);

            // Time-ago label
            var ts = post.timestamp;
            var uploadMs = ts ? (ts.seconds ? ts.seconds*1000 : (ts.toDate ? ts.toDate().getTime() : null)) : null;
            var nowMs = Date.now();
            var ageMs2 = uploadMs ? nowMs - uploadMs : null;
            var expired2 = ageMs2 !== null && ageMs2 > 24*60*60*1000;
            if (ageMs2 !== null) {
                var _s=Math.floor(ageMs2/1000),_m=Math.floor(_s/60),_h=Math.floor(_m/60),_d=Math.floor(_h/24);
                var tl2 = _d>=1 ? _d+'d ago' : _h>=1 ? _h+'h ago' : _m>=1 ? _m+'m ago' : 'just now';
                var timeEl = document.createElement('div');
                timeEl.style.cssText = 'font-size:8px;font-weight:600;color:rgba(255,255,255,0.55);font-family:var(--font);margin-top:1px;';
                timeEl.textContent = tl2;
                overlay.appendChild(timeEl);
            }
            // Dim + expired badge if >24h
            if (expired2) {
                vid.style.opacity = '0.45';
                vid.style.filter = 'grayscale(0.4)';
                var expEl = document.createElement('div');
                expEl.style.cssText = 'position:absolute;top:5px;left:5px;background:rgba(0,0,0,0.6);color:rgba(255,255,255,0.75);font-size:7px;font-weight:800;font-family:var(--font);padding:2px 5px;border-radius:4px;letter-spacing:0.04em;';
                expEl.textContent = 'EXPIRED';
                cell.appendChild(expEl);
            }
            cell.appendChild(overlay);

            // ── CLICK = open fullscreen viewer at this index ──
            cell.addEventListener('click', function() {
                openLikedViewer(i);
            });

            // Staggered entrance animation
            cell.style.opacity = '0';
            cell.style.transform = 'translateY(16px) scale(0.96)';
            cell.style.transition = 'none';
            grid.appendChild(cell);
            requestAnimationFrame(function() {
                setTimeout(function() {
                    cell.style.transition = 'opacity 0.32s ease, transform 0.32s cubic-bezier(0.34,1.56,0.64,1)';
                    cell.style.opacity = '1';
                    cell.style.transform = 'translateY(0) scale(1)';
                }, 40 + i * 60);
            });

        })(idx, p, media);
    });
}

// ── Fullscreen viewer (full home-feed experience) ──
var _viewerObs = null;
function openLikedViewer(startIdx) {
    var viewer = document.getElementById('liked-viewer');
    var vfeed  = document.getElementById('liked-viewer-feed');
    var back   = document.getElementById('liked-viewer-back');
    if (!viewer || !vfeed) return;

    var buildPin = window._createPinElement || window.createPinElement;
    if (!buildPin) { console.warn('_createPinElement not ready'); return; }

    // Tear down previous
    if (_viewerObs) { _viewerObs.disconnect(); _viewerObs = null; }
    vfeed.querySelectorAll('video').forEach(function(v){ v.pause(); v.currentTime = 0; });
    vfeed.innerHTML = '';

    // Build pins — flag disables the black loading overlay inside createPinElement
    window._buildingForViewer = true;
    var built = 0;
    window._savedPosts.forEach(function(p) {
        if (!p.media || !p.media[0] || !p.media[0].url) return;
        var pinEl = buildPin(p, p._id);
        if (!pinEl) return;
        // Set src now so browser starts fetching before user sees viewer
        var vid = pinEl.querySelector('video');
        if (vid) {
            var src = vid.dataset.src || vid.src;
            if (src) {
                vid.src = src;
                vid.removeAttribute('data-src');
                vid.preload = 'auto';
                // Remove lazy-load class so opacity:0 doesn't hide the video
                vid.classList.remove('lazy-load');
                vid.classList.add('loaded');
                vid.load();
            }
        }
        vfeed.appendChild(pinEl);
        built++;
    });
    window._buildingForViewer = false;
    if (built === 0) return;

    // Hard stop home feed behind viewer — mute too, no bleed-through
    document.querySelectorAll('#gallery video, #desktop-feed video').forEach(function(v){
        v.pause();
        v.muted = true;
    });

    // Open viewer (same as gallery — fixed fullscreen black)
    viewer.style.transform = 'translateY(0)';
    viewer.classList.add('open');

    // Scroll to tapped index
    var pins = vfeed.querySelectorAll('.pin-container');
    if (pins[startIdx]) {
        vfeed.scrollTop = pins[startIdx].offsetTop;
    }

    // IntersectionObserver — CSS snaps, we just play/pause. No src unloading (prevents reload flicker)
    var _viewerCurrentPin = null;
    _viewerObs = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            var pin = entry.target;
            var vid = pin.querySelector('video');
            if (!vid) return;
            if (entry.isIntersecting && entry.intersectionRatio >= 0.85) {
                // Leaving pin — pause only, keep src
                if (_viewerCurrentPin && _viewerCurrentPin !== pin) {
                    var _lv = _viewerCurrentPin.querySelector('video');
                    if (_lv) { _lv.pause(); }
                }
                _viewerCurrentPin = pin;

                // Restore src only if was explicitly unloaded
                if (!vid.src && vid.dataset.savedSrc) {
                    vid.src = vid.dataset.savedSrc; vid.load();
                }
                vid.currentTime = 0;
                vid.muted = false;
                vid.play().catch(function(){ vid.muted = true; vid.play().catch(function(){}); });
                // Apply global UI-hidden state
                pin.classList.toggle('ui-hidden', !!window._uiHidden);
                var pid = pin.dataset.postId;
                if (pid && typeof trackPresence === 'function') trackPresence(pid);
                // Preload adjacent — no unloading, no flicker
                var allPins = Array.prototype.slice.call(vfeed.querySelectorAll('.pin-container'));
                var ci = allPins.indexOf(pin);
                [-1, 1].forEach(function(off) {
                    var adj = allPins[ci + off];
                    if (!adj) return;
                    var av = adj.querySelector('video');
                    if (av && !av.src && av.dataset.savedSrc) {
                        av.src = av.dataset.savedSrc; av.muted = true; av.preload = 'auto'; av.load();
                    }
                });
            } else if (!entry.isIntersecting) {
                // Fully out of view — hard stop
                vid.pause();
                vid.muted = true;
                vid.currentTime = 0;
            }
        });
    }, { root: vfeed, threshold: [0, 0.85] });
    pins.forEach(function(pin) { _viewerObs.observe(pin); });

    // Back button — close viewer, return to grid
    if (back) {
        back.onclick = function() {
            // Step 1 — kill liked viewer observer + stop every video instantly
            if (_viewerObs) { _viewerObs.disconnect(); _viewerObs = null; }
            _viewerCurrentPin = null;
            document.querySelectorAll('video').forEach(function(v){
                v.pause();
                v.muted = true;
                v.currentTime = 0;
            });

            // Step 2 — disconnect gallery observer BEFORE animation starts
            var galObs = window._galleryObs;
            if (galObs) galObs.disconnect();

            // Step 3 — close the viewer
            viewer.classList.remove('open');
            viewer.style.transform = 'translateY(100%)';

            // Step 4 — after transition done, reconnect obs & resume only IF on home
            setTimeout(function() {
                // Hard stop again — belt and suspenders
                document.querySelectorAll('video').forEach(function(v){
                    v.pause(); v.muted = true;
                });

                // Reconnect gallery observer
                var gal = document.getElementById('gallery');
                if (gal && galObs) {
                    gal.querySelectorAll('.pin-container').forEach(function(p){ galObs.observe(p); });
                    window._galleryObs = galObs;
                }

                // Only play if user is on home right now
                if (window._mobSection !== 'home') return;

                var activePin = window._galleryCurrentPin;
                if (!activePin && gal) {
                    var allP = gal.querySelectorAll('.pin-container');
                    var i = Math.round(gal.scrollTop / window.innerHeight);
                    activePin = allP[Math.max(0, i)] || null;
                }
                if (!activePin) return;
                var v = activePin.querySelector('video');
                if (!v) return;
                // One final check — make sure nothing else snuck in
                document.querySelectorAll('video').forEach(function(x){ if(x!==v){x.pause();x.muted=true;} });
                v.muted = !window._userInteracted;
                v.currentTime = 0;
                v.play().catch(function(){ v.muted = true; v.play().catch(function(){}); });
            }, 450);
        };
    }
}


// Expose globally
window.openLikedPanel = function() {
    var el = document.getElementById('liked-section');
    if (el) el.style.display='flex';
    if (!window._likedSectionLoaded) { loadLikedGrid(); window._likedSectionLoaded=true; }
};
window.closeLikedPanel = function() {};  // no-op, section is persistent

// ── Save / Favourite helpers ──
window.saveToFavourites = function(postData, postId) {
    try {
        var ids   = JSON.parse(localStorage.getItem('favouritePostIds') || '[]');
        var posts = JSON.parse(localStorage.getItem('favouritePosts')   || '[]');
        if (!ids.includes(postId)) {
            ids.push(postId);
            var p = Object.assign({}, postData, { _id: postId });
            posts.push(p);
            localStorage.setItem('favouritePostIds', JSON.stringify(ids));
            localStorage.setItem('favouritePosts',   JSON.stringify(posts));
        }
    } catch(e) {}
    // Force grid refresh next time liked section is opened
    window._likedSectionLoaded = false;
};
window.removeFromFavourites = function(postId) {
    try {
        var ids   = JSON.parse(localStorage.getItem('favouritePostIds') || '[]');
        var posts = JSON.parse(localStorage.getItem('favouritePosts')   || '[]');
        localStorage.setItem('favouritePostIds', JSON.stringify(ids.filter(function(id){ return id !== postId; })));
        localStorage.setItem('favouritePosts',   JSON.stringify(posts.filter(function(p){ return p._id !== postId; })));
    } catch(e) {}
    window._likedSectionLoaded = false;
};
window.isPostFavourited = function(postId) {
    try {
        var ids = JSON.parse(localStorage.getItem('favouritePostIds') || '[]');
        return ids.includes(postId);
    } catch(e) { return false; }
};

// dummy to avoid leftover event listener error
document.addEventListener('loadLikedFeed', function() {});

// ════════════════════════════════════════════

// ── Copy / Screenshot Protection ──
document.addEventListener('copy', function(e){ e.preventDefault(); });
document.addEventListener('cut', function(e){ e.preventDefault(); });
document.addEventListener('contextmenu', function(e){ e.preventDefault(); });
document.addEventListener('selectstart', function(e){ e.preventDefault(); });
document.addEventListener('keydown', function(e){
    if (e.ctrlKey || e.metaKey) {
        if (['c','x','a','u','s','p'].includes(e.key.toLowerCase())) {
            e.preventDefault();
        }
    }
});

// ════════════════════════════════════════════

// ══════════════════════════════════════
// MOBILE PROFILE SECTION
// ══════════════════════════════════════
var _mobProfTabCache = {};
var _mobProfActiveTab = 'uploaded';
var _mobProfScrollTop = 0;
var _mobProfViewerObs = null;
var _mobProfViewerPosts = [];

function _initMobProfile() {
    _mobProfRefreshHeader();
    // Tabs
    var tabs = document.querySelectorAll('#mob-prof-tabs button');
    tabs.forEach(function(tb) {
        tb.addEventListener('click', function() {
            tabs.forEach(function(b){ b.classList.remove('active'); });
            tb.classList.add('active');
            _mobProfActiveTab = tb.dataset.tab;
            _mobProfLoadTab(_mobProfActiveTab);
        });
    });
    // Stats clicks
    var stFollowers = document.getElementById('mp-stat-followers');
    var stFollowing = document.getElementById('mp-stat-following');
    if (stFollowers) stFollowers.addEventListener('click', function(){ window._showFollowList && window._showFollowList('followers'); });
    if (stFollowing) stFollowing.addEventListener('click', function(){ window._showFollowList && window._showFollowList('following'); });
    // Viewer back
    var backBtn = document.getElementById('mob-prof-viewer-back');
    if (backBtn) backBtn.addEventListener('click', _mobProfCloseViewer);
    // Load first tab
    _mobProfLoadTab('uploaded');
}

function _resumeMobProfile() {
    _mobProfRefreshHeader();
    var tabs = document.querySelectorAll('#mob-prof-tabs button');
    tabs.forEach(function(b){ b.classList.remove('active'); });
    var activeTab = document.querySelector('#mob-prof-tabs button[data-tab="'+_mobProfActiveTab+'"]');
    if (activeTab) activeTab.classList.add('active');
    if (_mobProfTabCache[_mobProfActiveTab]) {
        _mobProfBuildGrid(_mobProfTabCache[_mobProfActiveTab]);
        var grid = document.getElementById('mob-prof-grid');
        if (grid && _mobProfScrollTop) requestAnimationFrame(function(){ grid.scrollTop = _mobProfScrollTop; });
    } else {
        _mobProfLoadTab(_mobProfActiveTab);
    }
}

function _mobProfRefreshHeader() {
    var user = window._currentUser;
    if (!user) {
        setTimeout(_mobProfRefreshHeader, 600);
        return;
    }
    var av = document.getElementById('mob-prof-av');
    var nm = document.getElementById('mob-prof-name');
    var hd = document.getElementById('mob-prof-handle');
    var bioEl = document.getElementById('mob-prof-bio');
    var linksEl = document.getElementById('mob-prof-links');
    var coverEl = document.getElementById('mob-prof-cover');
    if (nm) nm.textContent = user.displayName || 'You';
    // Handle shown as skeleton until Firestore doc loads below
    if (hd) hd.textContent = '';
    if (av) {
        av.innerHTML = '';
        var hue = ((user.displayName||'U')[0].toUpperCase().charCodeAt(0)*37)%360;
        if (user.photoURL && !user.photoURL.includes('default_profile')) {
            var img = document.createElement('img');
            img.src = user.photoURL;
            img.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;';
            av.appendChild(img);
        } else {
            av.textContent = (user.displayName||'U')[0].toUpperCase();
            av.style.background = 'hsl('+hue+',50%,42%)';
        }
    }
    // Fetch Firestore user doc for cover, bio, links
    var db2 = window._fbDb; var fns = window._fbFirestoreFns;
    if (db2 && fns) {
        fns.getDoc(fns.doc(db2,'users',user.uid)).then(function(snap) {
            var d = snap.exists() ? snap.data() : {};
            // Handle — use real username field from Firestore
            if (hd) {
                var uname = d.username || d.userName || (user.displayName||'').toLowerCase().replace(/\s+/g,'_');
                hd.textContent = uname ? '@' + uname : '';
            }
            // Cover photo
            if (coverEl) {
                var existImg = coverEl.querySelector('img');
                if (existImg) existImg.remove();
                if (d.coverURL) {
                    var covImg = document.createElement('img');
                    covImg.src = d.coverURL;
                    coverEl.insertBefore(covImg, coverEl.firstChild);
                }
            }
            // Bio
            if (bioEl) {
                if (d.bio && d.bio.trim()) {
                    bioEl.textContent = d.bio;
                    bioEl.style.display = 'block';
                } else {
                    bioEl.style.display = 'none';
                }
            }
            // Links
            if (linksEl) {
                linksEl.innerHTML = '';
                var links = Array.isArray(d.links) ? d.links : (d.link ? [d.link] : []);
                links.forEach(function(url) {
                    var a = document.createElement('a');
                    a.className = 'mob-prof-link-pill';
                    a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer';
                    var pretty = url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
                    a.innerHTML = '<svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg><span>'+pretty+'</span>';
                    linksEl.appendChild(a);
                });
            }
        }).catch(function(){});
    }
    // Stats
    var svEl = document.getElementById('mp-stat-videos');
    var sfEl = document.getElementById('mp-stat-followers');
    var sgEl = document.getElementById('mp-stat-following');
    if (db2 && fns) {
        Promise.all([
            fns.getDocs(fns.query(fns.collection(db2,'recence'), fns.where('userId','==',user.uid), fns.limit(200))),
            fns.getDocs(fns.query(fns.collection(db2,'follows'), fns.where('followedUserId','==',user.uid), fns.limit(200))),
            fns.getDocs(fns.query(fns.collection(db2,'follows'), fns.where('followerUserId','==',user.uid), fns.limit(200)))
        ]).then(function(res) {
            if (svEl) svEl.querySelector('.mob-prof-stat-num').textContent = res[0].size;
            if (sfEl) sfEl.querySelector('.mob-prof-stat-num').textContent = res[1].size;
            if (sgEl) sgEl.querySelector('.mob-prof-stat-num').textContent = res[2].size;
        }).catch(function(){});
    }
}

function _mobProfLoadTab(key, attempt) {
    var grid = document.getElementById('mob-prof-grid');
    if (!grid) return;
    if (_mobProfTabCache[key]) { _mobProfBuildGrid(_mobProfTabCache[key]); return; }
    var db = window._fbDb; var fns = window._fbFirestoreFns; var user = window._currentUser;
    if (!db || !fns || !user) {
        var att = (attempt||0)+1;
        if (att > 12) { grid.innerHTML = '<div style="padding:60px 20px;text-align:center;color:#bbb;font-size:13px;font-family:var(--font);">Sign in to view</div>'; return; }
        grid.innerHTML = '<div style="padding:60px 20px;text-align:center;color:#bbb;font-size:13px;font-family:var(--font);">Loading...</div>';
        setTimeout(function(){ _mobProfLoadTab(key, att); }, 600);
        return;
    }
    grid.innerHTML = '<div style="padding:60px 20px;text-align:center;color:#bbb;font-size:13px;font-family:var(--font);">Loading...</div>';
    var q;
    if (key==='uploaded')     q = fns.query(fns.collection(db,'recence'), fns.where('userId','==',user.uid), fns.limit(60));
    else if (key==='liked')   q = fns.query(fns.collection(db,'recence'), fns.where('likes','array-contains',user.uid), fns.limit(60));
    else                      q = fns.query(fns.collection(db,'recence'), fns.where('superlikes','array-contains',user.uid), fns.limit(60));
    fns.getDocs(q).then(function(snap) {
        var posts = [];
        snap.forEach(function(d){ var p=d.data(); p._id=d.id; posts.push(p); });
        posts.sort(function(a,b){ return ((b.timestamp&&b.timestamp.seconds)||0) - ((a.timestamp&&a.timestamp.seconds)||0); });
        _mobProfTabCache[key] = posts;
        _mobProfBuildGrid(posts);
    }).catch(function(e){ console.warn('mob prof tab:', e); grid.innerHTML = '<div style="padding:60px 20px;text-align:center;color:#bbb;font-size:13px;font-family:var(--font);">Failed to load</div>'; });
}

var _mpRatios = [1, 1, 1.35, 0.75, 1.2, 0.85, 1, 1.1, 0.9, 1.25];
function _mobProfBuildGrid(posts) {
    var grid = document.getElementById('mob-prof-grid');
    if (!grid) return;
    grid.innerHTML = '';
    if (!posts || !posts.length) {
        grid.innerHTML = '<div style="padding:60px 20px;text-align:center;color:#bbb;font-size:13px;font-family:var(--font);">Nothing here yet</div>';
        return;
    }
    posts.forEach(function(post, idx) {
        var m = post.media && post.media[0];
        if (!m || !m.url) return;
        var ratio = _mpRatios[idx % _mpRatios.length];
        var cell = document.createElement('div');
        cell.className = 'liked-cell';
        cell.style.cssText = 'break-inside:avoid;margin-bottom:4px;border-radius:10px;overflow:hidden;cursor:pointer;position:relative;background:#e8e8e8;display:block;-webkit-tap-highlight-color:transparent;transition:transform 0.18s cubic-bezier(0.34,1.56,0.64,1);box-shadow:0 1px 6px rgba(0,0,0,0.10);';
        var vid = document.createElement('video');
        vid.src = m.url; vid.muted=true; vid.playsInline=true; vid.preload='metadata';
        vid.style.cssText = 'width:100%;aspect-ratio:9/'+(16*ratio).toFixed(1)+';object-fit:cover;display:block;pointer-events:none;';
        vid.addEventListener('loadedmetadata', function(){ vid.currentTime=0.01; }, {once:true});
        vid.addEventListener('loadedmetadata', function(){
            var dur=Math.round(vid.duration||0);
            if(dur>0){var db2=document.createElement('div');db2.style.cssText='position:absolute;top:5px;right:5px;background:rgba(0,0,0,0.5);color:#fff;font-size:8px;font-weight:700;font-family:var(--font);padding:1px 4px;border-radius:4px;';db2.textContent=Math.floor(dur/60)+':'+(dur%60<10?'0':'')+(dur%60);cell.appendChild(db2);}
        });
        var ov = document.createElement('div');
        ov.style.cssText = 'position:absolute;bottom:0;left:0;right:0;background:linear-gradient(to top,rgba(0,0,0,0.65) 0%,transparent 100%);padding:14px 6px 6px;pointer-events:none;';
        var nd = document.createElement('div');
        nd.style.cssText = 'font-size:9px;font-weight:700;color:rgba(255,255,255,0.92);font-family:var(--font);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
        nd.textContent = '@'+(post.name||post.userName||'creator');
        ov.appendChild(nd);
        cell.appendChild(vid); cell.appendChild(ov);
        cell.addEventListener('click', function() { _mobProfOpenViewer(post, posts); });
        cell.style.opacity='0'; cell.style.transform='translateY(12px) scale(0.97)';
        grid.appendChild(cell);
        setTimeout(function(){ cell.style.transition='opacity 0.3s ease,transform 0.3s cubic-bezier(0.34,1.56,0.64,1)'; cell.style.opacity='1'; cell.style.transform='translateY(0) scale(1)'; }, 40+idx*50);
    });
    // Save scroll on scroll
    grid.onscroll = function(){ _mobProfScrollTop = grid.scrollTop; };
}

function _mobProfOpenViewer(clickedPost, posts) {
    _mobProfViewerPosts = posts;
    var viewer = document.getElementById('mob-prof-viewer');
    var feed   = document.getElementById('mob-prof-viewer-feed');
    var back   = document.getElementById('mob-prof-viewer-back');
    if (!viewer || !feed) return;
    if (_mobProfViewerObs) { _mobProfViewerObs.disconnect(); _mobProfViewerObs = null; }
    feed.querySelectorAll('video').forEach(function(v){ v.pause(); v.currentTime=0; });
    feed.innerHTML = '';
    var buildPin = window._createPinElement;
    if (!buildPin) return;

    // Reset global ui-hidden so actions are visible
    window._uiHidden = false;
    document.body.classList.remove('paused-view');

    window._buildingForViewer = true;
    var built = 0;
    posts.forEach(function(p) {
        if (!p.media || !p.media[0] || !p.media[0].url) return;
        var pinEl = buildPin(p, p._id);
        if (!pinEl) return;
        pinEl.classList.remove('ui-hidden');
        var v = pinEl.querySelector('video');
        if (v) {
            var src = v.dataset.src || v.src;
            if (src) { v.src = src; v.removeAttribute('data-src'); v.preload='auto'; v.classList.remove('lazy-load'); v.classList.add('loaded'); v.load(); }
        }
        feed.appendChild(pinEl);
        built++;
    });
    window._buildingForViewer = false;
    if (built === 0) return;

    // Hard stop home feed
    document.querySelectorAll('#gallery video').forEach(function(v){ v.pause(); v.muted=true; });

    viewer.style.transform = 'translateY(0)';
    viewer.classList.add('open');

    var startIdx = Math.max(0, posts.filter(function(q){ return q.media&&q.media[0]&&q.media[0].url; }).findIndex(function(q){ return q._id===clickedPost._id; }));
    var pins = feed.querySelectorAll('.pin-container');
    if (pins[startIdx]) feed.scrollTop = pins[startIdx].offsetTop;

    var _mpvCurrentPin = null;
    _mobProfViewerObs = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            var pin = entry.target;
            var v = pin.querySelector('video');
            if (!v) return;
            if (entry.isIntersecting && entry.intersectionRatio >= 0.85) {
                if (_mpvCurrentPin && _mpvCurrentPin !== pin) {
                    var lv = _mpvCurrentPin.querySelector('video');
                    if (lv) { lv.pause(); }
                }
                _mpvCurrentPin = pin;
                if (!v.src && v.dataset.savedSrc) { v.src = v.dataset.savedSrc; v.load(); }
                v.currentTime = 0; v.muted = false;
                v.play().catch(function(){ v.muted=true; v.play().catch(function(){}); });
                pin.classList.remove('ui-hidden');
                var pid = pin.dataset.postId;
                if (pid && typeof trackPresence === 'function') trackPresence(pid);
                // Preload adjacent
                var allPins = Array.prototype.slice.call(feed.querySelectorAll('.pin-container'));
                var ci = allPins.indexOf(pin);
                [-1,1].forEach(function(off){
                    var adj = allPins[ci+off]; if (!adj) return;
                    var av = adj.querySelector('video');
                    if (av && !av.src && av.dataset.savedSrc) { av.src=av.dataset.savedSrc; av.muted=true; av.preload='auto'; av.load(); }
                });
            } else if (!entry.isIntersecting) {
                v.pause(); v.muted=true; v.currentTime=0;
            }
        });
    }, { root: feed, threshold: [0, 0.85] });
    pins.forEach(function(p){ _mobProfViewerObs.observe(p); });

    // Back button
    if (back) {
        back.onclick = function() {
            if (_mobProfViewerObs) { _mobProfViewerObs.disconnect(); _mobProfViewerObs = null; }
            _mpvCurrentPin = null;
            document.querySelectorAll('video').forEach(function(v){ v.pause(); v.muted=true; v.currentTime=0; });
            var galObs = window._galleryObs;
            if (galObs) galObs.disconnect();
            viewer.classList.remove('open');
            viewer.style.transform = 'translateY(100%)';
            setTimeout(function() {
                document.querySelectorAll('video').forEach(function(v){ v.pause(); v.muted=true; });
                var gal = document.getElementById('gallery');
                if (gal && galObs) { gal.querySelectorAll('.pin-container').forEach(function(p){ galObs.observe(p); }); window._galleryObs = galObs; }
                if (window._mobSection !== 'profile') return;
                // stay on profile — nothing to resume
            }, 450);
        };
    }
}

function _mobProfCloseViewer() {
    var viewer = document.getElementById('mob-prof-viewer');
    var feed   = document.getElementById('mob-prof-viewer-feed');
    if (_mobProfViewerObs) { _mobProfViewerObs.disconnect(); _mobProfViewerObs = null; }
    if (feed) feed.querySelectorAll('video').forEach(function(v){ v.pause(); v.currentTime=0; });
    if (viewer) { viewer.classList.remove('open'); viewer.style.transform = 'translateY(100%)'; }
}

// Also save grid scroll when leaving profile section
var _origGoHome = window._goHome;
window._goHome = function() {
    var grid = document.getElementById('mob-prof-grid');
    if (grid) _mobProfScrollTop = grid.scrollTop;
    if (_origGoHome) _origGoHome();
};

// ══════════════════════════════════════
// DELETE BOTTOM SHEET (draggable)
// ══════════════════════════════════════
(function() {
    var _delId = null; var _delData = null;
    var overlay    = document.getElementById('delete-sheet-overlay');
    var sheet      = document.getElementById('delete-sheet');
    var confirmBtn = document.getElementById('dsh-confirm-btn');
    var cancelBtn  = document.getElementById('dsh-cancel-btn');
    if (!overlay || !sheet) return;

    function openSheet() { overlay.classList.add('open'); }
    function closeSheet() {
        sheet.style.transition = 'transform 0.32s cubic-bezier(0.22,1,0.36,1)';
        sheet.style.transform = 'translateY(100%)';
        setTimeout(function(){
            overlay.classList.remove('open');
            sheet.style.transform = '';
            sheet.style.transition = '';
        }, 340);
    }

    window._showDeleteConfirm = function(postId, postData) {
        _delId = postId; _delData = postData;
        openSheet();
    };

    cancelBtn.addEventListener('click', closeSheet);
    overlay.addEventListener('click', function(e){ if(e.target===overlay) closeSheet(); });

    // ── Drag-to-dismiss ──
    var _startY = 0; var _curY = 0; var _dragging = false;
    sheet.addEventListener('touchstart', function(e){ _startY = e.touches[0].clientY; _dragging = true; sheet.style.transition = 'none'; }, {passive:true});
    sheet.addEventListener('touchmove', function(e){
        if (!_dragging) return;
        _curY = e.touches[0].clientY - _startY;
        if (_curY > 0) sheet.style.transform = 'translateY('+_curY+'px)';
    }, {passive:true});
    sheet.addEventListener('touchend', function(){
        _dragging = false;
        sheet.style.transition = '';
        if (_curY > 90) { closeSheet(); }
        else { sheet.style.transform = ''; }
        _curY = 0;
    });

    confirmBtn.addEventListener('click', async function() {
        if (!_delId) return;
        confirmBtn.textContent = 'Deleting...'; confirmBtn.classList.add('deleting');
        var db = window._fbDb; var fns = window._fbFirestoreFns;
        if (!db || !fns) { confirmBtn.textContent='Delete'; confirmBtn.classList.remove('deleting'); return; }
        try {
            try { var cmts=await fns.getDocs(fns.collection(db,'recence',_delId,'comments')); await Promise.all(cmts.docs.map(function(c){ return fns.deleteDoc(fns.doc(db,'recence',_delId,'comments',c.id)); })); } catch(e){}
            try { var reps=await fns.getDocs(fns.collection(db,'recence',_delId,'replies')); await Promise.all(reps.docs.map(function(r){ return fns.deleteDoc(fns.doc(db,'recence',_delId,'replies',r.id)); })); } catch(e){}
            try {
                var media=(_delData&&_delData.media)||[];
                for(var i=0;i<media.length;i++){
                    var fid=media[i].fileId;
                    if(!fid&&media[i].url){ var pts=media[i].url.split('/'); fid=decodeURIComponent(pts[pts.length-1]); }
                    if(fid) await fetch('https://r2-upload.katlegomashilwane0691.workers.dev/delete',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({fileId:fid})});
                }
            } catch(e){}
            await fns.deleteDoc(fns.doc(db,'recence',_delId));
            var card = document.querySelector('[data-post-id="'+_delId+'"]');
            if (card) { card.style.transition='opacity 0.3s,transform 0.3s'; card.style.opacity='0'; card.style.transform='scale(0.92)'; setTimeout(function(){ if(card.parentNode) card.parentNode.removeChild(card); },320); }
            Object.keys(_mobProfTabCache).forEach(function(k){ _mobProfTabCache[k]=_mobProfTabCache[k].filter(function(p){ return p._id!==_delId; }); });
            closeSheet();
            confirmBtn.textContent='Delete'; confirmBtn.classList.remove('deleting');
            _delId=null; _delData=null;
        } catch(err) {
            console.error('Delete failed:',err);
            confirmBtn.textContent='Failed — retry'; confirmBtn.classList.remove('deleting');
        }
    });
})();

// ══════════════════════════════════════
// FOLLOW LIST PANEL
// ══════════════════════════════════════
(function() {
    var overlay  = document.getElementById('follow-list-overlay');
    var list     = document.getElementById('flp-list');
    var titleEl  = document.getElementById('flp-title');
    var closeBtn = document.getElementById('flp-close-btn');
    if (!overlay) return;

    function closePanel() {
        var panel = document.getElementById('follow-list-panel');
        if (panel) { panel.style.transition='transform 0.32s cubic-bezier(0.22,1,0.36,1)'; panel.style.transform='translateY(100%)'; }
        setTimeout(function(){ overlay.classList.remove('open'); if(panel){panel.style.transform='';panel.style.transition='';} }, 340);
    }
    closeBtn.addEventListener('click', closePanel);
    overlay.addEventListener('click', function(e){ if(e.target===overlay) closePanel(); });
    // Drag-to-dismiss on follow panel
    var _fpPanel = document.getElementById('follow-list-panel');
    var _fpSY=0, _fpCY=0, _fpDrag=false;
    if(_fpPanel){
        _fpPanel.addEventListener('touchstart',function(e){_fpSY=e.touches[0].clientY;_fpDrag=true;_fpPanel.style.transition='none';},{passive:true});
        _fpPanel.addEventListener('touchmove',function(e){if(!_fpDrag)return;_fpCY=e.touches[0].clientY-_fpSY;if(_fpCY>0)_fpPanel.style.transform='translateY('+_fpCY+'px)';},{passive:true});
        _fpPanel.addEventListener('touchend',function(){_fpDrag=false;_fpPanel.style.transition='';if(_fpCY>80)closePanel();else _fpPanel.style.transform='';_fpCY=0;});
    }

    window._showFollowList = function(type) {
        titleEl.textContent = type==='followers' ? 'Followers' : 'Following';
        list.innerHTML = '<div class="flp-empty">Loading...</div>';
        overlay.classList.add('open');
        var db=window._fbDb; var fns=window._fbFirestoreFns; var user=window._currentUser;
        if (!db||!fns||!user) { list.innerHTML='<div class="flp-empty">Sign in to view</div>'; return; }
        var q = type==='followers'
            ? fns.query(fns.collection(db,'follows'), fns.where('followedUserId','==',user.uid), fns.limit(200))
            : fns.query(fns.collection(db,'follows'), fns.where('followerUserId','==',user.uid), fns.limit(200));
        fns.getDocs(q).then(function(snap) {
            if (snap.empty) { list.innerHTML='<div class="flp-empty">No '+type+' yet</div>'; return; }
            var uids=[];
            snap.forEach(function(d){ var uid=type==='followers'?d.data().followerUserId:d.data().followedUserId; if(uid) uids.push(uid); });
            Promise.all(uids.map(function(uid){ return fns.getDoc(fns.doc(db,'users',uid)).then(function(ud){ return {uid:uid,data:ud.exists()?ud.data():null}; }).catch(function(){ return {uid:uid,data:null}; }); })).then(function(users) {
                list.innerHTML='';
                users.forEach(function(u) {
                    var ud=u.data||{}; var name=ud.displayName||ud.name||'User'; var photo=ud.photoURL||'';
                    var hue=(name[0]||'U').toUpperCase().charCodeAt(0)*37%360;
                    var isMe=user.uid===u.uid;
                    var isFollowed=window._followedUsersSet?window._followedUsersSet.has(u.uid):false;
                    var row=document.createElement('div'); row.className='flp-row';
                    var av=document.createElement('div'); av.className='flp-av';
                    if(photo&&!photo.includes('default_profile')){ var img=document.createElement('img'); img.src=photo; img.onerror=function(){ av.removeChild(img); av.textContent=name[0].toUpperCase(); av.style.background='hsl('+hue+',50%,42%)'; }; av.appendChild(img); }
                    else { av.textContent=name[0].toUpperCase(); av.style.background='hsl('+hue+',50%,42%)'; }
                    var info=document.createElement('div'); info.className='flp-info';
                    info.innerHTML='<div class="flp-name">'+name+'</div><div class="flp-handle-text">@'+name.toLowerCase().replace(/\s+/g,'_')+'</div>';
                    row.appendChild(av); row.appendChild(info);
                    if(!isMe){
                        var btn=document.createElement('button'); btn.className='flp-follow-btn'+(isFollowed?' following':''); btn.textContent=isFollowed?'Following':'Follow';
                        btn.addEventListener('click',function(){
                            var nowF=!btn.classList.contains('following'); btn.textContent=nowF?'Following':'Follow'; btn.classList.toggle('following',nowF);
                            var fq=fns.query(fns.collection(db,'follows'),fns.where('followerUserId','==',user.uid),fns.where('followedUserId','==',u.uid));
                            fns.getDocs(fq).then(function(s){ if(nowF&&s.empty){ fns.addDoc(fns.collection(db,'follows'),{followerUserId:user.uid,followedUserId:u.uid,followedUserName:name,timestamp:{seconds:Math.floor(Date.now()/1000)}}); } else if(!nowF){ s.forEach(function(d){ fns.deleteDoc(fns.doc(db,'follows',d.id)); }); } });
                        });
                        row.appendChild(btn);
                    }
                    list.appendChild(row);
                });
            });
        }).catch(function(){ list.innerHTML='<div class="flp-empty">Could not load</div>'; });
    };
})();

// ════════════════════════════════════════════

// ═══════════════════════════════════════════════════════
//  PROFILE ENHANCEMENTS — paste before </body>
// ═══════════════════════════════════════════════════════
(function() {
'use strict';

function hideArrows() {
  var na = document.getElementById('desktopNavArrows');
  if (na) na.style.display = 'none';
}
function el(tag, css, html) {
  var e = document.createElement(tag);
  if (css)  e.style.cssText = css;
  if (html) e.innerHTML = html;
  return e;
}

// ── FIX: dpv-back hides arrows ──
(function patchBack() {
  var btn = document.getElementById('dpv-back');
  if (!btn) { setTimeout(patchBack, 400); return; }
  btn.addEventListener('click', hideArrows, true);
})();

// ── FIX: nav buttons hide arrows + fix stuck profile ──
(function patchNav() {
  var btns = document.querySelectorAll('.ds-nav-item');
  if (!btns.length) { setTimeout(patchNav, 500); return; }
  btns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      hideArrows();
      if (btn.id !== 'dsNavProfile') { closeMenu(); closeModal(); }
      if (btn.id === 'dsNavProfile') {
        setTimeout(function() {
          var pp = document.getElementById('ds-profile-panel');
          if (pp) { pp.style.display='flex'; pp.style.opacity=''; pp.style.pointerEvents=''; }
        }, 60);
      }
    });
  });
})();
setTimeout(function() {
  document.querySelectorAll('.ds-nav-item').forEach(function(b){
    if (!b._p2) { b._p2=true; b.addEventListener('click', hideArrows); }
  });
}, 1500);

// ── FIX: re-apply active tab style ──
function reapplyActiveTab() {
  var pp = document.getElementById('ds-profile-panel');
  var key = (pp && pp._activeTabKey) || 'uploaded';
  document.querySelectorAll('#dp-tabs button').forEach(function(b) {
    var on = b.dataset.key === key;
    b.style.color = on ? '#111' : '#aaa';
    b.style.borderImage = on ? 'linear-gradient(135deg,#0f0f0f 0%,#3a3a3a 40%,#626262 70%,#a6a6a6 100%) 1' : 'none';
    b.style.borderBottomColor = on ? '#626262' : 'transparent';
  });
}

// ── STYLES ──
var st = document.createElement('style');
st.textContent = `

  /* Gear button */
  #dp-settings-badge {
    position: absolute; top: 14px; right: 14px; z-index: 20;
    width: 34px; height: 34px; border-radius: 50%; border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    background: var(--brand-gradient);
    box-shadow: 0 2px 12px rgba(0,0,0,0.22);
    transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s;
    -webkit-tap-highlight-color: transparent;
  }
  #dp-settings-badge svg { stroke: #fff; fill: none; }
  #dp-settings-badge:hover  { transform: rotate(40deg) scale(1.1); box-shadow: 0 4px 18px rgba(0,0,0,0.3); }
  #dp-settings-badge:active { transform: scale(0.9); }
  #dp-settings-badge.is-open { transform: rotate(0deg) !important; }
  #dp-settings-badge.is-open:hover { transform: scale(1.08) !important; }

  /* Settings dropdown */
  #dp-settings-menu {
    position: absolute; top: 54px; right: 14px; z-index: 200;
    width: 230px; border-radius: 16px; overflow: hidden;
    opacity: 0; pointer-events: none;
    transform: scale(0.9) translateY(-6px);
    transform-origin: top right;
    transition: opacity 0.2s ease, transform 0.22s cubic-bezier(0.34,1.56,0.64,1);
    box-shadow: 0 8px 32px rgba(0,0,0,0.16);
  }
  #dp-settings-menu.open { opacity: 1; pointer-events: all; transform: scale(1) translateY(0); }
  body.theme-light #dp-settings-menu { background: #fff;    border: 1px solid #efefef; }
  body.theme-dim   #dp-settings-menu { background: #15202b; border: 1px solid #38444d; }
  body.theme-dark  #dp-settings-menu { background: #0f0f0f; border: 1px solid #2f3336; }

  .dpm-item {
    display: flex; align-items: center; gap: 11px;
    padding: 11px 14px; cursor: pointer; border: none;
    width: 100%; text-align: left; background: transparent;
    transition: background 0.12s; -webkit-tap-highlight-color: transparent;
  }
  body.theme-light .dpm-item { border-bottom: 1px solid #f5f5f5; }
  body.theme-dim   .dpm-item { border-bottom: 1px solid #1e2732; }
  body.theme-dark  .dpm-item { border-bottom: 1px solid #1a1a1a; }
  .dpm-item:last-child { border-bottom: none !important; }
  body.theme-light .dpm-item:hover { background: #f7f7f7; }
  body.theme-dim   .dpm-item:hover { background: #1e2732; }
  body.theme-dark  .dpm-item:hover { background: #1a1a1a; }

  .dpm-icon { width: 32px; height: 32px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .dpm-icon svg { width: 15px; height: 15px; fill: none; stroke: #fff; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
  .dpm-label { font-size: 13px; font-weight: 700; font-family: var(--font,sans-serif); }
  .dpm-sub   { font-size: 10px; font-weight: 500; margin-top: 1px; font-family: var(--font,sans-serif); }
  body.theme-light .dpm-label { color: #111; } body.theme-dim .dpm-label { color: #fff; } body.theme-dark .dpm-label { color: #fff; }
  body.theme-light .dpm-sub   { color: #aaa; } body.theme-dim .dpm-sub   { color: #536471; } body.theme-dark .dpm-sub { color: #555; }
  .dpm-arrow svg { width: 12px; height: 12px; fill: none; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
  body.theme-light .dpm-arrow svg { stroke: #ccc; } body.theme-dim .dpm-arrow svg { stroke: #38444d; } body.theme-dark .dpm-arrow svg { stroke: #333; }

  /* Centered modal */
  #dp-modal-overlay {
    position: fixed; inset: 0; z-index: 9200;
    background: rgba(0,0,0,0.52);
    backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
    display: flex; align-items: center; justify-content: center;
    opacity: 0; pointer-events: none; transition: opacity 0.24s ease;
  }
  #dp-modal-overlay.open { opacity: 1; pointer-events: all; }
  #dp-modal-card {
    width: 500px; max-width: calc(100vw - 32px);
    height: 78vh; max-height: 680px;
    border-radius: 24px; overflow: hidden;
    display: flex; flex-direction: column;
    transform: scale(0.92) translateY(18px);
    transition: transform 0.3s cubic-bezier(0.22,1,0.36,1);
    box-shadow: 0 28px 80px rgba(0,0,0,0.38);
  }
  #dp-modal-overlay.open #dp-modal-card { transform: scale(1) translateY(0); }
  body.theme-light #dp-modal-card { background: #fff; }
  body.theme-dim   #dp-modal-card { background: #15202b; }
  body.theme-dark  #dp-modal-card { background: #0a0a0a; }
  #dp-modal-bar  { height: 3px; flex-shrink: 0; background: var(--brand-gradient); }
  #dp-modal-head {
    display: flex; align-items: center; justify-content: space-between;
    padding: 13px 16px 11px; flex-shrink: 0; border-bottom: 1px solid;
  }
  body.theme-light #dp-modal-head { border-color: #f0f0f0; }
  body.theme-dim   #dp-modal-head { border-color: #38444d; }
  body.theme-dark  #dp-modal-head { border-color: #1e1e1e; }
  #dp-modal-title { font-size: 14px; font-weight: 800; font-family: var(--font,sans-serif); letter-spacing: -0.02em; }
  body.theme-light #dp-modal-title { color: #111; } body.theme-dim #dp-modal-title { color: #fff; } body.theme-dark #dp-modal-title { color: #fff; }
  #dp-modal-close {
    width: 28px; height: 28px; border-radius: 50%; border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: transform 0.15s, background 0.15s;
  }
  #dp-modal-close:hover { transform: scale(1.1); } #dp-modal-close:active { transform: scale(0.88); }
  body.theme-light #dp-modal-close { background: #f2f2f2; color: #555; }
  body.theme-dim   #dp-modal-close { background: #253240; color: #8899a6; }
  body.theme-dark  #dp-modal-close { background: #1a1a1a; color: #a6a6a6; }
  #dp-modal-iframe { flex: 1; border: none; width: 100%; height: 100%; display: block; }

  /* Edit pencil */
  #dp-edit-btn {
    display: inline-flex; align-items: center; justify-content: center;
    width: 22px; height: 22px; border-radius: 50%; border: none; cursor: pointer;
    margin-left: 7px; flex-shrink: 0; vertical-align: middle;
    transition: transform 0.18s cubic-bezier(0.34,1.56,0.64,1);
    -webkit-tap-highlight-color: transparent;
  }
  #dp-edit-btn:hover { transform: scale(1.2); } #dp-edit-btn:active { transform: scale(0.88); }
  #dp-edit-btn svg { width: 11px; height: 11px; fill: none; stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round; }
  body.theme-light #dp-edit-btn { background: #ebebeb; } body.theme-dim #dp-edit-btn { background: #1e2732; } body.theme-dark #dp-edit-btn { background: #1a1a1a; }
  body.theme-light #dp-edit-btn svg { stroke: #555; } body.theme-dim #dp-edit-btn svg { stroke: #8899a6; } body.theme-dark #dp-edit-btn svg { stroke: #a6a6a6; }

  /* Stat dividers */
  .dp-stat-div {
    width: 1px; height: 26px; border-radius: 1px;
    align-self: center; flex-shrink: 0;
  }
  body.theme-light .dp-stat-div { background: #e8e8e8; }
  body.theme-dim   .dp-stat-div { background: #38444d; }
  body.theme-dark  .dp-stat-div { background: #2f3336; }

  /* Bio row */
  #dp-bio-row { padding: 0 20px 14px; display: flex; flex-direction: column; gap: 5px; flex-shrink: 0; }
  #dp-bio-text { font-size: 12px; font-weight: 500; line-height: 1.5; font-family: var(--font,sans-serif); }
  body.theme-light #dp-bio-text { color: #555; } body.theme-dim #dp-bio-text { color: #8899a6; } body.theme-dark #dp-bio-text { color: #a6a6a6; }
  #dp-join-date { display: flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 600; font-family: var(--font,sans-serif); }
  body.theme-light #dp-join-date { color: #bbb; } body.theme-dim #dp-join-date { color: #536471; } body.theme-dark #dp-join-date { color: #555; }

`;
document.head.appendChild(st);

// SVGs
var GEAR = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>';
var XICON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
window._gearSVG = GEAR;

// ── MODAL ──
var _modalBuilt = false;
function buildModal() {
  if (_modalBuilt) return; _modalBuilt = true;
  var ov = el('div'); ov.id = 'dp-modal-overlay';
  ov.addEventListener('click', function(e) { if (e.target === ov) closeModal(); });
  var card = el('div'); card.id = 'dp-modal-card';
  var bar  = el('div'); bar.id  = 'dp-modal-bar';
  var head = el('div'); head.id = 'dp-modal-head';
  var title = el('div'); title.id = 'dp-modal-title';
  var cls = el('button'); cls.id = 'dp-modal-close';
  cls.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
  cls.addEventListener('click', closeModal);
  head.appendChild(title); head.appendChild(cls);
  var iframe = el('iframe'); iframe.id = 'dp-modal-iframe';
  card.appendChild(bar); card.appendChild(head); card.appendChild(iframe);
  ov.appendChild(card); document.body.appendChild(ov);
}
function openModal(t, src) {
  buildModal();
  document.getElementById('dp-modal-title').textContent = t;
  document.getElementById('dp-modal-iframe').src = src;
  document.getElementById('dp-modal-overlay').classList.add('open');
  closeMenu();
}
function closeModal() {
  var o = document.getElementById('dp-modal-overlay');
  if (o) o.classList.remove('open');
  setTimeout(function() { var f = document.getElementById('dp-modal-iframe'); if (f) f.src = 'about:blank'; }, 320);
}
window._closeModal = closeModal;
document.addEventListener('keydown', function(e) { if (e.key === 'Escape') closeModal(); });

// ── SETTINGS MENU ──
var ITEMS = [
  { icon: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>', bg: 'linear-gradient(135deg,#0f0f0f,#3a3a3a)', label: 'Appearance', sub: 'Theme, display', file: 'chats.html' },
  { icon: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>', bg: 'linear-gradient(135deg,#1a1a2e,#16213e)', label: 'Privacy & Safety', sub: 'Who sees your content', file: 'privacy.html' },
  { icon: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>', bg: 'linear-gradient(135deg,#2d1b69,#11998e)', label: 'Notifications', sub: 'Likes, comments, follows', file: 'notifications.html' },
  { icon: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>', bg: 'linear-gradient(135deg,#373b44,#4286f4)', label: 'Help & Support', sub: 'FAQs, contact us', file: 'help.html' },
  { icon: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>', bg: 'linear-gradient(135deg,#3a3a3a,#a6a6a6)', label: 'About & Policies', sub: 'Terms, privacy policy', file: 'about.html' }
];
var _menuOpen = false;
function buildMenu(parent) {
  if (document.getElementById('dp-settings-menu')) return;
  var menu = el('div'); menu.id = 'dp-settings-menu';
  ITEMS.forEach(function(item) {
    var row = el('button'); row.className = 'dpm-item';
    var ic  = el('div'); ic.className = 'dpm-icon'; ic.style.background = item.bg;
    ic.innerHTML = '<svg viewBox="0 0 24 24">' + item.icon + '</svg>';
    var txt = el('div'); txt.className = 'dpm-text';
    txt.innerHTML = '<div class="dpm-label">' + item.label + '</div><div class="dpm-sub">' + item.sub + '</div>';
    var arr = el('div'); arr.className = 'dpm-arrow';
    arr.innerHTML = '<svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>';
    row.appendChild(ic); row.appendChild(txt); row.appendChild(arr);
    row.addEventListener('click', function() { openModal(item.label, item.file); });
    menu.appendChild(row);
  });
  parent.appendChild(menu);
}
function openMenu() {
  _menuOpen = true;
  var m = document.getElementById('dp-settings-menu');
  if (m) m.classList.add('open');
  var b = document.getElementById('dp-settings-badge');
  if (b) { b.classList.add('is-open'); b.innerHTML = XICON; }
}
function closeMenu() {
  _menuOpen = false;
  var m = document.getElementById('dp-settings-menu');
  if (m) m.classList.remove('open');
  var b = document.getElementById('dp-settings-badge');
  if (b) { b.classList.remove('is-open'); b.innerHTML = GEAR; }
}
window._closeSettingsMenu = closeMenu;
document.addEventListener('click', function(e) {
  if (_menuOpen && !e.target.closest('#dp-settings-menu') && !e.target.closest('#dp-settings-badge')) closeMenu();
});

// ── BIO ROW ──
function injectBioRow() {
  if (document.getElementById('dp-bio-row')) return;
  var head = document.getElementById('dp-head');
  if (!head) return;
  var bioRow = el('div'); bioRow.id = 'dp-bio-row';
  var bioText = el('div'); bioText.id = 'dp-bio-text';
  bioText.textContent = 'Your videos, likes and super-likes live here.';
  var joinDiv = el('div'); joinDiv.id = 'dp-join-date';
  var now = new Date();
  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  joinDiv.innerHTML = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>Joined ' + months[now.getMonth()] + ' ' + now.getFullYear();
  bioRow.appendChild(bioText); bioRow.appendChild(joinDiv);
  head.parentNode.insertBefore(bioRow, head.nextSibling);
}

// ── STAT DIVIDERS ──
function injectStatDividers() {
  var stats = document.getElementById('dp-stats');
  if (!stats || stats.dataset.divs) return;
  var obs = new MutationObserver(function() {
    var items = stats.querySelectorAll('[data-stat]');
    if (items.length < 2) return;
    obs.disconnect(); stats.dataset.divs = '1';
    var ch = Array.prototype.slice.call(stats.children);
    stats.innerHTML = '';
    ch.forEach(function(c, i) {
      stats.appendChild(c);
      if (i < ch.length - 1) { var d = el('div'); d.className = 'dp-stat-div'; stats.appendChild(d); }
    });
  });
  obs.observe(stats, { childList: true, subtree: true });
}

// ── INJECT ALL ──
function injectAll() {
  var pp = document.getElementById('ds-profile-panel');
  if (!pp) { setTimeout(injectAll, 400); return; }

  // Gear + menu
  if (!document.getElementById('dp-settings-badge')) {
    pp.style.position = 'relative';
    var gear = el('button'); gear.id = 'dp-settings-badge';
    gear.setAttribute('aria-label', 'Settings'); gear.innerHTML = GEAR;
    gear.addEventListener('click', function() { if (_menuOpen) closeMenu(); else openMenu(); });
    pp.appendChild(gear); buildMenu(pp);
  }

  // Edit pencil
  if (!document.getElementById('dp-edit-btn')) {
    (function tryEdit() {
      var nm = document.getElementById('dp-name');
      if (!nm) { setTimeout(tryEdit, 300); return; }
      var btn = el('button'); btn.id = 'dp-edit-btn';
      btn.setAttribute('aria-label', 'Edit profile');
      btn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>';
      btn.addEventListener('click', function() { openModal('Edit Profile', 'edit.html'); });
      nm.style.display = 'inline-flex'; nm.style.alignItems = 'center';
      nm.appendChild(btn);
    })();
  }

  injectStatDividers();
  injectBioRow();

  // Re-apply active tab on each open
  setTimeout(reapplyActiveTab, 100);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectAll);
} else {
  injectAll();
}
document.addEventListener('click', function(e) {
  if (e.target.closest('#dsNavProfile')) setTimeout(function() { injectAll(); reapplyActiveTab(); }, 200);
});
window._openProfileModal = openModal;

})();

// ════════════════════════════════════════════

// ═══════════════════════════════════════════════════════
//  PROFILE ENHANCEMENTS — paste before </body>
// ═══════════════════════════════════════════════════════
(function() {
'use strict';

function hideArrows() {
  var na = document.getElementById('desktopNavArrows');
  if (na) na.style.display = 'none';
}
function el(tag, css, html) {
  var e = document.createElement(tag);
  if (css)  e.style.cssText = css;
  if (html) e.innerHTML = html;
  return e;
}

// ── FIX: dpv-back hides arrows ──
(function patchBack() {
  var btn = document.getElementById('dpv-back');
  if (!btn) { setTimeout(patchBack, 400); return; }
  btn.addEventListener('click', hideArrows, true);
})();

// ── FIX: nav buttons hide arrows + fix stuck profile ──
(function patchNav() {
  var btns = document.querySelectorAll('.ds-nav-item');
  if (!btns.length) { setTimeout(patchNav, 500); return; }
  btns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      hideArrows();
      if (btn.id !== 'dsNavProfile') { closeMenu(); closeModal(); }
      if (btn.id === 'dsNavProfile') {
        setTimeout(function() {
          var pp = document.getElementById('ds-profile-panel');
          if (pp) { pp.style.display='flex'; pp.style.opacity=''; pp.style.pointerEvents=''; }
        }, 60);
      }
    });
  });
})();
setTimeout(function() {
  document.querySelectorAll('.ds-nav-item').forEach(function(b){
    if (!b._p2) { b._p2=true; b.addEventListener('click', hideArrows); }
  });
}, 1500);

// ── FIX: re-apply active tab style ──
function reapplyActiveTab() {
  var pp = document.getElementById('ds-profile-panel');
  var key = (pp && pp._activeTabKey) || 'uploaded';
  document.querySelectorAll('#dp-tabs button').forEach(function(b) {
    var on = b.dataset.key === key;
    b.style.color = on ? '#111' : '#aaa';
    b.style.borderImage = on ? 'linear-gradient(135deg,#0f0f0f 0%,#3a3a3a 40%,#626262 70%,#a6a6a6 100%) 1' : 'none';
    b.style.borderBottomColor = on ? '#626262' : 'transparent';
  });
}

// ── STYLES ──
var st = document.createElement('style');
st.textContent = `

  /* Gear button */
  #dp-settings-badge {
    position: absolute; top: 14px; right: 14px; z-index: 20;
    width: 34px; height: 34px; border-radius: 50%; border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    background: var(--brand-gradient);
    box-shadow: 0 2px 12px rgba(0,0,0,0.22);
    transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s;
    -webkit-tap-highlight-color: transparent;
  }
  #dp-settings-badge svg { stroke: #fff; fill: none; }
  #dp-settings-badge:hover  { transform: rotate(40deg) scale(1.1); box-shadow: 0 4px 18px rgba(0,0,0,0.3); }
  #dp-settings-badge:active { transform: scale(0.9); }
  #dp-settings-badge.is-open { transform: rotate(0deg) !important; }
  #dp-settings-badge.is-open:hover { transform: scale(1.08) !important; }

  /* Settings dropdown */
  #dp-settings-menu {
    position: absolute; top: 54px; right: 14px; z-index: 200;
    width: 230px; border-radius: 16px; overflow: hidden;
    opacity: 0; pointer-events: none;
    transform: scale(0.9) translateY(-6px);
    transform-origin: top right;
    transition: opacity 0.2s ease, transform 0.22s cubic-bezier(0.34,1.56,0.64,1);
    box-shadow: 0 8px 32px rgba(0,0,0,0.16);
  }
  #dp-settings-menu.open { opacity: 1; pointer-events: all; transform: scale(1) translateY(0); }
  body.theme-light #dp-settings-menu { background: #fff;    border: 1px solid #efefef; }
  body.theme-dim   #dp-settings-menu { background: #15202b; border: 1px solid #38444d; }
  body.theme-dark  #dp-settings-menu { background: #0f0f0f; border: 1px solid #2f3336; }

  .dpm-item {
    display: flex; align-items: center; gap: 11px;
    padding: 11px 14px; cursor: pointer; border: none;
    width: 100%; text-align: left; background: transparent;
    transition: background 0.12s; -webkit-tap-highlight-color: transparent;
  }
  body.theme-light .dpm-item { border-bottom: 1px solid #f5f5f5; }
  body.theme-dim   .dpm-item { border-bottom: 1px solid #1e2732; }
  body.theme-dark  .dpm-item { border-bottom: 1px solid #1a1a1a; }
  .dpm-item:last-child { border-bottom: none !important; }
  body.theme-light .dpm-item:hover { background: #f7f7f7; }
  body.theme-dim   .dpm-item:hover { background: #1e2732; }
  body.theme-dark  .dpm-item:hover { background: #1a1a1a; }

  .dpm-icon { width: 32px; height: 32px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .dpm-icon svg { width: 15px; height: 15px; fill: none; stroke: #fff; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
  .dpm-label { font-size: 13px; font-weight: 700; font-family: var(--font,sans-serif); }
  .dpm-sub   { font-size: 10px; font-weight: 500; margin-top: 1px; font-family: var(--font,sans-serif); }
  body.theme-light .dpm-label { color: #111; } body.theme-dim .dpm-label { color: #fff; } body.theme-dark .dpm-label { color: #fff; }
  body.theme-light .dpm-sub   { color: #aaa; } body.theme-dim .dpm-sub   { color: #536471; } body.theme-dark .dpm-sub { color: #555; }
  .dpm-arrow svg { width: 12px; height: 12px; fill: none; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
  body.theme-light .dpm-arrow svg { stroke: #ccc; } body.theme-dim .dpm-arrow svg { stroke: #38444d; } body.theme-dark .dpm-arrow svg { stroke: #333; }

  /* Centered modal */
  #dp-modal-overlay {
    position: fixed; inset: 0; z-index: 9200;
    background: rgba(0,0,0,0.52);
    backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
    display: flex; align-items: center; justify-content: center;
    opacity: 0; pointer-events: none; transition: opacity 0.24s ease;
  }
  #dp-modal-overlay.open { opacity: 1; pointer-events: all; }
  #dp-modal-card {
    width: 500px; max-width: calc(100vw - 32px);
    height: 78vh; max-height: 680px;
    border-radius: 24px; overflow: hidden;
    display: flex; flex-direction: column;
    transform: scale(0.92) translateY(18px);
    transition: transform 0.3s cubic-bezier(0.22,1,0.36,1);
    box-shadow: 0 28px 80px rgba(0,0,0,0.38);
  }
  #dp-modal-overlay.open #dp-modal-card { transform: scale(1) translateY(0); }
  body.theme-light #dp-modal-card { background: #fff; }
  body.theme-dim   #dp-modal-card { background: #15202b; }
  body.theme-dark  #dp-modal-card { background: #0a0a0a; }
  #dp-modal-bar  { height: 3px; flex-shrink: 0; background: var(--brand-gradient); }
  #dp-modal-head {
    display: flex; align-items: center; justify-content: space-between;
    padding: 13px 16px 11px; flex-shrink: 0; border-bottom: 1px solid;
  }
  body.theme-light #dp-modal-head { border-color: #f0f0f0; }
  body.theme-dim   #dp-modal-head { border-color: #38444d; }
  body.theme-dark  #dp-modal-head { border-color: #1e1e1e; }
  #dp-modal-title { font-size: 14px; font-weight: 800; font-family: var(--font,sans-serif); letter-spacing: -0.02em; }
  body.theme-light #dp-modal-title { color: #111; } body.theme-dim #dp-modal-title { color: #fff; } body.theme-dark #dp-modal-title { color: #fff; }
  #dp-modal-close {
    width: 28px; height: 28px; border-radius: 50%; border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: transform 0.15s, background 0.15s;
  }
  #dp-modal-close:hover { transform: scale(1.1); } #dp-modal-close:active { transform: scale(0.88); }
  body.theme-light #dp-modal-close { background: #f2f2f2; color: #555; }
  body.theme-dim   #dp-modal-close { background: #253240; color: #8899a6; }
  body.theme-dark  #dp-modal-close { background: #1a1a1a; color: #a6a6a6; }
  #dp-modal-iframe { flex: 1; border: none; width: 100%; height: 100%; display: block; }

  /* Edit pencil */
  #dp-edit-btn {
    display: inline-flex; align-items: center; justify-content: center;
    width: 22px; height: 22px; border-radius: 50%; border: none; cursor: pointer;
    margin-left: 7px; flex-shrink: 0; vertical-align: middle;
    transition: transform 0.18s cubic-bezier(0.34,1.56,0.64,1);
    -webkit-tap-highlight-color: transparent;
  }
  #dp-edit-btn:hover { transform: scale(1.2); } #dp-edit-btn:active { transform: scale(0.88); }
  #dp-edit-btn svg { width: 11px; height: 11px; fill: none; stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round; }
  body.theme-light #dp-edit-btn { background: #ebebeb; } body.theme-dim #dp-edit-btn { background: #1e2732; } body.theme-dark #dp-edit-btn { background: #1a1a1a; }
  body.theme-light #dp-edit-btn svg { stroke: #555; } body.theme-dim #dp-edit-btn svg { stroke: #8899a6; } body.theme-dark #dp-edit-btn svg { stroke: #a6a6a6; }

  /* Stat dividers */
  .dp-stat-div {
    width: 1px; height: 26px; border-radius: 1px;
    align-self: center; flex-shrink: 0;
  }
  body.theme-light .dp-stat-div { background: #e8e8e8; }
  body.theme-dim   .dp-stat-div { background: #38444d; }
  body.theme-dark  .dp-stat-div { background: #2f3336; }

  /* Bio row */
  #dp-bio-row { padding: 0 20px 14px; display: flex; flex-direction: column; gap: 5px; flex-shrink: 0; }
  #dp-bio-text { font-size: 12px; font-weight: 500; line-height: 1.5; font-family: var(--font,sans-serif); }
  body.theme-light #dp-bio-text { color: #555; } body.theme-dim #dp-bio-text { color: #8899a6; } body.theme-dark #dp-bio-text { color: #a6a6a6; }
  #dp-join-date { display: flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 600; font-family: var(--font,sans-serif); }
  body.theme-light #dp-join-date { color: #bbb; } body.theme-dim #dp-join-date { color: #536471; } body.theme-dark #dp-join-date { color: #555; }

`;
document.head.appendChild(st);

// SVGs
var GEAR = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>';
var XICON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
window._gearSVG = GEAR;

// ── MODAL ──
var _modalBuilt = false;
function buildModal() {
  if (_modalBuilt) return; _modalBuilt = true;
  var ov = el('div'); ov.id = 'dp-modal-overlay';
  ov.addEventListener('click', function(e) { if (e.target === ov) closeModal(); });
  var card = el('div'); card.id = 'dp-modal-card';
  var bar  = el('div'); bar.id  = 'dp-modal-bar';
  var head = el('div'); head.id = 'dp-modal-head';
  var title = el('div'); title.id = 'dp-modal-title';
  var cls = el('button'); cls.id = 'dp-modal-close';
  cls.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
  cls.addEventListener('click', closeModal);
  head.appendChild(title); head.appendChild(cls);
  var iframe = el('iframe'); iframe.id = 'dp-modal-iframe';
  card.appendChild(bar); card.appendChild(head); card.appendChild(iframe);
  ov.appendChild(card); document.body.appendChild(ov);
}
function openModal(t, src) {
  buildModal();
  document.getElementById('dp-modal-title').textContent = t;
  document.getElementById('dp-modal-iframe').src = src;
  document.getElementById('dp-modal-overlay').classList.add('open');
  closeMenu();
}
function closeModal() {
  var o = document.getElementById('dp-modal-overlay');
  if (o) o.classList.remove('open');
  setTimeout(function() { var f = document.getElementById('dp-modal-iframe'); if (f) f.src = 'about:blank'; }, 320);
}
window._closeModal = closeModal;
document.addEventListener('keydown', function(e) { if (e.key === 'Escape') closeModal(); });

// ── SETTINGS MENU ──
var ITEMS = [
  { icon: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>', bg: 'linear-gradient(135deg,#0f0f0f,#3a3a3a)', label: 'Appearance', sub: 'Theme, display', file: 'chats.html' },
  { icon: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>', bg: 'linear-gradient(135deg,#1a1a2e,#16213e)', label: 'Privacy & Safety', sub: 'Who sees your content', file: 'privacy.html' },
  { icon: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>', bg: 'linear-gradient(135deg,#2d1b69,#11998e)', label: 'Notifications', sub: 'Likes, comments, follows', file: 'notifications.html' },
  { icon: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>', bg: 'linear-gradient(135deg,#373b44,#4286f4)', label: 'Help & Support', sub: 'FAQs, contact us', file: 'help.html' },
  { icon: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>', bg: 'linear-gradient(135deg,#3a3a3a,#a6a6a6)', label: 'About & Policies', sub: 'Terms, privacy policy', file: 'about.html' }
];
var _menuOpen = false;
function buildMenu(parent) {
  if (document.getElementById('dp-settings-menu')) return;
  var menu = el('div'); menu.id = 'dp-settings-menu';
  ITEMS.forEach(function(item) {
    var row = el('button'); row.className = 'dpm-item';
    var ic  = el('div'); ic.className = 'dpm-icon'; ic.style.background = item.bg;
    ic.innerHTML = '<svg viewBox="0 0 24 24">' + item.icon + '</svg>';
    var txt = el('div'); txt.className = 'dpm-text';
    txt.innerHTML = '<div class="dpm-label">' + item.label + '</div><div class="dpm-sub">' + item.sub + '</div>';
    var arr = el('div'); arr.className = 'dpm-arrow';
    arr.innerHTML = '<svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>';
    row.appendChild(ic); row.appendChild(txt); row.appendChild(arr);
    row.addEventListener('click', function() { openModal(item.label, item.file); });
    menu.appendChild(row);
  });
  parent.appendChild(menu);
}
function openMenu() {
  _menuOpen = true;
  var m = document.getElementById('dp-settings-menu');
  if (m) m.classList.add('open');
  var b = document.getElementById('dp-settings-badge');
  if (b) { b.classList.add('is-open'); b.innerHTML = XICON; }
}
function closeMenu() {
  _menuOpen = false;
  var m = document.getElementById('dp-settings-menu');
  if (m) m.classList.remove('open');
  var b = document.getElementById('dp-settings-badge');
  if (b) { b.classList.remove('is-open'); b.innerHTML = GEAR; }
}
window._closeSettingsMenu = closeMenu;
document.addEventListener('click', function(e) {
  if (_menuOpen && !e.target.closest('#dp-settings-menu') && !e.target.closest('#dp-settings-badge')) closeMenu();
});

// ── BIO ROW ──
function injectBioRow() {
  if (document.getElementById('dp-bio-row')) return;
  var head = document.getElementById('dp-head');
  if (!head) return;
  var bioRow = el('div'); bioRow.id = 'dp-bio-row';
  var bioText = el('div'); bioText.id = 'dp-bio-text';
  bioText.textContent = 'Your videos, likes and super-likes live here.';
  var joinDiv = el('div'); joinDiv.id = 'dp-join-date';
  var now = new Date();
  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  joinDiv.innerHTML = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>Joined ' + months[now.getMonth()] + ' ' + now.getFullYear();
  bioRow.appendChild(bioText); bioRow.appendChild(joinDiv);
  head.parentNode.insertBefore(bioRow, head.nextSibling);
}

// ── STAT DIVIDERS ──
function injectStatDividers() {
  var stats = document.getElementById('dp-stats');
  if (!stats || stats.dataset.divs) return;
  var obs = new MutationObserver(function() {
    var items = stats.querySelectorAll('[data-stat]');
    if (items.length < 2) return;
    obs.disconnect(); stats.dataset.divs = '1';
    var ch = Array.prototype.slice.call(stats.children);
    stats.innerHTML = '';
    ch.forEach(function(c, i) {
      stats.appendChild(c);
      if (i < ch.length - 1) { var d = el('div'); d.className = 'dp-stat-div'; stats.appendChild(d); }
    });
  });
  obs.observe(stats, { childList: true, subtree: true });
}

// ── INJECT ALL ──
function injectAll() {
  var pp = document.getElementById('ds-profile-panel');
  if (!pp) { setTimeout(injectAll, 400); return; }

  // Gear + menu
  if (!document.getElementById('dp-settings-badge')) {
    pp.style.position = 'relative';
    var gear = el('button'); gear.id = 'dp-settings-badge';
    gear.setAttribute('aria-label', 'Settings'); gear.innerHTML = GEAR;
    gear.addEventListener('click', function() { if (_menuOpen) closeMenu(); else openMenu(); });
    pp.appendChild(gear); buildMenu(pp);
  }

  // Edit pencil
  if (!document.getElementById('dp-edit-btn')) {
    (function tryEdit() {
      var nm = document.getElementById('dp-name');
      if (!nm) { setTimeout(tryEdit, 300); return; }
      var btn = el('button'); btn.id = 'dp-edit-btn';
      btn.setAttribute('aria-label', 'Edit profile');
      btn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>';
      btn.addEventListener('click', function() { openModal('Edit Profile', 'edit.html'); });
      nm.style.display = 'inline-flex'; nm.style.alignItems = 'center';
      nm.appendChild(btn);
    })();
  }

  injectStatDividers();
  injectBioRow();

  // Re-apply active tab on each open
  setTimeout(reapplyActiveTab, 100);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectAll);
} else {
  injectAll();
}
document.addEventListener('click', function(e) {
  if (e.target.closest('#dsNavProfile')) setTimeout(function() { injectAll(); reapplyActiveTab(); }, 200);
});
window._openProfileModal = openModal;

})();

// ════════════════════════════════════════════
// MOBILE PROFILE SETTINGS PANEL
// ════════════════════════════════════════════

// ═══════════════════════════════════════════════════════
//  MOBILE PROFILE SETTINGS — slides in from the right
//  Works on the mobile profile section (#profile-section)
//  No conflict with desktop code above
// ═══════════════════════════════════════════════════════
(function() {

  var GEAR_SVG = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>';

  var ITEMS = [
    { icon: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>', bg: 'linear-gradient(135deg,#0f0f0f,#3a3a3a)', label: 'Appearance',      sub: 'Theme, display',           file: 'chats.html' },
    { icon: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>', bg: 'linear-gradient(135deg,#1a1a2e,#16213e)', label: 'Privacy & Safety', sub: 'Who sees your content',    file: 'privacy.html' },
    { icon: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>', bg: 'linear-gradient(135deg,#2d1b69,#11998e)', label: 'Notifications',   sub: 'Likes, comments, follows', file: 'notifications.html' },
    { icon: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>', bg: 'linear-gradient(135deg,#373b44,#4286f4)', label: 'Help & Support',  sub: 'FAQs, contact us',          file: 'help.html' },
    { icon: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>', bg: 'linear-gradient(135deg,#3a3a3a,#a6a6a6)', label: 'About & Policies', sub: 'Terms, privacy policy',     file: 'about.html' }
  ];

    // ── Styles moved to index.html <style> ──

  // ── Build the panel once ──
  var _built = false;
  function buildPanel() {
    if (_built) return; _built = true;

    var panel = document.createElement('div');
    panel.id = 'mob-set-panel';

    // Top gradient bar
    var bar = document.createElement('div'); bar.id = 'mob-set-topbar';
    panel.appendChild(bar);

    // Header
    var head = document.createElement('div'); head.id = 'mob-set-head';
    var backBtn = document.createElement('button'); backBtn.id = 'mob-set-back';
    backBtn.setAttribute('aria-label', 'Back');
    backBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>';
    backBtn.addEventListener('click', function() {
      closePanel();
    });
    var title = document.createElement('span'); title.id = 'mob-set-title';
    title.textContent = 'Settings';
    head.appendChild(backBtn); head.appendChild(title);
    panel.appendChild(head);

    // Menu list
    var list = document.createElement('div'); list.id = 'mob-set-list';
    ITEMS.forEach(function(item) {
      var row = document.createElement('div'); row.className = 'mob-set-item';
      var icon = document.createElement('div'); icon.className = 'mob-set-icon'; icon.style.background = item.bg;
      icon.innerHTML = '<svg viewBox="0 0 24 24">' + item.icon + '</svg>';
      var text = document.createElement('div'); text.className = 'mob-set-text';
      text.innerHTML = '<div class="mob-set-label">' + item.label + '</div><div class="mob-set-sub">' + item.sub + '</div>';
      var chev = document.createElement('div'); chev.className = 'mob-set-chevron';
      chev.innerHTML = '<svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>';
      row.appendChild(icon); row.appendChild(text); row.appendChild(chev);
      row.addEventListener('click', function() { openSubPage(item.label, item.file); });
      list.appendChild(row);
    });
    panel.appendChild(list);

    // Iframe for sub-pages
    var iframe = document.createElement('iframe'); iframe.id = 'mob-set-iframe';
    iframe.setAttribute('loading', 'lazy');
    panel.appendChild(iframe);

    document.body.appendChild(panel);
  }

  function openPanel() {
    buildPanel();
    document.getElementById('mob-set-panel').classList.add('open');
  }

  function closePanel() {
    var panel  = document.getElementById('mob-set-panel');
    var iframe = document.getElementById('mob-set-iframe');
    var list   = document.getElementById('mob-set-list');
    var title  = document.getElementById('mob-set-title');
    if (panel) panel.classList.remove('open');
    // Reset after transition
    setTimeout(function() {
      if (iframe) { iframe.style.display = 'none'; iframe.src = 'about:blank'; }
      if (list)   list.style.display = 'block';
      if (title)  title.textContent = 'Settings';
    }, 400);
  }

  function openSubPage(label, file) {
    var list   = document.getElementById('mob-set-list');
    var iframe = document.getElementById('mob-set-iframe');
    var title  = document.getElementById('mob-set-title');
    if (list)   list.style.display = 'none';
    if (iframe) { iframe.style.display = 'block'; iframe.src = file; }
    if (title)  title.textContent = label;
  }

  // ── Inject gear into mob-prof-head top row ──
  function injectMobGear() {
    var head = document.getElementById('mob-prof-head');
    if (!head) { setTimeout(injectMobGear, 400); return; }
    if (document.getElementById('mob-set-gear')) return;

    // Gear sits top-right of the whole profile head
    head.style.position = 'relative';
    var gear = document.createElement('button');
    gear.id = 'mob-set-gear';
    gear.setAttribute('aria-label', 'Settings');
    gear.innerHTML = GEAR_SVG;
    gear.addEventListener('click', openPanel);
    head.appendChild(gear);

    // Edit pencil next to name
    if (!document.getElementById('mob-set-edit-btn')) {
      (function tryMobEdit() {
        var av = document.getElementById('mob-prof-av');
        if (!av) { setTimeout(tryMobEdit, 300); return; }
        if (document.getElementById('mob-set-edit-btn')) return;
        // Wrap avatar in a relative container so pencil can sit on its corner
        var wrapper = document.createElement('div');
        wrapper.id = 'mob-set-av-wrap';
        wrapper.style.cssText = 'position:relative;flex-shrink:0;width:64px;height:64px;';
        av.parentNode.insertBefore(wrapper, av);
        wrapper.appendChild(av);
        var btn = document.createElement('button');
        btn.id = 'mob-set-edit-btn';
        btn.setAttribute('aria-label', 'Edit profile');
        btn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>';
        btn.addEventListener('click', function() {
          openPanel();
          setTimeout(function() { openSubPage('Edit Profile', 'edit.html'); }, 50);
        });
        wrapper.appendChild(btn);
      })();
    }
  }

  // Close when switching away via bottom nav
  document.addEventListener('click', function(e) {
    var navBtn = e.target.closest('.nav-btn');
    if (navBtn) closePanel();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectMobGear);
  } else {
    injectMobGear();
  }

  // Re-inject if profile section reopened
  document.addEventListener('click', function(e) {
    var nb = e.target.closest('[data-section="profile"], #navProfile, .nav-btn');
    if (nb) setTimeout(injectMobGear, 300);
  });

  window._mobOpenSettings  = openPanel;
  window._mobCloseSettings = closePanel;

})();

// ════════════════════════════════════════════
// COMMENTS: dismiss, emoji bar, video, gif shimmer
// ════════════════════════════════════════════

(function () {

  // ── Styles moved to index.html <style> ──

  /* ══════════════════════════════════════════════════════
     DRAG TO DISMISS
     Works from the handle AND from scrolling up at the top.
     Uses the existing .comment-sheet.dragging + transition
     already in CSS. Calls csClose so video restores properly.
     ══════════════════════════════════════════════════════ */

  var sheet  = document.getElementById('commentSheet');
  var handle = document.getElementById('csDragHandle');
  var list   = document.getElementById('commentsList');

  function closeSheet() {
    var btn = document.getElementById('csClose');
    if (btn) btn.click();
  }

  function animateOut(onDone) {
    if (!sheet) return;
    sheet.classList.add('dragging');           // kill transition
    sheet.style.transform = 'translateY(100%)';
    sheet.style.opacity   = '0';
    // Re-enable transition for the fly-out
    requestAnimationFrame(function () {
      sheet.classList.remove('dragging');
      sheet.style.transition = 'transform 0.32s cubic-bezier(0.4,0,1,1), opacity 0.22s ease';
      requestAnimationFrame(function () {
        sheet.style.transform = 'translateY(100%)';
        sheet.style.opacity   = '0';
        setTimeout(function () {
          sheet.style.transition = '';
          sheet.style.transform  = '';
          sheet.style.opacity    = '';
          if (onDone) onDone();
        }, 340);
      });
    });
  }

  function dragSetup(el, fromList) {
    if (!el || !sheet) return;
    var startY      = 0;
    var startScroll = 0;
    var active      = false;
    var dismissed   = false;

    el.addEventListener('touchstart', function (e) {
      startY      = e.touches[0].clientY;
      startScroll = fromList ? list.scrollTop : 0;
      active      = true;
      dismissed   = false;
    }, { passive: true });

    el.addEventListener('touchmove', function (e) {
      if (!active || dismissed) return;
      // For list: only hijack when list is scrolled to the very top
      if (fromList && startScroll > 4) return;
      if (fromList && list.scrollTop > 4) return;

      var dy = e.touches[0].clientY - startY;
      if (dy <= 0) return;

      // Sheet follows finger live
      sheet.classList.add('dragging');
      sheet.style.transform = 'translateY(' + Math.min(dy, 320) + 'px)';
      sheet.style.opacity   = String(Math.max(0.35, 1 - dy / 380));

      if (dy > 130) {
        dismissed = true;
        active    = false;
        sheet.classList.remove('dragging');
        // Let it fly
        sheet.style.transition = 'transform 0.28s cubic-bezier(0.4,0,1,1), opacity 0.2s ease';
        sheet.style.transform  = 'translateY(100%)';
        sheet.style.opacity    = '0';
        setTimeout(function () {
          sheet.style.transition = '';
          sheet.style.transform  = '';
          sheet.style.opacity    = '';
          closeSheet();
        }, 300);
      }
    }, { passive: true });

    el.addEventListener('touchend', function () {
      if (!active || dismissed) return;
      active = false;
      // Snap back with spring
      sheet.classList.remove('dragging');
      sheet.style.transition = 'transform 0.38s cubic-bezier(0.34,1.56,0.64,1), opacity 0.22s ease';
      sheet.style.transform  = '';
      sheet.style.opacity    = '';
      setTimeout(function () { sheet.style.transition = ''; }, 400);
    }, { passive: true });
  }

  // Drag from handle bar (anywhere on handle area)
  dragSetup(handle, false);
  // Drag from list (only when scrolled to top)
  dragSetup(list, true);

  // Desktop: hard wheel-up at top dismisses
  if (list) {
    list.addEventListener('wheel', function (e) {
      if (list.scrollTop <= 0 && e.deltaY < -60) closeSheet();
    }, { passive: true });
  }


  /* ══════════════════════════════════════════════════════
     EMOJI ROW — hidden until keyboard appears (input focused)
     Targets the real #mobileEmojiRow / .cs-emoji-row
     Re-binds every time the sheet opens (lazy content).
     ══════════════════════════════════════════════════════ */

  var _emojiBound = false;

  function bindEmojiBar() {
    if (_emojiBound) return;
    var root  = document.getElementById('commentSheet') || document;
    var input = root.querySelector('#commentInput, #cmtInput, .comment-input, .cs-input');
    var bars  = root.querySelectorAll('#mobileEmojiRow, .cs-emoji-row, .cs-emoji-bar, #cmtEmojiBar, .emoji-suggestions');
    if (!input || bars.length === 0) return;
    _emojiBound = true;

    function show() {
      bars.forEach(function (b) {
        b.classList.remove('emoji-visible');
        void b.offsetWidth; // reflow — restart animation
        b.classList.add('emoji-visible');
      });
    }
    function hide() {
      setTimeout(function () {
        bars.forEach(function (b) { b.classList.remove('emoji-visible'); });
      }, 180);
    }
    input.addEventListener('focus', show);
    input.addEventListener('blur',  hide);
  }

  // Try now (if sheet is pre-rendered)
  bindEmojiBar();

  // Re-try every time the sheet opens (handles lazy-rendered content)
  if (sheet) {
    new MutationObserver(function (muts) {
      muts.forEach(function (m) {
        if (m.attributeName === 'class') {
          if (sheet.classList.contains('open')) {
            _emojiBound = false; // reset so we re-query fresh
            setTimeout(bindEmojiBar, 100);
          }
        }
      });
    }).observe(sheet, { attributes: true, attributeFilter: ['class'] });
  }


  /* ══════════════════════════════════════════════════════
     COMMENT POP ANIMATION
     ══════════════════════════════════════════════════════ */
  if (list) {
    new MutationObserver(function (muts) {
      muts.forEach(function (m) {
        var i = 0;
        m.addedNodes.forEach(function (node) {
          if (node.nodeType !== 1 || !node.classList.contains('comment')) return;
          var delay = i++ * 55;
          setTimeout(function () { node.classList.add('cmt-animate'); }, delay);
        });
      });
    }).observe(list, { childList: true });
  }


  /* ══════════════════════════════════════════════════════
     GIF SHIMMER
     ══════════════════════════════════════════════════════ */
  function wrapGif(img) {
    if (img.dataset.sw) return;
    img.dataset.sw = '1';
    var wrap = document.createElement('div');
    wrap.className = 'cmt-gif-wrap';
    img.parentNode.insertBefore(wrap, img);
    img.classList.remove('comment-gif');
    wrap.appendChild(img);
    var shim = document.createElement('div');
    shim.className = 'cmt-gif-shimmer';
    wrap.appendChild(shim);
    function done() { shim.classList.add('loaded'); }
    if (img.complete && img.naturalWidth) done();
    else { img.addEventListener('load', done); img.addEventListener('error', done); }
  }

  document.querySelectorAll('.comment-gif').forEach(wrapGif);

  if (list) {
    new MutationObserver(function (muts) {
      muts.forEach(function (m) {
        m.addedNodes.forEach(function (node) {
          if (node.nodeType !== 1) return;
          var imgs = node.classList && node.classList.contains('comment-gif')
            ? [node] : Array.from(node.querySelectorAll('.comment-gif'));
          imgs.forEach(wrapGif);
        });
      });
    }).observe(list, { childList: true, subtree: true });
  }

})();