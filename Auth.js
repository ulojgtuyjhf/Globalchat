// ── Inline Auth Overlay ──
// Drop this script into index.html once.
// Call window._showAuthPrompt() from anywhere to show the login sheet.
// On success the user stays on the page — no redirect.

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth, onAuthStateChanged,
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult,
  updateProfile, sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  getFirestore, setDoc, doc, getDoc, collection, query, where, getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ── Firebase init (reuse existing app if already initialised by index.js) ──
const _fbConfig = {
  apiKey:            "AIzaSyDnPz8BWCaXJOazlFVO4Eap8VxdSR2oDFQ",
  authDomain:        "globalchat-2d669.firebaseapp.com",
  projectId:         "globalchat-2d669",
  storageBucket:     "globalchat-2d669.firebasestorage.app",
  messagingSenderId: "178714711978",
  appId:             "1:178714711978:web:fb831188be23e62a4bbdd3"
};
const _app  = getApps().length ? getApps()[0] : initializeApp(_fbConfig);
const _auth = getAuth(_app);
const _db   = getFirestore(_app);
const R2_UPLOAD = 'https://r2-upload.katlegomashilwane0691.workers.dev/upload';

// ── Inject CSS ──
(function injectStyles() {
  if (document.getElementById('_auth-overlay-styles')) return;
  const s = document.createElement('style');
  s.id = '_auth-overlay-styles';
  s.textContent = `
    :root {
      --auth-brand: linear-gradient(135deg,#0f0f0f 0%,#3a3a3a 40%,#626262 70%,#a6a6a6 100%);
      --auth-brand-solid: #2a2a2a;
      --auth-card: #ffffff;
      --auth-text: #111111;
      --auth-mid: #555555;
      --auth-light: #999999;
      --auth-border: #e8e8e8;
      --auth-error: #e53935;
      --auth-success: #22c55e;
      --auth-radius: 16px;
      --auth-font: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
    }

    /* ── Overlay backdrop ── */
    #_auth-overlay {
      position: fixed; inset: 0; z-index: 99000;
      background: rgba(0,0,0,0.55);
      backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
      display: flex; align-items: center; justify-content: center;
      opacity: 0; visibility: hidden;
      transition: opacity 0.28s ease, visibility 0.28s ease;
    }
    #_auth-overlay.active { opacity: 1; visibility: visible; }

    /* ── Sheet ── */
    ._auth-sheet {
      background: var(--auth-card);
      border-radius: 24px;
      padding: 28px 24px;
      width: 92%; max-width: 400px;
      box-shadow: 0 32px 80px rgba(0,0,0,0.28);
      transform: translateY(28px) scale(0.96);
      transition: transform 0.34s cubic-bezier(0.22,1,0.36,1), opacity 0.28s ease;
      position: relative; opacity: 0;
      display: none;
      max-height: 92vh; overflow-y: auto;
      font-family: var(--auth-font);
    }
    #_auth-overlay.active ._auth-sheet {
      transform: translateY(0) scale(1); opacity: 1;
    }
    /* brand accent bar */
    ._auth-sheet::before {
      content:''; display:block; height:3px;
      background: var(--auth-brand);
      border-radius: 3px 3px 0 0;
      position:absolute; top:0; left:0; right:0;
    }

    /* ── Close button ── */
    ._auth-close {
      position:absolute; top:16px; right:16px;
      width:30px; height:30px; border-radius:50%;
      background:#f0f0f0; border:none;
      display:flex; align-items:center; justify-content:center;
      cursor:pointer; color:var(--auth-mid);
      transition: background 0.15s, transform 0.2s, color 0.15s;
    }
    ._auth-close:hover { background:#e8e8e8; color:var(--auth-error); transform:rotate(90deg); }
    ._auth-close svg { width:14px; height:14px; }

    /* ── Home screen (Google + Email options) ── */
    #_auth-home { display:none; }
    ._auth-home-title {
      font-size:22px; font-weight:900; letter-spacing:-0.03em;
      color:var(--auth-text); text-align:center;
      margin:4px 0 6px; font-family:var(--auth-font);
    }
    ._auth-home-sub {
      font-size:13px; color:var(--auth-light); font-weight:500;
      text-align:center; margin-bottom:22px;
    }
    ._auth-home-sub span {
      background: var(--auth-brand);
      -webkit-background-clip:text; background-clip:text; color:transparent;
      font-weight:900;
    }

    ._auth-option {
      display:flex; align-items:center; gap:14px;
      padding:15px 18px;
      background:var(--auth-card);
      border:1.5px solid var(--auth-border);
      border-radius:var(--auth-radius);
      cursor:pointer; margin-bottom:10px;
      transition: transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s, border-color 0.2s;
      box-shadow: 0 1px 4px rgba(0,0,0,0.05);
      -webkit-tap-highlight-color: transparent;
    }
    ._auth-option:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(0,0,0,0.1); border-color:#aaa; }
    ._auth-option:active { transform:scale(0.98); }
    ._auth-option-icon { width:22px; height:22px; flex-shrink:0; color:#555; }
    ._auth-option-title { font-weight:800; font-size:15px; color:var(--auth-text); font-family:var(--auth-font); }
    ._auth-option-desc  { font-size:12px; color:var(--auth-light); margin-top:1px; }
    ._auth-option.google { border-color:#e0e0e0; background:linear-gradient(135deg,#fff 0%,#fafafa 100%); }
    ._auth-option.google:hover { border-color:#4285f4; box-shadow:0 6px 20px rgba(66,133,244,0.15); }

    /* ── Google inline (inside login sheet) ── */
    ._auth-google-inline {
      display:flex; align-items:center; gap:12px;
      padding:13px 16px; border:1.5px solid #e0e0e0;
      border-radius:var(--auth-radius); cursor:pointer;
      background:#fff; margin-bottom:14px;
      transition: border-color 0.2s, box-shadow 0.2s, transform 0.15s;
      -webkit-tap-highlight-color: transparent;
    }
    ._auth-google-inline:hover { border-color:#4285f4; box-shadow:0 4px 14px rgba(66,133,244,0.15); transform:translateY(-1px); }
    ._auth-google-inline:active { transform:scale(0.98); }
    ._auth-google-inline svg { width:20px; height:20px; flex-shrink:0; }
    ._auth-google-inline span { font-size:14px; font-weight:800; color:var(--auth-text); font-family:var(--auth-font); }

    /* ── Header ── */
    ._auth-header { margin-bottom:20px; text-align:center; padding-top:4px; }
    ._auth-header h3 { font-size:22px; font-weight:900; letter-spacing:-0.03em; color:var(--auth-text); margin-bottom:4px; font-family:var(--auth-font); }
    ._auth-header p  { font-size:13px; color:var(--auth-light); font-weight:500; }

    /* ── Back link ── */
    ._auth-back {
      display:inline-flex; align-items:center; gap:5px;
      font-size:12px; font-weight:700; color:var(--auth-mid);
      cursor:pointer; margin-bottom:18px;
      transition:color 0.15s;
      background:none; border:none; padding:0; font-family:var(--auth-font);
      -webkit-tap-highlight-color:transparent;
    }
    ._auth-back:hover { color:var(--auth-text); }
    ._auth-back svg { width:14px; height:14px; }

    /* ── Inputs ── */
    ._auth-group { position:relative; margin-bottom:12px; }
    ._auth-group input {
      width:100%; padding:22px 14px 8px; height:56px;
      border:1.5px solid var(--auth-border);
      border-radius:14px; font-size:15px;
      background:#fafafa; color:var(--auth-text);
      outline:none; transition:border-color 0.2s, box-shadow 0.2s, background 0.2s;
      font-family:var(--auth-font);
      -webkit-appearance:none; appearance:none;
    }
    ._auth-group input:focus { border-color:#555; background:#fff; box-shadow:0 0 0 3px rgba(80,80,80,0.1); }
    ._auth-group input.has-toggle { padding-right:46px; }
    ._auth-group input.err { border-color:var(--auth-error); }
    ._auth-group label {
      position:absolute; top:50%; left:14px;
      transform:translateY(-50%);
      font-size:15px; font-weight:500; color:var(--auth-light);
      pointer-events:none;
      transition:all 0.16s cubic-bezier(0.22,1,0.36,1); z-index:1;
    }
    ._auth-group input:focus ~ label,
    ._auth-group input:not(:placeholder-shown) ~ label {
      top:10px; transform:translateY(0);
      font-size:10px; font-weight:700;
      color:#555; letter-spacing:0.06em; text-transform:uppercase;
    }

    /* pw toggle */
    ._auth-pw-toggle {
      position:absolute; right:14px; top:50%; transform:translateY(-50%);
      background:none; border:none; cursor:pointer;
      color:var(--auth-light); padding:4px;
      display:flex; align-items:center; justify-content:center;
      transition:color 0.15s;
    }
    ._auth-pw-toggle:hover { color:var(--auth-text); }
    ._auth-pw-toggle svg { width:18px; height:18px; }

    ._auth-err { color:var(--auth-error); font-size:12px; font-weight:600; margin-top:4px; display:none; padding-left:2px; }

    /* captcha */
    ._auth-captcha-wrap { margin:10px 0 14px; }
    ._auth-captcha-box {
      display:flex; align-items:center; gap:10px;
      padding:12px 14px; border:1.5px solid var(--auth-border);
      border-radius:14px; cursor:pointer;
      transition:border-color 0.2s, background 0.2s; user-select:none;
    }
    ._auth-captcha-box.checked { border-color:var(--auth-success); background:rgba(34,197,94,0.05); }
    ._auth-check-icon {
      width:20px; height:20px; border:2px solid #ccc;
      border-radius:5px; flex-shrink:0; position:relative;
      transition:all 0.2s; background:#fff;
    }
    ._auth-captcha-box.checked ._auth-check-icon { background:var(--auth-success); border-color:var(--auth-success); }
    ._auth-check-icon::after {
      content:''; position:absolute;
      top:2px; left:5px; width:6px; height:10px;
      border:2px solid #fff; border-top:none; border-left:none;
      transform:rotate(45deg); opacity:0; transition:opacity 0.2s;
    }
    ._auth-captcha-box.checked ._auth-check-icon::after { opacity:1; }
    ._auth-captcha-box span { font-size:14px; font-weight:600; color:var(--auth-text); font-family:var(--auth-font); }

    /* forgot */
    ._auth-forgot { text-align:right; margin:-6px 0 12px; }
    ._auth-forgot a { font-size:12px; font-weight:700; color:var(--auth-mid); text-decoration:none; cursor:pointer; transition:color 0.15s; }
    ._auth-forgot a:hover { color:var(--auth-text); }

    /* divider */
    ._auth-divider { display:flex; align-items:center; gap:10px; margin:6px 0 14px; }
    ._auth-divider-line { flex:1; height:1px; background:var(--auth-border); }
    ._auth-divider-label { font-size:11px; font-weight:700; color:var(--auth-light); letter-spacing:0.05em; text-transform:uppercase; white-space:nowrap; }

    /* username check */
    ._auth-uname-status {
      display:flex; align-items:center; gap:5px;
      font-size:12px; font-weight:700; margin-top:4px; padding-left:2px;
      min-height:16px; transition:opacity 0.2s;
    }
    ._auth-uname-status.hidden { opacity:0; pointer-events:none; }
    ._auth-uname-status.checking { color:var(--auth-light); }
    ._auth-uname-status.ok  { color:var(--auth-success); }
    ._auth-uname-status.bad { color:var(--auth-error); }
    ._auth-uname-status svg { width:13px; height:13px; stroke:currentColor; fill:none; stroke-width:2.8; stroke-linecap:round; stroke-linejoin:round; flex-shrink:0; }

    /* submit */
    ._auth-submit {
      width:100%; height:52px; border:none;
      border-radius:14px; background:var(--auth-brand);
      color:#fff; font-size:15px; font-weight:800;
      letter-spacing:0.02em; cursor:pointer; font-family:var(--auth-font);
      position:relative; overflow:hidden;
      transition:transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s, opacity 0.2s;
    }
    ._auth-submit:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 24px rgba(0,0,0,0.22); }
    ._auth-submit:active:not(:disabled) { transform:scale(0.97); }
    ._auth-submit:disabled { opacity:0.5; cursor:not-allowed; transform:none !important; }
    ._auth-spinner {
      display:none; width:18px; height:18px;
      border:2px solid rgba(255,255,255,0.4); border-top-color:#fff;
      border-radius:50%; animation:_auth-spin 0.7s linear infinite;
      position:absolute; right:18px; top:50%; transform:translateY(-50%);
    }

    /* loading sheet */
    ._auth-loading-body { padding:20px 8px 12px; display:flex; flex-direction:column; align-items:center; }
    ._auth-dots { display:flex; gap:8px; margin-bottom:20px; }
    ._auth-dots span { width:10px; height:10px; border-radius:50%; background:var(--auth-brand-solid); display:inline-block; animation:_auth-bounce 1.1s ease-in-out infinite; }
    ._auth-dots span:nth-child(2) { animation-delay:0.18s; }
    ._auth-dots span:nth-child(3) { animation-delay:0.36s; }
    ._auth-loading-title { font-size:18px; font-weight:900; letter-spacing:-0.02em; margin-bottom:4px; font-family:var(--auth-font); }
    ._auth-loading-sub   { font-size:14px; color:var(--auth-light); font-weight:500; font-family:var(--auth-font); }
    ._auth-prog-wrap { width:100%; height:3px; background:var(--auth-border); border-radius:2px; margin-top:18px; overflow:hidden; }
    ._auth-prog-bar  { height:100%; background:var(--auth-brand); border-radius:2px; width:0%; transition:width 0.5s cubic-bezier(0.19,1,0.22,1); }

    /* photo sheet */
    ._auth-photo-ring {
      width:96px; height:96px; border-radius:50%;
      background:var(--auth-brand); padding:3px;
      margin:0 auto 18px; cursor:pointer; position:relative;
    }
    ._auth-photo-inner {
      width:100%; height:100%; border-radius:50%;
      background:#f0f0f0;
      display:flex; align-items:center; justify-content:center;
      overflow:hidden; font-size:36px; font-weight:900; color:#888;
      position:relative;
    }
    ._auth-photo-inner img { width:100%; height:100%; object-fit:cover; border-radius:50%; display:block; }
    ._auth-photo-edit {
      position:absolute; bottom:2px; right:2px;
      width:26px; height:26px; border-radius:50%;
      background:var(--auth-brand);
      display:flex; align-items:center; justify-content:center;
      box-shadow:0 2px 8px rgba(0,0,0,0.18);
    }
    ._auth-photo-edit svg { width:12px; height:12px; stroke:#fff; fill:none; stroke-width:2.2; stroke-linecap:round; stroke-linejoin:round; }
    ._auth-photo-hint { font-size:13px; color:var(--auth-light); text-align:center; margin-bottom:20px; font-weight:500; font-family:var(--auth-font); }
    ._auth-photo-prog-wrap { height:3px; background:var(--auth-border); border-radius:2px; margin:8px 0 14px; overflow:hidden; display:none; }
    ._auth-photo-prog-bar  { height:100%; background:var(--auth-brand); border-radius:2px; width:0%; transition:width 0.4s ease; }
    ._auth-photo-upload-btn {
      width:100%; height:50px; border:none; border-radius:14px;
      background:var(--auth-brand); color:#fff;
      font-size:15px; font-weight:800; cursor:pointer;
      font-family:var(--auth-font); margin-bottom:10px;
      transition:transform 0.2s, box-shadow 0.2s, opacity 0.2s;
    }
    ._auth-photo-upload-btn:active { transform:scale(0.97); }
    ._auth-photo-upload-btn:disabled { opacity:0.5; cursor:not-allowed; }
    ._auth-photo-skip-btn {
      width:100%; height:44px;
      border:1.5px solid var(--auth-border);
      border-radius:14px; background:transparent;
      color:var(--auth-mid); font-size:14px; font-weight:700;
      cursor:pointer; font-family:var(--auth-font);
      transition:border-color 0.2s, color 0.2s;
    }
    ._auth-photo-skip-btn:hover { border-color:#888; color:var(--auth-text); }

    /* forgot success */
    ._auth-forgot-success { display:none; text-align:center; padding:10px 0 4px; }
    ._auth-forgot-success .check-circle {
      width:56px; height:56px; border-radius:50%;
      background:rgba(34,197,94,0.12);
      display:flex; align-items:center; justify-content:center;
      margin:0 auto 14px;
    }
    ._auth-forgot-success .check-circle svg { width:28px; height:28px; stroke:var(--auth-success); fill:none; stroke-width:2.5; }
    ._auth-forgot-success p { font-size:14px; color:var(--auth-mid); font-weight:500; line-height:1.5; font-family:var(--auth-font); }

    /* toast */
    #_auth-toast {
      position:fixed; bottom:calc(env(safe-area-inset-bottom,0px) + 80px); left:50%;
      transform:translateX(-50%) translateY(20px);
      background:#111; color:#fff;
      padding:12px 20px; border-radius:99px;
      font-size:14px; font-weight:700; font-family:var(--auth-font);
      white-space:nowrap; z-index:99999;
      opacity:0; pointer-events:none;
      transition:opacity 0.25s, transform 0.25s cubic-bezier(0.34,1.56,0.64,1);
      box-shadow:0 8px 28px rgba(0,0,0,0.22);
    }
    #_auth-toast.show { opacity:1; transform:translateX(-50%) translateY(0); }

    /* mobile: bottom sheet */
    @media (max-width:640px) {
      #_auth-overlay { align-items:flex-end; }
      ._auth-sheet {
        width:100% !important; max-width:100% !important;
        border-radius:26px 26px 0 0 !important;
        transform:translateY(100%) !important;
        padding-bottom:max(env(safe-area-inset-bottom,16px),28px) !important;
      }
      #_auth-overlay.active ._auth-sheet { transform:translateY(0) !important; }
      ._auth-sheet::before { border-radius:0; }
    }

    @keyframes _auth-spin   { to { transform:rotate(360deg); } }
    @keyframes _auth-bounce { 0%,80%,100%{transform:scale(0.6);opacity:0.4;} 40%{transform:scale(1.15);opacity:1;} }
  `;
  document.head.appendChild(s);
})();

