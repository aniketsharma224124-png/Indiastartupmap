// AdPanel.jsx — Fixed vertical ad panels on left/right sides
// 4 rotating sponsor slots + 1 advertise slot per side
// User ads from Firestore replace default ads one-by-one.
// When user ads expire, defaults come back.

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../lib/firebase'

// ── DEFAULT AD POOLS ─────────────────────────────────────────────────────────
const DEFAULT_LEFT_ADS = [
  { id: 'razorpay', emoji: '💳', logo_url: 'https://razorpay.com/favicon.ico', bg: '#dbeafe', name: 'Razorpay', tagline: 'Accept payments instantly. UPI, cards & more.', url: 'https://razorpay.com' },
  { id: 'setu', emoji: '🔗', logo_url: null, bg: '#dcfce7', name: 'Setu', tagline: 'Fintech APIs for Indian builders. Go live fast.', url: 'https://setu.co' },
  { id: 'vercel', emoji: '▲', logo_url: 'https://vercel.com/favicon.ico', bg: '#f3f4f6', name: 'Vercel', tagline: 'Deploy frontends to the edge. Zero config.', url: 'https://vercel.com' },
  { id: 'angellist', emoji: '😇', logo_url: null, bg: '#e0e7ff', name: 'AngelList', tagline: 'Where startups meet their first investors.', url: 'https://angel.co' },
  { id: 'notion', emoji: '📝', logo_url: 'https://www.notion.so/favicon.ico', bg: '#f8f8f8', name: 'Notion', tagline: 'All your startup docs in one place.', url: 'https://notion.so' },
  { id: 'stripe', emoji: '💠', logo_url: 'https://stripe.com/favicon.ico', bg: '#eef2ff', name: 'Stripe', tagline: 'Payments infrastructure for the internet.', url: 'https://stripe.com' },
  { id: 'freshworks', emoji: '🎯', logo_url: null, bg: '#fce7f3', name: 'Freshworks', tagline: 'CRM & support built for fast-growing teams.', url: 'https://freshworks.com' },
]

const DEFAULT_RIGHT_ADS = [
  { id: 'zoho', emoji: '📊', logo_url: 'https://www.zoho.com/favicon.ico', bg: '#fee2e2', name: 'Zoho', tagline: 'CRM, books & HR. Run your whole business.', url: 'https://zoho.com' },
  { id: 'groww', emoji: '📈', logo_url: 'https://groww.in/favicon.ico', bg: '#dcfce7', name: 'Groww', tagline: "Invest in India's growth story. Stocks & MF.", url: 'https://groww.in' },
  { id: 'aws', emoji: '☁️', logo_url: null, bg: '#fff7ed', name: 'AWS India', tagline: 'Cloud credits & support for Indian founders.', url: 'https://aws.amazon.com/startups' },
  { id: 'intercom', emoji: '💬', logo_url: 'https://www.intercom.com/favicon.ico', bg: '#e0f2fe', name: 'Intercom', tagline: 'Customer messaging that converts & retains.', url: 'https://intercom.com' },
  { id: 'postman', emoji: '🚀', logo_url: 'https://www.postman.com/favicon.ico', bg: '#fff3e0', name: 'Postman', tagline: 'Build, test & document APIs with your team.', url: 'https://postman.com' },
  { id: 'lemon', emoji: '🍋', logo_url: null, bg: '#fef9c3', name: 'Lemon Squeezy', tagline: 'Sell software & digital products, India-ready.', url: 'https://lemonsqueezy.com' },
  { id: 'hubspot', emoji: '🟠', logo_url: 'https://www.hubspot.com/favicon.ico', bg: '#fff0e6', name: 'HubSpot', tagline: 'Free CRM — grow better with HubSpot.', url: 'https://hubspot.com' },
]

// ── SPONSOR CARD ─────────────────────────────────────────────────────────────
function SponsorCard({ ad }) {
  const [imgErr, setImgErr] = useState(false)
  const [hov, setHov] = useState(false)
  return (
    <a href={ad.url} target="_blank" rel="noopener noreferrer"
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: 'block', textDecoration: 'none',
        background: '#f3eeff', border: '1px solid #e0d4f5',
        borderRadius: '12px', padding: '10px 8px 9px',
        textAlign: 'center', cursor: 'pointer',
        width: 130, flexShrink: 0,
        boxShadow: hov ? '0 6px 20px rgba(0,0,0,0.14)' : '0 1px 4px rgba(0,0,0,0.08)',
        transform: hov ? 'translateY(-1px)' : 'translateY(0)',
        transition: 'box-shadow 0.18s, transform 0.15s',
      }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: ad.bg || '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 5px', overflow: 'hidden' }}>
        {ad.logo_url && !imgErr
          ? <img src={ad.logo_url} alt={ad.name} onError={() => setImgErr(true)} style={{ width: 20, height: 20, objectFit: 'contain' }} />
          : <span style={{ fontSize: 16 }}>{ad.emoji || '📢'}</span>}
      </div>
      <div style={{ fontFamily: 'DM Sans,system-ui,sans-serif', fontWeight: 800, fontSize: 10, color: '#111827', marginBottom: 2, lineHeight: 1.2 }}>{ad.name}</div>
      <div style={{ fontFamily: 'DM Sans,system-ui,sans-serif', fontWeight: 400, fontSize: 9, color: '#6b7280', lineHeight: 1.3 }}>{ad.tagline}</div>
    </a>
  )
}

