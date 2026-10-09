// screens/ModelListScreen.js
import React, { useState, useEffect } from 'react';
import {
    StyleSheet, Text, View, FlatList, TouchableOpacity,
    ActivityIndicator, SafeAreaView, RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy'; // <-- Legacy import for Expo SDK 54
import { ModelService } from '../services/ModelService';

const MODELS_DIR = FileSystem.documentDirectory + 'models/';

export default function ModelListScreen({ navigation }) {
    const [models, setModels] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadModels = async () => {
        try {
            setIsLoading(true);

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
                setIsLoading(false);
                setRefreshing(false);
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
                        localUri: filePath, // Yeh local file path ModelViewerScreen ke liye zaroori hai
                        size: Math.round((info.size || 0) / 1024),
                        modificationTime: info.modificationTime || 0
                    });
                }
            }

            glbFiles.sort((a, b) => b.modificationTime - a.modificationTime);
            setModels(glbFiles);
        } catch (error) {
            console.error('[ModelList] Error loading models:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadModels();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadModels();
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity 
            style={styles.modelCard}
            onPress={() => {
                // ModelViewerScreen ko localUri, taskId aur modelName pass karna
                navigation.navigate('ModelViewerScreen', { 
                    localUri: item.localUri,
                    taskId: item.taskId,
                    modelName: item.name 
                });
            }}
        >
            <View style={styles.iconContainer}>
                <Ionicons name="cube" size={24} color="#00A3FF" />
            </View>
            <View style={styles.modelInfo}>
                <Text style={styles.modelTitle}>{item.name}</Text>
                <Text style={styles.modelDate}>
                    Size: {item.size} KB
                </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={22} color="#111" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Saved Models</Text>
                <View style={{ width: 40 }} />
            </View>

            {isLoading && !refreshing ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#00A3FF" />
                </View>
            ) : models.length === 0 ? (
                <View style={styles.centerContainer}>
                    <Ionicons name="folder-open-outline" size={50} color="#555" />
                    <Text style={styles.emptyText}>No models found.</Text>
                </View>
            ) : (
                <FlatList
                    data={models}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContainer}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00A3FF" />
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#111' },
    header: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingHorizontal: 20, 
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#222'
    },
    backButton: { 
        width: 40, 
        height: 40, 
        borderRadius: 20, 
        backgroundColor: '#FFF', 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    headerTitle: { 
        fontSize: 18, 
        fontWeight: 'bold', 
        color: '#FFF', 
        textAlign: 'center',
        flex: 1 
    },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { color: '#888', fontSize: 15, marginTop: 10 },
    listContainer: { padding: 20 },
    modelCard: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: '#1e1e1e', 
        padding: 16, 
        borderRadius: 14, 
        marginBottom: 12, 
        borderWidth: 1, 
        borderColor: '#333' 
    },
    iconContainer: { 
        width: 45, 
        height: 45, 
        borderRadius: 10, 
        backgroundColor: '#2a2a2a', 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginRight: 14 
    },
    modelInfo: { flex: 1 },
    modelTitle: { color: '#FFF', fontSize: 16, fontWeight: '600', marginBottom: 4 },
    modelDate: { color: '#888', fontSize: 12 }
});