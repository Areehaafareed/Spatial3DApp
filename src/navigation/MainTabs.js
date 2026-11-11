import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';

import ModelListScreen from '../screens/ModelListScreen';
import ScannnerScreen from '../screens/ScannnerScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const COLORS = {
  primary: '#1AA1E6',
  primarySoft: '#E4F1FB',
  text: '#1B1F2A',
  muted: '#8A94A6',
  border: '#E3E6EE',
};

const icons = { Library: 'package', Capture: 'camera', Profile: 'user' };

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.muted,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingTop: 6,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarIconStyle: { marginTop: 2 },
        tabBarIcon: ({ color, size }) => (
          <Feather name={icons[route.name]} size={size - 2} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Library" component={ModelListScreen} />
      <Tab.Screen
        name="Capture"
        component={ScannnerScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Feather name="aperture" size={26} color={color} />
          ),
        }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
