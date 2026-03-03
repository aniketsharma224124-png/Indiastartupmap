import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { createPortal } from 'react-dom'
import { useEffect, useState, useRef } from 'react'
import Home from './pages/Home'
import StatePage from './pages/StatePage'
import AdminPage from './pages/AdminPage'
import ListingSuccess from './pages/ListingSuccess'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import Contact from './pages/Contact'
import Navbar from './components/Navbar'
import ParticleBackground from './components/ParticleBackground'
import InvestorMap from './pages/InvestorMap'
import PricingPage from './pages/PricingPage'
import FounderDashboard from './pages/FounderDashboard'
import InvestorDashboard from './pages/InvestorDashboard'
import InvestorListingPage from './pages/InvestorListingPage'
import StartupProfilePage from './pages/StartupProfilePage'
import InvestorProfilePage from './pages/InvestorProfilePage'
import AdPlanPage from './pages/AdPlanPage'
import { LeftAdPanel, RightAdPanel } from './components/AdPanel'

// ── AD PANELS — scroll with page, positioned at hero tagline level ───────────
function AdPanelsPortal() {
  const location = useLocation()
  const [mounted, setMounted] = useState(false)
  const [wide, setWide] = useState(false)
  useEffect(() => {
    setMounted(true)
    const check = () => setWide(window.innerWidth >= 1280)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])
  if (!mounted || location.pathname !== '/' || !wide) return null
  const base = {
    position: 'fixed',
    top: 160,
    zIndex: 40,
    pointerEvents: 'auto',
  }
  return createPortal(
    <>
      <div style={{ ...base, left: 6 }}><LeftAdPanel /></div>
      <div style={{ ...base, right: 6 }}><RightAdPanel /></div>
    </>,
    document.body
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-navy-900 relative overflow-x-hidden">
        <ParticleBackground />
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/state/:stateId" element={<StatePage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/success" element={<ListingSuccess />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/investor-map" element={<Navigate to="/?mode=investor" replace />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/dashboard/founder" element={<FounderDashboard />} />
          <Route path="/dashboard/investor" element={<InvestorDashboard />} />
          <Route path="/investor-listing" element={<InvestorListingPage />} />
          <Route path="/startup/:startupId" element={<StartupProfilePage />} />
          <Route path="/investor/:investorId" element={<InvestorProfilePage />} />
          <Route path="/ad-plan" element={<AdPlanPage />} />
        </Routes>
        <AdPanelsPortal />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#0D1525',
              color: '#E8EAF0',
              border: '1px solid rgba(255,255,255,0.1)',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '14px',
            },
          }}
        />
      </div>
    </BrowserRouter>
  )
}
