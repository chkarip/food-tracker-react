/**
 * Firebase Firestore Service
 * ------------------------------------------------------------------
 * Handles all database operations for food inventory management with
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

export interface FoodInventoryItem {
  id: string;
  userId: string;
  foodName: string;
  quantity: number;
  unit: string;
  expiryDate?: string;
  location: 'fridge' | 'freezer' | 'pantry' | 'counter';
  status: 'fresh' | 'low' | 'empty';
  lastUpdated: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FOOD_INVENTORY_COLLECTION = 'foodInventory';

/**
 * Get all inventory items for a user
 */
export const getUserInventory = async (userId: string): Promise<FoodInventoryItem[]> => {
  const q = query(
    collection(db, FOOD_INVENTORY_COLLECTION),
    where('userId', '==', userId),
    orderBy('lastUpdated', 'desc')
  );

  const querySnapshot = await getDocs(q);
  const items: FoodInventoryItem[] = [];

  querySnapshot.forEach((doc) => {
    const data = doc.data();
    items.push({
      ...data,
      id: doc.id,
      lastUpdated: data.lastUpdated instanceof Timestamp ? data.lastUpdated.toDate() : data.lastUpdated,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
    } as FoodInventoryItem);
  });

  return items;
};

/**
 * Add a new inventory item
 */
export const addInventoryItem = async (item: Omit<FoodInventoryItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const timestamp = new Date();
  const docId = `${item.userId}_${item.foodName.toLowerCase().replace(/[^a-z0-9]/g, '-')}_${Date.now()}`;

  const inventoryItem = {
    ...item,
    id: docId,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const docRef = doc(db, FOOD_INVENTORY_COLLECTION, docId);
  await setDoc(docRef, inventoryItem);

  console.log('✅ Inventory item added successfully:', docId);
  return docId;
};

/**
 * Update an existing inventory item
 */
export const updateInventoryItem = async (
  itemId: string,
  updates: Partial<Omit<FoodInventoryItem, 'id' | 'userId' | 'createdAt'>>
): Promise<void> => {
  const docRef = doc(db, FOOD_INVENTORY_COLLECTION, itemId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: new Date(),
  });

  console.log('✅ Inventory item updated successfully:', itemId);
};

/**
 * Delete an inventory item
 */
export const deleteInventoryItem = async (itemId: string): Promise<void> => {
  const docRef = doc(db, FOOD_INVENTORY_COLLECTION, itemId);
  await deleteDoc(docRef);

  console.log('✅ Inventory item deleted successfully:', itemId);
};

/**
 * Get inventory items by location
 */
export const getInventoryByLocation = async (
  userId: string,
  location: 'fridge' | 'freezer' | 'pantry' | 'counter'
): Promise<FoodInventoryItem[]> => {
  const q = query(
    collection(db, FOOD_INVENTORY_COLLECTION),
    where('userId', '==', userId),
    where('location', '==', location),
    orderBy('lastUpdated', 'desc')
  );

  const querySnapshot = await getDocs(q);
  const items: FoodInventoryItem[] = [];

  querySnapshot.forEach((doc) => {
    const data = doc.data();
    items.push({
      ...data,
      id: doc.id,
      lastUpdated: data.lastUpdated instanceof Timestamp ? data.lastUpdated.toDate() : data.lastUpdated,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
    } as FoodInventoryItem);
  });

  return items;
};

/**
 * Get items expiring soon (within 3 days)
 */
export const getExpiringSoonItems = async (userId: string): Promise<FoodInventoryItem[]> => {
  const today = new Date();
  const threeDaysFromNow = new Date(today);
  threeDaysFromNow.setDate(today.getDate() + 3);

  const q = query(
    collection(db, FOOD_INVENTORY_COLLECTION),
    where('userId', '==', userId),
    where('expiryDate', '!=', null),
    orderBy('expiryDate', 'asc')
  );

  const querySnapshot = await getDocs(q);
  const items: FoodInventoryItem[] = [];

  querySnapshot.forEach((doc) => {
    const data = doc.data();
    const expiryDate = data.expiryDate instanceof Timestamp ? data.expiryDate.toDate() : new Date(data.expiryDate);

    if (expiryDate <= threeDaysFromNow && expiryDate >= today) {
      items.push({
        ...data,
        id: doc.id,
        lastUpdated: data.lastUpdated instanceof Timestamp ? data.lastUpdated.toDate() : data.lastUpdated,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
      } as FoodInventoryItem);
    }
  });

  return items;
};

