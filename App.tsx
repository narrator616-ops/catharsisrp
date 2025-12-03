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
  uploadFileToStorage 
} from './services/storage';
import { MapData, LocationMarker } from './types';

// Simple UUID generator
const generateId = () => Math.random().toString(36).substr(2, 9) + Date.now().toString(36);

const App: React.FC = () => {
  const [mapData, setMapData] = useState<MapData>({ backgroundImage: null, markers: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<LocationMarker | null>(null);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [pendingCoords, setPendingCoords] = useState<{x: number, y: number} | null>(null);
  
  // Login Modal State
  const [isLoginModalOpen, setLoginModalOpen] = useState(false);

  // Subscribe to Firebase Data
  useEffect(() => {
    const unsubscribe = subscribeToMapData((data) => {
      setMapData(data);
      setIsLoading(false);
    });

    return () => unsubscribe();
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
    try {
      setIsLoading(true);
      const url = await uploadFileToStorage(file, 'maps');
      await updateMapBackgroundInDb(url);
    } catch (e) {
      alert("Ошибка загрузки карты. Проверьте настройки Firebase.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveLocation = async (markerData: Omit<LocationMarker, 'id'>) => {
    if (!isAdmin) return;
    
    // Optimistic UI update could be done here, but we'll rely on the subscription
    const newMarker: LocationMarker = {
      ...markerData,
      id: generateId()
    };

    try {
      await addMarkerToDb(newMarker);
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
        await removeMarkerFromDb(id);
        setSelectedMarker(null);
      } catch (e) {
        alert("Ошибка удаления.");
      }
    }
  };

  // Helper passed to AdminPanel to handle image uploads to cloud
  const handleImageUpload = async (file: File, folder: string): Promise<string> => {
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