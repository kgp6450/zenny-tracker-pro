import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface CustomCategory {
  id: string;
  name: string;
  icon: string;
  color?: string | null;
}

// Default categories that are always available
export const DEFAULT_CATEGORIES: CustomCategory[] = [
  { id: 'food', name: 'Food', icon: '🍔' },
  { id: 'transport', name: 'Transport', icon: '🚗' },
  { id: 'entertainment', name: 'Entertainment', icon: '🎬' },
  { id: 'bills', name: 'Bills', icon: '📄' },
  { id: 'other', name: 'Other', icon: '📦' },
];

export const useCategories = () => {
  const { user } = useAuth();
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Use ref to avoid stale closure
  const customCategoriesRef = useRef<CustomCategory[]>([]);
  customCategoriesRef.current = customCategories;

  // Fetch custom categories from the database
  const fetchCategories = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, icon, color')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setCustomCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // All categories = defaults + custom
  const allCategories = [...DEFAULT_CATEGORIES, ...customCategories];

  // Add a new custom category
  const addCategory = useCallback(async (name: string, icon: string) => {
    if (!user) {
      toast.error('Please sign in to add categories');
      return null;
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error('Category name is required');
      return null;
    }

    if (trimmedName.length > 50) {
      toast.error('Category name must be less than 50 characters');
      return null;
    }

    // Check if category already exists (use ref to get current value)
    const currentCategories = [...DEFAULT_CATEGORIES, ...customCategoriesRef.current];
    const exists = currentCategories.some(
      c => c.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (exists) {
      toast.error('Category already exists');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('categories')
        .insert({
          user_id: user.id,
          name: trimmedName,
          icon: icon || '📦',
        })
        .select('id, name, icon, color')
        .single();

      if (error) throw error;

      setCustomCategories(prev => [...prev, data]);
      toast.success('Category added');
      return data;
    } catch (error: any) {
      console.error('Error adding category:', error);
      if (error.code === '23505') {
        toast.error('Category already exists');
      } else {
        toast.error('Failed to add category');
      }
      return null;
    }
  }, [user]);

  // Delete a custom category
  const deleteCategory = useCallback(async (id: string) => {
    if (!user) return false;

    // Don't allow deleting default categories
    if (DEFAULT_CATEGORIES.some(c => c.id === id)) {
      toast.error('Cannot delete default categories');
      return false;
    }

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCustomCategories(prev => prev.filter(c => c.id !== id));
      toast.success('Category deleted');
      return true;
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category');
      return false;
    }
  }, [user]);

  // Get category info by name
  const getCategoryInfo = useCallback((categoryName: string) => {
    return allCategories.find(
      c => c.name.toLowerCase() === categoryName.toLowerCase() || c.id === categoryName
    ) || { id: 'other', name: categoryName, icon: '📦' };
  }, [allCategories]);

  return {
    categories: allCategories,
    customCategories,
    defaultCategories: DEFAULT_CATEGORIES,
    isLoading,
    addCategory,
    deleteCategory,
    getCategoryInfo,
    refetch: fetchCategories,
  };
};
