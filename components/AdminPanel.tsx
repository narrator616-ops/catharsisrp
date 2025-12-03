import React, { useState } from 'react';
import { Button, Input, TextArea, Icons } from './UI';
import { LocationMarker } from '../types';
import { generateLocationLore } from '../services/geminiService';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  onUploadMap: (file: File) => void;
  onUploadImage: (file: File, folder: string) => Promise<string>;
  pendingCoordinates: { x: number; y: number } | null;
  onSaveLocation: (marker: Omit<LocationMarker, 'id'>) => void;
  onCancelLocation: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ 
  isOpen, 
  onClose, 
  onLogout,
  onUploadMap,
  onUploadImage,
  pendingCoordinates,
  onSaveLocation,
  onCancelLocation
}) => {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [type, setType] = useState<LocationMarker['type']>('landmark');
  const [imageUrl, setImageUrl] = useState('');
  const [markerImageUrl, setMarkerImageUrl] = useState('');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploadingToken, setIsUploadingToken] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // File handler for map background
  const handleMapFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUploadMap(e.target.files[0]);
    }
  };

  // Helper for image uploads to Cloud
  const handleTokenUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
       setIsUploadingToken(true);
       try {
         const url = await onUploadImage(e.target.files[0], 'tokens');
         setMarkerImageUrl(url);
       } catch (err) {
         alert("Ошибка загрузки токена");
       } finally {
         setIsUploadingToken(false);
       }
    }
  };

  const handleContentImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
       setIsUploadingImage(true);
       try {
         const url = await onUploadImage(e.target.files[0], 'locations');
         setImageUrl(url);
       } catch (err) {
         alert("Ошибка загрузки фото");
       } finally {
         setIsUploadingImage(false);
       }
    }
  };

  const handleGenerateLore = async () => {
    if (!name) {
      alert("Сначала введите название локации!");
      return;
    }
    setIsGenerating(true);
    const lore = await generateLocationLore(name, type);
    setDesc(lore);
    setIsGenerating(false);
  };

  const handleSubmit = () => {
    if (pendingCoordinates && name && desc) {
      onSaveLocation({
        x: pendingCoordinates.x,
        y: pendingCoordinates.y,
        title: name,
        description: desc,
        type,
        image: imageUrl,
        markerImage: markerImageUrl
      });
      // Reset form
      setName('');
      setDesc('');
      setImageUrl('');
      setMarkerImageUrl('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-x-0 bottom-0 top-auto md:top-0 md:left-auto md:bottom-0 md:right-0 w-full md:w-96 bg-rpg-panel border-t md:border-l md:border-t-0 border-rpg-accent shadow-2xl z-30 overflow-y-auto flex flex-col p-6 transition-transform max-h-[80vh] md:max-h-screen">
      <div className="flex justify-between items-center mb-6 border-b border-rpg-border pb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-display text-rpg-accent">Панель Мастера</h2>
          <button 
            onClick={onLogout}
            className="text-[10px] uppercase font-bold tracking-widest text-red-400 border border-red-900/50 bg-red-900/20 px-2 py-1 rounded hover:bg-red-900/40 transition-colors"
          >
            Выход
          </button>
        </div>
        <button onClick={onClose} className="text-rpg-muted hover:text-white"><Icons.Close /></button>
      </div>

      <div className="space-y-8 flex-1">
        
        {/* Map Management Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-rpg-muted uppercase tracking-wider">Карта мира</h3>
          <div className="border border-dashed border-rpg-border rounded-lg p-4 hover:bg-black/20 transition-colors text-center cursor-pointer relative">
            <input type="file" accept="image/*" onChange={handleMapFile} className="absolute inset-0 opacity-0 cursor-pointer" />
            <div className="flex flex-col items-center gap-2 text-rpg-text">
              <Icons.Upload />
              <span className="text-sm">Загрузить карту</span>
            </div>
          </div>
        </div>

        {/* New Location Form (Only shows if coordinates selected) */}
        {pendingCoordinates ? (
           <div className="space-y-4 bg-black/20 p-4 rounded border border-rpg-accent animate-fade-in">
             <div className="flex justify-between items-center">
               <h3 className="text-sm font-bold text-rpg-accent uppercase">Новая точка</h3>
               <span className="text-xs text-rpg-muted">({Math.round(pendingCoordinates.x)}%, {Math.round(pendingCoordinates.y)}%)</span>
             </div>
             
             <Input 
                placeholder="Название локации" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                label="Название"
             />

             <div>
                <label className="text-rpg-muted text-xs uppercase tracking-wider block mb-1">Тип (для иконки)</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['city', 'dungeon', 'shop', 'landmark'] as const).map(t => (
                    <button 
                      key={t}
                      onClick={() => setType(t)}
                      className={`p-2 rounded border text-xs capitalize ${type === t ? 'bg-rpg-accent text-black border-rpg-accent' : 'border-rpg-border text-rpg-muted hover:border-white'}`}
                    >
                      {t === 'city' ? 'Город' : t === 'dungeon' ? 'Данж' : t === 'shop' ? 'Торг' : 'Место'}
                    </button>
                  ))}
                </div>
             </div>

             <div className="relative">
               <TextArea 
                  placeholder="Описание локации..." 
                  value={desc} 
                  onChange={e => setDesc(e.target.value)} 
                  label="Описание"
               />
               <button 
                  onClick={handleGenerateLore}
                  disabled={isGenerating}
                  className="absolute top-0 right-0 text-xs text-rpg-accent hover:text-white flex items-center gap-1 mt-1"
               >
                 <Icons.Sparkles /> {isGenerating ? 'Думаю...' : 'AI Описание'}
               </button>
             </div>

             {/* Marker Image Upload */}
             <div className="space-y-1">
                <label className="text-rpg-muted text-xs uppercase tracking-wider">Фото Маркера (Круглое)</label>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full border border-rpg-border overflow-hidden bg-black/50 shrink-0 relative">
                    {isUploadingToken ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50"><div className="w-4 h-4 border-2 border-rpg-accent border-t-transparent rounded-full animate-spin"></div></div>
                    ) : markerImageUrl ? (
                      <img src={markerImageUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-rpg-muted">?</div>
                    )}
                  </div>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleTokenUpload} 
                    className="text-xs text-rpg-muted file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-rpg-panel file:text-rpg-text hover:file:bg-rpg-accent hover:file:text-black w-full"
                  />
                </div>
             </div>

             {/* Main Image Upload */}
             <div className="space-y-1">
                <label className="text-rpg-muted text-xs uppercase tracking-wider">Фото Внутри (Контент)</label>
                 <div className="relative">
                    {isUploadingImage && (
                        <div className="absolute -top-6 right-0 text-xs text-rpg-accent animate-pulse">Загрузка...</div>
                    )}
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleContentImageUpload} 
                      className="text-xs text-rpg-muted file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-rpg-panel file:text-rpg-text hover:file:bg-rpg-accent hover:file:text-black w-full"
                    />
                 </div>
             </div>

             <div className="flex gap-2 pt-2">
               <Button onClick={handleSubmit} disabled={isUploadingToken || isUploadingImage} className="flex-1">Создать</Button>
               <Button onClick={onCancelLocation} variant="secondary" className="px-2"><Icons.Trash /></Button>
             </div>
           </div>
        ) : (
          <div className="bg-rpg-dark/50 p-4 rounded border border-rpg-border text-center text-sm text-rpg-muted">
            <p className="mb-2"><Icons.Map /></p>
            <p>Нажми на карту, чтобы добавить новую метку.</p>
          </div>
        )}

      </div>
      
      <div className="mt-8 pt-4 border-t border-rpg-border text-center">
        <p className="text-xs text-rpg-muted font-serif italic">"Путешествие в тысячу ли начинается с первого шага."</p>
      </div>
    </div>
  );
};

export default AdminPanel;