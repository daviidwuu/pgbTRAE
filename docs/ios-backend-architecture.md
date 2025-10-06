# iOS 26 PWA Backend Architecture for Push Notifications

## Architecture Overview

This document outlines the redesigned backend architecture specifically optimized for iOS 26 PWA push notifications.

## System Architecture Diagram

```mermaid
graph TB
    subgraph "iOS 26 PWA Frontend"
        PWA["PWA App (Safari)"]
        SW["Service Worker (iOS-optimized)"]
        PM["Push Manager"]
    end
    
    subgraph "Firebase Backend Services"
        API["Next.js API Routes"]
        ADMIN["Firebase Admin SDK"]
        FS["Firestore Database"]
        AUTH["Firebase Auth"]
    end
    
    subgraph "Push Notification System"
        VAPID["VAPID Keys"]
        WEBPUSH["Web Push Library"]
        PAYLOAD["iOS Push Payload Formatter"]
    end
    
    subgraph "iOS Native System"
        SAFARI["Safari Push Service"]
        NATIVE["iOS Native Notifications"]
    end
    
    subgraph "Enhanced Components"
        DETECTOR["iOS Safari Detector"]
        LOGGER["Push Notification Logger"]
        RETRY["Retry Logic Handler"]
        VALIDATOR["Subscription Validator"]
    end

    %% User Interactions
    PWA --> SW
    SW --> PM
    PM --> API
    
    %% Backend Processing
    API --> DETECTOR
    DETECTOR --> PAYLOAD
    API --> ADMIN
    ADMIN --> FS
    ADMIN --> AUTH
    
    %% Push Notification Flow
    API --> VAPID
    VAPID --> WEBPUSH
    WEBPUSH --> PAYLOAD
    PAYLOAD --> SAFARI
    SAFARI --> NATIVE
    
    %% Error Handling & Logging
    API --> LOGGER
    WEBPUSH --> RETRY
    RETRY --> LOGGER
    PM --> VALIDATOR
    VALIDATOR --> LOGGER
    
    %% Data Storage
    FS --> |"User Data"| API
    FS --> |"Push Subscriptions"| API
    FS --> |"Transaction Data"| API
    
    %% Service Worker Events
    SW --> |"Push Events"| NATIVE
    SW --> |"Background Sync"| API
    
    style PWA fill:#e1f5fe
    style SW fill:#f3e5f5
    style NATIVE fill:#e8f5e8
    style API fill:#fff3e0
    style DETECTOR fill:#ffebee
    style PAYLOAD fill:#f1f8e9
```

## Key Components

### 1. iOS Safari Detector
- Detects iOS Safari browser
- Applies iOS-specific push notification logic
- Handles iOS PWA installation requirements

### 2. iOS Push Payload Formatter
- Formats push notifications for iOS Safari compatibility
- Ensures proper notification structure and metadata
- Handles iOS-specific notification actions

### 3. Enhanced Service Worker
- iOS-optimized push event handling
- Proper notification display for iOS
- Background sync capabilities

### 4. Push Notification Logger
- Comprehensive logging for debugging
- Tracks push notification success/failure rates
- Monitors iOS-specific issues

### 5. Retry Logic Handler
- Handles failed push notifications
- Implements exponential backoff
- Manages subscription cleanup

## Data Flow

1. **User Action**: User performs transaction in PWA
2. **Detection**: System detects iOS Safari and applies iOS-specific logic
3. **Processing**: API processes transaction and prepares push notification
4. **Formatting**: Push payload is formatted for iOS compatibility
5. **Delivery**: Notification is sent via Safari Push Service
6. **Display**: Native iOS notification is displayed to user
7. **Logging**: All steps are logged for debugging and monitoring

## iOS 26 Specific Considerations

- PWA must be installed (added to home screen)
- Service worker must be properly registered and active
- Push subscription requires correct VAPID key format
- Notifications must use iOS-compatible payload structure
- Error handling for iOS-specific failure modes