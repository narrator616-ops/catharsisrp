
export interface LocationMarker {
  id: string;
  x: number; // Percentage relative to map width (0-100)
  y: number; // Percentage relative to map height (0-100)
  title: string;
  description: string;
  image?: string; // Main content image (inside modal)
  markerImage?: string; // Token/Thumbnail image (on map)
  type: 'city' | 'dungeon' | 'landmark' | 'shop';
}

export interface MapData {
  backgroundImage: string | null; // Base64
  markers: LocationMarker[];
}

export enum GameMode {
  VIEW = 'VIEW',
  ADMIN = 'ADMIN',
  EDIT_LOCATION = 'EDIT_LOCATION'
}

export const STORAGE_KEY = 'rpg_world_map_data_v1';
