export const firebaseConfig = {
  "projectId": "piggybankpwa",
  "appId": "1:900477412295:web:f6214abb48991dee6c2fe2",
  "storageBucket": "piggybankpwa.firebasestorage.app",
  "apiKey": "AIzaSyAnJ3wVnkeLAmm01cX2KHTlrNvCzpB0Uqs",
  "authDomain": "piggybankpwa.firebaseapp.com",
  "messagingSenderId": "900477412295",
  "measurementId": "G-ZTT2R73NMS"
};

// VAPID Configuration for Push Notifications
export const vapidConfig = {
  publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BDaR2LHlKHBdEgxJe4jCtpuMEdVsy3hVprllCQ0PpMw-sUR123gkAY145aIOH4Wuma0j4T08iRrqZpTSjFmjkGA',
  privateKey: process.env.VAPID_PRIVATE_KEY || 'n30ox9j051ucBpzbAS5kpfo6aT2CPeKQ-7ywGQxpmr4',
  subject: process.env.VAPID_SUBJECT || 'mailto:davidwuguantong@gmail.com'
};
