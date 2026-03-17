// ─────────────────────────────────────────────────────────────
//  seed-firebase.mjs
//  Creates the IndiaStartupMap database structure in Firestore
//  with sample approved startups so your map isn't empty.
//
//  HOW TO RUN:
//  1. npm install firebase-admin
//  2. Download your service account key (see SETUP_GUIDE.md Step 4B)
//  3. Place it as serviceAccountKey.json in the same folder as this file
//  4. node scripts/seed-firebase.mjs
// ─────────────────────────────────────────────────────────────

import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load service account
let serviceAccount
try {
  serviceAccount = JSON.parse(
    readFileSync(join(__dirname, 'serviceAccountKey.json'), 'utf8')
  )
} catch {
  console.error('❌ serviceAccountKey.json not found in scripts/ folder.')
  console.error('   Download it from: Firebase Console → Project Settings → Service accounts → Generate new private key')
  process.exit(1)
}

initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore()

// ── Sample startups — one per major region to populate the map ─
const SAMPLE_STARTUPS = [
  {
    company_name:  'Zepto',
    website_url:   'https://zeptonow.com',
    state:         'Maharashtra',
    sector:        'E-Commerce',
    description:   '10-minute grocery delivery across India.',
    email:         'hello@zeptonow.com',
    brand_color:   '#8B5CF6',
    logo_url:      null,
    plan:          'premium',
    is_premium:    true,
    status:        'approved',
    payment_id:    'sample_pay_001',
    founder_name:  'Aadit Palicha',
    linkedin_url:  'https://linkedin.com/company/zepto',
    twitter_url:   null,
    instagram_url: null,
    expires_at:    new Date(Date.now() + 365 * 2 * 24 * 60 * 60 * 1000).toISOString(),
    created_at:    Timestamp.fromDate(new Date()),
  },
  {
    company_name:  'Razorpay',
    website_url:   'https://razorpay.com',
    state:         'Karnataka',
    sector:        'Fintech',
    description:   'Payment gateway powering millions of Indian businesses.',
    email:         'hello@razorpay.com',
    brand_color:   '#2D6FE8',
    logo_url:      null,
    plan:          'enterprise',
    is_premium:    true,
    status:        'approved',
    payment_id:    'sample_pay_002',
    founder_name:  'Harshil Mathur',
    linkedin_url:  'https://linkedin.com/company/razorpay',
    twitter_url:   'https://twitter.com/razorpay',
    instagram_url: null,
    expires_at:    new Date(Date.now() + 365 * 3 * 24 * 60 * 60 * 1000).toISOString(),
    created_at:    Timestamp.fromDate(new Date()),
  },
  {
    company_name:  'Meesho',
    website_url:   'https://meesho.com',
    state:         'Karnataka',
    sector:        'E-Commerce',
    description:   'Social commerce platform for Bharat.',
    email:         'support@meesho.com',
    brand_color:   '#F43F5E',
    logo_url:      null,
    plan:          'basic',
    is_premium:    false,
    status:        'approved',
    payment_id:    'sample_pay_003',
    founder_name:  'Vidit Aatrey',
    linkedin_url:  null,
    twitter_url:   null,
    instagram_url: null,
    expires_at:    new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    created_at:    Timestamp.fromDate(new Date()),
  },
  {
    company_name:  'Ola Electric',
    website_url:   'https://olaelectric.com',
    state:         'Tamil Nadu',
    sector:        'CleanTech',
    description:   'Electric vehicles built for India.',
    email:         'hello@olaelectric.com',
    brand_color:   '#10B981',
    logo_url:      null,
    plan:          'premium',
    is_premium:    true,
    status:        'approved',
    payment_id:    'sample_pay_004',
    founder_name:  'Bhavish Aggarwal',
    linkedin_url:  null,
    twitter_url:   null,
    instagram_url: null,
    expires_at:    new Date(Date.now() + 365 * 2 * 24 * 60 * 60 * 1000).toISOString(),
    created_at:    Timestamp.fromDate(new Date()),
  },
  {
    company_name:  'PhonePe',
    website_url:   'https://phonepe.com',
    state:         'Karnataka',
    sector:        'Fintech',
    description:   'India\'s leading digital payments platform.',
    email:         'support@phonepe.com',
    brand_color:   '#5B21B6',
    logo_url:      null,
    plan:          'basic',
    is_premium:    false,
    status:        'approved',
    payment_id:    'sample_pay_005',
    founder_name:  'Sameer Nigam',
    linkedin_url:  null,
    twitter_url:   null,
    instagram_url: null,
    expires_at:    new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    created_at:    Timestamp.fromDate(new Date()),
  },
  {
    company_name:  'Groww',
    website_url:   'https://groww.in',
    state:         'Karnataka',
    sector:        'Fintech',
    description:   'Simple investing app for stocks, mutual funds & more.',
    email:         'hello@groww.in',
    brand_color:   '#00D09C',
    logo_url:      null,
    plan:          'basic',
    is_premium:    false,
    status:        'approved',
    payment_id:    'sample_pay_006',
    founder_name:  'Lalit Keshre',
    linkedin_url:  null,
    twitter_url:   null,
    instagram_url: null,
    expires_at:    new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    created_at:    Timestamp.fromDate(new Date()),
  },
  {
    company_name:  'Dunzo',
    website_url:   'https://dunzo.com',
    state:         'Maharashtra',
    sector:        'Logistics',
    description:   'Hyperlocal delivery for everything you need.',
    email:         'hello@dunzo.com',
    brand_color:   '#F59E0B',
    logo_url:      null,
    plan:          'basic',
    is_premium:    false,
    status:        'approved',
    payment_id:    'sample_pay_007',
    founder_name:  'Kabeer Biswas',
    linkedin_url:  null,
    twitter_url:   null,
    instagram_url: null,
    expires_at:    new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    created_at:    Timestamp.fromDate(new Date()),
  },
  {
    company_name:  'Slice',
    website_url:   'https://sliceit.com',
    state:         'Karnataka',
    sector:        'Fintech',
    description:   'Credit card & payments for millennials.',
    email:         'hello@sliceit.com',
    brand_color:   '#7C3AED',
    logo_url:      null,
    plan:          'basic',
    is_premium:    false,
    status:        'approved',
    payment_id:    'sample_pay_008',
    founder_name:  'Rajan Bajaj',
    linkedin_url:  null,
    twitter_url:   null,
    instagram_url: null,
    expires_at:    new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    created_at:    Timestamp.fromDate(new Date()),
  },
  {
    company_name:  'Urban Company',
    website_url:   'https://urbancompany.com',
    state:         'Delhi',
    sector:        'Services',
    description:   'Home services marketplace — salon, plumbing, cleaning.',
    email:         'support@urbancompany.com',
    brand_color:   '#0EA5E9',
    logo_url:      null,
    plan:          'premium',
    is_premium:    true,
    status:        'approved',
    payment_id:    'sample_pay_009',
    founder_name:  'Abhiraj Bhal',
    linkedin_url:  null,
    twitter_url:   null,
    instagram_url: null,
    expires_at:    new Date(Date.now() + 365 * 2 * 24 * 60 * 60 * 1000).toISOString(),
    created_at:    Timestamp.fromDate(new Date()),
  },
  {
    company_name:  'Cars24',
    website_url:   'https://cars24.com',
    state:         'Haryana',
    sector:        'Automotive',
    description:   'Buy and sell used cars at a fair price.',
    email:         'hello@cars24.com',
    brand_color:   '#EF4444',
    logo_url:      null,
    plan:          'basic',
    is_premium:    false,
    status:        'approved',
    payment_id:    'sample_pay_010',
    founder_name:  'Vikram Chopra',
    linkedin_url:  null,
    twitter_url:   null,
    instagram_url: null,
    expires_at:    new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    created_at:    Timestamp.fromDate(new Date()),
  },
  {
    company_name:  'Darwinbox',
    website_url:   'https://darwinbox.com',
    state:         'Telangana',
    sector:        'HR Tech',
    description:   'Modern HR platform for enterprise teams.',
    email:         'hello@darwinbox.com',
    brand_color:   '#0D9488',
    logo_url:      null,
    plan:          'basic',
    is_premium:    false,
    status:        'approved',
    payment_id:    'sample_pay_011',
    founder_name:  'Chaitanya Peddi',
    linkedin_url:  null,
    twitter_url:   null,
    instagram_url: null,
    expires_at:    new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    created_at:    Timestamp.fromDate(new Date()),
  },
  {
    company_name:  'Nykaa',
    website_url:   'https://nykaa.com',
    state:         'Maharashtra',
    sector:        'E-Commerce',
    description:   'Beauty and lifestyle ecommerce platform.',
    email:         'support@nykaa.com',
    brand_color:   '#EC4899',
    logo_url:      null,
    plan:          'premium',
    is_premium:    true,
    status:        'approved',
    payment_id:    'sample_pay_012',
    founder_name:  'Falguni Nayar',
    linkedin_url:  null,
    twitter_url:   null,
    instagram_url: null,
    expires_at:    new Date(Date.now() + 365 * 2 * 24 * 60 * 60 * 1000).toISOString(),
    created_at:    Timestamp.fromDate(new Date()),
  },
]