// ── Inject HTML ──
(function injectHTML() {
  if (document.getElementById('_auth-overlay')) return;

  const el = document.createElement('div');
  el.id = '_auth-overlay';
  el.innerHTML = `
    <div id="_auth-toast"></div>

    <!-- ── Home: choose method ── -->
    <div class="_auth-sheet" id="_auth-home">
      <button class="_auth-close" id="_auth-home-close" aria-label="Close">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
      <div class="_auth-header" style="margin-bottom:18px;">
        <h3 class="_auth-home-title">Join <span style="background:var(--auth-brand);-webkit-background-clip:text;background-clip:text;color:transparent;">Nmedea</span></h3>
        <p class="_auth-home-sub">Sign in to like, comment and follow</p>
      </div>

      <!-- Google -->
      <div class="_auth-option google" id="_auth-google-home">
        <svg class="_auth-option-icon" viewBox="0 0 48 48">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.08 17.74 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-3.59-13.46-8.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
        </svg>
        <div>
          <div class="_auth-option-title">Continue with Google</div>
          <div class="_auth-option-desc">Fastest way — one tap</div>
        </div>
      </div>

      <!-- Sign In with email -->
      <div class="_auth-option" id="_auth-goto-login">
        <svg class="_auth-option-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
          <polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
        </svg>
        <div>
          <div class="_auth-option-title">Sign In</div>
          <div class="_auth-option-desc">Already have an account?</div>
        </div>
      </div>

      <!-- Create account with email -->
      <div class="_auth-option" id="_auth-goto-register">
        <svg class="_auth-option-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
        </svg>
        <div>
          <div class="_auth-option-title">Create Account</div>
          <div class="_auth-option-desc">Register with email &amp; password</div>
        </div>
      </div>
    </div>

    <!-- ── Login sheet ── -->
    <div class="_auth-sheet" id="_auth-login">
      <button class="_auth-close" id="_auth-login-close" aria-label="Close">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
      <button class="_auth-back" id="_auth-login-back">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        Back
      </button>
      <div class="_auth-header">
        <h3>Welcome Back</h3>
        <p>Sign in to your account</p>
      </div>
      <!-- Google inside login -->
      <div class="_auth-google-inline" id="_auth-google-login">
        <svg viewBox="0 0 48 48">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.08 17.74 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-3.59-13.46-8.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
        </svg>
        <span>Continue with Google</span>
      </div>
      <div class="_auth-divider">
        <div class="_auth-divider-line"></div>
        <span class="_auth-divider-label">or sign in with email</span>
        <div class="_auth-divider-line"></div>
      </div>
      <form id="_auth-login-form" novalidate>
        <div class="_auth-group">
          <input type="email" id="_al-email" placeholder=" " required autocomplete="email">
          <label for="_al-email">Email</label>
          <div class="_auth-err" id="_al-email-err"></div>
        </div>
        <div class="_auth-group">
          <input type="password" id="_al-pass" placeholder=" " required autocomplete="current-password" class="has-toggle">
          <label for="_al-pass">Password</label>
          <button type="button" class="_auth-pw-toggle" data-target="_al-pass" aria-label="Toggle password">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
          <div class="_auth-err" id="_al-pass-err"></div>
        </div>
        <div class="_auth-forgot"><a id="_auth-forgot-link">Forgot password?</a></div>
        <div class="_auth-captcha-wrap">
          <div class="_auth-captcha-box" id="_auth-captcha">
            <div class="_auth-check-icon"></div>
            <span>I'm not a robot</span>
          </div>
        </div>
        <div class="_auth-err" id="_al-form-err" style="margin-bottom:10px;"></div>
        <button type="submit" class="_auth-submit" id="_auth-login-submit" disabled>Sign In<div class="_auth-spinner"></div></button>
      </form>
    </div>

    <!-- ── Register sheet ── -->
    <div class="_auth-sheet" id="_auth-register">
      <button class="_auth-close" id="_auth-register-close" aria-label="Close">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
      <button class="_auth-back" id="_auth-register-back">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        Back
      </button>
      <div class="_auth-header">
        <h3>Create Account</h3>
        <p>Fill in your details to get started</p>
      </div>
      <form id="_auth-register-form" novalidate>
        <div class="_auth-group">
          <input type="text" id="_ar-username" placeholder=" " required autocomplete="username" spellcheck="false">
          <label for="_ar-username">Username</label>
          <div class="_auth-err" id="_ar-username-err"></div>
        </div>
        <div class="_auth-uname-status hidden" id="_ar-uname-status">
          <svg id="_ar-uname-icon" viewBox="0 0 24 24"></svg>
          <span id="_ar-uname-text"></span>
        </div>
        <div class="_auth-group">
          <input type="email" id="_ar-email" placeholder=" " required autocomplete="email">
          <label for="_ar-email">Email</label>
          <div class="_auth-err" id="_ar-email-err"></div>
        </div>
        <div class="_auth-group">
          <input type="password" id="_ar-pass" placeholder=" " required autocomplete="new-password" class="has-toggle">
          <label for="_ar-pass">Password</label>
          <button type="button" class="_auth-pw-toggle" data-target="_ar-pass" aria-label="Toggle password">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
          <div class="_auth-err" id="_ar-pass-err"></div>
        </div>
        <div class="_auth-err" id="_ar-form-err" style="margin-bottom:10px;"></div>
        <button type="submit" class="_auth-submit">Create Account<div class="_auth-spinner"></div></button>
      </form>
    </div>

    <!-- ── Loading sheet ── -->
    <div class="_auth-sheet" id="_auth-loading">
      <div class="_auth-loading-body">
        <div class="_auth-dots"><span></span><span></span><span></span></div>
        <div class="_auth-loading-title" id="_auth-load-title">Processing...</div>
        <div class="_auth-loading-sub"   id="_auth-load-sub"></div>
        <div class="_auth-prog-wrap"><div class="_auth-prog-bar" id="_auth-prog-bar"></div></div>
      </div>
    </div>

    <!-- ── Photo sheet ── -->
    <div class="_auth-sheet" id="_auth-photo">
      <div class="_auth-header">
        <h3>Add a profile photo</h3>
        <p>Let people know who you are</p>
      </div>
      <div class="_auth-photo-ring" id="_auth-photo-ring">
        <div class="_auth-photo-inner" id="_auth-photo-inner">
          <span id="_auth-photo-letter">?</span>
          <div class="_auth-photo-edit">
            <svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          </div>
        </div>
      </div>
      <p class="_auth-photo-hint">Tap the circle above to choose a photo</p>
      <div class="_auth-photo-prog-wrap" id="_auth-photo-prog-wrap">
        <div class="_auth-photo-prog-bar" id="_auth-photo-prog-bar"></div>
      </div>
      <input type="file" id="_auth-photo-file" accept="image/*" style="display:none;">
      <button class="_auth-photo-upload-btn" id="_auth-photo-upload" disabled>Save Photo</button>
      <button class="_auth-photo-skip-btn"   id="_auth-photo-skip">Skip for now</button>
    </div>

    <!-- ── Forgot Password sheet ── -->
    <div class="_auth-sheet" id="_auth-forgot">
      <button class="_auth-close" id="_auth-forgot-close" aria-label="Close">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
      <div class="_auth-header">
        <h3>Reset Password</h3>
        <p>Enter your email to receive a reset link</p>
      </div>
      <form id="_auth-forgot-form" novalidate>
        <div class="_auth-group">
          <input type="email" id="_af-email" placeholder=" " required autocomplete="email">
          <label for="_af-email">Email</label>
          <div class="_auth-err" id="_af-email-err"></div>
        </div>
        <div class="_auth-err" id="_af-form-err" style="margin-bottom:10px;"></div>
        <button type="submit" class="_auth-submit">Send Reset Link<div class="_auth-spinner"></div></button>
      </form>
      <div class="_auth-forgot-success" id="_auth-forgot-success">
        <div class="check-circle">
          <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <p>Check your inbox — we sent a password reset link to your email.</p>
      </div>
    </div>
  `;
  document.body.appendChild(el);
})();

