import { MapData, STORAGE_KEY } from '../types';

const DEFAULT_DATA: MapData = {
  backgroundImage: null,
  markers: []
};

export const loadMapData = (): MapData => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : DEFAULT_DATA;
  } catch (error) {
    console.error("Failed to load map data", error);
    return DEFAULT_DATA;
  }
};

export const saveMapData = (data: MapData): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save map data (likely quota exceeded for image)", error);
    alert("Ошибка сохранения: Возможно, изображение слишком большое. Попробуйте файл меньшего размера.");
  }
};
