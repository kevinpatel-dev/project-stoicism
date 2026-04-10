import { registerSW } from 'virtual:pwa-register'

// This registers the service worker so your app works offline and can be installed
registerSW({ immediate: true })
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css' // <-- This is the magic line that loads Tailwind!

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)