// ── Also create a sample PENDING startup to test admin panel ──
const SAMPLE_PENDING = {
  company_name:  'TestStartup',
  website_url:   'https://example.com',
  state:         'Gujarat',
  sector:        'SaaS',
  description:   'This is a test pending submission. Approve or reject from admin panel.',
  email:         'test@example.com',
  brand_color:   '#3B7DD8',
  logo_url:      null,
  plan:          'basic',
  is_premium:    false,
  status:        'pending',
  payment_id:    null,
  founder_name:  'Test Founder',
  linkedin_url:  null,
  twitter_url:   null,
  instagram_url: null,
  expires_at:    null,
  created_at:    Timestamp.fromDate(new Date()),
}

async function seed() {
  console.log('🚀 Starting Firebase seed...\n')

  const col = db.collection('startups')

  // Check if already seeded
  const existing = await col.limit(1).get()
  if (!existing.empty) {
    console.log('⚠️  Collection already has data.')
    console.log('   Delete the startups collection in Firebase Console first if you want to reseed.')
    console.log('   Or continue — this will ADD to existing data.')
    console.log('')
  }

  // Insert approved sample startups
  console.log('📦 Inserting sample startups...')
  const batch = db.batch()

  for (const startup of SAMPLE_STARTUPS) {
    const ref = col.doc()
    batch.set(ref, startup)
    console.log(`   ✓ ${startup.company_name} (${startup.state}) — ${startup.plan}`)
  }

  // Insert pending test startup
  const pendingRef = col.doc()
  batch.set(pendingRef, SAMPLE_PENDING)
  console.log(`   ⏳ ${SAMPLE_PENDING.company_name} (${SAMPLE_PENDING.state}) — PENDING`)

  await batch.commit()

  console.log('\n✅ Seed complete!')
  console.log(`   ${SAMPLE_STARTUPS.length} approved startups inserted`)
  console.log('   1 pending startup inserted (visible in /admin panel)')
  console.log('\n🗺️  Your map should now show startups across these states:')

  const states = [...new Set(SAMPLE_STARTUPS.map(s => s.state))]
  states.forEach(s => console.log('   •', s))

  console.log('\n📋 Next: Go to Firebase Console → Firestore → startups collection to verify.')
  process.exit(0)
}

seed().catch(err => {
  console.error('❌ Seed failed:', err.message)
  process.exit(1)
})
