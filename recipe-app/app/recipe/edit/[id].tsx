import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useRecipeStore } from '../../../store/useRecipeStore';
import { RecipeForm } from '../new';
import { Recipe } from '../../../lib/types';

export default function EditRecipeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { selectedRecipe, loadRecipe, editRecipe } = useRecipeStore();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (id) loadRecipe(id).then(() => setLoaded(true));
  }, [id]);

  if (!loaded || !selectedRecipe) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator size="large" color="#10B981" /></View>;
  }

  const handleSave = async (data: Partial<Recipe>) => {
    await editRecipe(id!, data);
    router.back();
  };

  return (
    <RecipeForm
      initial={{
        title: selectedRecipe.title,
        description: selectedRecipe.description ?? '',
        servings: selectedRecipe.servings,
        prep_time: selectedRecipe.prep_time ?? undefined,
        cook_time: selectedRecipe.cook_time ?? undefined,
        rating: selectedRecipe.rating,
        is_favourite: selectedRecipe.is_favourite,
        is_starred: selectedRecipe.is_starred,
        notes: selectedRecipe.notes ?? '',
        source_url: selectedRecipe.source_url ?? '',
        image_url: selectedRecipe.image_url ?? '',
        ingredients: selectedRecipe.ingredients ?? [],
        steps: selectedRecipe.steps ?? [],
        tags: selectedRecipe.tags ?? [],
      }}
      onSave={handleSave}
    />
  );
}
