import React, { useEffect, useRef, useState } from "react";
import { View, ActivityIndicator, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import * as FileSystem from "expo-file-system/legacy";

const HTML = `
<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<script type="module" src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js"></script>
<style>html,body{margin:0;height:100%;background:#111}model-viewer{width:100%;height:100%}</style>
</head><body>
<model-viewer id="mv" camera-controls auto-rotate shadow-intensity="1"></model-viewer>
<script>
function send(type, msg){ window.ReactNativeWebView.postMessage(JSON.stringify({type:type,msg:String(msg)})); }
var mv = document.getElementById("mv");
mv.addEventListener("load", function(){ send("log","MODEL LOADED OK"); });
mv.addEventListener("error", function(e){ send("error","model-viewer error: "+JSON.stringify(e.detail||{})); });
function loadGlb(b64){
  try {
    var bin = atob(b64), n = bin.length, bytes = new Uint8Array(n);
    for (var i = 0; i < n; i++) bytes[i] = bin.charCodeAt(i);
    var blob = new Blob([bytes], { type: "model/gltf-binary" });
    mv.setAttribute("src", URL.createObjectURL(blob));
    send("log","src set, bytes="+n);
  } catch(e){ send("error","loadGlb failed: "+e.message); }
}
window.onerror = function(m){ send("error","JS error: "+m); };
</script>
</body></html>`;

export default function ModelViewerScreen({ route, navigation }) {
  const { localUri, modelName } = route.params || {};
  const webRef = useRef(null);
  const injected = useRef(false);
  const [b64, setB64] = useState(null);
  const [error, setError] = useState(null);

  const handleBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.replace("Onboarding");
  };

  useEffect(() => {
    (async () => {
      try {
        if (!localUri) throw new Error("localUri param nahi mila (navigation params check karo).");
        const info = await FileSystem.getInfoAsync(localUri);
        console.log("[Viewer] exists:", info.exists, "size KB:", Math.round((info.size || 0) / 1024));
        if (!info.exists) throw new Error("GLB file local storage mein nahi mili.");
        const data = await FileSystem.readAsStringAsync(localUri, { encoding: "base64" });
        setB64(data);
      } catch (e) {
        console.error("[Viewer] error", e);
        setError(e.message);
      }
    })();
  }, [localUri]);

  // Back button har state (error / loading / viewer) mein dikhega
  const BackButton = (
    <SafeAreaView style={styles.backWrapper} edges={["top"]} pointerEvents="box-none">
      <View style={styles.topRow}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={22} color="#111" />
        </TouchableOpacity>
        {!!modelName && (
          <View style={styles.titlePill}>
            <Ionicons name="cube-outline" size={14} color="#00A3FF" />
            <Text style={styles.titleText} numberOfLines={1}>{modelName}</Text>
          </View>
        )}
        <View style={{ width: 40 }} />
      </View>
    </SafeAreaView>
  );

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        {BackButton}
      </View>
    );
  }

  if (!b64) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#00A3FF" />
        {BackButton}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webRef}
        originWhitelist={["*"]}
        source={{ html: HTML }}
        javaScriptEnabled
        style={styles.webview}
        onLoadEnd={() => {
          if (injected.current) return;
          injected.current = true;
          webRef.current?.injectJavaScript(`loadGlb("${b64}"); true;`);
        }}
        onMessage={(e) => {
          const { type, msg } = JSON.parse(e.nativeEvent.data);
          console.log(`[Viewer] ${type}: ${msg}`);
        }}
        onError={(e) => console.error("[Viewer] WebView error:", e.nativeEvent.description)}
        onHttpError={(e) => console.error("[Viewer] HTTP error:", e.nativeEvent.statusCode)}
      />
      {BackButton}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#111" },
  center: { justifyContent: "center", alignItems: "center" },
  webview: { flex: 1, backgroundColor: "#111" },
  errorText: { color: "red", padding: 20, paddingTop: 100 },
  backWrapper: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 10, paddingHorizontal: 20, paddingTop: 10 },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  titlePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    maxWidth: "60%",
    backgroundColor: "rgba(255,255,255,0.92)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  titleText: { fontSize: 13, fontWeight: "700", color: "#111" },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
});
