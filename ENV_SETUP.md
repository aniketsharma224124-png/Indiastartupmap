# 🔧 Environment Setup — India Startup Map

## Step 1 — Copy the env template
```bash
cp .env.example .env
```

## Step 2 — Fill in Firebase credentials

1. Go to **Firebase Console** → https://console.firebase.google.com
2. Select your project (or create one)
3. Click **Project Settings** (gear icon) → **Your Apps** → **Web App**
4. Under "SDK setup and configuration" choose **Config**
5. Copy the values into your `.env`:

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

## Step 3 — Fill in Razorpay key

1. Go to **Razorpay Dashboard** → Settings → API Keys
2. Generate a **Test key** for dev (starts with `rzp_test_`)
3. Add to `.env`:
```env
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
```

## Step 4 — Fill in Cloudinary (for logo uploads)

1. Sign up free at https://cloudinary.com
2. Dashboard → **Settings** → **Upload** → **Upload Presets**
3. Click "Add upload preset" → set **Signing mode** to **Unsigned** → Save
4. Add to `.env`:
```env
VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
VITE_CLOUDINARY_UPLOAD_PRESET=indiastartupmap-logos
```

## Step 5 — Enable Firebase services

In Firebase Console, enable:
- **Authentication** → Sign-in method → Email/Password ✅ + Google ✅
- **Firestore Database** → Create database → Start in **production mode**

## Step 6 — Deploy Firestore rules and indexes

```bash
npm install -g firebase-tools
firebase login
firebase use --add   # select your project
firebase deploy --only firestore:rules,firestore:indexes
```

## Step 7 — Start the app

```bash
npm install
npm run dev
```

Open http://localhost:3000 — data should now load from Firestore.

---

## ✅ Verify Firebase is connected

Open browser DevTools → Console and look for:
- ✅ No red `[IndiaStartupMap] ⚠️ FIREBASE NOT CONFIGURED` error
- Run `window.firebaseDebug?.()` (not available directly, but check no errors)

If you see `permission-denied` errors:
→ Run `firebase deploy --only firestore:rules`

If you see `index` errors:
→ Run `firebase deploy --only firestore:indexes`
   OR click the link in the console error — Firebase auto-creates the index.

