import React, { useEffect, useRef } from 'react';
import { 
  StyleSheet, Text, View, SafeAreaView, TouchableOpacity, 
  Platform, Animated , Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Camera } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';

export default function OnboardingScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

const handleAllowAccess = async () => {
    try {
      // 1. Camera Permission
      const cameraStatus = await Camera.requestCameraPermissionsAsync();
      
      // 2. Storage / Media Library Permission
      const mediaLibraryStatus = await MediaLibrary.requestPermissionsAsync();

      // Check in console which permissions were granted and which weren't
      console.log("Camera Permission Status:", cameraStatus.status);
      console.log("Storage/MediaLibrary Status:", mediaLibraryStatus.status);

      // Check different conditions for clarity
      if (cameraStatus.status === 'granted' && mediaLibraryStatus.status === 'granted') {
        console.log("Both permissions granted! (Camera + Storage)");
        navigation.replace('Scanner');
      } 
      else if (cameraStatus.status === 'granted' && mediaLibraryStatus.status !== 'granted') {
        Alert.alert(
          "Storage Permission Missing",
          "Camera permission is granted, but Storage (Media Library) permission is required to save 3D models."
        );
      } 
      else {
        Alert.alert(
          "Permissions Denied",
          "You must grant the necessary permissions to use the app."
        );
      }

    } catch (error) {
      console.error("Error requesting permissions: ", error);
    }
  };

  return (
    // SafeAreaView ki jagah View use kiya hai taake center point shift na ho
    <View style={styles.container}>
      
      {/* 1. Header (Iske liye SafeAreaView andar lagaya hai taake header notch k neeche aye) */}
      <SafeAreaView>
        <View style={styles.appHeader}>
          <View style={styles.logoRow}>
            <View style={styles.logoCircleSm}>
              <Ionicons name="cube-outline" size={20} color="#00A3FF" />
            </View>
            <Text style={styles.logoTextSm}>Spatial3D</Text>
          </View>
        </View>
      </SafeAreaView>

      {/* 2. Full Screen Blur Overlay (Absolute exact center) */}
      <Animated.View style={[styles.overlayLayer, { opacity: fadeAnim }]}>
        
        {/* Blur effect pure screen pe */}
        <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFillObject} />
        
        {/* 3. White Modal Card */}
        <Animated.View style={[styles.modalCard, { transform: [{ scale: scaleAnim }] }]}>
          
          <View style={styles.topIconCircle}>
            <Ionicons name="camera-outline" size={28} color="#0052cc" />
          </View>

          <Text style={styles.title}>Allow Camera & Storage Access</Text>
          <Text style={styles.description}>
            Spatial3D needs access to your LiDAR optical sensor and local storage to scan real objects in 3D and save meshes to your device.
          </Text>

          <View style={styles.featureBox}>
            <View style={styles.featureIconBox}>
              <Ionicons name="camera-outline" size={20} color="#0052cc" />
            </View>
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Camera & LiDAR Sensor</Text>
              <Text style={styles.featureSubtitle}>3D depth scanning & photogrammetry</Text>
            </View>
          </View>

          <View style={styles.featureBox}>
            <View style={styles.featureIconBox}>
              <Ionicons name="folder-outline" size={20} color="#0052cc" />
            </View>
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Device Storage</Text>
              <Text style={styles.featureSubtitle}>Cache point clouds & save 3D models</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={handleAllowAccess}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.primaryButtonText}>Allow Access</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={() => console.log("Declined")}>
            <Text style={styles.secondaryButtonText}>Don't Allow</Text>
          </TouchableOpacity>

        </Animated.View>
      </Animated.View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  
  appHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: Platform.OS === 'android' ? 40 : 10, paddingBottom: 10 },
  logoRow: { flexDirection: 'row', alignItems: 'center' },
  logoCircleSm: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#E5F3FF', justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  logoTextSm: { fontSize: 18, fontWeight: 'bold', color: '#111' },

  overlayLayer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },

  modalCard: {
    backgroundColor: '#FFF',
    width: '88%',
    borderRadius: 30,
    padding: 24,
    paddingTop: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  
  topIconCircle: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#F0F5FF', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  
  title: { fontSize: 20, fontWeight: 'bold', color: '#111', textAlign: 'center', marginBottom: 12 },
  description: { fontSize: 13, color: '#555', textAlign: 'center', lineHeight: 20, marginBottom: 24, paddingHorizontal: 5 },

  featureBox: { width: '100%', flexDirection: 'row', alignItems: 'center', backgroundColor: '#F4F7FB', padding: 16, borderRadius: 20, marginBottom: 12 },
  featureIconBox: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E5F0FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  featureTextContainer: { flex: 1 },
  featureTitle: { fontSize: 14, fontWeight: 'bold', color: '#111', marginBottom: 2 },
  featureSubtitle: { fontSize: 12, color: '#666' },

  primaryButton: { width: '100%', backgroundColor: '#00A3FF', borderRadius: 30, height: 55, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 12, shadowColor: '#00A3FF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  primaryButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  
  secondaryButton: { width: '100%', height: 50, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  secondaryButtonText: { color: '#333', fontSize: 15, fontWeight: '600' }
});