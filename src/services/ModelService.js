// services/ModelService.js
import * as FileSystem from "expo-file-system/legacy";
import * as ImageManipulator from "expo-image-manipulator";

const BASE_URL = "https://api.meshy.ai/openapi/v1/image-to-3d";
const API_KEY = process.env.EXPO_PUBLIC_MESHY_KEY;

const BACKEND_URL = 'http://192.168.1.12:5000/api';

const POLL_INTERVAL_MS = 3000;
const MAX_POLLS = 200;

const MODELS_DIR = FileSystem.documentDirectory + "models/";
const INDEX_PATH = MODELS_DIR + "index.json";

const DEBUG = true;
const log = (...args) => DEBUG && console.log("[ModelService]", ...args);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const authHeaders = () => ({
    Authorization: `Bearer ${API_KEY}`,
    "Content-Type": "application/json",
});

const ensureDir = () =>
    FileSystem.makeDirectoryAsync(MODELS_DIR, { intermediates: true }).catch(() => {});

const glbPath = (taskId) => `${MODELS_DIR}${taskId}.glb`;

const hasValidFile = async (uri) => {
    const info = await FileSystem.getInfoAsync(uri);
    return info.exists && (info.size || 0) > 0;
};

const readIndex = async () => {
    try {
        return JSON.parse(await FileSystem.readAsStringAsync(INDEX_PATH));
    } catch {
        return {};
    }
};

const writeIndex = async (index) => {
    await ensureDir();
    await FileSystem.writeAsStringAsync(INDEX_PATH, JSON.stringify(index));
};

const toDataUri = async (uri) => {
    const img = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1024 } }],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG, base64: true }
    );
    return `data:image/jpeg;base64,${img.base64}`;
};

const createTask = async (imageDataUri) => {
    log("Creating task (credits will be used)...");
    const res = await fetch(BASE_URL, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ image_url: imageDataUri }),
    });

    const text = await res.text();
    if (!res.ok) throw new Error(`Meshy create failed (${res.status}): ${text}`);

    const data = JSON.parse(text);
    if (!data.result) throw new Error("Meshy did not return a task id.");
    return data.result;
};

const getTask = async (taskId) => {
    const res = await fetch(`${BASE_URL}/${taskId}`, { headers: authHeaders() });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Meshy status failed (${res.status}): ${text}`);
    }
    return res.json();
};

const downloadGlb = async (url, taskId) => {
    await ensureDir();
    const localUri = glbPath(taskId);

    if (await hasValidFile(localUri)) {
        log("GLB already on device, skipping download:", localUri);
        return localUri;
    }

    log("Downloading GLB to:", localUri);
    const { uri, status } = await FileSystem.downloadAsync(url, localUri);

    if (status !== 200 || !(await hasValidFile(uri))) {
        await FileSystem.deleteAsync(uri, { idempotent: true });
        throw new Error(`GLB download failed (status ${status})`);
    }
    return uri;
};

export class ModelService {
    static async generate3DModel(imageUri, setStatusText) {
        try {
            if (!API_KEY) {
                throw new Error("EXPO_PUBLIC_MESHY_KEY nahi mili. .env check karo.");
            }

            const index = await readIndex();
            let taskId = index[imageUri]?.taskId;

            // 1) Cache Hit: Agar file pehle se local mein mojood hai toh API hit nahi hogi!
            if (taskId && (await hasValidFile(glbPath(taskId)))) {
                log("Cache hit, no API call required:", taskId);
                return { taskId, localUri: glbPath(taskId), fromCache: true };
            }

            // 2) Resume task agar pehle create ho chuka hai lekin download nahi hua
            if (taskId) {
                log("Resuming existing task, no new credits used:", taskId);
            } else {
                setStatusText?.("Preparing image...");
                const dataUri = await toDataUri(imageUri);

                setStatusText?.("Uploading image...");
                taskId = await createTask(dataUri);

                index[imageUri] = { taskId };
                await writeIndex(index);
            }

            setStatusText?.("Generating 3D model (~1-2 mins)...");

            for (let i = 0; i < MAX_POLLS; i++) {
                const task = await getTask(taskId);
                log("Poll", i, "| status:", task.status, "| progress:", task.progress);

                if (task.status === "SUCCEEDED") {
                    const glbUrl = task.model_urls?.glb;
                    if (!glbUrl) throw new Error("Generation finished, but no GLB URL found.");

                    setStatusText?.("Downloading model...");
                    const localUri = await downloadGlb(glbUrl, taskId);
                    return { taskId, localUri, thumbnail: task.thumbnail_url };
                }

                if (task.status === "FAILED" || task.status === "CANCELED") {
                    const latest = await readIndex();
                    delete latest[imageUri];
                    await writeIndex(latest);
                    throw new Error(task.task_error?.message || `Task ${task.status}`);
                }

                setStatusText?.(`Generating 3D model... ${task.progress ?? 0}%`);
                await sleep(POLL_INTERVAL_MS);
            }

            throw new Error("Generation timed out.");
        } catch (error) {
            console.error("[ModelService] Error:", error?.message);
            throw error;
        }
    }

    static async getLastSavedModel() {
        const files = await FileSystem.readDirectoryAsync(MODELS_DIR).catch(() => []);
        let best = null;
        for (const f of files.filter((name) => name.endsWith(".glb"))) {
            const info = await FileSystem.getInfoAsync(MODELS_DIR + f);
            const t = info.modificationTime || 0;
            if (!best || t > best.t) best = { uri: info.uri, t };
        }
        return best?.uri || null;
    }


    // 1. Model ka name backend (MongoDB) aur local storage dono par save karne ke liye
    static async saveModelName(taskId, customName) {
        try {
            // Local storage index update karein (agar aapka pehle se hai)
            console.log('[ModelService] Saving name locally & to backend...');

            // MongoDB backend par POST request bhejna
            const response = await fetch(`${BACKEND_URL}/models`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    taskId: taskId,
                    name: customName
                })
            });

            const result = await response.json();
            console.log('[ModelService] Backend save response:', result);
            return result;
        } catch (error) {
            console.error('[ModelService] Error saving to backend:', error);
            throw error;
        }
    }

    // 2. MongoDB backend se saare saved models fetch karne ke liye
    static async fetchModelsFromBackend() {
        try {
            const response = await fetch(`${BACKEND_URL}/models`);
            const models = await response.json();
            return models; // [{ taskId, name, createdAt }, ...]
        } catch (error) {
            console.error('[ModelService] Error fetching from backend:', error);
            return [];
        }
    }

    // Saare models ka index read karne ke liye (ModelList mein use hoga)
    static async getIndexData() {
        return await readIndex();
    }
}