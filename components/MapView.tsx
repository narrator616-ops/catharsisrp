
import React, { useRef, useState, useEffect } from 'react';
import { LocationMarker, MapData } from '../types';
import Marker from './Marker';

interface MapViewProps {
  mapData: MapData;
  isAdmin: boolean;
  onMarkerClick: (marker: LocationMarker) => void;
  onMapClick: (x: number, y: number) => void;
}

const MapView: React.FC<MapViewProps> = ({ mapData, isAdmin, onMarkerClick, onMapClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Handle image load to center map initially
  useEffect(() => {
    // Reset view when image changes
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [mapData.backgroundImage]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault(); // Stop page scrolling
    const scaleAdjustment = -e.deltaY * 0.001;
    const newScale = Math.min(Math.max(0.5, scale + scaleAdjustment), 4);
    setScale(newScale);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // If we are holding shift, we might be trying to click a point (if desired), 
    // but generally map navigation takes precedence unless it's a quick click.
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handling for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ 
        x: e.touches[0].clientX - position.x, 
        y: e.touches[0].clientY - position.y 
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && e.touches.length === 1) {
      // Prevent pull-to-refresh
      // e.preventDefault(); // Can't be passive if preventing default, handle in CSS overscroll-none
      setPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    // Distinguish drag from click
    // Simple way: check if position changed significantly?
    // For now, assume if isAdmin is on, we might want to place a marker.
    if (isAdmin && !isDragging) {
       // Need to calculate % relative to the image, not the container
       // This requires the image ref
       const img = document.getElementById('rpg-map-image');
       if (img) {
         const rect = img.getBoundingClientRect();
         const clickX = e.clientX - rect.left;
         const clickY = e.clientY - rect.top;
         
         const percentX = (clickX / rect.width) * 100;
         const percentY = (clickY / rect.height) * 100;

         if (percentX >= 0 && percentX <= 100 && percentY >= 0 && percentY <= 100) {
           onMapClick(percentX, percentY);
         }
       }
    }
  };

  return (
    <div 
      ref={containerRef}
      className="w-full h-full overflow-hidden bg-rpg-dark relative cursor-move touch-none flex items-center justify-center"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
    >
      <div 
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          transformOrigin: 'center',
          transition: isDragging ? 'none' : 'transform 0.1s ease-out'
        }}
        className="inline-block relative shadow-2xl"
      >
        {mapData.backgroundImage ? (
          <img 
            id="rpg-map-image"
            src={mapData.backgroundImage} 
            alt="RPG Map" 
            className="max-w-none pointer-events-none select-none"
            style={{ display: 'block' }} // Prevents inline gaps
            onDragStart={(e) => e.preventDefault()}
          />
        ) : (
          <div className="w-[100vw] h-[100vh] flex flex-col items-center justify-center text-rpg-muted border-2 border-dashed border-rpg-border m-4 bg-black/20">
            <p className="text-xl mb-4 font-display">Карта не загружена</p>
            <p className="text-sm">Перейдите в режим администратора, чтобы добавить карту.</p>
          </div>
        )}

        {/* Markers Overlay */}
        {mapData.backgroundImage && mapData.markers.map(marker => (
           <Marker 
             key={marker.id} 
             marker={marker} 
             scale={scale}
             onClick={onMarkerClick}
           />
        ))}

        {/* Admin Cursor Hint */}
        {isAdmin && mapData.backgroundImage && (
          <div className="absolute inset-0 pointer-events-none border-2 border-rpg-accent opacity-30 z-0"></div>
        )}
      </div>

      {/* Controls Overlay */}
      <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-20">
        <button 
          onClick={(e) => { e.stopPropagation(); setScale(s => Math.min(s + 0.5, 4)); }}
          className="bg-rpg-panel border border-rpg-border p-3 rounded-full shadow-lg text-rpg-text hover:bg-rpg-accent hover:text-white transition-colors"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); setScale(s => Math.max(s - 0.5, 0.5)); }}
          className="bg-rpg-panel border border-rpg-border p-3 rounded-full shadow-lg text-rpg-text hover:bg-rpg-accent hover:text-white transition-colors"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        </button>
      </div>
    </div>
  );
};

export default MapView;
