/**
 * Simple standalone script to initialize Firebase database
 * Run this directly in the browser console or as a separate script
 */

import { initializeFirebaseDatabase } from './initializeFirebaseDatabase';

// Auto-run database initialization
(async () => {
  try {
    console.log('🚀 Starting Firebase database auto-initialization...');
    await initializeFirebaseDatabase();
    
    console.log('✅ Database initialization completed successfully!');
    console.log('🔥 Your Firestore database now contains:');
    console.log('   - 14 food items with complete nutrition data');
    console.log('   - Cost information and efficiency calculations');
    console.log('   - Food categories for filtering');
    console.log('   - Macro targets configuration');
    console.log('');
    console.log('🌐 Check your Firebase Console: https://console.firebase.google.com/');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
  }
})();

export {}; // Make this a module
