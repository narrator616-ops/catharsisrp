
import React, { useState, useEffect } from 'react';
import MapView from './components/MapView';
import AdminPanel from './components/AdminPanel';
import LocationModal from './components/LocationModal';
import LoginModal from './components/LoginModal';
import { Icons } from './components/UI';
import { loadMapData, saveMapData } from './services/storage';
import { MapData, LocationMarker } from './types';

// Simple UUID polyfill since we can't easily npm install uuid in this context without specific instruction
const generateId = () => Math.random().toString(36).substr(2, 9) + Date.now().toString(36);

const App: React.FC = () => {
  const [mapData, setMapData] = useState<MapData>({ backgroundImage: null, markers: [] });
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<LocationMarker | null>(null);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [pendingCoords, setPendingCoords] = useState<{x: number, y: number} | null>(null);
  
  // Login Modal State
  const [isLoginModalOpen, setLoginModalOpen] = useState(false);

  // Load data on mount
  useEffect(() => {
    const data = loadMapData();
    if (data) setMapData(data);
  }, []);

  // Save data on change
  useEffect(() => {
    if (mapData.backgroundImage) {
      saveMapData(mapData);
    }
  }, [mapData]);

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

  const handleUploadMap = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setMapData(prev => ({ ...prev, backgroundImage: e.target!.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveLocation = (markerData: Omit<LocationMarker, 'id'>) => {
    const newMarker: LocationMarker = {
      ...markerData,
      id: generateId()
    };
    setMapData(prev => ({
      ...prev,
      markers: [...prev.markers, newMarker]
    }));
    setPendingCoords(null);
  };

  const handleDeleteLocation = (id: string) => {
    if (window.confirm("Вы уверены, что хотите удалить эту локацию?")) {
      setMapData(prev => ({
        ...prev,
        markers: prev.markers.filter(m => m.id !== id)
      }));
      setSelectedMarker(null);
    }
  };

  const handleAdminToggle = () => {
    if (isAdmin) {
      // If already admin, just toggle the sidebar visibility
      setSidebarOpen(!isSidebarOpen);
    } else {
      // Open custom login modal
      setLoginModalOpen(true);
    }
  };

  const handleLoginSubmit = (password: string) => {
    if (password === "adm089") {
      setIsAdmin(true);
      setSidebarOpen(true);
      setLoginModalOpen(false);
    } else {
      // Simple error handling: alert for now, or we could pass error state down to modal if we lifted state up more
      alert("Неверный пароль!"); 
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    setSidebarOpen(false);
    setPendingCoords(null);
  };

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
