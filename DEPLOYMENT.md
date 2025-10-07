# Firebase Hosting Deployment Guide

This guide shows how to deploy your PWA to Firebase Hosting while using Trae as your development environment instead of Firebase Studio.

## 🚀 Quick Deployment

### Option 1: One-Command Deploy
```bash
npm run firebase:deploy
```

### Option 2: Step-by-Step Deploy
```bash
# 1. Build the application
npm run build

# 2. Deploy to Firebase
firebase deploy --only hosting
```

## 🔧 Initial Setup

### 1. Firebase Project Setup
```bash
# Login to Firebase (if not already logged in)
firebase login

# Initialize Firebase project (if not already done)
firebase init hosting

# Set your Firebase project ID
firebase use your-firebase-project-id
```

### 2. Update Project Configuration
Edit `.firebaserc` and replace `your-firebase-project-id` with your actual Firebase project ID:
```json
{
  "projects": {
    "default": "your-actual-project-id"
  }
}
```

## 📁 Project Structure for Firebase

The project is configured for **static export** deployment:

```
.next/out/          # Built static files (auto-generated)
├── index.html      # Main app entry
├── _next/          # Next.js assets
├── manifest.json   # PWA manifest
├── sw.js          # Service worker
└── icon.png       # App icon
```

## 🛠 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run firebase:deploy` | Build and deploy to production |
| `npm run firebase:preview` | Deploy to preview channel |
| `npm run build` | Build for production |
| `npm run generate-manifest` | Generate PWA manifest |

## 🌐 Deployment Options

### Production Deployment
```bash
npm run firebase:deploy
```
Your app will be available at: `https://your-project-id.web.app`

### Preview Deployment
```bash
npm run firebase:preview
```
Creates a preview channel for testing before production.

### Custom Domain
1. Go to Firebase Console → Hosting
2. Add custom domain
3. Follow DNS configuration steps

## 🔧 Configuration Files

### `firebase.json`
- Configured for static export (`public: ".next/out"`)
- Optimized headers for PWA assets
- Service worker caching rules

### `next.config.ts`
- Static export enabled (`output: 'export'`)
- Image optimization disabled for static hosting
- PWA configuration maintained

### `apphosting.yaml`
- Firebase App Hosting configuration
- Region: `asia-southeast1`
- Auto-scaling settings

## 📱 PWA Features Preserved

✅ **Service Worker**: Optimized caching strategies  
✅ **Offline Support**: Background sync and caching  
✅ **Push Notifications**: iOS and Android support  
✅ **Install Prompt**: Add to home screen  
✅ **Performance**: Lazy loading and optimization  

## 🔍 Troubleshooting

### Build Issues
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Try building again
npm run build
```

### Firebase Issues
```bash
# Check Firebase login
firebase login --reauth

# Verify project
firebase projects:list

# Check hosting status
firebase hosting:sites:list
```

### Environment Variables
For production deployment, set environment variables in Firebase:
```bash
firebase functions:config:set app.name="Your App Name"
```

## 🚀 Continuous Deployment

### GitHub Actions (Optional)
Create `.github/workflows/firebase-hosting.yml`:
```yaml
name: Deploy to Firebase Hosting
on:
  push:
    branches: [ main ]
jobs:
  build_and_deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          projectId: your-project-id
```

## 📊 Performance Monitoring

Firebase automatically provides:
- **Performance Monitoring**: Page load times
- **Analytics**: User engagement
- **Crash Reporting**: Error tracking
- **A/B Testing**: Feature experiments

## 🔐 Security

- **HTTPS**: Automatic SSL certificates
- **CDN**: Global content delivery
- **DDoS Protection**: Built-in security
- **Custom Headers**: Security headers configured

---

## 🎯 Next Steps

1. **Set up your Firebase project ID** in `.firebaserc`
2. **Run `npm run firebase:deploy`** to deploy
3. **Configure custom domain** (optional)
4. **Set up monitoring** and analytics
5. **Enable continuous deployment** (optional)

Your PWA is now ready for production with all optimizations intact! 🚀