import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { WorkoutTemplateDocument, SaveTemplateInput } from '../types/template';
import { WorkoutType } from '../types/workout';
import {
  getUserTemplatesForWorkoutType,
  getTemplate,
  saveOrUpdateTemplate,
  deleteTemplate
} from '../services/firebase/workout/templateService';

export const useTemplates = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<WorkoutTemplateDocument[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<WorkoutTemplateDocument | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load templates for specific workout type (on-demand)
  const loadTemplatesForWorkoutType = useCallback(async (workoutType: WorkoutType) => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const userTemplates = await getUserTemplatesForWorkoutType(user.uid, workoutType);
      setTemplates(userTemplates);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load templates';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load a specific template
  const loadTemplate = useCallback(async (templateId: string) => {
    try {
      const template = await getTemplate(templateId);
      if (template) {
        setSelectedTemplate(template);
        return template;
      }
      return null;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load template';
      setError(errorMessage);
      return null;
    }
  }, []);

  // Save or update template
  const saveTemplate = useCallback(async (
    templateData: SaveTemplateInput,
    updateExistingId?: string
  ) => {
    if (!user) throw new Error('User not authenticated');
    const templateId = await saveOrUpdateTemplate(user.uid, templateData, updateExistingId);
    await loadTemplatesForWorkoutType(templateData.workoutType);
    return templateId;
  }, [user, loadTemplatesForWorkoutType]);

  // Delete template
  const removeTemplate = useCallback(async (templateId: string) => {
    if (!user) throw new Error('User not authenticated');
    await deleteTemplate(templateId, user.uid);
    if (selectedTemplate?.id === templateId) {
      setSelectedTemplate(null);
    }
    // Refresh templates list
    const template = templates.find(t => t.id === templateId);
    if (template) {
      await loadTemplatesForWorkoutType(template.workoutType);
    }
  }, [user, selectedTemplate, templates, loadTemplatesForWorkoutType]);

  // Clear selected template
  const clearSelectedTemplate = useCallback(() => {
    setSelectedTemplate(null);
  }, []);

  return {
    templates,
    selectedTemplate,
    loading,
    error,
    loadTemplatesForWorkoutType,
    loadTemplate,
    saveTemplate,
    deleteTemplate: removeTemplate,
    clearSelectedTemplate,
    setSelectedTemplate
  };
};

export default useTemplates;