// ── Helpers ──
const _ov = () => document.getElementById('_auth-overlay');
const ALL_SHEETS = ['_auth-home','_auth-login','_auth-register','_auth-loading','_auth-photo','_auth-forgot'];

function _showSheet(id) {
  ALL_SHEETS.forEach(s => {
    const el = document.getElementById(s);
    if (el) el.style.display = s === id ? 'block' : 'none';
  });
  _ov().classList.add('active');
}
function _closeAll() {
  _ov().classList.remove('active');
  setTimeout(() => ALL_SHEETS.forEach(s => {
    const el = document.getElementById(s);
    if (el) el.style.display = 'none';
  }), 320);
}
function _clearErrs() {
  document.querySelectorAll('#_auth-overlay ._auth-err').forEach(e => { e.textContent=''; e.style.display='none'; });
}
function _showErr(id, msg) {
  const el = document.getElementById(id);
  if (el) { el.textContent = msg; el.style.display = msg ? 'block' : 'none'; }
}
function _toast(msg, duration = 3000) {
  const t = document.getElementById('_auth-toast');
  if (!t) return;
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), duration);
}
function _validate(inp) {
  const v = inp.value.trim();
  if (!v && inp.required) return 'This field is required';
  if (inp.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Enter a valid email address';
  if (inp.type === 'password' && v.length < 6) return 'Password must be at least 6 characters';
  if (inp.id === '_ar-username' && !/^[a-zA-Z0-9_]{3,20}$/.test(v)) return '3–20 characters: letters, numbers or _';
  return null;
}
function isMobile() {
  return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
}

// loading helpers
function _showLoading(title, sub) {
  ALL_SHEETS.forEach(s => { const el = document.getElementById(s); if (el) el.style.display = 'none'; });
  document.getElementById('_auth-load-title').textContent = title || 'Processing...';
  document.getElementById('_auth-load-sub').textContent = sub || '';
  document.getElementById('_auth-prog-bar').style.width = '0%';
  document.getElementById('_auth-loading').style.display = 'block';
}
function _setProgress(pct, title, sub) {
  document.getElementById('_auth-prog-bar').style.width = pct + '%';
  if (title) document.getElementById('_auth-load-title').textContent = title;
  if (sub)   document.getElementById('_auth-load-sub').textContent = sub;
}
function _runSteps(steps, done) {
  let i = 0;
  const iv = setInterval(() => {
    if (i >= steps.length) { clearInterval(iv); done && done(); return; }
    _setProgress(steps[i].p, steps[i].t, steps[i].s); i++;
  }, 800);
}

// ── On success: close overlay, notify the app ──
function _onAuthSuccess(user) {
  _setProgress(100, 'You\'re in!', '');
  setTimeout(() => {
    _closeAll();
    // Let index.js know auth state changed — it already listens via onAuthStateChanged
    window._currentUser = user;
    // Fire a custom event so index.js can reinitialise the feed/UI
    window.dispatchEvent(new CustomEvent('authSuccess', { detail: { user } }));
  }, 700);
}

// ── Photo modal ──
let _pendingUser = null, _photoFile = null, _photoObjectURL = null;

function _shouldAskPhoto(user) {
  if (!user) return false;
  if (!user.photoURL || user.photoURL.includes('default_profile') || user.photoURL === '') return true;
  try {
    const skipped = JSON.parse(localStorage.getItem('photoSkipped') || '{}');
    const last = skipped[user.uid];
    if (!last) return false;
    return (Date.now() - last) > 3 * 24 * 60 * 60 * 1000;
  } catch(e) { return false; }
}

function _showPhotoModal(user, displayName) {
  _pendingUser = user;
  const letter = (displayName || user.email || 'U')[0].toUpperCase();
  document.getElementById('_auth-photo-letter').textContent = letter;
  const inner = document.getElementById('_auth-photo-inner');
  const existImg = inner.querySelector('img');
  if (existImg) existImg.remove();
  document.getElementById('_auth-photo-letter').style.display = '';

  const uploadBtn = document.getElementById('_auth-photo-upload');
  if (user.photoURL && !user.photoURL.includes('default_profile')) {
    const img = document.createElement('img'); img.src = user.photoURL;
    img.onerror = () => img.remove();
    inner.appendChild(img);
    uploadBtn.disabled = false; uploadBtn.textContent = 'Keep this photo';
  } else {
    uploadBtn.disabled = true; uploadBtn.textContent = 'Save Photo';
  }
  _photoFile = null; _photoObjectURL = null;
  document.getElementById('_auth-photo-prog-wrap').style.display = 'none';
  document.getElementById('_auth-photo-prog-bar').style.width = '0%';
  _showSheet('_auth-photo');
}

// ── Wire events (runs once DOM is ready) ──
function _wireEvents() {
  // Close buttons
  ['_auth-home-close','_auth-login-close','_auth-register-close','_auth-forgot-close'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', _closeAll);
  });

  // Click outside to close
  _ov().addEventListener('click', e => { if (e.target === _ov()) _closeAll(); });

  // Back buttons
  document.getElementById('_auth-login-back').addEventListener('click', () => { _clearErrs(); _showSheet('_auth-home'); });
  document.getElementById('_auth-register-back').addEventListener('click', () => { _clearErrs(); _showSheet('_auth-home'); });

  // Home → sheets
  document.getElementById('_auth-goto-login').addEventListener('click', () => {
    _clearErrs(); _captchaOk = false;
    document.getElementById('_auth-captcha').classList.remove('checked');
    document.getElementById('_auth-login-submit').disabled = true;
    _showSheet('_auth-login');
    setTimeout(() => document.getElementById('_al-email').focus(), 350);
  });
  document.getElementById('_auth-goto-register').addEventListener('click', () => {
    _clearErrs(); _resetUname();
    _showSheet('_auth-register');
    setTimeout(() => document.getElementById('_ar-username').focus(), 350);
  });

  // pw toggles
  document.querySelectorAll('#_auth-overlay ._auth-pw-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const inp = document.getElementById(btn.dataset.target);
      if (!inp) return;
      const isText = inp.type === 'text';
      inp.type = isText ? 'password' : 'text';
      btn.querySelector('svg').innerHTML = isText
        ? '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>'
        : '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>';
    });
  });

  // Google
  async function _doGoogle() {
    _showLoading('Connecting to Google...', 'Please wait');
    _setProgress(25, '', '');
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    if (isMobile()) {
      try { await signInWithRedirect(_auth, provider); } catch(e) { _closeAll(); _toast('Google sign-in failed. Please try again.'); }
      return;
    }
    try {
      const result = await signInWithPopup(_auth, provider);
      await _handleGoogleResult(result);
    } catch(e) {
      _closeAll();
      if (e.code === 'auth/popup-closed-by-user') return;
      if (e.code === 'auth/popup-blocked') {
        _toast('Popup blocked — redirecting to Google...');
        setTimeout(async () => { await signInWithRedirect(_auth, provider); }, 1000);
        return;
      }
      _toast('Google sign-in failed: ' + (e.message || 'Unknown error'));
    }
  }
  document.getElementById('_auth-google-home').addEventListener('click', _doGoogle);
  document.getElementById('_auth-google-login').addEventListener('click', _doGoogle);

  // ── Captcha ──
  let _captchaOk = false;
  document.getElementById('_auth-captcha').addEventListener('click', () => {
    _captchaOk = Math.random() > 0.08;
    document.getElementById('_auth-captcha').classList.toggle('checked', _captchaOk);
    document.getElementById('_auth-login-submit').disabled = !_captchaOk;
    if (!_captchaOk) _showErr('_al-form-err', 'Verification failed. Please try again.');
    else _showErr('_al-form-err', '');
  });

  // ── Login form ──
  document.getElementById('_auth-login-form').addEventListener('submit', async e => {
    e.preventDefault(); _clearErrs();
    const btn = e.target.querySelector('._auth-submit');
    const sp  = btn.querySelector('._auth-spinner');
    const email = document.getElementById('_al-email').value.trim();
    const pass  = document.getElementById('_al-pass').value;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { _showErr('_al-email-err', 'Enter a valid email address'); return; }
    if (!pass) { _showErr('_al-pass-err', 'Password is required'); return; }
    if (!_captchaOk) { _showErr('_al-form-err', 'Please confirm you are not a robot'); return; }
    btn.disabled = true; sp.style.display = 'block';
    try {
      _showLoading('Signing in...', 'Verifying credentials');
      _runSteps([
        { p:35, t:'Verifying email...', s:'Checking account' },
        { p:65, t:'Authenticating...', s:'Verifying identity' }
      ], async () => {
        try {
          const cred = await signInWithEmailAndPassword(_auth, email, pass);
          if (_shouldAskPhoto(cred.user)) { _showPhotoModal(cred.user, cred.user.displayName); }
          else { _onAuthSuccess(cred.user); }
        } catch(err) {
          _clearErrs(); _showSheet('_auth-login');
          _captchaOk = false;
          document.getElementById('_auth-captcha').classList.remove('checked');
          document.getElementById('_auth-login-submit').disabled = true;
          const msg = ['auth/user-not-found','auth/wrong-password','auth/invalid-credential','auth/invalid-email'].includes(err.code)
            ? 'Invalid email or password.'
            : err.code === 'auth/too-many-requests' ? 'Too many attempts. Please try again later.'
            : err.message || 'Sign in failed.';
          _showErr('_al-form-err', msg);
          btn.disabled = false; sp.style.display = 'none';
        }
      });
    } catch(err) { _showErr('_al-form-err', 'An error occurred. Please try again.'); btn.disabled = false; sp.style.display = 'none'; }
  });

  // ── Username live check ──
  let _unameTimer = null, _unameValid = false;
  const _unameInp = document.getElementById('_ar-username');
  const _unameSt  = document.getElementById('_ar-uname-status');

  function _resetUname() { _unameSt.className = '_auth-uname-status hidden'; _unameValid = false; }
  function _setUname(type, text) {
    _unameSt.className = '_auth-uname-status ' + type;
    document.getElementById('_ar-uname-icon').innerHTML = type === 'ok'
      ? '<polyline points="20 6 9 17 4 12"/>'
      : type === 'bad' ? '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>' : '';
    document.getElementById('_ar-uname-text').textContent = text;
  }

  _unameInp.addEventListener('input', () => {
    clearTimeout(_unameTimer);
    const val = _unameInp.value.trim();
    _showErr('_ar-username-err', '');
    if (!val) { _resetUname(); return; }
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(val)) { _setUname('bad','3–20 characters: letters, numbers or _'); _unameValid=false; return; }
    _setUname('checking','Checking availability…');
    _unameTimer = setTimeout(async () => {
      try {
        const snap = await getDocs(query(collection(_db,'users'), where('username','==',val)));
        if (!snap.empty) { _setUname('bad','@'+val+' is already taken'); _showErr('_ar-username-err','@'+val+' is already taken'); _unameValid=false; }
        else { _setUname('ok','@'+val+' is available ✓'); _unameValid=true; }
      } catch(e) { _resetUname(); _unameValid=true; }
    }, 550);
  });

  // ── Register form ──
  document.getElementById('_auth-register-form').addEventListener('submit', async e => {
    e.preventDefault(); _clearErrs();
    const btn = e.target.querySelector('._auth-submit');
    const sp  = btn.querySelector('._auth-spinner');
    let ok = true;
    [document.getElementById('_ar-username'), document.getElementById('_ar-email'), document.getElementById('_ar-pass')].forEach(inp => {
      const err = _validate(inp);
      if (err) { _showErr(inp.id+'-err', err); ok=false; }
    });
    if (!ok) return;
    const uname = _unameInp.value.trim();
    if (!_unameValid) { _showErr('_ar-username-err','Please wait for username check to complete'); return; }
    btn.disabled=true; sp.style.display='block';
    const email = document.getElementById('_ar-email').value.trim();
    const pass  = document.getElementById('_ar-pass').value;
    try {
      _showLoading('Creating account...','Please wait');
      _runSteps([
        { p:30, t:'Validating details...', s:'' },
        { p:60, t:'Creating account...', s:'Setting up credentials' }
      ], async () => {
        try {
          const snap = await getDocs(query(collection(_db,'users'), where('username','==',uname)));
          if (!snap.empty) {
            _clearErrs(); _showSheet('_auth-register');
            _showErr('_ar-username-err','@'+uname+' was just taken. Try another.');
            _unameValid=false; _setUname('bad','@'+uname+' is already taken');
            btn.disabled=false; sp.style.display='none'; return;
          }
          const cred = await createUserWithEmailAndPassword(_auth, email, pass);
          await updateProfile(cred.user, { displayName: uname });
          await setDoc(doc(_db,'users',cred.user.uid), {
            uid: cred.user.uid, email, username: uname,
            displayName: uname, photoURL: '',
            provider: 'email', createdAt: new Date().toISOString()
          });
          _showPhotoModal(cred.user, uname);
        } catch(err) {
          _clearErrs(); _showSheet('_auth-register');
          const msg = err.code === 'auth/email-already-in-use'
            ? 'That email is already registered.' : (err.message || 'Registration failed.');
          _showErr('_ar-form-err', msg);
          btn.disabled=false; sp.style.display='none';
        }
      });
    } catch(err) { _showErr('_ar-form-err','An error occurred. Please try again.'); btn.disabled=false; sp.style.display='none'; }
  });

  // ── Forgot password ──
  document.getElementById('_auth-forgot-link').addEventListener('click', () => {
    _showSheet('_auth-forgot');
    document.getElementById('_auth-forgot-form').style.display = 'block';
    document.getElementById('_auth-forgot-success').style.display = 'none';
    _clearErrs();
    setTimeout(() => document.getElementById('_af-email').focus(), 350);
  });
  document.getElementById('_auth-forgot-form').addEventListener('submit', async e => {
    e.preventDefault(); _clearErrs();
    const btn = e.target.querySelector('._auth-submit');
    const sp  = btn.querySelector('._auth-spinner');
    const email = document.getElementById('_af-email').value.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { _showErr('_af-email-err','Enter a valid email address'); return; }
    btn.disabled=true; sp.style.display='block';
    try {
      await sendPasswordResetEmail(_auth, email);
      document.getElementById('_auth-forgot-form').style.display = 'none';
      document.getElementById('_auth-forgot-success').style.display = 'block';
    } catch(err) {
      const msg = err.code === 'auth/user-not-found' ? 'No account found with that email.' : (err.message || 'Failed to send reset email.');
      _showErr('_af-form-err', msg);
      btn.disabled=false; sp.style.display='none';
    }
  });

  // ── Photo sheet ──
  document.getElementById('_auth-photo-ring').addEventListener('click', () => document.getElementById('_auth-photo-file').click());
  document.getElementById('_auth-photo-file').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 8*1024*1024) { _toast('Image must be under 8MB'); return; }
    _photoFile = file;
    if (_photoObjectURL) URL.revokeObjectURL(_photoObjectURL);
    _photoObjectURL = URL.createObjectURL(file);
    const inner = document.getElementById('_auth-photo-inner');
    let img = inner.querySelector('img');
    if (!img) { img = document.createElement('img'); inner.appendChild(img); }
    img.src = _photoObjectURL;
    document.getElementById('_auth-photo-letter').style.display = 'none';
    const uploadBtn = document.getElementById('_auth-photo-upload');
    uploadBtn.disabled=false; uploadBtn.textContent='Save Photo';
  });

  document.getElementById('_auth-photo-upload').addEventListener('click', async () => {
    if (!_pendingUser) { _onAuthSuccess(_pendingUser); return; }
    if (!_photoFile && _pendingUser.photoURL && !_pendingUser.photoURL.includes('default_profile')) {
      _setProgress(100,'All set!',''); setTimeout(() => _onAuthSuccess(_pendingUser), 700); return;
    }
    if (!_photoFile) { _onAuthSuccess(_pendingUser); return; }
    const btn = document.getElementById('_auth-photo-upload');
    btn.disabled=true; btn.textContent='Uploading...';
    const pw = document.getElementById('_auth-photo-prog-wrap');
    const pb = document.getElementById('_auth-photo-prog-bar');
    pw.style.display='block'; pb.style.width='20%';
    try {
      const ext = _photoFile.name.split('.').pop() || 'jpg';
      const fname = 'avatars/' + _pendingUser.uid + '_' + Date.now() + '.' + ext;
      const fd = new FormData();
      fd.append('file', _photoFile, fname);
      pb.style.width='50%';
      const res = await fetch(R2_UPLOAD, { method:'POST', body:fd });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      const photoURL = data.url || data.fileUrl || data.publicUrl || '';
      pb.style.width='80%';
      await updateProfile(_pendingUser, { photoURL });
      await setDoc(doc(_db,'users',_pendingUser.uid), { photoURL }, { merge:true });
      pb.style.width='100%';
      setTimeout(() => _onAuthSuccess(_pendingUser), 600);
    } catch(err) {
      btn.disabled=false; btn.textContent='Retry Upload';
      pw.style.display='none';
      _toast('Photo upload failed. You can skip and add one later.');
    }
  });

  document.getElementById('_auth-photo-skip').addEventListener('click', () => {
    if (_pendingUser) {
      const skipped = JSON.parse(localStorage.getItem('photoSkipped') || '{}');
      skipped[_pendingUser.uid] = Date.now();
      localStorage.setItem('photoSkipped', JSON.stringify(skipped));
    }
    _onAuthSuccess(_pendingUser);
  });

  // Escape key
  document.addEventListener('keydown', e => { if (e.key === 'Escape') _closeAll(); });

  // inline blur validation
  document.querySelectorAll('#_auth-overlay input').forEach(inp => {
    inp.addEventListener('blur', () => {
      if (!inp.value.trim()) return;
      const err = _validate(inp);
      const errEl = document.getElementById(inp.id + '-err');
      if (errEl && err) { errEl.textContent = err; errEl.style.display = 'block'; }
    });
    inp.addEventListener('input', () => {
      const errEl = document.getElementById(inp.id + '-err');
      if (errEl) { errEl.textContent = ''; errEl.style.display = 'none'; }
    });
  });
}

