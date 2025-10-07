#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Load environment variables if .env file exists
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

const manifest = {
  name: process.env.NEXT_PUBLIC_APP_NAME || "Finance Tracker",
  short_name: process.env.NEXT_PUBLIC_APP_SHORT_NAME || "Finance Tracker",
  start_url: "/",
  display: "standalone",
  orientation: "portrait",
  background_color: process.env.NEXT_PUBLIC_BACKGROUND_COLOR || "#000000",
  theme_color: process.env.NEXT_PUBLIC_THEME_COLOR || "#000000",
  gcm_sender_id: process.env.NEXT_PUBLIC_GCM_SENDER_ID || "103953800507",
  icons: [
    {
      src: "/icon.png",
      sizes: "192x192",
      type: "image/png"
    },
    {
      src: "/icon-512.png",
      sizes: "512x512",
      type: "image/png"
    }
  ]
};

// Write manifest.json
const manifestPath = path.join(__dirname, '..', 'public', 'manifest.json');
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

console.log('✅ Generated manifest.json with environment-specific values');
console.log(`   App Name: ${manifest.name}`);
console.log(`   Theme Color: ${manifest.theme_color}`);
console.log(`   GCM Sender ID: ${manifest.gcm_sender_id}`);