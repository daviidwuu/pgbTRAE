# PiggyBank 🐷💰

A modern, feature-rich personal finance management Progressive Web App (PWA) built with Next.js and Firebase. Track your expenses, manage budgets, and gain insights into your spending habits with a beautiful, mobile-first interface.

## ✨ Features

### 💳 Transaction Management
- **Add & Track Transactions**: Record income and expenses with detailed categorization
- **Smart Categories**: Pre-defined categories (F&B, Shopping, Transport, Bills) with custom category support
- **Transaction History**: View and filter your complete transaction history
- **Quick Actions**: Easy-to-use interface for rapid transaction entry

### 📊 Budget Management
- **Monthly Budgets**: Set and track monthly spending limits by category
- **Budget Monitoring**: Real-time budget tracking with visual indicators
- **Spending Insights**: Understand your spending patterns and stay within limits

### 📈 Financial Reports & Analytics
- **Visual Charts**: Interactive charts powered by Recharts for spending analysis
- **Date Range Filtering**: Analyze spending across different time periods
- **Category Breakdown**: Detailed insights into spending by category
- **Balance Tracking**: Monitor your overall financial health

### 📱 Progressive Web App (PWA)
- **Offline Support**: Works without internet connection using service workers
- **Mobile Optimized**: Native app-like experience on mobile devices
- **Push Notifications**: Stay updated with spending alerts and reminders
- **Install to Home Screen**: Add to your device's home screen for quick access

### 🔐 Authentication & Security
- **Firebase Authentication**: Secure user authentication and data protection
- **User Profiles**: Personalized experience with user settings and preferences
- **Data Privacy**: Your financial data is securely stored and encrypted

### 🎨 Modern UI/UX
- **Responsive Design**: Beautiful interface that works on all screen sizes
- **Dark/Light Mode Support**: Comfortable viewing in any lighting condition
- **Smooth Animations**: Polished interactions with Tailwind CSS animations
- **Accessible**: Built with accessibility best practices

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Firebase project (for authentication and database)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd pgbTRAE
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Firebase**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Authentication (Email/Password)
   - Enable Firestore Database
   - Enable Firebase Hosting (optional)
   - Configure your Firebase credentials in `src/firebase/config.ts`

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000) to see the app in action.

### Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking
- `npm run firebase:deploy` - Build and deploy to Firebase Hosting
- `npm run firebase:preview` - Deploy to Firebase preview channel

## 🛠️ Technology Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **React 18** - UI library with hooks and modern patterns
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Lucide React** - Beautiful icon library

### Backend & Database
- **Firebase** - Backend-as-a-Service platform
- **Firestore** - NoSQL document database
- **Firebase Authentication** - User authentication service
- **Firebase Hosting** - Static site hosting
- **Firebase Functions** - Serverless functions (optional)

### PWA & Performance
- **Next PWA** - Progressive Web App capabilities
- **Service Workers** - Offline functionality and caching
- **Web Push API** - Push notification support
- **Dynamic Imports** - Code splitting for optimal performance

### Data Visualization
- **Recharts** - Composable charting library
- **Date-fns** - Modern date utility library
- **React Hook Form** - Performant form handling
- **Zod** - TypeScript-first schema validation

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── login/             # Authentication pages
│   ├── dashboard.tsx      # Main dashboard component
│   └── page.tsx           # Home page
├── components/            # Reusable UI components
│   ├── dashboard/         # Dashboard-specific components
│   └── ui/               # Base UI components (Radix UI)
├── firebase/             # Firebase configuration and utilities
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions and data types
└── sw.js                 # Service worker for PWA functionality
```

## 🔧 Configuration

### Firebase Setup
1. Update `src/firebase/config.ts` with your Firebase project credentials
2. Configure Firestore security rules in `firestore.rules`
3. Set up Firebase indexes in `firestore.indexes.json`

### PWA Configuration
- Customize app manifest in `public/manifest.json`
- Update service worker settings in `public/sw.js`
- Configure PWA options in `next.config.ts`

## 📱 Mobile Features

PiggyBank is designed mobile-first with special attention to:
- **Touch-friendly Interface**: Large tap targets and smooth gestures
- **Offline Functionality**: Continue using the app without internet
- **Push Notifications**: Get notified about budget limits and reminders
- **Home Screen Installation**: Install like a native app
- **Fast Loading**: Optimized for mobile networks

## 🤝 Contributing

We welcome contributions! Please feel free to submit issues and pull requests.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**PiggyBank** - Take control of your finances with style! 🐷✨
