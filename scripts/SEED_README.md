# How to Seed the Database

This script fills your Firestore database with sample startup data
so your India map isn't empty when you first launch.

## What it creates

**12 approved startups** spread across states:
- Maharashtra → Zepto (premium), Nykaa (premium), Dunzo
- Karnataka → Razorpay (enterprise), Meesho, PhonePe, Groww, Slice
- Tamil Nadu → Ola Electric (premium)
- Delhi → Urban Company (premium)
- Haryana → Cars24
- Telangana → Darwinbox

**1 pending startup** (TestStartup, Gujarat)
→ visible in your admin panel at /admin to test approve/reject

## Steps

### 1. Get your Service Account Key

1. Firebase Console → ⚙️ Project Settings
2. Click **"Service accounts"** tab
3. Click **"Generate new private key"**
4. Save the downloaded JSON file as **`serviceAccountKey.json`**
5. Place it in the **`scripts/`** folder (same folder as this file)

> ⚠️ Never commit serviceAccountKey.json to git — add it to .gitignore

### 2. Install firebase-admin

```bash
npm install firebase-admin
```

### 3. Run the seed script

```bash
node scripts/seed-firebase.mjs
```

### 4. Verify

Go to Firebase Console → Firestore Database → startups collection.
You should see 13 documents.

## Re-seeding (if needed)

To start fresh:
1. Firebase Console → Firestore → startups collection
2. Click the 3 dots → **Delete collection**
3. Run the seed script again
