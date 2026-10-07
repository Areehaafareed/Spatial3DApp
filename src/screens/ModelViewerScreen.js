import React from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';

export default function ModelViewerScreen({ route, navigation }) {
    const { modelGlbUrl } = route.params || {};

    // HTML template jo 3D .glb file ko browser/webview mein 3D rotateable model ke taur par dikhaye
    const viewerHtml = `
      <!DOCTYPE html>
      <html>
        head>
          <script type="module" src="https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js"></script>
          <style>
            body { margin: 0; background-color: #f4f7fb; display: flex; justify-content: center; align-items: center; height: 100vh; }
            model-viewer { width: 100%; height: 100%; }
          </style>
        </head>
        <body>
          <model-viewer src="${modelGlbUrl}" alt="3D Scan" auto-rotate camera-controls></model-viewer>
        </body>
      </html>
    `;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#111" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Your 3D Model (.glb)</Text>
            </View>

            <View style={styles.viewerContainer}>
                {modelGlbUrl ? (
                    <WebView 
                        originWhitelist={['*']}
                        source={{ html: viewerHtml }} 
                        style={styles.webview} 
                    />
                ) : (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color="#00A3FF" />
                        <Text style={styles.loadingText}>Generating 3D Model from AI...</Text>
                    </View>
                )}
            </View>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.exportButton} onPress={() => alert("Model ready to download!")}>
                    <Text style={styles.exportButtonText}>Download .GLB File</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#EEE' },
    backBtn: { marginRight: 15 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111' },
    viewerContainer: { flex: 1, margin: 20, borderRadius: 20, overflow: 'hidden', backgroundColor: '#F4F7FB' },
    webview: { flex: 1, backgroundColor: 'transparent' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 10, color: '#666', fontSize: 14, fontWeight: '600' },
    footer: { padding: 20 },
    exportButton: { backgroundColor: '#00A3FF', height: 55, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
    exportButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});