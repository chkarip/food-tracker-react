/**
 * Firestore Index Creation Helper
 * This script helps create the required composite index for daily plans queries
 */

import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

export const createFirestoreIndex = async () => {
  try {
    console.log('🔍 Creating Firestore composite index...');
    
    // This query will trigger Firebase to show us the index creation URL
    const q = query(
      collection(db, 'mealPlans'),
      where('userId', '==', 'dummy-user-id'),
      where('date', '>=', '2025-01-01'),
      where('date', '<=', '2025-12-31'),
      orderBy('date', 'asc'),
      limit(1)
    );
    
    // This will fail and show us the index creation URL
    await getDocs(q);
    
    console.log('✅ Index already exists or query succeeded');
  } catch (error: any) {
    if (error.message.includes('requires an index')) {
      console.log('📋 Index Creation Required:');
      console.log('Please click this link to create the index:');
      
      // Extract the URL from the error message
      const urlMatch = error.message.match(/https:\/\/[^\s]+/);
      if (urlMatch) {
        console.log('🔗', urlMatch[0]);
        
        // Try to open the URL automatically
        if (typeof window !== 'undefined') {
          window.open(urlMatch[0], '_blank');
        }
      }
      
      console.log('After creating the index, wait 1-2 minutes for it to build, then refresh the app.');
    } else {
      console.error('❌ Unexpected error:', error);
    }
  }
};

// Auto-run when imported
if (typeof window !== 'undefined') {
  createFirestoreIndex();
}
