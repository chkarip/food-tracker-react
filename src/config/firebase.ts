// Firebase configuration for track-everything-54d37 project
/**
 * firebase.ts - Firebase Configuration & Authentication Setup
 * 
 * BUSINESS PURPOSE:
 * Core Firebase integration that provides:
 * - Secure cloud database (Firestore) for all program data
 * - User authentication and session management
 * - Real-time data synchronization across devices
 * - Scalable backend infrastructure for the food tracking application
 * - Data persistence and backup for user's health/fitness programs
 * 
 * KEY BUSINESS LOGIC:
 * 1. FIRESTORE DATABASE: Manages all program data (meals, workouts, activities, analytics)
 * 2. AUTHENTICATION: Secure user login with email/password and social providers
 * 3. REAL-TIME SYNC: Automatic data synchronization for multi-device access
 * 4. SECURITY RULES: Ensures users can only access their own program data
 * 5. SCALABILITY: Cloud infrastructure that grows with user base
 * 
 * CORE FIREBASE COLLECTIONS:
 * - mealPlans: Detailed meal planning and nutrition data
 * - scheduledWorkouts: Complete workout specifications and scheduling
 * - scheduledActivities: Unified task scheduling for calendar integration
 * - activityHistory: Program completion tracking and analytics
 * - userPreferences: Individual macro targets and program settings
 * 
 * BUSINESS VALUE:
 * - Provides secure, reliable data storage for personal health information
 * - Enables cross-device synchronization for program continuity
 * - Supports real-time updates for immediate feedback and tracking
 * - Maintains data integrity and backup for long-term program success
 * - Scales automatically as the application grows
 */
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

// Global Request Logger - Logs all HTTP requests in the app with operation context
const originalFetch = window.fetch;

function getRequestDescription(url: string, method: string, options?: RequestInit): string {
  // Firebase Firestore requests
  if (url.includes('firestore.googleapis.com') || url.includes('firebasedatabase.app')) {
    return 'Firebase Database';
  }
  
  // Firebase Auth requests
  if (url.includes('identitytoolkit.googleapis.com') || url.includes('securetoken.googleapis.com')) {
    return 'Firebase Auth';
  }
  
  // Open Food Facts API
  if (url.includes('world.openfoodfacts.org')) {
    if (url.includes('/cgi/search.pl')) {
      const searchParams = new URLSearchParams(url.split('?')[1]);
      const query = searchParams.get('search_terms');
      return `Open Food Facts Search: "${query}"`;
    }
    if (url.includes('/api/v0/product/')) {
      const barcode = url.split('/product/')[1]?.split('.')[0];
      return `Open Food Facts Product: ${barcode}`;
    }
    return 'Open Food Facts API';
  }
  
  // Firebase Storage
  if (url.includes('firebasestorage.googleapis.com')) {
    return 'Firebase Storage';
  }
  
  // Firebase Analytics/Performance
  if (url.includes('firebaseinstallations.googleapis.com') || 
      url.includes('firebaselogging.googleapis.com') ||
      url.includes('firebaseremoteconfig.googleapis.com')) {
    return 'Firebase Analytics/Config';
  }
  
  // Generic fallback
  try {
    const urlObj = new URL(url);
    return `${urlObj.hostname}`;
  } catch {
    return 'Unknown Service';
  }
}

window.fetch = async function(...args) {
  const [url, options] = args;
  const method = options?.method || 'GET';
  const timestamp = new Date().toISOString();
  const urlString = typeof url === 'string' ? url : url instanceof URL ? url.href : url.url;
  const description = getRequestDescription(urlString, method, options);
  
  console.log(`🌐 REQUEST [${timestamp}] ${description} - ${method} ${urlString}`);
  
  try {
    const response = await originalFetch.apply(this, args);
    console.log(`✅ RESPONSE [${timestamp}] ${description} - Status: ${response.status}`);
    return response;
  } catch (error) {
    console.log(`❌ REQUEST FAILED [${timestamp}] ${description} - Error: ${error}`);
    throw error;
  }
};

// Firebase configuration object
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);

// Initialize Analytics only in production and when measurement ID is available
export const analytics = process.env.REACT_APP_FIREBASE_MEASUREMENT_ID ? getAnalytics(app) : null;

// Export the app instance
export default app;
