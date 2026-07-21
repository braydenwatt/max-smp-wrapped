import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import Home from './Home.jsx'
import Player from './Player.jsx'
import ScrollTop from './ScrollTop.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <ScrollTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/player/:uuid" element={<Player />} />
      </Routes>
    </HashRouter>
  </React.StrictMode>,
)
