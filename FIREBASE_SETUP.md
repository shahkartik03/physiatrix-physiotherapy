# Firebase Setup Instructions

## Step 1: Create Firebase Account

1. Go to: **https://console.firebase.google.com**
2. Click **"Get started"** or **"Sign in"**
3. Use your Google account to sign in
4. Accept Terms of Service

---

## Step 2: Create Firebase Project

1. Click **"Add project"** or **"Create a project"**
2. Enter project name: **`physiatrix-pwa`**
3. Click **Continue**
4. **Google Analytics**: Toggle OFF (not needed for now)
5. Click **Create project**
6. Wait ~30 seconds for project creation
7. Click **Continue**

---

## Step 3: Register Your Web App

1. In Firebase Console, click the **Web icon** `</>`
2. App nickname: **`Physiatrix PWA`**
3. ✅ Check **"Also set up Firebase Hosting"**
4. Click **"Register app"**
5. **COPY the firebaseConfig object** (we'll use this in Step 6)

It looks like this:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "physiatrix-pwa.firebaseapp.com",
  projectId: "physiatrix-pwa",
  storageBucket: "physiatrix-pwa.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
```

6. Click **Continue to console**

---

## Step 4: Enable Authentication

1. In left sidebar, click **"Build"** → **"Authentication"**
2. Click **"Get started"**
3. Click **"Email/Password"** provider
4. Toggle **"Enable"** to ON
5. Toggle **"Email link (passwordless sign-in)"** to OFF (keep it disabled)
6. Click **"Save"**

---

## Step 5: Create Firestore Database

1. In left sidebar, click **"Build"** → **"Firestore Database"**
2. Click **"Create database"**
3. **Location**: Choose closest to you (e.g., `asia-south1` for India)
4. Click **Next**
5. **Security rules**: Select **"Start in production mode"** (we'll update rules later)
6. Click **"Create"**
7. Wait ~30 seconds for database creation

---

## Step 6: Update Firebase Config in Code

Open `src/config/firebase.ts` and replace the placeholder config with YOUR config from Step 3:

```typescript
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "physiatrix-pwa.firebaseapp.com",
  projectId: "physiatrix-pwa",
  storageBucket: "physiatrix-pwa.appspot.com",
  messagingSenderId: "YOUR_ACTUAL_SENDER_ID",
  appId: "YOUR_ACTUAL_APP_ID"
};
```

---

## Step 7: Deploy Security Rules

In VS Code terminal, run:
```bash
npm install -g firebase-tools
firebase login
firebase init firestore
# Select: Use an existing project
# Select: physiatrix-pwa
# Accept default files (firestore.rules, firestore.indexes.json)
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

---

## Step 8: Create Initial Admin User

1. In Firebase Console, go to **Authentication** → **Users**
2. Click **"Add user"**
3. Email: `admin@physiatrix.com` (or your email)
4. Password: Create a strong password
5. Click **"Add user"**
6. **COPY the User UID** (e.g., `abc123xyz456`)

---

## Step 9: Create Admin Doctor in Firestore

1. In Firebase Console, go to **Firestore Database**
2. Click **"Start collection"**
3. Collection ID: `doctors`
4. Click **Next**
5. Document ID: **Paste the User UID from Step 8**
6. Add fields:

| Field | Type | Value |
|-------|------|-------|
| name | string | Admin Doctor |
| email | string | admin@physiatrix.com |
| phone | string | +919876543210 |
| specialization | string | Physiotherapy |
| isAdmin | boolean | true |
| commissionRate | number | 0 |
| isActive | boolean | true |
| joiningDate | string | 2026-02-09 |
| createdAt | timestamp | (click "Set to current time") |
| updatedAt | timestamp | (click "Set to current time") |

7. Click **Save**

---

## Step 10: Create Other Doctors (Optional)

Repeat Step 8 & 9 for each doctor, but set `isAdmin: false` and `commissionRate: 30` (30%)

---

## Step 11: Test the Setup

Once you've completed all steps and updated the config, tell me:
**"Config updated"** 

and I'll help you test the Firebase connection!

---

## 📝 Quick Reference

**Firebase Console:** https://console.firebase.google.com  
**Your Project:** https://console.firebase.google.com/project/physiatrix-pwa  
**Documentation:** https://firebase.google.com/docs/web/setup

---

## ⚠️ Important Notes

- Never commit your Firebase config to public repositories
- The apiKey is OK to expose (it's restricted by domain)
- Keep your service account keys private
- Enable App Check in production for extra security