// ── Google redirect result (mobile) ──
async function _handleGoogleResult(result) {
  _setProgress(60, 'Setting up profile...', '');
  const user = result.user;
  const isNew = !(await getDoc(doc(_db,'users',user.uid))).exists();
  if (isNew) {
    await setDoc(doc(_db,'users',user.uid), {
      uid: user.uid, email: user.email,
      displayName: user.displayName || '',
      username: (user.displayName || 'user').toLowerCase().replace(/\s+/g,'_'),
      photoURL: user.photoURL || '',
      provider: 'google', createdAt: new Date().toISOString()
    });
  }
  _setProgress(90,'Almost there...','');
  if (isNew || _shouldAskPhoto(user)) { _showPhotoModal(user, user.displayName); }
  else { _onAuthSuccess(user); }
}

// Check for mobile Google redirect result on load
getRedirectResult(_auth).then(async result => {
  if (!result) return;
  _showLoading('Connecting with Google...','');
  _ov().classList.add('active');
  await _handleGoogleResult(result);
}).catch(e => {
  if (e.code !== 'auth/cancelled-popup-request') console.warn('Redirect result:', e.code);
});

// ── Public API ──
// index.html calls _showAuthOverlay(screen) — 'home' | 'login' | 'register'
window._showAuthOverlay = function(screen) {
  _clearErrs();
  screen = screen || 'home';
  if (screen === 'login') {
    document.getElementById('_auth-captcha').classList.remove('checked');
    document.getElementById('_auth-login-submit').disabled = true;
    _showSheet('_auth-login');
    setTimeout(() => document.getElementById('_al-email').focus(), 350);
  } else if (screen === 'register') {
    _showSheet('_auth-register');
    setTimeout(() => document.getElementById('_ar-username').focus(), 350);
  } else {
    _showSheet('_auth-home');
  }
};

// Exposed so Dragon Ball Google btn can trigger Google sign-in directly
window._authDoGoogle = async function() {
  _showLoading('Connecting to Google...', 'Please wait');
  _setProgress(25, '', '');
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  if (isMobile()) {
    try { await signInWithRedirect(_auth, provider); } catch(e) { _closeAll(); _toast('Google sign-in failed. Please try again.'); }
    return;
  }
  try {
    const result = await signInWithPopup(_auth, provider);
    await _handleGoogleResult(result);
  } catch(e) {
    _closeAll();
    if (e.code === 'auth/popup-closed-by-user') return;
    if (e.code === 'auth/popup-blocked') {
      _toast('Popup blocked — redirecting to Google...');
      setTimeout(async () => { await signInWithRedirect(_auth, provider); }, 1000);
      return;
    }
    _toast('Google sign-in failed: ' + (e.message || 'Unknown error'));
  }
};

// Wire everything once the overlay HTML is in the DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _wireEvents);
} else {
  _wireEvents();
}
