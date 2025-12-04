import React, { useState, useEffect } from 'react';
import MapView from './components/MapView';
import AdminPanel from './components/AdminPanel';
import LocationModal from './components/LocationModal';
import LoginModal from './components/LoginModal';
import { Icons } from './components/UI';
import { 
  subscribeToMapData, 
  addMarkerToDb, 
  removeMarkerFromDb, 
  updateMapBackgroundInDb, 
  uploadFileToStorage,
  getMapFromLocalStorage,
  saveMapToLocalStorage,
  fileToDataUrl
} from './services/storage';
import { isFirebaseConfigured } from './services/firebase';
import { MapData, LocationMarker } from './types';

// Simple UUID generator
const generateId = () => Math.random().toString(36).substr(2, 9) + Date.now().toString(36);

const App: React.FC = () => {
  const [mapData, setMapData] = useState<MapData>({ backgroundImage: null, markers: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<LocationMarker | null>(null);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [pendingCoords, setPendingCoords] = useState<{x: number, y: number} | null>(null);
  
  // Login Modal State
  const [isLoginModalOpen, setLoginModalOpen] = useState(false);

  // Subscribe to Firebase Data with Offline Fallback
  useEffect(() => {
    console.log("App mounted, initializing...");
    let isMounted = true;
    let unsubscribe: () => void = () => {};

    // Таймер: если Firebase не отвечает за 3 секунды, переходим в оффлайн
    const timeoutTimer = setTimeout(() => {
      if (isMounted && isLoading) {
         console.warn("Connection timeout. Switching to Offline Mode.");
         setOfflineMode(true);
         setMapData(getMapFromLocalStorage());
         setIsLoading(false);
      }
    }, 3000);

    if (isFirebaseConfigured) {
      try {
        unsubscribe = subscribeToMapData(
          (data) => {
            if (!isMounted) return;
            console.log("Data received from Firebase");
            clearTimeout(timeoutTimer);
            setMapData(data);
            setIsLoading(false);
            setOfflineMode(false);
          },
          (error) => {
            console.warn("Firebase Subscription Failed:", error);
            // On error, we just let the timer switch us to offline, 
            // OR strictly switch now if timer hasn't fired.
          }
        );
      } catch (e) {
        console.error("Subscription setup failed:", e);
      }
    } else {
      // No config -> Immediate offline mode
      clearTimeout(timeoutTimer);
      setOfflineMode(true);
      setMapData(getMapFromLocalStorage());
      setIsLoading(false);
    }

    return () => {
      isMounted = false;
      clearTimeout(timeoutTimer);
      unsubscribe();
    };
  }, []);

  const handleMarkerClick = (marker: LocationMarker) => {
    setPendingCoords(null);
    setSelectedMarker(marker);
  };

  const handleMapClick = (x: number, y: number) => {
    if (isAdmin) {
      setPendingCoords({ x, y });
      setSidebarOpen(true);
    }
  };

  const handleUploadMap = async (file: File) => {
    if (!isAdmin) return;
    setIsLoading(true);
    try {
      if (offlineMode) {
        // Offline: Convert to Base64 and save locally
        const url = await fileToDataUrl(file);
        const newData = { ...mapData, backgroundImage: url };
        setMapData(newData);
        saveMapToLocalStorage(newData);
      } else {
        // Online: Upload to Storage
        const url = await uploadFileToStorage(file, 'maps');
        await updateMapBackgroundInDb(url);
      }
    } catch (e: any) {
      console.error(e);
      alert("Ошибка загрузки карты.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveLocation = async (markerData: Omit<LocationMarker, 'id'>) => {
    if (!isAdmin) return;
    
    const newMarker: LocationMarker = {
      ...markerData,
      id: generateId()
    };

    try {
      if (offlineMode) {
        const newData = {
           ...mapData,
           markers: [...mapData.markers, newMarker]
        };
        setMapData(newData);
        saveMapToLocalStorage(newData);
      } else {
        await addMarkerToDb(newMarker);
      }
      setPendingCoords(null);
    } catch (e) {
      console.error(e);
      alert("Ошибка сохранения метки.");
    }
  };

  const handleDeleteLocation = async (id: string) => {
    if (!isAdmin) return;
    if (window.confirm("Вы уверены, что хотите удалить эту локацию?")) {
      try {
        if (offlineMode) {
          const newData = {
            ...mapData,
            markers: mapData.markers.filter(m => m.id !== id)
          };
          setMapData(newData);
          saveMapToLocalStorage(newData);
        } else {
          await removeMarkerFromDb(id);
        }
        setSelectedMarker(null);
      } catch (e) {
        alert("Ошибка удаления.");
      }
    }
  };

  const handleImageUpload = async (file: File, folder: string): Promise<string> => {
    if (offlineMode) {
       return await fileToDataUrl(file);
    }
    return await uploadFileToStorage(file, folder);
  };

  const handleAdminToggle = () => {
    if (isAdmin) {
      setSidebarOpen(!isSidebarOpen);
    } else {
      setLoginModalOpen(true);
    }
  };

  const handleLoginSubmit = (password: string) => {
    if (password === "adm089") {
      setIsAdmin(true);
      setSidebarOpen(true);
      setLoginModalOpen(false);
    } else {
      alert("Неверный пароль!"); 
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    setSidebarOpen(false);
    setPendingCoords(null);
  };

  if (isLoading) {
    return (
      <div className="w-full h-screen bg-rpg-dark flex items-center justify-center flex-col gap-4">
        <div className="w-12 h-12 border-4 border-rpg-accent border-t-transparent rounded-full animate-spin"></div>
        <p className="text-rpg-accent font-display animate-pulse">Загрузка мира...</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-rpg-dark overflow-hidden flex flex-col md:flex-row">
      
      {/* Mobile Top Bar */}
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-20 pointer-events-none">
         <h1 className="font-display text-2xl text-rpg-accent drop-shadow-lg pointer-events-auto select-none bg-black/50 px-3 py-1 rounded backdrop-blur-sm">
           RPG World
         </h1>
         <div className="pointer-events-auto">
           <button 
             onClick={handleAdminToggle}
             className={`p-2 rounded-full shadow-lg border transition-all ${isAdmin ? 'bg-rpg-accent text-rpg-dark border-white' : 'bg-rpg-panel text-rpg-muted border-rpg-border'}`}
           >
             <Icons.Edit />
           </button>
         </div>
      </div>

      {/* Offline Indicator */}
      {offlineMode && (
         <div className="absolute bottom-12 md:bottom-4 left-1/2 -translate-x-1/2 z-30 bg-amber-900/80 text-amber-200 px-4 py-1 rounded-full text-xs border border-amber-700 pointer-events-none backdrop-blur-sm animate-fade-in">
           Оффлайн режим • Данные сохраняются локально
         </div>
      )}

      {/* Main Map Area */}
      <main className="flex-1 relative h-full">
        <MapView 
          mapData={mapData}
          isAdmin={isAdmin}
          onMarkerClick={handleMarkerClick}
          onMapClick={handleMapClick}
        />
      </main>

      {/* Admin Sidebar / Drawer */}
      <AdminPanel 
        isOpen={isAdmin && isSidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
        onUploadMap={handleUploadMap}
        onUploadImage={handleImageUpload} 
        pendingCoordinates={pendingCoords}
        onSaveLocation={handleSaveLocation}
        onCancelLocation={() => setPendingCoords(null)}
      />

      {/* View Modal */}
      <LocationModal 
        marker={selectedMarker}
        onClose={() => setSelectedMarker(null)}
        isAdmin={isAdmin}
        onDelete={handleDeleteLocation}
      />

      {/* Login Modal */}
      <LoginModal 
        isOpen={isLoginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onLogin={handleLoginSubmit}
      />

    </div>
  );
};

export default App;