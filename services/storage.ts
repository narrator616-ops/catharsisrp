import { db, storage } from './firebase';
import { doc, onSnapshot, setDoc, updateDoc, arrayUnion, getDoc, Firestore } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, FirebaseStorage } from 'firebase/storage';
import { MapData, LocationMarker, STORAGE_KEY } from '../types';

const MAP_DOC_ID = 'main_rpg_map';
const COLLECTION_NAME = 'maps';

// -- Local Storage Operations (Offline Mode) --

export const getMapFromLocalStorage = (): MapData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as MapData;
    }
  } catch (e) {
    console.error("Failed to parse local storage", e);
  }
  return { backgroundImage: null, markers: [] };
};

export const saveMapToLocalStorage = (data: MapData) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save to local storage", e);
    alert("Ошибка сохранения: возможно, файл слишком большой для локального хранилища.");
  }
};

export const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};


// -- Database Operations --

// Subscribe to real-time updates
export const subscribeToMapData = (callback: (data: MapData) => void, onError?: (error: any) => void) => {
  // Guard clause: If db failed to initialize (e.g. invalid config), return early error
  if (!db) {
    if (onError) onError(new Error("Database not initialized"));
    return () => {}; // Return empty unsubscribe function
  }

  // Cast db to Firestore to satisfy TypeScript. 
  const docRef = doc(db as Firestore, COLLECTION_NAME, MAP_DOC_ID);
  
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data() as MapData);
    } else {
      // Create initial document if it doesn't exist
      const initialData: MapData = { backgroundImage: null, markers: [] };
      setDoc(docRef, initialData).catch(err => {
         if (onError) onError(err);
      });
      callback(initialData);
    }
  }, (error) => {
    console.error("Error fetching map data:", error);
    if (onError) onError(error);
  });
};

// Add a new marker
export const addMarkerToDb = async (marker: LocationMarker) => {
  if (!db) throw new Error("Database not initialized");
  const docRef = doc(db as Firestore, COLLECTION_NAME, MAP_DOC_ID);
  await updateDoc(docRef, {
    markers: arrayUnion(marker)
  });
};

// Remove a marker
export const removeMarkerFromDb = async (markerId: string) => {
  if (!db) throw new Error("Database not initialized");
  const docRef = doc(db as Firestore, COLLECTION_NAME, MAP_DOC_ID);
  // Firestore arrayRemove requires the exact object value, which is hard to track.
  // Instead, we read, filter, and write back. Safe for low concurrency.
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    const data = snap.data() as MapData;
    const updatedMarkers = data.markers.filter(m => m.id !== markerId);
    await updateDoc(docRef, { markers: updatedMarkers });
  }
};

// Update background map
export const updateMapBackgroundInDb = async (url: string) => {
  if (!db) throw new Error("Database not initialized");
  const docRef = doc(db as Firestore, COLLECTION_NAME, MAP_DOC_ID);
  await setDoc(docRef, { backgroundImage: url }, { merge: true });
};

// -- Storage Operations --

// Upload a file to Firebase Storage and return the URL
export const uploadFileToStorage = async (file: File, path: string): Promise<string> => {
  if (!storage) throw new Error("Storage not initialized");
  try {
    const storageRef = ref(storage as FirebaseStorage, `${path}/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};