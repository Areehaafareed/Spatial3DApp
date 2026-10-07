import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, SafeAreaView, TouchableOpacity, 
  Platform 
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Camera, CameraView } from 'expo-camera';

export default function ScannerScreen({ navigation }) {
  const [isGridVisible, setIsGridVisible] = useState(false);
  const [isFlashOn, setIsFlashOn] = useState(false);

  return (
    <View style={styles.container}>
      
      {/* 1. Real Camera View background mein */}
      <CameraView 
        style={StyleSheet.absoluteFillObject} 
        enableTorch={isFlashOn}
      />

      {/* 2. Top Header & Controls */}
      <SafeAreaView style={styles.topSafeArea}>
        <View style={styles.topHeader}>
          {/* Close / X Button */}
          <TouchableOpacity 
            style={styles.iconButton} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="close" size={22} color="#111" />
          </TouchableOpacity>

          {/* LiDAR Active Badge */}
          <View style={styles.lidarBadge}>
            <View style={styles.lidarDot} />
            <Text style={styles.lidarText}>LiDAR ACTIVE</Text>
          </View>

          {/* Grid Toggle Button */}
          <TouchableOpacity 
            style={[styles.iconButton, isGridVisible && styles.activeGridBtn]} 
            onPress={() => setIsGridVisible(!isGridVisible)}
          >
            <Ionicons name="grid-outline" size={20} color={isGridVisible ? "#00A3FF" : "#111"} />
          </TouchableOpacity>

          {/* Flash / Torch Button */}
          <TouchableOpacity 
            style={[styles.iconButton, isFlashOn && styles.activeGridBtn]} 
            onPress={() => setIsFlashOn(!isFlashOn)}
          >
            <Ionicons name="flashlight-outline" size={20} color={isFlashOn ? "#00A3FF" : "#111"} />
          </TouchableOpacity>
        </View>

        {/* Instruction Banner */}
        <View style={styles.instructionBanner}>
          <Ionicons name="information-circle-outline" size={18} color="#0052cc" style={{ marginRight: 6 }} />
          <Text style={styles.instructionText}>Keep object centered • Move slowly</Text>
        </View>
      </SafeAreaView>

      {/* Grid Overlay (Agar grid button on ho) */}
      {isGridVisible && (
        <View style={styles.gridOverlay} pointerEvents="none">
          <View style={styles.gridLineHorizontal} />
          <View style={styles.gridLineVertical} />
        </View>
      )}

      {/* 3. Center Scanning Guide Elements (Bounding Box / Blue Rings & Point Markers) */}
      <View style={styles.centerGuideContainer} pointerEvents="none">
        <View style={styles.scanningFrame}>
          {/* Corner markers */}
          <View style={[styles.cornerMarker, styles.topLeft]} />
          <View style={[styles.cornerMarker, styles.topRight]} />
          <View style={[styles.cornerMarker, styles.bottomLeft]} />
          <View style={[styles.cornerMarker, styles.bottomRight]} />

          {/* Sample Node / Point indicators inside scan */}
          <View style={[styles.nodeTag, { top: '30%', left: '40%' }]}>
            <Text style={styles.nodeText}>P: 041</Text>
          </View>

          <View style={[styles.nodeTag, { top: '55%', right: '25%' }]}>
            <Text style={styles.nodeText}>P: 118</Text>
          </View>

          {/* Dimension Box at bottom of the object frame */}
          <View style={styles.dimensionBadge}>
            <MaterialCommunityIcons name="ruler" size={16} color="#0052cc" style={{ marginRight: 6 }} />
            <Text style={styles.dimensionText}>0.74m × 0.82m × 0.95m</Text>
          </View>
        </View>
      </View>

      {/* 4. Bottom Controls & Progress */}
      <View style={styles.bottomContainer}>
        
        {/* Progress status bar */}
        <View style={styles.progressCard}>
          <Ionicons name="sync-outline" size={16} color="#0052cc" style={{ marginRight: 6 }} />
          <Text style={styles.progressText}>68% completed • Move around the top</Text>
        </View>

        {/* Action Buttons Row */}
        <View style={styles.actionRow}>
          {/* Cancel Button */}
          <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          {/* Capture / Stop Shutter Button */}
          <TouchableOpacity style={styles.captureOuterBtn}>
            <View style={styles.captureInnerBtn} />
          </TouchableOpacity>

          {/* Done Button */}
          <TouchableOpacity style={styles.doneButton} onPress={() => console.log("Scan Finished!")}>
            <Ionicons name="checkmark" size={18} color="#FFF" style={{ marginRight: 4 }} />
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>

      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  
  topSafeArea: { width: '100%', zIndex: 10 },
  topHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 30 : 10 },
  
  iconButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  activeGridBtn: { backgroundColor: '#E5F3FF', borderWidth: 1, borderColor: '#00A3FF' },

  lidarBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  lidarDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#00A3FF', marginRight: 6 },
  lidarText: { fontSize: 12, fontWeight: 'bold', color: '#111' },

  instructionBanner: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginTop: 12 },
  instructionText: { fontSize: 13, fontWeight: '600', color: '#333' },

  gridOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  gridLineHorizontal: { width: '100%', height: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  gridLineVertical: { width: 1, height: '100%', backgroundColor: 'rgba(255,255,255,0.2)' },

  centerGuideContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 },
  scanningFrame: { width: '100%', height: 320, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  
  cornerMarker: { position: 'absolute', width: 24, height: 24, borderColor: '#00A3FF', borderWidth: 3 },
  topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 8 },
  topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 8 },
  bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 8 },
  bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 8 },

  nodeTag: { position: 'absolute', backgroundColor: 'rgba(17, 17, 17, 0.8)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  nodeText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },

  dimensionBadge: { position: 'absolute', bottom: -10, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.95)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6 },
  dimensionText: { fontSize: 12, fontWeight: 'bold', color: '#111' },

  bottomContainer: { width: '100%', paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 30 : 20, alignItems: 'center', zIndex: 10 },
  
  progressCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 25, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6 },
  progressText: { fontSize: 13, fontWeight: '600', color: '#111' },

  actionRow: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  
  cancelButton: { backgroundColor: 'rgba(255,255,255,0.9)', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 25 },
  cancelButtonText: { fontSize: 15, fontWeight: '600', color: '#111' },

  captureOuterBtn: { width: 70, height: 70, borderRadius: 35, borderWidth: 3, borderColor: '#00A3FF', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.3)' },
  captureInnerBtn: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#FFF' },

  doneButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#00A3FF', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 25, shadowColor: '#00A3FF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6 },
  doneButtonText: { fontSize: 15, fontWeight: 'bold', color: '#FFF' }
});