import React, { useState } from 'react';
import { 
    StyleSheet, Text, View, SafeAreaView, TouchableOpacity, 
    Image, ActivityIndicator, Alert, Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ModelService } from '../services/ModelService';

export default function ScanPreviewScreen({ route, navigation }) {
    const { imageUri } = route.params;
    const [isLoading, setIsLoading] = useState(false);
    const [statusText, setStatusText] = useState('Review your cropped scan preview');

    const handleConfirmOk = async () => {
        try {
            setIsLoading(true);
            setStatusText('Uploading to Neural4D AI...');

            // 1. Send image URL/URI to service to start 3D generation task
            const modelUUID = await ModelService.uploadingModel(imageUri);

            if (!modelUUID) {
                throw new Error("Failed to start 3D generation task");
            }

            console.log("Neural4D Task Created UUID:", modelUUID);
            setStatusText('Processing 3D model, please wait...');

            // 2. Poll for the completed model status passing setStatusText callback
            const result = await ModelService.convertingUpdatingModel(modelUUID, setStatusText);
            
            setIsLoading(false);

            if (result && result.format) {
                navigation.replace('ModelViewerScreen', { 
                    modelGlbUrl: result.format 
                });
            } else {
                Alert.alert("Error", "Timed out or failed to retrieve 3D model link.");
            }

        } catch (error) {
            console.error("AI 3D Generation Error:", error);
            setIsLoading(false);
            Alert.alert("Error", "3D conversion failed. Please check your network and API key.");
        }
    };

    const handleCancel = () => {
        navigation.goBack(); 
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={handleCancel}>
                    <Ionicons name="arrow-back" size={22} color="#111" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Scan Preview</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Cropped Image Preview Container */}
            <View style={styles.previewContainer}>
                <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="contain" />
            </View>

            {/* Status / Instruction */}
            <View style={styles.statusBox}>
                <Text style={styles.statusText}>{statusText}</Text>
            </View>

            {/* Loading Overlay */}
            {isLoading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#00A3FF" />
                    <Text style={styles.loadingText}>{statusText}</Text>
                </View>
            )}

            {/* Bottom Actions */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} disabled={isLoading}>
                    <Text style={styles.cancelBtnText}>Cancel / Retake</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.okBtn} onPress={handleConfirmOk} disabled={isLoading}>
                    <Ionicons name="checkmark" size={18} color="#FFF" style={{ marginRight: 6 }} />
                    <Text style={styles.okBtnText}>OK / Generate</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#111' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 10 },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
    previewContainer: { flex: 1, margin: 20, backgroundColor: '#222', borderRadius: 16, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#333' },
    previewImage: { width: '100%', height: '100%' },
    statusBox: { paddingHorizontal: 20, paddingBottom: 10, alignItems: 'center' },
    statusText: { color: '#AAA', fontSize: 14, textAlign: 'center' },
    loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', zIndex: 50 },
    loadingText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginTop: 12, textAlign: 'center', paddingHorizontal: 20 },
    footer: { flexDirection: 'row', justifyContent: 'space-space-between', padding: 20, paddingBottom: Platform.OS === 'ios' ? 20 : 15 },
    cancelBtn: { flex: 1, backgroundColor: '#333', paddingVertical: 16, borderRadius: 25, alignItems: 'center', marginRight: 10 },
    cancelBtnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
    okBtn: { flex: 1, flexDirection: 'row', backgroundColor: '#00A3FF', paddingVertical: 16, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
    okBtnText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' }
});