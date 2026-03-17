import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore }        from 'firebase-admin/firestore'
import { readFileSync }        from 'fs'
import { fileURLToPath }       from 'url'
import { dirname, join }       from 'path'
 
const __dirname = dirname(fileURLToPath(import.meta.url))
const sa = JSON.parse(readFileSync(join(__dirname, 'serviceAccountKey.json'), 'utf8'))
initializeApp({ credential: cert(sa) })
const db = getFirestore()
 
// Copy INVESTORS_BY_STATE from src/data/investors.js and paste here
// Then run:
export const INVESTORS_BY_STATE = {
  karnataka: [
    {
      id: 'seq-ka-1',
      firm_name: 'Sequoia Capital India',
      partner_name: 'Rajan Anandan',
      focus: ['SaaS', 'Fintech', 'Consumer'],
      stage: 'Series A–C',
      cheque_size: '₹5Cr–₹100Cr',
      open_to_pitches: true,
      brand_color: '#E23744',
      avatar: 'S',
      plan: 'lead',
      status: 'approved',
    },
    {
      id: 'acc-ka-2',
      firm_name: 'Accel Partners',
      partner_name: 'Prashanth Prakash',
      focus: ['B2B', 'Fintech', 'Deep Tech'],
      stage: 'Seed–Series B',
      cheque_size: '₹1Cr–₹50Cr',
      open_to_pitches: true,
      brand_color: '#3395FF',
      avatar: 'A',
      plan: 'partner',
      status: 'approved',
    },
    {
      id: 'blm-ka-3',
      firm_name: 'Blume Ventures',
      partner_name: 'Karthik Reddy',
      focus: ['Consumer', 'SaaS', 'Health'],
      stage: 'Pre-Seed–Series A',
      cheque_size: '₹50L–₹10Cr',
      open_to_pitches: false,
      brand_color: '#00D09C',
      avatar: 'B',
      plan: 'scout',
      status: 'approved',
    },
  ],
  maharashtra: [
    {
      id: 'nex-mh-1',
      firm_name: 'Nexus Venture Partners',
      partner_name: 'Sandeep Singhal',
      focus: ['Consumer', 'Fintech', 'Health'],
      stage: 'Series A–D',
      cheque_size: '₹5Cr–₹200Cr',
      open_to_pitches: true,
      brand_color: '#FC8019',
      avatar: 'N',
      plan: 'lead',
      status: 'approved',
    },
    {
      id: 'kal-mh-2',
      firm_name: 'Kalaari Capital',
      partner_name: 'Vani Kola',
      focus: ['Consumer', 'Edtech', 'Fintech'],
      stage: 'Seed–Series C',
      cheque_size: '₹2Cr–₹80Cr',
      open_to_pitches: true,
      brand_color: '#FC2779',
      avatar: 'K',
      plan: 'partner',
      status: 'approved',
    },
  ],
  delhi: [
    {
      id: 'mat-dl-1',
      firm_name: 'Matrix Partners India',
      partner_name: 'Avnish Bajaj',
      focus: ['Consumer', 'B2B', 'Fintech'],
      stage: 'Series A–C',
      cheque_size: '₹5Cr–₹100Cr',
      open_to_pitches: true,
      brand_color: '#1B5EAB',
      avatar: 'M',
      plan: 'lead',
      status: 'approved',
    },
    {
      id: 'iq-dl-2',
      firm_name: 'IndiaQuotient',
      partner_name: 'Anand Lunia',
      focus: ['Consumer', 'Vernacular', 'Rural'],
      stage: 'Pre-Seed–Series A',
      cheque_size: '₹25L–₹8Cr',
      open_to_pitches: true,
      brand_color: '#E67E22',
      avatar: 'IQ',
      plan: 'partner',
      status: 'approved',
    },
  ],
  'tamil-nadu': [
    {
      id: 'chi-tn-1',
      firm_name: 'Chiratae Ventures',
      partner_name: 'TC Meenakshisundaram',
      focus: ['Deep Tech', 'Health', 'SaaS'],
      stage: 'Seed–Series B',
      cheque_size: '₹1Cr–₹40Cr',
      open_to_pitches: true,
      brand_color: '#27AE60',
      avatar: 'C',
      plan: 'partner',
      status: 'approved',
    },
  ],
  gujarat: [
    {
      id: 'vc-gj-1',
      firm_name: 'Venture Catalysts',
      partner_name: 'Dr. Apoorv Ranjan',
      focus: ['Consumer', 'Fintech', 'Agri'],
      stage: 'Angel–Pre-Seed',
      cheque_size: '₹25L–₹3Cr',
      open_to_pitches: true,
      brand_color: '#E67E22',
      avatar: 'VC',
      plan: 'scout',
      status: 'approved',
    },
  ],
};
 
async function seed() {
  const col = db.collection('investors')
  for (const [state, invList] of Object.entries(INVESTORS_BY_STATE)) {
    for (const inv of invList) {
      await col.add({ ...inv, state, status: 'approved', created_at: new Date().toISOString() })
      console.log('Added:', inv.firm_name, '-', state)
    }
  }
  console.log('Done seeding investors!')
}
seed()