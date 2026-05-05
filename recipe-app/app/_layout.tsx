import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { getDatabase } from '../lib/database';

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#10B981',
    secondary: '#6B7280',
    background: '#F9FAFB',
    surface: '#FFFFFF',
  },
};

export default function RootLayout() {
  useEffect(() => {
    getDatabase().catch(console.error);
  }, []);

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="recipe/[id]"
            options={{ title: 'Recipe', headerBackTitle: 'Back', presentation: 'card' }}
          />
          <Stack.Screen
            name="recipe/new"
            options={{ title: 'New Recipe', presentation: 'modal' }}
          />
          <Stack.Screen
            name="recipe/edit/[id]"
            options={{ title: 'Edit Recipe', presentation: 'modal' }}
          />
          <Stack.Screen
            name="import"
            options={{ title: 'Import Recipe', presentation: 'modal' }}
          />
          <Stack.Screen
            name="plan/[id]"
            options={{ title: 'Meal Plan', presentation: 'card' }}
          />
          <Stack.Screen
            name="settings"
            options={{ title: 'Settings', presentation: 'modal' }}
          />
        </Stack>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
