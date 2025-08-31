/**
 * Shopping List Service
 * ------------------------------------------------------------------
 * Handles all database operations for shopping list management with
 * real-time subscriptions and cross-device synchronization.
 */

import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  onSnapshot,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../../../config/firebase';

export interface ShoppingListItem {
  id: string;
  userId: string;
  foodName: string;
  quantity: number; // in kg for weight foods, units for unit foods
  unit: 'kg' | 'units';
  addedDate: Date;
  lastUpdated: Date;
  notes?: string;
}

const SHOPPING_LIST_COLLECTION = 'shoppingList';

/**
 * Get all shopping list items for a user
 */
export const getUserShoppingList = async (userId: string): Promise<ShoppingListItem[]> => {
  const q = query(
    collection(db, SHOPPING_LIST_COLLECTION),
    where('userId', '==', userId),
    orderBy('lastUpdated', 'desc')
  );

  const querySnapshot = await getDocs(q);
  const items: ShoppingListItem[] = [];

  querySnapshot.forEach((doc) => {
    const data = doc.data();
    items.push({
      ...data,
      id: doc.id,
      addedDate: data.addedDate instanceof Timestamp ? data.addedDate.toDate() : data.addedDate,
      lastUpdated: data.lastUpdated instanceof Timestamp ? data.lastUpdated.toDate() : data.lastUpdated,
    } as ShoppingListItem);
  });

  return items;
};

/**
 * Add a new shopping list item
 */
export const addShoppingListItem = async (item: Omit<ShoppingListItem, 'id' | 'addedDate' | 'lastUpdated'>): Promise<string> => {
  const timestamp = new Date();
  const docId = `${item.userId}_${item.foodName.toLowerCase().replace(/[^a-z0-9]/g, '-')}_${Date.now()}`;

  const shoppingItem = {
    ...item,
    id: docId,
    addedDate: timestamp,
    lastUpdated: timestamp,
  };

  const docRef = doc(db, SHOPPING_LIST_COLLECTION, docId);
  await setDoc(docRef, shoppingItem);

  console.log('✅ Shopping list item added successfully:', docId);
  return docId;
};

/**
 * Update an existing shopping list item
 */
export const updateShoppingListItem = async (
  itemId: string,
  updates: Partial<Omit<ShoppingListItem, 'id' | 'userId' | 'addedDate'>>
): Promise<void> => {
  const docRef = doc(db, SHOPPING_LIST_COLLECTION, itemId);
  await updateDoc(docRef, {
    ...updates,
    lastUpdated: new Date(),
  });

  console.log('✅ Shopping list item updated successfully:', itemId);
};

/**
 * Delete a shopping list item
 */
export const deleteShoppingListItem = async (itemId: string): Promise<void> => {
  const docRef = doc(db, SHOPPING_LIST_COLLECTION, itemId);
  await deleteDoc(docRef);

  console.log('✅ Shopping list item deleted successfully:', itemId);
};

/**
 * Bulk update shopping list items
 */
export const bulkUpdateShoppingListItems = async (
  updates: { itemId: string; updates: Partial<Omit<ShoppingListItem, 'id' | 'userId' | 'addedDate'>> }[]
): Promise<void> => {
  const batch = writeBatch(db);

  updates.forEach(({ itemId, updates }) => {
    const docRef = doc(db, SHOPPING_LIST_COLLECTION, itemId);
    batch.update(docRef, {
      ...updates,
      lastUpdated: new Date(),
    });
  });

  await batch.commit();
  console.log('✅ Bulk shopping list update completed successfully');
};

/**
 * Real-time listener for user's shopping list
 */
export const subscribeToUserShoppingList = (
  userId: string,
  onNext: (items: ShoppingListItem[]) => void,
  onError?: (err: Error) => void
): (() => void) => {
  const q = query(
    collection(db, SHOPPING_LIST_COLLECTION),
    where('userId', '==', userId),
    orderBy('lastUpdated', 'desc')
  );

  return onSnapshot(
    q,
    (querySnapshot) => {
      const items: ShoppingListItem[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        items.push({
          ...data,
          id: doc.id,
          addedDate: data.addedDate instanceof Timestamp ? data.addedDate.toDate() : data.addedDate,
          lastUpdated: data.lastUpdated instanceof Timestamp ? data.lastUpdated.toDate() : data.lastUpdated,
        } as ShoppingListItem);
      });
      onNext(items);
    },
    (error) => {
      console.error('Error in shopping list subscription:', error);
      if (onError) onError(error as Error);
    }
  );
};

/**
 * Migrate localStorage shopping list to Firestore
 */
export const migrateLocalStorageToFirestore = async (
  userId: string,
  localStorageItems: any[]
): Promise<void> => {
  const batch = writeBatch(db);
  const timestamp = new Date();

  localStorageItems.forEach((item) => {
    const docId = `${userId}_${item.foodName.toLowerCase().replace(/[^a-z0-9]/g, '-')}_${Date.now()}_${Math.random()}`;

    const shoppingItem = {
      ...item,
      userId,
      id: docId,
      addedDate: item.addedDate ? new Date(item.addedDate) : timestamp,
      lastUpdated: item.lastUpdated ? new Date(item.lastUpdated) : timestamp,
    };

    const docRef = doc(db, SHOPPING_LIST_COLLECTION, docId);
    batch.set(docRef, shoppingItem);
  });

  await batch.commit();
  console.log('✅ LocalStorage shopping list migration completed successfully');
};

/**
 * Clear all shopping list items for a user
 */
export const clearUserShoppingList = async (userId: string): Promise<void> => {
  const q = query(
    collection(db, SHOPPING_LIST_COLLECTION),
    where('userId', '==', userId)
  );

  const querySnapshot = await getDocs(q);
  const batch = writeBatch(db);

  querySnapshot.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
  console.log('✅ User shopping list cleared successfully');
};

/**
 * Check if food already exists in shopping list
 */
export const getShoppingListItemByFoodName = async (
  userId: string,
  foodName: string
): Promise<ShoppingListItem | null> => {
  const q = query(
    collection(db, SHOPPING_LIST_COLLECTION),
    where('userId', '==', userId),
    where('foodName', '==', foodName)
  );

  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    const doc = querySnapshot.docs[0];
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      addedDate: data.addedDate instanceof Timestamp ? data.addedDate.toDate() : data.addedDate,
      lastUpdated: data.lastUpdated instanceof Timestamp ? data.lastUpdated.toDate() : data.lastUpdated,
    } as ShoppingListItem;
  }

  return null;
};

const shoppingListService = {
  getUserShoppingList,
  addShoppingListItem,
  updateShoppingListItem,
  deleteShoppingListItem,
  bulkUpdateShoppingListItems,
  subscribeToUserShoppingList,
  migrateLocalStorageToFirestore,
  clearUserShoppingList,
  getShoppingListItemByFoodName,
};

export default shoppingListService;
