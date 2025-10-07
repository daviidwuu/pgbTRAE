import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  initializeApp();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, subscription, isIOSSafari, userAgent, timestamp, oldEndpoint } = body;

    if (!userId || !subscription) {
      return NextResponse.json(
        { error: 'Missing required fields: userId and subscription' },
        { status: 400 }
      );
    }

    const db = getFirestore();
    
    // Create subscription document in Firestore
    const subscriptionId = subscription.endpoint.replace(/\//g, '_');
    const subscriptionRef = db.collection(`users/${userId}/pushSubscriptions`).doc(subscriptionId);
    
    const subscriptionData = {
      endpoint: subscription.endpoint,
      keys: {
        auth: subscription.keys.auth,
        p256dh: subscription.keys.p256dh,
      },
      isIOSSafari: isIOSSafari || false,
      userAgent: userAgent || '',
      timestamp: timestamp || Date.now(),
      createdAt: new Date().toISOString(),
    };

    // If there's an old endpoint, remove it
    if (oldEndpoint) {
      const oldSubscriptionId = oldEndpoint.replace(/\//g, '_');
      const oldSubscriptionRef = db.collection(`users/${userId}/pushSubscriptions`).doc(oldSubscriptionId);
      await oldSubscriptionRef.delete();
    }

    await subscriptionRef.set(subscriptionData);

    console.log(`[Push API] Subscription saved for user ${userId}`, {
      endpoint: subscription.endpoint,
      isIOSSafari,
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Push subscription saved successfully' 
    });

  } catch (error) {
    console.error('[Push API] Error saving subscription:', error);
    return NextResponse.json(
      { error: 'Failed to save push subscription' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, endpoint } = body;

    if (!userId || !endpoint) {
      return NextResponse.json(
        { error: 'Missing required fields: userId and endpoint' },
        { status: 400 }
      );
    }

    const db = getFirestore();
    const subscriptionId = endpoint.replace(/\//g, '_');
    const subscriptionRef = db.collection(`users/${userId}/pushSubscriptions`).doc(subscriptionId);
    
    await subscriptionRef.delete();

    console.log(`[Push API] Subscription removed for user ${userId}`, { endpoint });

    return NextResponse.json({ 
      success: true, 
      message: 'Push subscription removed successfully' 
    });

  } catch (error) {
    console.error('[Push API] Error removing subscription:', error);
    return NextResponse.json(
      { error: 'Failed to remove push subscription' },
      { status: 500 }
    );
  }
}