import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StripeProvider } from './src/services/StripeBridge';

import AuthScreen from './src/screens/AuthScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import ModelViewerScreen from './src/screens/ModelViewerScreen';
import ScanPreviewScreen from './src/screens/ScanPreviewScreen';
import CheckoutScreen from './src/screens/CheckoutScreen';
import MainTabs from './src/navigation/MainTabs';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <StripeProvider publishableKey="pk_test_51UPh8YFv2ebkb7UTUSvqtfsLow5rPE4tfQKPs6a1rt2TVA3DbMl53SxN0zix2nV29Kz7mwuT0C1tgfhNGDsmpgMI00KPry742t">
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Auth">
          <Stack.Screen name="Auth" component={AuthScreen} />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen name="ScanPreviewScreen" component={ScanPreviewScreen} />
          <Stack.Screen name="ModelViewerScreen" component={ModelViewerScreen} />
          <Stack.Screen name="Checkout" component={CheckoutScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </StripeProvider>
  );
}