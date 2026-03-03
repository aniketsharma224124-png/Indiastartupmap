import { useEffect, useState } from 'react'
import { collection, getDocs, deleteDoc, doc, addDoc } from 'firebase/firestore'
import { db, auth } from '../lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'

const DUMMY_INVESTORS = [
    {
        firm_name: 'Sequoia Capital India',
        partner_name: 'Rajan Anandan',
        email: 'rajan@sequoiacap.in',
        phone: '+91 98765 43210',
        type: 'VC Fund',
        sector: 'Technology',
        stage: 'Series A, Series B',
        ticket_size: '₹5Cr - ₹50Cr',
        state: 'Karnataka',
        city: 'Bengaluru',
        website_url: 'https://www.sequoiacap.com/india/',
        linkedin_url: 'https://linkedin.com/company/sequoia-capital-india',
        description: 'Sequoia Capital India advises and invests in bold founders building category-defining companies. We partner with founders from idea to IPO and beyond.',
        portfolio: 'Byju\'s, Zomato, Unacademy, CRED, Pine Labs',
        thesis: 'We look for exceptional founders attacking large markets with differentiated technology and business models.',
        plan: 'partner_elite',
        status: 'approved',
        is_premium: true,
        logo_url: 'https://www.google.com/s2/favicons?domain=sequoiacap.com&sz=128',
        brand_color: '#FF6B35',
    },
    {
        firm_name: 'Accel Partners India',
        partner_name: 'Prashanth Prakash',
        email: 'prashanth@accel.com',
        phone: '+91 98765 43211',
        type: 'VC Fund',
        sector: 'SaaS, Enterprise',
        stage: 'Seed, Series A',
        ticket_size: '₹2Cr - ₹25Cr',
        state: 'Karnataka',
        city: 'Bengaluru',
        website_url: 'https://www.accel.com/',
        linkedin_url: 'https://linkedin.com/company/accel-partners',
        description: 'Accel is an early and growth-stage venture capital firm that powers bold founders through every phase of company building.',
        portfolio: 'Flipkart, Freshworks, Swiggy, BrowserStack, Infra.Market',
        thesis: 'We back entrepreneurs who are reimagining how people live and work across India and globally.',
        plan: 'partner_elite',
        status: 'approved',
        is_premium: true,
        logo_url: 'https://www.google.com/s2/favicons?domain=accel.com&sz=128',
        brand_color: '#2563EB',
    },
    {
        firm_name: 'Kalaari Capital',
        partner_name: 'Vani Kola',
        email: 'vani@kalaari.com',
        phone: '+91 98765 43212',
        type: 'VC Fund',
        sector: 'Consumer Tech, Healthcare',
        stage: 'Seed, Series A',
        ticket_size: '₹1Cr - ₹15Cr',
        state: 'Karnataka',
        city: 'Bengaluru',
        website_url: 'https://www.kalaari.com/',
        linkedin_url: 'https://linkedin.com/company/kalaari-capital',
        description: 'Kalaari Capital is an early-stage, technology-focused venture capital firm helping entrepreneurs build unique solutions for India.',
        portfolio: 'Dream11, Myntra, Snapdeal, CureFit, YourStory',
        thesis: 'We invest in visionary entrepreneurs who are solving real problems uniquely relevant to India.',
        plan: 'partner_elite',
        status: 'approved',
        is_premium: true,
        logo_url: 'https://www.google.com/s2/favicons?domain=kalaari.com&sz=128',
        brand_color: '#9B6FFF',
    },
    {
        firm_name: 'Blume Ventures',
        partner_name: 'Karthik Reddy',
        email: 'karthik@blumeventures.com',
        phone: '+91 98765 43213',
        type: 'Micro VC',
        sector: 'Deeptech, SaaS, Consumer',
        stage: 'Pre-Seed, Seed',
        ticket_size: '₹50L - ₹5Cr',
        state: 'Maharashtra',
        city: 'Mumbai',
        website_url: 'https://blume.vc/',
        linkedin_url: 'https://linkedin.com/company/blume-ventures',
        description: 'Blume Ventures is one of India\'s leading early-stage venture funds, investing in startups solving real problems for the Indian market.',
        portfolio: 'Unacademy, Slice, Dunzo, Purplle, GreyOrange',
        thesis: 'We bet on founders with conviction who are building for India-first markets with global potential.',
        plan: 'partner_elite',
        status: 'approved',
        is_premium: true,
        logo_url: 'https://www.google.com/s2/favicons?domain=blume.vc&sz=128',
        brand_color: '#00D09C',
    },
    {
        firm_name: 'India Quotient',
        partner_name: 'Anand Lunia',
        email: 'anand@indiaquotient.in',
        phone: '+91 98765 43214',
        type: 'VC Fund',
        sector: 'Fintech, Vernacular, EdTech',
        stage: 'Seed',
        ticket_size: '₹25L - ₹3Cr',
        state: 'Maharashtra',
        city: 'Mumbai',
        website_url: 'https://www.indiaquotient.in/',
        linkedin_url: 'https://linkedin.com/company/india-quotient',
        description: 'India Quotient backs first-time founders building for the next 500 million Indians. We focus on Bharat-first consumer startups.',
        portfolio: 'ShareChat, Sharechat, Sugar Cosmetics, Citymall, KhataBook',
        thesis: 'We invest in products designed for Bharat — the next wave of internet users in India.',
        plan: 'partner_elite',
        status: 'approved',
        is_premium: true,
        logo_url: 'https://www.google.com/s2/favicons?domain=indiaquotient.in&sz=128',
        brand_color: '#F59E0B',
    },
]

