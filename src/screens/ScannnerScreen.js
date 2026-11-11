import React, { useState, useEffect, useRef } from 'react';
import { 
    StyleSheet, Text, View, SafeAreaView, TouchableOpacity, 
    Platform, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';

const measureInWindow = (ref) =>
    new Promise((resolve, reject) => {
        if (!ref.current) return reject(new Error('Ref not ready'));
        ref.current.measureInWindow((x, y, width, height) =>
            resolve({ x, y, width, height })
        );
    });

export default function ScannerScreen({ navigation }) {
    const cameraRef = useRef(null);
    const cameraBoxRef = useRef(null);
    const frameRef = useRef(null);

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

            const cam = await measureInWindow(cameraBoxRef);
            const frame = await measureInWindow(frameRef);

            const photo = await cameraRef.current.takePictureAsync({ quality: 1 });

            const relX = frame.x - cam.x;
            const relY = frame.y - cam.y;

            const scale = Math.max(cam.width / photo.width, cam.height / photo.height);
            const offsetX = (photo.width * scale - cam.width) / 2;
            const offsetY = (photo.height * scale - cam.height) / 2;

            const reqOriginX = (relX + offsetX) / scale;
            const reqOriginY = (relY + offsetY) / scale;
            const reqWidth = frame.width / scale;
            const reqHeight = frame.height / scale;

            const safeOriginX = Math.max(0, Math.min(Math.round(reqOriginX), photo.width - 1));
            const safeOriginY = Math.max(0, Math.min(Math.round(reqOriginY), photo.height - 1));
            const safeWidth = Math.max(1, Math.min(Math.round(reqWidth), photo.width - safeOriginX));
            const safeHeight = Math.max(1, Math.min(Math.round(reqHeight), photo.height - safeOriginY));

            const croppedImage = await ImageManipulator.manipulateAsync(
                photo.uri,
                [{ crop: { 
                    originX: safeOriginX, 
                    originY: safeOriginY, 
                    width: safeWidth, 
                    height: safeHeight 
                } }],
                { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
            );

            setIsScanning(false);
            setScanStatusText('Tap capture to scan object');

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
            <View ref={cameraBoxRef} collapsable={false} style={styles.cameraWrapper}>
                <CameraView 
                    ref={cameraRef}
                    style={styles.camera}
                    facing="back"
                    enableTorch={isFlashOn}
                />
            </View>

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

                    <View style={styles.rightButtons}>
    

                        <TouchableOpacity 
                            style={[styles.iconButton, isGridVisible && styles.activeGridBtn]} 
                            onPress={() => setIsGridVisible(!isGridVisible)}
                        >
                            <Ionicons name="grid-outline" size={20} color={isGridVisible ? "#00A3FF" : "#111"} />
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[styles.iconButton, { marginLeft: 8 }, isFlashOn && styles.activeGridBtn]} 
                            onPress={() => setIsFlashOn(!isFlashOn)}
                        >
                            <Ionicons name="flashlight-outline" size={20} color={isFlashOn ? "#00A3FF" : "#111"} />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.instructionBanner}>
                    <Ionicons name="information-circle-outline" size={18} color="#0052cc" style={{ marginRight: 6 }} />
                    <Text style={styles.instructionText}>{scanStatusText}</Text>
                </View>
            </SafeAreaView>

            {isGridVisible && (
                <View style={styles.gridOverlay} pointerEvents="none">
                    <View style={styles.gridLineHorizontal} />
                    <View style={styles.gridLineVertical} />
                </View>
            )}

            <View style={styles.centerGuideContainer} pointerEvents="none">
                <View ref={frameRef} collapsable={false} style={styles.scanningFrame}>
                    <View style={[styles.cornerMarker, styles.topLeft]} />
                    <View style={[styles.cornerMarker, styles.topRight]} />
                    <View style={[styles.cornerMarker, styles.bottomLeft]} />
                    <View style={[styles.cornerMarker, styles.bottomRight]} />
                </View>
            </View>

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
    rightButtons: { flexDirection: 'row', alignItems: 'center' },
    iconButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center' },
    activeGridBtn: { backgroundColor: '#E5F3FF', borderWidth: 1, borderColor: '#00A3FF' },
    instructionBanner: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginTop: 12 },
    instructionText: { fontSize: 13, fontWeight: '600', color: '#333' },
    gridOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 1 },
    gridLineHorizontal: { width: '100%', height: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
    gridLineVertical: { width: 1, height: '100%', backgroundColor: 'rgba(255,255,255,0.2)' },
    centerGuideContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30, zIndex: 2 },
    scanningFrame: { width: '100%', height: 320, position: 'relative' },
    cornerMarker: { position: 'absolute', width: 24, height: 24, borderColor: '#00A3FF', borderWidth: 3 },
    topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 8 },
    topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 8 },
    bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 8 },
    bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 8 },
    bottomContainer: { width: '100%', paddingBottom: 40, alignItems: 'center', zIndex: 10, position: 'absolute', bottom: 0 },
    captureOuterBtn: { width: 70, height: 70, borderRadius: 35, borderWidth: 3, borderColor: '#00A3FF', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.3)' },
    captureInnerBtn: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#FFF' }
});