import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import HomeScreen from './src/screens/HomeScreen';
import ScanScreen from './src/screens/ScanScreen';
import ItemDetailScreen from './src/screens/ItemDetailScreen';
import { startBackgroundTracking } from './src/services/locationTracker';
import { configureNotifications } from './src/services/alarm';
import type { TrackedItem } from './src/types';

export type RootStackParamList = {
  Home: undefined;
  Scan: undefined;
  ItemDetail: { itemId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  useEffect(() => {
    configureNotifications();
    startBackgroundTracking();
  }, []);

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'TimmyTime' }}
        />
        <Stack.Screen
          name="Scan"
          component={ScanScreen}
          options={{ title: 'Scan an item' }}
        />
        <Stack.Screen
          name="ItemDetail"
          component={ItemDetailScreen}
          options={{ title: 'Item' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export type { TrackedItem };
