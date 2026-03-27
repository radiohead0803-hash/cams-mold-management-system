import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import './index.css'
import { registerServiceWorker, setupInstallPrompt } from './utils/pwaUtils'

// PWA 서비스 워커 등록 + 포그라운드 푸시 핸들러
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    registerServiceWorker().then((registration) => {
      if (!registration) return

      // Listen for push messages forwarded from SW while app is in foreground
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'PUSH_RECEIVED') {
          showInAppToast(event.data.payload)
        }
      })
    })
    setupInstallPrompt()
  })
}

// In-app toast notification for foreground push events
function showInAppToast(payload) {
  const { title, body } = payload || {}
  if (!title && !body) return

  // Remove existing toast if present
  const existing = document.getElementById('cams-push-toast')
  if (existing) existing.remove()

  const toast = document.createElement('div')
  toast.id = 'cams-push-toast'
  toast.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; z-index: 99999;
    padding: 16px 20px; padding-top: max(16px, env(safe-area-inset-top));
    background: linear-gradient(135deg, #2563eb, #4f46e5);
    color: white; font-family: system-ui, sans-serif;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    transform: translateY(-100%); transition: transform 0.3s ease;
    cursor: pointer;
  `
  toast.innerHTML = `
    <div style="font-size:14px;font-weight:600;margin-bottom:2px">${title || 'CAMS 알림'}</div>
    ${body ? `<div style="font-size:12px;opacity:0.9;line-height:1.4">${body}</div>` : ''}
  `
  toast.onclick = () => {
    toast.style.transform = 'translateY(-100%)'
    setTimeout(() => toast.remove(), 300)
    if (payload?.url) window.location.href = payload.url
  }

  document.body.appendChild(toast)
  // Trigger slide-in
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      toast.style.transform = 'translateY(0)'
    })
  })

  // Auto-dismiss after 5 seconds
  setTimeout(() => {
    if (document.getElementById('cams-push-toast')) {
      toast.style.transform = 'translateY(-100%)'
      setTimeout(() => toast.remove(), 300)
    }
  }, 5000)
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
)