// ── ADVERTISE SLOT ───────────────────────────────────────────────────────────
function AdvertiseSlot() {
  const [hov, setHov] = useState(false)
  const navigate = useNavigate()
  return (
    <div
      onClick={() => navigate('/ad-plan')}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: 'block', textDecoration: 'none',
        background: hov ? '#ece4ff' : '#f3eeff',
        border: `1.5px dashed ${hov ? '#7c3aed' : '#c4b5fd'}`,
        borderRadius: '12px', padding: '10px 8px',
        textAlign: 'center', cursor: 'pointer',
        width: 130, flexShrink: 0,
        transition: 'border-color 0.18s, background 0.18s',
      }}>
      <div style={{ fontSize: 14, marginBottom: 3 }}>📢</div>
      <div style={{ fontFamily: 'DM Sans,system-ui,sans-serif', fontWeight: 800, fontSize: 9, color: '#374151', marginBottom: 2 }}>Advertise Here</div>
      <div style={{ fontFamily: 'DM Sans,system-ui,sans-serif', fontSize: 8.5, color: '#9ca3af' }}>₹799/month</div>
    </div>
  )
}

// ── ROTATING AD SLOT ──────────────────────────────────────────────────────────
function AdSlot({ pool, startIdx, delayMs = 0 }) {
  const [cur, setCur] = useState(startIdx % pool.length)
  const [opacity, setOpacity] = useState(1)

  useEffect(() => {
    const init = setTimeout(() => {
      const t = setInterval(() => {
        setOpacity(0)
        setTimeout(() => { setCur(p => (p + 1) % pool.length); setOpacity(1) }, 380)
      }, 7000)
      return () => clearInterval(t)
    }, delayMs)
    return () => clearTimeout(init)
  }, [pool.length, delayMs])

  return (
    <div style={{ opacity, transform: opacity === 1 ? 'translateY(0)' : 'translateY(4px)', transition: 'opacity 0.38s, transform 0.38s' }}>
      <SponsorCard ad={pool[cur]} />
    </div>
  )
}

// ── VERTICAL PANEL — 4 rotating + 1 advertise slot ──────────────────────────
function Panel({ pool }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7, width: 138, padding: '4px', pointerEvents: 'auto' }}>
      <AdSlot pool={pool} startIdx={0} delayMs={0} />
      <AdSlot pool={pool} startIdx={2} delayMs={2000} />
      <AdSlot pool={pool} startIdx={4} delayMs={4000} />
      <AdSlot pool={pool} startIdx={6} delayMs={6000} />
      <AdvertiseSlot />
    </div>
  )
}

// ── DYNAMIC AD LOADER ────────────────────────────────────────────────────────
// Fetches user ads from Firestore. User ads replace default ads 1-for-1.
// When user ads expire or are removed, defaults come back.
function useDynamicAds(defaultPool) {
  const [pool, setPool] = useState(defaultPool)

  useEffect(() => {
    const loadUserAds = async () => {
      try {
        const now = new Date().toISOString()
        const snap = await getDocs(
          query(collection(db, 'ad_purchases'), where('status', '==', 'active'))
        )
        const userAds = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(ad => !ad.expires_at || ad.expires_at > now)
          .map(ad => ({
            id: ad.id,
            emoji: '📢',
            logo_url: ad.logo_url || null,
            bg: ad.brand_color || '#dbeafe',
            name: ad.company_name || 'Sponsor',
            tagline: ad.tagline || 'Check us out!',
            url: ad.website_url || '#',
          }))

        if (userAds.length === 0) {
          setPool(defaultPool)
          return
        }

        // Replace defaults 1-for-1 with user ads
        const merged = [...defaultPool]
        userAds.forEach((uAd, i) => {
          if (i < merged.length) merged[i] = uAd
          else merged.push(uAd)
        })
        setPool(merged)
      } catch {
        setPool(defaultPool)
      }
    }
    loadUserAds()
  }, [])

  return pool
}

// ── EXPORTS ───────────────────────────────────────────────────────────────────
export function LeftAdPanel() {
  const pool = useDynamicAds(DEFAULT_LEFT_ADS)
  return <Panel pool={pool} />
}
export function RightAdPanel() {
  const pool = useDynamicAds(DEFAULT_RIGHT_ADS)
  return <Panel pool={pool} />
}
