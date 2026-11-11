// screens/ModelListScreen.js
import React, { useState, useCallback } from 'react';
import {
    StyleSheet, Text, View, FlatList, TouchableOpacity,
    ActivityIndicator, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy'; // Legacy import for Expo SDK 54
import { ModelService } from '../services/ModelService';
import { AuthService } from '../services/AuthService';

const MODELS_DIR = FileSystem.documentDirectory + 'models/';

const COLORS = {
    bg: '#F6F7FB',
    card: '#FFFFFF',
    border: '#E3E6EE',
    text: '#1B1F2A',
    muted: '#6B7280',
    primary: '#1AA1E6',
    primaryDark: '#0B5C8C',
    primarySoft: '#E4F1FB',
};

const formatSize = (kb) => (kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`);

const formatDate = (ts) => {
    if (!ts) return '';
    const d = new Date(ts * 1000);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function ModelListScreen({ navigation }) {
    const [models, setModels] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadModels = useCallback(async () => {
        try {
            // 1) MongoDB backend se saved models fetch karein
            const backendModels = await ModelService.fetchModelsFromBackend();
            const backendNames = {};
            backendModels.forEach(m => {
                backendNames[m.taskId] = m.name;
            });

            // 2) Local directory check karein
            const dirInfo = await FileSystem.getInfoAsync(MODELS_DIR);
            if (!dirInfo.exists) {
                setModels([]);
                return;
            }

            const files = await FileSystem.readDirectoryAsync(MODELS_DIR);
            const glbFiles = [];

            for (const file of files) {
                if (file.endsWith('.glb')) {
                    const taskId = file.replace('.glb', '');
                    const filePath = MODELS_DIR + file;
                    const info = await FileSystem.getInfoAsync(filePath);

                    glbFiles.push({
                        id: file,
                        taskId: taskId,
                        name: backendNames[taskId] || `Model (${taskId.substring(0, 6)})`,
                        localUri: filePath, // ModelViewerScreen ke liye zaroori
                        size: Math.round((info.size || 0) / 1024),
                        modificationTime: info.modificationTime || 0
                    });
                }
            }

            glbFiles.sort((a, b) => b.modificationTime - a.modificationTime);
            setModels(glbFiles);
        } catch (error) {
            console.error('[ModelList] Error loading models:', error);
            if (error?.status === 401) {
                // Session expired — wapas sign-in par bhejo
                await AuthService.logout();
                navigation.replace('Auth');
                return;
            }
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, [navigation]);

    // Tab mein screen mounted rehti hai, isliye har baar focus par reload hoga
    // (naya scan save karke Library tab par aane par list update ho jayegi)
    useFocusEffect(
        useCallback(() => {
            loadModels();
        }, [loadModels])
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadModels();
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.modelCard}
            activeOpacity={0.7}
            onPress={() => {
                navigation.navigate('ModelViewerScreen', {
                    localUri: item.localUri,
                    taskId: item.taskId,
                    modelName: item.name
                });
            }}
        >
            <View style={styles.iconContainer}>
                <Ionicons name="cube" size={26} color={COLORS.primary} />
            </View>
            <View style={styles.modelInfo}>
                <Text style={styles.modelTitle} numberOfLines={1}>{item.name}</Text>
                <View style={styles.metaRow}>
                    <Ionicons name="calendar-outline" size={11} color={COLORS.muted} />
                    <Text style={styles.modelMeta}>{formatDate(item.modificationTime)}</Text>
                    <View style={styles.metaDot} />
                    <Ionicons name="document-outline" size={11} color={COLORS.muted} />
                    <Text style={styles.modelMeta}>{formatSize(item.size)}</Text>
                </View>
            </View>
            <View style={styles.arrowWrap}>
                <Ionicons name="chevron-forward" size={18} color={COLORS.primary} />
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <View style={styles.brand}>
                    <Ionicons name="cube-outline" size={22} color={COLORS.primary} />
                    <Text style={styles.headerTitle}>Saved Models</Text>
                </View>
                <Text style={styles.count}>{models.length} {models.length === 1 ? 'model' : 'models'}</Text>
            </View>

            {isLoading && !refreshing ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : models.length === 0 ? (
                <View style={styles.centerContainer}>
                    <View style={styles.emptyIconWrap}>
                        <Ionicons name="cube-outline" size={44} color={COLORS.primary} />
                    </View>
                    <Text style={styles.emptyTitle}>No 3D Models Yet</Text>
                    <Text style={styles.emptyText}>Snap a photo of any object to turn it into an interactive 3D model.</Text>
                    <TouchableOpacity
                        style={styles.scanBtn}
                        activeOpacity={0.85}
                        onPress={() => navigation.navigate('Capture')}
                    >
                        <Ionicons name="camera-outline" size={18} color="#fff" />
                        <Text style={styles.scanBtnText}>Start Scanning</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={models}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContainer}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 14,
    },
    brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    headerTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text },
    count: { fontSize: 13, color: COLORS.muted },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
    emptyIconWrap: {
        width: 84,
        height: 84,
        borderRadius: 42,
        backgroundColor: COLORS.primarySoft,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 6 },
    emptyText: { color: COLORS.muted, fontSize: 14, textAlign: 'center', lineHeight: 20 },
    scanBtn: {
        marginTop: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: COLORS.primary,
        paddingHorizontal: 22,
        paddingVertical: 12,
        borderRadius: 24,
    },
    scanBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
    listContainer: { paddingHorizontal: 16, paddingBottom: 24 },
    modelCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.card,
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    iconContainer: {
        width: 52,
        height: 52,
        borderRadius: 14,
        backgroundColor: COLORS.primarySoft,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    modelInfo: { flex: 1 },
    modelTitle: { color: COLORS.text, fontSize: 16, fontWeight: '600', marginBottom: 6 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    modelMeta: { color: COLORS.muted, fontSize: 11 },
    metaDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: COLORS.muted, marginHorizontal: 2 },
    arrowWrap: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.primarySoft,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
