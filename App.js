import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AuthScreen from './src/screens/AuthScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import ScannerScreen from './src/screens/ScannnerScreen';
import ModelViewerScreen from './src/screens/ModelViewerScreen';
import ScanPreviewScreen from './src/screens/ScanPreviewScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Auth">
        <Stack.Screen name="Auth" component={AuthScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Scanner" component={ScannerScreen} />
        <Stack.Screen name="ScanPreviewScreen" component={ScanPreviewScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ModelViewerScreen" component={ModelViewerScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}