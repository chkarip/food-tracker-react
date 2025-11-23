import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './styles/layout.css';
import AppRoot from './AppRoot';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <AppRoot />
  </React.StrictMode>
);

// Register service worker with aggressive update detection for PWA
if ('serviceWorker' in navigator) {
  const APP_VERSION = 'v2025-11-23-mobile-nav-fix'; // MUST match index.html and sw.js
  
  window.addEventListener('load', () => {
    // Check version immediately on load
    const storedVersion = localStorage.getItem('pwa_app_version');
    
    if (storedVersion && storedVersion !== APP_VERSION) {
      console.log('[PWA] Version mismatch! Forcing update...');
      console.log('[PWA] Old:', storedVersion, '→ New:', APP_VERSION);
      
      // Unregister ALL service workers immediately
      navigator.serviceWorker.getRegistrations().then(registrations => {
        console.log(`[PWA] Unregistering ${registrations.length} service worker(s)...`);
        Promise.all(registrations.map(reg => reg.unregister()))
          .then(() => {
            console.log('[PWA] All service workers unregistered');
            
            // Clear all caches
            if ('caches' in window) {
              caches.keys().then(cacheNames => {
                console.log(`[PWA] Deleting ${cacheNames.length} cache(s)...`);
                return Promise.all(cacheNames.map(name => caches.delete(name)));
              }).then(() => {
                console.log('[PWA] All caches cleared');
                localStorage.setItem('pwa_app_version', APP_VERSION);
                
                // Force hard reload
                window.location.reload();
              });
            } else {
              localStorage.setItem('pwa_app_version', APP_VERSION);
              window.location.reload();
            }
          });
      });
      return; // Don't register SW yet, will happen after reload
    }
    
    // Store version if not set
    if (!storedVersion) {
      localStorage.setItem('pwa_app_version', APP_VERSION);
    }
    
    // Now register service worker
    navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
      .then(registration => {
        console.log('[PWA] Service Worker registered successfully');
        
        // Force immediate check for updates
        registration.update();
        
        // Check for updates every 10 seconds (aggressive for PWA)
        setInterval(() => {
          console.log('[PWA] Checking for updates...');
          registration.update();
        }, 10000);

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            console.log('[PWA] Update found! Installing...');
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[PWA] New version installed! Activating...');
                // Auto-activate without prompt for PWA
                newWorker.postMessage({ type: 'SKIP_WAITING' });
              }
            });
          }
        });
      })
      .catch(error => {
        console.error('[PWA] Service Worker registration failed:', error);
      });

    // Listen for controller change (new SW activated)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[PWA] New service worker activated, reloading page...');
      window.location.reload();
    });
  });
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
