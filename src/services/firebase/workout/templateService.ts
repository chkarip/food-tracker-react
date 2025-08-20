/**
 * templateService.ts – Workout Template Management System
 */

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { WorkoutTemplateDocument, SaveTemplateInput } from '../../../types/template';
import { WorkoutType } from '../../../types/workout';
import { COLLECTIONS } from '../shared/utils';

/* ------------------------------------------------------------------
 * Save a new workout template
 * ---------------------------------------------------------------- */
/* ------------------------------------------------------------------
 * Save OR Update a workout template
 * ---------------------------------------------------------------- */
export const saveOrUpdateTemplate = async (
  userId: string,
  template: SaveTemplateInput,
  templateId?: string
): Promise<string> => {
  try {
    // Use existing ID for updates, generate new for creates
    const finalTemplateId = templateId || `template_${userId}_${Date.now()}`;
    const templateRef = doc(db, COLLECTIONS.WORKOUT_TEMPLATES, finalTemplateId);

    console.log('💾 Firestore DEBUG – saveOrUpdateTemplate:', {
      userId,
      templateName: template.name,
      workoutType: template.workoutType,
      exerciseCount: template.exercises.length,
      isUpdate: !!templateId
    });

    const templateDoc: Omit<WorkoutTemplateDocument, 'id'> = {
      ...template,
      userId,
      // Preserve original creation date for updates
      createdAt: templateId ? 
        (await getExistingCreatedAt(finalTemplateId)) : 
        new Date().toISOString(),
      lastUsed: new Date().toISOString()
    };

    await setDoc(templateRef, templateDoc);
    console.log(`✅ Successfully ${templateId ? 'updated' : 'created'} workout template`);
    return finalTemplateId;

  } catch (error: unknown) {
    console.error('❌ Save/Update template error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to ${templateId ? 'update' : 'save'} template: ${errorMessage}`);
  }
};

// Helper to preserve original creation date when updating
const getExistingCreatedAt = async (templateId: string): Promise<string> => {
  try {
    const templateRef = doc(db, COLLECTIONS.WORKOUT_TEMPLATES, templateId);
    const docSnap = await getDoc(templateRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data() as WorkoutTemplateDocument;
      return data.createdAt;
    }
    return new Date().toISOString(); // Fallback
  } catch {
    return new Date().toISOString(); // Fallback
  }
};

/* ------------------------------------------------------------------
 * Load user's templates
 * ---------------------------------------------------------------- */
/* ------------------------------------------------------------------
 * Load user's templates (on-demand only)
 * ---------------------------------------------------------------- */
export const getUserTemplatesForWorkoutType = async (
  userId: string,
  workoutType?: WorkoutType
): Promise<WorkoutTemplateDocument[]> => {
  try {
    let q;
    
    if (workoutType) {
      q = query(
        collection(db, COLLECTIONS.WORKOUT_TEMPLATES),
        where('userId', '==', userId),
        where('workoutType', '==', workoutType),
        orderBy('lastUsed', 'desc')
      );
    } else {
      q = query(
        collection(db, COLLECTIONS.WORKOUT_TEMPLATES),
        where('userId', '==', userId),
        orderBy('lastUsed', 'desc')
      );
    }

    const querySnapshot = await getDocs(q);
    const templates = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as WorkoutTemplateDocument[];

    console.log(`📋 Loaded ${templates.length} templates for user`);
    return templates;

  } catch (error: unknown) {
    console.error('❌ Load user templates error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to load templates: ${errorMessage}`);
  }
};

/* ------------------------------------------------------------------
 * Load public templates (for browsing/sharing)
 * ---------------------------------------------------------------- */
// Public templates logic removed (templates are private only)

/* ------------------------------------------------------------------
 * Get a specific template by ID
 * ---------------------------------------------------------------- */
export const getTemplate = async (
  templateId: string
): Promise<WorkoutTemplateDocument | null> => {
  try {
    const templateRef = doc(db, COLLECTIONS.WORKOUT_TEMPLATES, templateId);
    const docSnap = await getDoc(templateRef);

    if (!docSnap.exists()) {
      console.log('ℹ️ Template not found');
      return null;
    }

    return { id: docSnap.id, ...docSnap.data() } as WorkoutTemplateDocument;

  } catch (error: unknown) {
    console.error('❌ Get template error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to get template: ${errorMessage}`);
  }
};

/* ------------------------------------------------------------------
 * Update template's lastUsed timestamp (when loaded into workout)
 * ---------------------------------------------------------------- */
export const updateTemplateLastUsed = async (
  templateId: string
): Promise<void> => {
  try {
    await updateDoc(
      doc(db, COLLECTIONS.WORKOUT_TEMPLATES, templateId),
      {
        lastUsed: new Date().toISOString()
      }
    );

    console.log('✅ Updated template lastUsed timestamp');

  } catch (error: unknown) {
    console.error('❌ Update template lastUsed error:', error);
    // Don't throw - this is not critical functionality
  }
};

/* ------------------------------------------------------------------
 * Update template details
 * ---------------------------------------------------------------- */
// updateTemplate logic now handled by saveOrUpdateTemplate

/* ------------------------------------------------------------------
 * Delete a template
 * ---------------------------------------------------------------- */
export const deleteTemplate = async (
  templateId: string,
  userId: string
): Promise<void> => {
  try {
    // Verify ownership
    const template = await getTemplate(templateId);
    if (!template || template.userId !== userId) {
      throw new Error('Template not found or access denied');
    }

    await deleteDoc(doc(db, COLLECTIONS.WORKOUT_TEMPLATES, templateId));
    console.log('✅ Successfully deleted template');

  } catch (error: unknown) {
    console.error('❌ Delete template error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to delete template: ${errorMessage}`);
  }
};

/* ------------------------------------------------------------------
 * Clone a template (make a copy)
 * ---------------------------------------------------------------- */
export const cloneTemplate = async (
  templateId: string,
  userId: string,
  newName: string
): Promise<string> => {
  try {
    const originalTemplate = await getTemplate(templateId);
    if (!originalTemplate) {
      throw new Error('Template not found');
    }

    // Create new template based on original
    const clonedTemplate: SaveTemplateInput = {
      name: newName,
      workoutType: originalTemplate.workoutType,
      exercises: originalTemplate.exercises.map(ex => ({ ...ex })), // Deep copy
      description: `Cloned from: ${originalTemplate.name}`
    };

    return await saveOrUpdateTemplate(userId, clonedTemplate);

  } catch (error: unknown) {
    console.error('❌ Clone template error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to clone template: ${errorMessage}`);
  }
};

/* ------------------------------------------------------------------
 * Migration: Move localStorage templates to Firebase
 * ---------------------------------------------------------------- */
export const migrateLocalStorageTemplates = async (
  userId: string
): Promise<{ migrated: number; errors: string[] }> => {
  const results: { migrated: number; errors: string[] } = { migrated: 0, errors: [] };

  try {
    const localTemplates = localStorage.getItem('workoutTemplates');
    if (!localTemplates) {
      console.log('ℹ️ No localStorage templates to migrate');
      return results;
    }

    const templates = JSON.parse(localTemplates);
    console.log(`🔄 Migrating ${templates.length} templates from localStorage`);

    for (const template of templates) {
      try {
        const migratedTemplate: SaveTemplateInput = {
          name: template.name,
          workoutType: template.workoutType,
          exercises: template.exercises,
          description: 'Migrated from localStorage'
        };

        await saveOrUpdateTemplate(userId, migratedTemplate);
        results.migrated++;

      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push(`Failed to migrate "${template.name}": ${errorMessage}`);
      }
    }

    // Clear localStorage after successful migration
    if (results.migrated > 0 && results.errors.length === 0) {
      localStorage.removeItem('workoutTemplates');
      console.log('✅ Cleared localStorage templates after successful migration');
    }

    return results;

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    results.errors.push(`Migration failed: ${errorMessage}`);
    return results;
  }
};