/**
 * Get low stock items (status = 'low')
 */
export const getLowStockItems = async (userId: string): Promise<FoodInventoryItem[]> => {
  const q = query(
    collection(db, FOOD_INVENTORY_COLLECTION),
    where('userId', '==', userId),
    where('status', '==', 'low'),
    orderBy('lastUpdated', 'desc')
  );

  const querySnapshot = await getDocs(q);
  const items: FoodInventoryItem[] = [];

  querySnapshot.forEach((doc) => {
    const data = doc.data();
    items.push({
      ...data,
      id: doc.id,
      lastUpdated: data.lastUpdated instanceof Timestamp ? data.lastUpdated.toDate() : data.lastUpdated,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
    } as FoodInventoryItem);
  });

  return items;
};

/**
 * Bulk update inventory items (for status updates)
 */
export const bulkUpdateInventoryItems = async (
  updates: { itemId: string; updates: Partial<Omit<FoodInventoryItem, 'id' | 'userId' | 'createdAt'>> }[]
): Promise<void> => {
  const batch = writeBatch(db);

  updates.forEach(({ itemId, updates }) => {
    const docRef = doc(db, FOOD_INVENTORY_COLLECTION, itemId);
    batch.update(docRef, {
      ...updates,
      updatedAt: new Date(),
    });
  });

  await batch.commit();
  console.log('✅ Bulk inventory update completed successfully');
};

/**
 * Real-time listener for user's inventory
 */
export const subscribeToUserInventory = (
  userId: string,
  onNext: (items: FoodInventoryItem[]) => void,
  onError?: (err: Error) => void
): (() => void) => {
  const q = query(
    collection(db, FOOD_INVENTORY_COLLECTION),
    where('userId', '==', userId),
    orderBy('lastUpdated', 'desc')
  );

  return onSnapshot(
    q,
    (querySnapshot) => {
      const items: FoodInventoryItem[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        items.push({
          ...data,
          id: doc.id,
          lastUpdated: data.lastUpdated instanceof Timestamp ? data.lastUpdated.toDate() : data.lastUpdated,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
        } as FoodInventoryItem);
      });
      onNext(items);
    },
    (error) => {
      console.error('Error in inventory subscription:', error);
      if (onError) onError(error as Error);
    }
  );
};

/**
 * Migrate localStorage inventory to Firebase
 */
export const migrateLocalStorageToFirebase = async (
  userId: string,
  localStorageItems: any[]
): Promise<void> => {
  const batch = writeBatch(db);
  const timestamp = new Date();

  localStorageItems.forEach((item) => {
    const docId = `${userId}_${item.foodName.toLowerCase().replace(/[^a-z0-9]/g, '-')}_${Date.now()}_${Math.random()}`;

    const inventoryItem = {
      ...item,
      userId,
      id: docId,
      lastUpdated: item.lastUpdated ? new Date(item.lastUpdated) : timestamp,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    const docRef = doc(db, FOOD_INVENTORY_COLLECTION, docId);
    batch.set(docRef, inventoryItem);
  });

  await batch.commit();
  console.log('✅ LocalStorage migration completed successfully');
};

/**
 * Clear all inventory items for a user (dangerous operation)
 */
export const clearUserInventory = async (userId: string): Promise<void> => {
  const q = query(
    collection(db, FOOD_INVENTORY_COLLECTION),
    where('userId', '==', userId)
  );

  const querySnapshot = await getDocs(q);
  const batch = writeBatch(db);

  querySnapshot.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
  console.log('✅ User inventory cleared successfully');
};

const foodInventoryService = {
  getUserInventory,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  getInventoryByLocation,
  getExpiringSoonItems,
  getLowStockItems,
  bulkUpdateInventoryItems,
  subscribeToUserInventory,
  migrateLocalStorageToFirebase,
  clearUserInventory,
};

export default foodInventoryService;
