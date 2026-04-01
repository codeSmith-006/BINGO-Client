import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@flaticon/flaticon-uicons/css/bold/rounded.css'
import './index.css'
import App from './App.jsx'
import { GameProvider } from './context/GameContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GameProvider>
      <App />
    </GameProvider>
  </StrictMode>,
)
