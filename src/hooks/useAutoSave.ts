import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface AutoSaveOptions<T> {
  key: string;
  data: T;
  onSave: (data: T) => Promise<void>;
  debounceMs?: number;
  enabled?: boolean;
}

interface AutoSaveResult<T> {
  isSaving: boolean;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  saveNow: () => Promise<void>;
  discardChanges: () => void;
  getDraft: () => T | null;
}

export function useAutoSave<T>({
  key,
  data,
  onSave,
  debounceMs = 3000,
  enabled = true,
}: AutoSaveOptions<T>): AutoSaveResult<T> {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [draft, setDraft, removeDraft] = useLocalStorage<T | null>(`autosave-${key}`, null);
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastDataRef = useRef<string>(JSON.stringify(data));

  // Detect changes
  useEffect(() => {
    const currentData = JSON.stringify(data);
    if (currentData !== lastDataRef.current) {
      setHasUnsavedChanges(true);
      setDraft(data);
    }
  }, [data, setDraft]);

  // Auto-save with debounce
  useEffect(() => {
    if (!enabled || !hasUnsavedChanges) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      await saveNow();
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, enabled, hasUnsavedChanges, debounceMs]);

  const saveNow = useCallback(async () => {
    if (isSaving) return;
    
    setIsSaving(true);
    try {
      await onSave(data);
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      lastDataRef.current = JSON.stringify(data);
      removeDraft();
    } catch (error) {
      console.error('Auto-save failed:', error);
      toast({
        title: "Opslaan mislukt",
        description: "Je wijzigingen worden lokaal bewaard.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [data, isSaving, onSave, removeDraft, toast]);

  const discardChanges = useCallback(() => {
    setHasUnsavedChanges(false);
    removeDraft();
  }, [removeDraft]);

  const getDraft = useCallback(() => draft, [draft]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  return {
    isSaving,
    lastSaved,
    hasUnsavedChanges,
    saveNow,
    discardChanges,
    getDraft,
  };
}

// Auto-save indicator component hook
export function useAutoSaveIndicator() {
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const showSaving = useCallback(() => setStatus('saving'), []);
  const showSaved = useCallback(() => {
    setStatus('saved');
    setTimeout(() => setStatus('idle'), 2000);
  }, []);
  const showError = useCallback(() => {
    setStatus('error');
    setTimeout(() => setStatus('idle'), 3000);
  }, []);

  return { status, showSaving, showSaved, showError };
}
