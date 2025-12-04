import React, { useState, useEffect, useRef } from 'react';
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
  const [connectionError, setConnectionError] = useState(false);
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
    console.log("App mounted, initializing Firebase subscription...");
    let isMounted = true;
    let unsubscribe: () => void = () => {};

    if (!isFirebaseConfigured) return;

    // Таймер безопасности: если данные не пришли через 4 секунды, показываем ошибку
    const timeoutTimer = setTimeout(() => {
      if (isMounted) {
        setIsLoading((prevLoading) => {
          if (prevLoading) {
             console.warn("Connection timeout reached. Showing error screen.");
             setConnectionError(true);
             return false;
          }
          return prevLoading;
        });
      }
    }, 4000);

    try {
      unsubscribe = subscribeToMapData(
        (data) => {
          if (!isMounted) return;
          console.log("Data received from Firebase");
          clearTimeout(timeoutTimer); // Отменяем таймер ошибки при успехе
          setMapData(data);
          setIsLoading(false);
          setConnectionError(false);
          setPermissionError(false);
        },
        (error) => {
          if (!isMounted) return;
          clearTimeout(timeoutTimer);
          console.error("Firebase Error in App.tsx:", error);
          
          if (error?.code === 'permission-denied' || error?.message?.includes('Missing or insufficient permissions')) {
            setPermissionError(true);
            setIsLoading(false);
          } else {
            setConnectionError(true);
            setIsLoading(false);
          }
        }
      );
    } catch (e) {
      console.error("Subscription failed synchronous:", e);
      setConnectionError(true);
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

  // Экран ошибки прав доступа
  if (permissionError) {
    return (
      <div className="w-full h-screen bg-rpg-dark flex items-center justify-center p-4">
        <div className="max-w-2xl bg-rpg-panel border-2 border-rpg-accent p-8 rounded-lg shadow-2xl text-center">
          <h1 className="text-2xl font-display text-rpg-accent mb-4">Ошибка Доступа</h1>
          <p className="text-rpg-text mb-6">
            База данных заблокирована настройками приватности.
          </p>
          <div className="text-left space-y-4 text-sm text-rpg-muted">
             <p>1. Перейдите в <a href="https://console.firebase.google.com/" target="_blank" className="text-blue-400 underline" rel="noreferrer">Firebase Console</a> → <b>Firestore Database</b> → <b>Rules</b>.</p>
             <p>2. Вставьте этот код (разрешает доступ всем):</p>
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
          </div>
          <button onClick={() => window.location.reload()} className="mt-8 bg-rpg-accent text-black font-bold py-2 px-6 rounded hover:bg-amber-600">
            Готово, обновить
          </button>
        </div>
      </div>
    );
  }

  // Экран ошибки подключения (Тайм-аут)
  if (connectionError) {
    return (
      <div className="w-full h-screen bg-rpg-dark flex items-center justify-center p-4">
        <div className="max-w-xl bg-rpg-panel border-2 border-red-800 p-8 rounded-lg shadow-2xl text-center">
          <div className="text-red-500 mb-4 flex justify-center text-4xl">⚠️</div>
          <h1 className="text-2xl font-display text-white mb-4">Ошибка Подключения</h1>
          <p className="text-rpg-text mb-6">
            Сайт не может получить данные от Firebase. 
            <br/><span className="text-rpg-muted text-sm">Время ожидания истекло.</span>
          </p>
          
          <div className="bg-black/30 p-4 rounded text-left text-sm text-rpg-muted border border-rpg-border">
            <p className="font-bold text-white mb-2">Возможные причины:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <b>База данных не создана:</b> Зайдите в Firebase Console → раздел <b>Firestore Database</b> и нажмите кнопку "Create Database".
              </li>
              <li>
                <b>Правила доступа:</b> Убедитесь, что Rules в Firestore разрешают чтение.
              </li>
              <li>
                <b>Сетевой экран/VPN:</b> Попробуйте отключить VPN.
              </li>
            </ul>
          </div>

          <button onClick={() => window.location.reload()} className="mt-6 bg-rpg-panel border border-rpg-border text-white py-2 px-6 rounded hover:bg-rpg-accent hover:text-black transition-colors">
            Попробовать снова
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
        <p className="text-xs text-rpg-muted">Ожидание ответа от базы данных...</p>
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