export default function AdminCleanup() {
    const [log, setLog] = useState(['Waiting for auth...'])
    const [done, setDone] = useState(false)

    const addLog = (msg) => setLog(p => [...p, `${new Date().toLocaleTimeString()} — ${msg}`])

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (user) => {
            if (user) {
                addLog(`Logged in as ${user.email}. Starting cleanup...`)
                runCleanup()
            } else {
                addLog('❌ NOT LOGGED IN — please log in first, then revisit this page.')
            }
        })
        return () => unsub()
    }, [])

    const runCleanup = async () => {
        try {
            addLog('🗑️ Deleting all investors...')
            const investorSnap = await getDocs(collection(db, 'investors'))
            addLog(`Found ${investorSnap.docs.length} investors to delete`)
            for (const d of investorSnap.docs) {
                await deleteDoc(doc(db, 'investors', d.id))
                addLog(`  Deleted: ${d.data().firm_name || d.id}`)
            }
            addLog('✅ All investors deleted')

            addLog('➕ Adding 5 Partner Elite investors with logos...')
            for (const inv of DUMMY_INVESTORS) {
                const ref = await addDoc(collection(db, 'investors'), {
                    ...inv,
                    uid: 'dummy_' + inv.firm_name.replace(/\s/g, '_').toLowerCase(),
                    created_at: new Date().toISOString(),
                    listing_date: new Date().toISOString(),
                })
                addLog(`  Added: ${inv.firm_name} → /investor/${ref.id}`)
            }
            addLog('✅ 5 Partner Elite investors added with logos')
            addLog('🎉 ALL DONE!')
            setDone(true)
        } catch (e) {
            addLog(`❌ ERROR: ${e.code || ''} ${e.message}`)
        }
    }

    return (
        <div style={{ background: '#0a0a0f', minHeight: '100vh', padding: 40, color: 'white', fontFamily: 'monospace' }}>
            <h1 style={{ fontSize: 24, marginBottom: 20 }}>🔧 Admin Cleanup</h1>
            {done && <p style={{ color: '#00D09C', fontWeight: 'bold', fontSize: 18 }}>✅ ALL DONE!</p>}
            <div style={{ marginTop: 20, background: '#111', borderRadius: 8, padding: 16, maxHeight: 600, overflow: 'auto' }}>
                {log.map((l, i) => <div key={i} style={{ marginBottom: 4, fontSize: 13 }}>{l}</div>)}
            </div>
        </div>
    )
}
