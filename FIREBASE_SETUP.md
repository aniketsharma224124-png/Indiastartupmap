# Firebase Setup for Auth

## 1. Enable Authentication in Firebase Console
Go to: https://console.firebase.google.com → Your Project → Authentication → Sign-in method

Enable these providers:
- ✅ **Email/Password**
- ✅ **Google** (set your project's support email)

## 2. Add Authorized Domain
Authentication → Settings → Authorized domains → Add your Vercel/domain URL

## 3. Create Firestore `users` Collection Rules
Go to: Firestore → Rules → Replace with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own profile
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
    // Startups, investors, intro_requests — existing rules
    match /startups/{id} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /investors/{id} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /intro_requests/{id} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 4. How Login Works
- **Navbar** → "🚀 Founder" or "💰 Investor" button → opens AuthModal
- **AuthModal** → Login OR Sign Up tab, role toggle (Founder/Investor), Google button
- On login → user profile saved to Firestore `users/{uid}` with `role` field
- **Auto-redirect**: visiting `/dashboard/founder` while logged in as investor redirects to `/dashboard/investor` and vice versa
- **Auth state** persisted across page refreshes via Firebase Auth

## 5. Firestore `users` Document Structure
```json
{
  "uid": "firebase-uid",
  "email": "user@example.com",
  "name": "Display Name",
  "role": "founder",       // or "investor"
  "provider": "email",     // or "google"
  "created_at": "ISO-date"
}
```
