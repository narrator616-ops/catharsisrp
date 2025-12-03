
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
import { isFirebaseConfigured } from './services/firebase';
import { MapData, LocationMarker } from './types';

// Simple UUID generator
const generateId = () => Math.random().toString(36).substr(2, 9) + Date.now().toString(36);

const App: React.FC = () => {
  const [mapData, setMapData] = useState<MapData>({ backgroundImage: null, markers: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [permissionError, setPermissionError] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<LocationMarker | null>(null);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [pendingCoords, setPendingCoords] = useState<{x: number, y: number} | null>(null);
  
  // Login Modal State
  const [isLoginModalOpen, setLoginModalOpen] = useState(false);

  // Check configuration
  if (!isFirebaseConfigured) {
    return (
      <div className="w-full h-screen bg-rpg-dark flex items-center justify-center p-4">
        <div className="max-w-xl bg-rpg-panel border-2 border-red-800 p-8 rounded-lg shadow-2xl text-center">
          <div className="text-red-500 mb-4 flex justify-center"><Icons.Trash /></div>
          <h1 className="text-2xl font-display text-red-400 mb-4">Configuration Missing</h1>
          <p className="text-rpg-text mb-6">
            The application cannot connect to the database because the API keys are missing.
          </p>
          <div className="bg-black/40 p-4 rounded text-left text-xs font-mono text-rpg-muted mb-6 overflow-x-auto">
            <p className="mb-2 text-white">Edit <span className="text-yellow-400">services/firebase.ts</span> and add your keys.</p>
          </div>
        </div>
      </div>
    );
  }

  // Subscribe to Firebase Data
  useEffect(() => {
    if (!isFirebaseConfigured) return;

    const unsubscribe = subscribeToMapData(
      (data) => {
        setMapData(data);
        setIsLoading(false);
        setPermissionError(false);
      },
      (error) => {
        // Check for permission denied error
        if (error?.code === 'permission-denied' || error?.message?.includes('Missing or insufficient permissions')) {
          setPermissionError(true);
          setIsLoading(false);
        }
      }
    );

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
    } catch (e: any) {
      console.error(e);
      if (e?.code === 'storage/unauthorized') {
        alert("Ошибка доступа к хранилищу. Проверьте вкладку Rules в Firebase Storage.");
      } else {
        alert("Ошибка загрузки карты.");
      }
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

  if (permissionError) {
    return (
      <div className="w-full h-screen bg-rpg-dark flex items-center justify-center p-4">
        <div className="max-w-2xl bg-rpg-panel border-2 border-rpg-accent p-8 rounded-lg shadow-2xl text-center">
          <h1 className="text-2xl font-display text-rpg-accent mb-4">Ошибка Доступа (Permissions Error)</h1>
          <p className="text-rpg-text mb-6">
            База данных заблокирована. Вам нужно разрешить доступ в настройках Firebase.
          </p>
          
          <div className="text-left space-y-4 text-sm text-rpg-muted">
             <p>1. Перейдите в <a href="https://console.firebase.google.com/" target="_blank" className="text-blue-400 underline">Firebase Console</a> → <b>Firestore Database</b> → <b>Rules</b>.</p>
             <p>2. Замените код правил на этот (разрешает чтение/запись всем):</p>
             <pre className="bg-black/50 p-3 rounded text-green-400 font-mono text-xs overflow-x-auto">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`}
             </pre>
             <p>3. Нажмите <b>Publish</b>.</p>
             <p>4. Сделайте то же самое для <b>Storage</b> → <b>Rules</b>:</p>
             <pre className="bg-black/50 p-3 rounded text-green-400 font-mono text-xs overflow-x-auto">
{`rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}`}
             </pre>
          </div>
          <button onClick={() => window.location.reload()} className="mt-8 bg-rpg-accent text-black font-bold py-2 px-6 rounded hover:bg-amber-600">
            Я исправил, обновить страницу
          </button>
        </div>
      </div>
    );
  }

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
