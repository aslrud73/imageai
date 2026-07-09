import React from 'react'
import ReactDOM from 'react-dom/client'
import '@fontsource/gowun-batang/400.css'
import '@fontsource/gowun-batang/700.css'
import './index.css'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// PWA: 서비스 워커 등록 (오프라인 앱 셸)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}
