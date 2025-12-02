
import React from 'react';
import { LocationMarker } from '../types';

interface MarkerProps {
  marker: LocationMarker;
  onClick: (marker: LocationMarker) => void;
  scale: number;
}

const Marker: React.FC<MarkerProps> = ({ marker, onClick, scale }) => {
  const getIconColor = () => {
    switch(marker.type) {
      case 'city': return 'text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.8)]';
      case 'dungeon': return 'text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]';
      case 'shop': return 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]';
      default: return 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]';
    }
  };

  // Counteract the map zoom scale so markers stay relatively consistent in size
  const dynamicScale = Math.max(0.6, 1 / scale); 

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick(marker);
      }}
      style={{
        left: `${marker.x}%`,
        top: `${marker.y}%`,
        transform: `translate(-50%, -100%) scale(${dynamicScale})`,
        position: 'absolute'
      }}
      className="group z-10 focus:outline-none flex flex-col items-center"
    >
      <div className="relative transition-transform duration-300 group-hover:scale-[2.0] group-hover:z-50 origin-bottom">
        {marker.markerImage ? (
          // Photo Marker (Token)
          <div className="w-12 h-12 rounded-full border-2 border-white shadow-[0_0_15px_rgba(0,0,0,0.8)] overflow-hidden bg-rpg-dark relative z-20 group-hover:shadow-[0_0_25px_rgba(217,119,6,0.8)] group-hover:border-rpg-accent transition-all">
            <img 
              src={marker.markerImage} 
              alt={marker.title} 
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          // Default SVG Icon
          <svg 
            viewBox="0 0 24 24" 
            width="48" 
            height="48" 
            fill="currentColor"
            className={`${getIconColor()} transition-all duration-300 drop-shadow-md`}
          >
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        )}
      </div>
      
      {/* Title Tooltip */}
      <span className="absolute top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/90 border border-rpg-border px-3 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg font-display">
        {marker.title}
      </span>
    </button>
  );
};

export default Marker;
