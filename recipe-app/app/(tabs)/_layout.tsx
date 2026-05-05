import { Tabs } from 'expo-router';
import { Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#10B981',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#F3F4F6',
          height: 88,
          paddingBottom: 28,
          paddingTop: 8,
        },
        headerStyle: { backgroundColor: '#fff' },
        headerTitleStyle: { fontWeight: '700', fontSize: 18 },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Recipes',
          tabBarLabel: 'Recipes',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🍽️" label="Recipes" focused={focused} />,
          headerRight: () => (
            <TouchableOpacity onPress={() => router.push('/settings')} style={{ paddingRight: 16 }}>
              <Text style={{ fontSize: 22 }}>⚙️</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <Tabs.Screen
        name="tags"
        options={{
          title: 'Tags',
          tabBarLabel: 'Tags',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏷️" label="Tags" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="plans"
        options={{
          title: 'Meal Plans',
          tabBarLabel: 'Plans',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📅" label="Plans" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="shopping"
        options={{
          title: 'Shopping',
          tabBarLabel: 'Shopping',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🛒" label="Shopping" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
