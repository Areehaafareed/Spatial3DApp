import React, { useState, useEffect, useRef } from 'react';
import { 
    StyleSheet, Text, View, SafeAreaView, TouchableOpacity, 
    Platform, Alert, Dimensions, ActivityIndicator 
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ScannerScreen({ navigation }) {
    const cameraRef = useRef(null);
    const [isGridVisible, setIsGridVisible] = useState(false);
    const [isFlashOn, setIsFlashOn] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [scanStatusText, setScanStatusText] = useState('Tap capture to scan object');

    const [permission, requestPermission] = useCameraPermissions();

    useEffect(() => {
        if (!permission || !permission.granted) {
            requestPermission();
        }
    }, [permission]);

    const handleStartCapture = async () => {
        if (!cameraRef.current) return;

        try {
            setIsScanning(true);
            setScanStatusText('Capturing & cropping object...');

            // 1. Photo click karein
            const photo = await cameraRef.current.takePictureAsync({ skipProcessing: true });

            // 2. Blue box ke mutabiq crop karein
            const frameWidth = SCREEN_WIDTH - 60;
            const frameHeight = 320;
            const frameX = 30;
            const frameY = (SCREEN_HEIGHT - frameHeight) / 2;

            const scaleX = photo.width / SCREEN_WIDTH;
            const scaleY = photo.height / SCREEN_HEIGHT;

            const croppedImage = await ImageManipulator.manipulateAsync(
                photo.uri,
                [{ crop: { originX: frameX * scaleX, originY: frameY * scaleY, width: frameWidth * scaleX, height: frameHeight * scaleY } }],
                { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
            );

            setIsScanning(false);
            setScanStatusText('Tap capture to scan object');

            // 3. Nayi Preview Screen par navigate karein aur cropped image URI pass karein
            navigation.navigate('ScanPreviewScreen', {
                imageUri: croppedImage.uri
            });

        } catch (error) {
            console.error("Capture & Crop Error:", error);
            setIsScanning(false);
            setScanStatusText('Tap capture to scan object');
            Alert.alert("Error", "Failed to capture or crop image.");
        }
    };

    const handleDone = () => {
        Alert.alert("Success", "Scan finished successfully!");
        if (navigation.canGoBack()) {
            navigation.goBack();
        } else {
            navigation.replace('Onboarding');
        }
    };

    if (!permission || !permission.granted) {
        return (
            <View style={styles.permissionContainer}>
                <Text style={styles.permissionText}>Camera permission is required to use the scanner.</Text>
                <TouchableOpacity style={styles.grantBtn} onPress={requestPermission}>
                    <Text style={styles.grantBtnText}>Grant Permission</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Camera View */}
            <View style={styles.cameraWrapper}>
                <CameraView 
                    ref={cameraRef}
                    style={styles.camera}
                    facing="back"
                    enableTorch={isFlashOn}
                />
            </View>

            {/* Top Header */}
            <SafeAreaView style={styles.topSafeArea}>
                <View style={styles.topHeader}>
                    <TouchableOpacity 
                        style={styles.iconButton} 
                        onPress={() => {
                            if (navigation.canGoBack()) navigation.goBack();
                            else navigation.replace('Onboarding');
                        }}
                    >
                        <Ionicons name="close" size={22} color="#111" />
                    </TouchableOpacity>

                    <View style={styles.lidarBadge}>
                        <View style={[styles.lidarDot, { backgroundColor: isScanning ? '#00FF00' : '#00A3FF' }]} />
                        <Text style={styles.lidarText}>{isScanning ? 'PROCESSING...' : 'LiDAR ACTIVE'}</Text>
                    </View>

                    <TouchableOpacity 
                        style={[styles.iconButton, isGridVisible && styles.activeGridBtn]} 
                        onPress={() => setIsGridVisible(!isGridVisible)}
                    >
                        <Ionicons name="grid-outline" size={20} color={isGridVisible ? "#00A3FF" : "#111"} />
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.iconButton, isFlashOn && styles.activeGridBtn]} 
                        onPress={() => setIsFlashOn(!isFlashOn)}
                    >
                        <Ionicons name="flashlight-outline" size={20} color={isFlashOn ? "#00A3FF" : "#111"} />
                    </TouchableOpacity>
                </View>

                <View style={styles.instructionBanner}>
                    <Ionicons name="information-circle-outline" size={18} color="#0052cc" style={{ marginRight: 6 }} />
                    <Text style={styles.instructionText}>{scanStatusText}</Text>
                </View>
            </SafeAreaView>

            {/* Grid Overlay */}
            {isGridVisible && (
                <View style={styles.gridOverlay} pointerEvents="none">
                    <View style={styles.gridLineHorizontal} />
                    <View style={styles.gridLineVertical} />
                </View>
            )}

            {/* Center Scanning Guide (Blue Box) */}
            <View style={styles.centerGuideContainer} pointerEvents="none">
                <View style={styles.scanningFrame}>
                    <View style={[styles.cornerMarker, styles.topLeft]} />
                    <View style={[styles.cornerMarker, styles.topRight]} />
                    <View style={[styles.cornerMarker, styles.bottomLeft]} />
                    <View style={[styles.cornerMarker, styles.bottomRight]} />
                    
                    <View style={styles.dimensionBadge}>
                        <MaterialCommunityIcons name="ruler" size={16} color="#0052cc" style={{ marginRight: 6 }} />
                        <Text style={styles.dimensionText}>0.74m × 0.82m × 0.95m</Text>
                    </View>
                </View>
            </View>

            {/* Bottom Controls */}
            <View style={styles.bottomContainer}>
                <View style={{ width: '100%', alignItems: 'center' }}>
                    <TouchableOpacity style={styles.captureOuterBtn} onPress={handleStartCapture} disabled={isScanning}>
                        <View style={[styles.captureInnerBtn, isScanning && { backgroundColor: '#FF3B30' }]} />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    cameraWrapper: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#000' },
    camera: { flex: 1, width: '100%', height: '100%' },
    permissionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF', padding: 20 },
    permissionText: { fontSize: 16, textAlign: 'center', marginBottom: 20, color: '#333' },
    grantBtn: { backgroundColor: '#00A3FF', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 20 },
    grantBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
    topSafeArea: { width: '100%', zIndex: 10 },
    topHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 30 : 10 },
    iconButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center' },
    activeGridBtn: { backgroundColor: '#E5F3FF', borderWidth: 1, borderColor: '#00A3FF' },
    lidarBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
    lidarDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#00A3FF', marginRight: 6 },
    lidarText: { fontSize: 12, fontWeight: 'bold', color: '#111' },
    instructionBanner: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginTop: 12 },
    instructionText: { fontSize: 13, fontWeight: '600', color: '#333' },
    gridOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 1 },
    gridLineHorizontal: { width: '100%', height: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
    gridLineVertical: { width: 1, height: '100%', backgroundColor: 'rgba(255,255,255,0.2)' },
    centerGuideContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30, zIndex: 2 },
    scanningFrame: { width: '100%', height: 320, justifyContent: 'center', alignItems: 'center', position: 'relative' },
    cornerMarker: { position: 'absolute', width: 24, height: 24, borderColor: '#00A3FF', borderWidth: 3 },
    topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 8 },
    topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 8 },
    bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 8 },
    bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 8 },
    dimensionBadge: { position: 'absolute', bottom: -10, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.95)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
    dimensionText: { fontSize: 12, fontWeight: 'bold', color: '#111' },
    bottomContainer: { width: '100%', paddingBottom: 40, alignItems: 'center', zIndex: 10, position: 'absolute', bottom: 0 },
    captureOuterBtn: { width: 70, height: 70, borderRadius: 35, borderWidth: 3, borderColor: '#00A3FF', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.3)' },
    captureInnerBtn: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#FFF' }
});