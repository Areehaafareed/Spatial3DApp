// screens/ScanPreviewScreen.js
import React, { useState } from 'react';
import {
    StyleSheet, Text, View, TouchableOpacity,
    Image, ActivityIndicator, Alert, Platform, TextInput,
    KeyboardAvoidingView, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ModelService } from '../services/ModelService';
import { ProfileService } from '../services/ProfileService';

const FREE_MODEL_KEY = '@piximesh_model_count';

export default function ScanPreviewScreen({ route, navigation }) {
    const { imageUri } = route.params;
    const [isLoading, setIsLoading] = useState(false);
    const [statusText, setStatusText] = useState('Review your cropped scan preview');
    
    const [generatedResult, setGeneratedResult] = useState(null);
    const [modelName, setModelName] = useState('');
    const [showNameInput, setShowNameInput] = useState(false);

    const handleConfirmOk = async () => {
        try {
            // --- Free Trial Gate (Pro members ke liye bypass) ---
            let isPro = false;
            let freeCount = 0;
            try {
                const status = await ProfileService.getPaymentStatus();
                isPro = !!status?.isPro;
            } catch {
                // Backend reachable nahi hai — local counter par fall back karo
            }

            if (!isPro) {
                const raw = await AsyncStorage.getItem(FREE_MODEL_KEY);
                freeCount = raw ? parseInt(raw, 10) : 0;

                if (freeCount >= 1) {
                    Alert.alert(
                        '🔒 Free Trial Used',
                        'You have used your 1 free 3D model. Upgrade to PixiMesh Pro to generate unlimited models.',
                        [
                            { text: 'Cancel', style: 'cancel' },
                            {
                                text: 'Upgrade Now',
                                onPress: () => navigation.navigate('Checkout'),
                            },
                        ]
                    );
                    return;
                }
            }
            // --- End Gate ---

            setIsLoading(true);
            console.log('[Scan] Generate start, imageUri:', imageUri);

            const result = await ModelService.generate3DModel(imageUri, setStatusText);
            console.log('[Scan] Result:', result);

            // Increment usage counter after successful generation (free-tier tracking only)
            if (!isPro) {
                await AsyncStorage.setItem(FREE_MODEL_KEY, String(freeCount + 1));
            }

            setIsLoading(false);

            if (result?.localUri) {
                setGeneratedResult(result);
                setShowNameInput(true);
                setStatusText('Model generated successfully! Enter a name.');
            } else {
                Alert.alert('Error', 'Model local storage mein save nahi hua.');
            }
        } catch (error) {
            console.error('[Scan] Error:', error?.message, error);
            setIsLoading(false);
            setStatusText('Review your cropped scan preview');
            Alert.alert('Generation Failed', error?.message || 'Unknown error');
        }
    };

    const handleSaveAndNavigate = async () => {
        if (!modelName.trim()) {
            Alert.alert('Required', 'Please enter a name for your 3D model.');
            return;
        }

        try {
            console.log('[Scan] Saving to MongoDB with taskId:', generatedResult.taskId);
            await ModelService.saveModelName(generatedResult.taskId, modelName.trim());
            console.log('[Scan] Successfully saved to backend!');
            navigation.replace('ModelViewerScreen', { localUri: generatedResult.localUri, modelName: modelName.trim() });
        } catch (e) {
            console.error('Error saving name to backend:', e);
            Alert.alert('Warning', 'Model local mein save ho gaya lekin backend par sync nahi ho saka.');
            navigation.replace('ModelViewerScreen', { localUri: generatedResult.localUri, modelName: modelName.trim() });
        }
    };

    const handleCancel = () => {
        if (!isLoading) navigation.goBack();
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
                style={{ flex: 1 }}
            >
                <View style={styles.header}>
                    <View style={styles.topRow}>
                        <TouchableOpacity style={styles.backButton} onPress={handleCancel} disabled={isLoading}>
                            <Ionicons name="arrow-back" size={22} color="#111" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Scan Preview</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    <View style={styles.subRow}>
                        <TouchableOpacity 
                            style={styles.viewSavedBtn} 
                            onPress={() => navigation.navigate('MainTabs', { screen: 'Library' })} 
                            disabled={isLoading}
                        >
                            <Ionicons name="folder-open-outline" size={14} color="#00A3FF" style={{ marginRight: 4 }} />
                            <Text style={styles.viewSavedText}>View Saved Models</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive" automaticallyAdjustKeyboardInsets={true}>
                    <View style={[styles.previewContainer, showNameInput && { height: 180 }]}>
                        <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="contain" />
                    </View>

                    <View style={styles.statusBox}>
                        <Text style={styles.statusText}>{statusText}</Text>
                    </View>

                    {/* Free trial badge */}
                    <View style={styles.trialBadge}>
                        <Ionicons name="gift-outline" size={14} color="#00A3FF" style={{ marginRight: 6 }} />
                        <Text style={styles.trialBadgeText}>1st model is FREE • Upgrade for unlimited</Text>
                    </View>
                </ScrollView>

                {isLoading && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color="#00A3FF" />
                        <Text style={styles.loadingText}>{statusText}</Text>
                    </View>
                )}

                {showNameInput && (
                    <View style={styles.nameInputContainer}>
                        <Text style={styles.inputLabel}>Name your 3D Model:</Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="e.g., Coffee Mug, Table, Chair..."
                            placeholderTextColor="#666"
                            value={modelName}
                            onChangeText={setModelName}
                            autoFocus={true}
                        />
                        <TouchableOpacity style={styles.saveNameBtn} onPress={handleSaveAndNavigate}>
                            <Text style={styles.saveNameBtnText}>Save Model</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {!showNameInput && (
                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} disabled={isLoading}>
                            <Text style={styles.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.okBtn} onPress={handleConfirmOk} disabled={isLoading}>
                            <Ionicons name="cube-outline" size={18} color="#FFF" style={{ marginRight: 6 }} />
                            <Text style={styles.okBtnText}>Generate 3D</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#111' },
    header: { 
        paddingHorizontal: 20, 
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#222'
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: { 
        width: 40, height: 40, borderRadius: 20, 
        backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' 
    },
    headerTitle: { 
        fontSize: 18, fontWeight: 'bold', color: '#FFF', 
        textAlign: 'center', flex: 1 
    },
    subRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 },
    viewSavedBtn: { 
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 12, paddingVertical: 6, 
        backgroundColor: '#222', borderRadius: 14, 
        borderWidth: 1, borderColor: '#444' 
    },
    viewSavedText: { color: '#00A3FF', fontSize: 13, fontWeight: '600' },
    scrollContent: { flexGrow: 1, paddingBottom: 20 },
    previewContainer: { 
        flex: 1, margin: 20, height: 300, backgroundColor: '#222', 
        borderRadius: 20, overflow: 'hidden', justifyContent: 'center', 
        alignItems: 'center', borderWidth: 1, borderColor: '#333' 
    },
    previewImage: { width: '100%', height: '100%' },
    statusBox: { paddingHorizontal: 20, paddingBottom: 10, alignItems: 'center' },
    statusText: { color: '#AAA', fontSize: 14, textAlign: 'center' },
    trialBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'center',
        backgroundColor: '#1a2a3a',
        borderWidth: 1,
        borderColor: '#00A3FF44',
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 20,
        marginTop: 4,
        marginBottom: 10,
    },
    trialBadgeText: { color: '#00A3FF', fontSize: 12, fontWeight: '600' },
    loadingOverlay: { 
        ...StyleSheet.absoluteFillObject, 
        backgroundColor: 'rgba(0,0,0,0.85)', 
        justifyContent: 'center', alignItems: 'center', zIndex: 50 
    },
    loadingText: { 
        color: '#FFF', fontSize: 16, fontWeight: 'bold', 
        marginTop: 12, textAlign: 'center', paddingHorizontal: 20 
    },
    nameInputContainer: { 
        padding: 20, backgroundColor: '#1a1a1a', 
        borderTopWidth: 1, borderTopColor: '#333' 
    },
    inputLabel: { color: '#FFF', fontSize: 14, fontWeight: '600', marginBottom: 8 },
    textInput: { 
        backgroundColor: '#222', borderWidth: 1, borderColor: '#444', 
        borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, 
        color: '#FFF', fontSize: 15, marginBottom: 12 
    },
    saveNameBtn: { 
        backgroundColor: '#00A3FF', paddingVertical: 14, 
        borderRadius: 25, alignItems: 'center' 
    },
    saveNameBtnText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
    footer: { 
        flexDirection: 'row', justifyContent: 'space-between', 
        padding: 20, paddingBottom: Platform.OS === 'ios' ? 20 : 15 
    },
    cancelBtn: { 
        flex: 1, backgroundColor: '#2a2a2a', paddingVertical: 16, 
        borderRadius: 25, alignItems: 'center', marginRight: 10,
        borderWidth: 1, borderColor: '#444'
    },
    cancelBtnText: { color: '#AAA', fontSize: 15, fontWeight: '600' },
    okBtn: { 
        flex: 1, flexDirection: 'row', backgroundColor: '#00A3FF', 
        paddingVertical: 16, borderRadius: 25, justifyContent: 'center', 
        alignItems: 'center', marginLeft: 10 
    },
    okBtnText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' }
});
