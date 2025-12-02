import React from 'react';
import { LocationMarker } from '../types';
import { Button, Icons } from './UI';

interface LocationModalProps {
  marker: LocationMarker | null;
  onClose: () => void;
  isAdmin: boolean;
  onDelete: (id: string) => void;
}

const LocationModal: React.FC<LocationModalProps> = ({ marker, onClose, isAdmin, onDelete }) => {
  if (!marker) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div 
        className="w-full md:max-w-lg bg-rpg-panel border-t-2 md:border-2 border-rpg-accent shadow-2xl rounded-t-xl md:rounded-xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header Image */}
        <div className="relative h-48 bg-stone-900 shrink-0">
          {marker.image ? (
            <img src={marker.image} alt={marker.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-stone-800 to-stone-900">
               <span className="text-6xl opacity-20"><Icons.Map /></span>
            </div>
          )}
          <button 
            onClick={onClose}
            className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-white hover:bg-rpg-accent transition-colors"
          >
            <Icons.Close />
          </button>
          <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-rpg-panel to-transparent h-20"></div>
          <h2 className="absolute bottom-4 left-6 text-3xl font-display text-white drop-shadow-md">{marker.title}</h2>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          <div className="flex items-center gap-2 mb-4">
             <span className={`px-2 py-0.5 text-xs font-bold uppercase tracking-wider rounded border ${
               marker.type === 'dungeon' ? 'border-red-900 text-red-400 bg-red-900/20' : 
               marker.type === 'city' ? 'border-blue-900 text-blue-400 bg-blue-900/20' :
               marker.type === 'shop' ? 'border-yellow-900 text-yellow-400 bg-yellow-900/20' :
               'border-stone-600 text-stone-400 bg-stone-800'
             }`}>
               {marker.type === 'city' ? 'Город' : marker.type === 'dungeon' ? 'Подземелье' : marker.type === 'shop' ? 'Торговец' : 'Достопримечательность'}
             </span>
          </div>

          <div className="prose prose-invert prose-p:font-serif prose-p:text-rpg-text prose-p:leading-relaxed">
            <p>{marker.description}</p>
          </div>
        </div>

        {/* Footer Actions */}
        {isAdmin && (
          <div className="p-4 border-t border-rpg-border bg-black/20 flex justify-end">
            <Button variant="danger" onClick={() => onDelete(marker.id)} icon={<Icons.Trash />}>
              Удалить
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationModal;
