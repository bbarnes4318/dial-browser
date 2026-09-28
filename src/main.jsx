import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import '@/lib/enforceDomain'
import { initCopyProtection } from '@/lib/copyProtect'
import { initVoices } from '@/lib/voiceSynthesis'

// Preload natural voices for human-like speech synthesis
initVoices()

// Enable site-wide copyright / content protection
initCopyProtection()

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)