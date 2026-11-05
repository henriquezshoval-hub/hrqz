export interface EnvironmentalRecord {
  id: string;
  timestamp: string;
  category: 'agua' | 'aire' | 'biodiversidad' | 'residuos' | 'suelo' | 'ruido' | 'vegetacion';
  title: string;
  description: string;
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;
  accuracy: number | null;
  verified: boolean;
  verifiedAt: string | null;
  notes: string;
  severity: 'bajo' | 'medio' | 'alto' | 'critico';
  photos: string[];
  customFields: Record<string, string>;
}

export type CategoryInfo = {
  key: EnvironmentalRecord['category'];
  label: string;
  icon: string;
  color: string;
  description: string;
};

export const CATEGORIES: CategoryInfo[] = [
  { key: 'agua', label: 'Calidad del Agua', icon: '💧', color: 'bg-blue-500', description: 'pH, turbidez, temperatura, oxígeno' },
  { key: 'aire', label: 'Calidad del Aire', icon: '💨', color: 'bg-sky-500', description: 'PM2.5, PM10, CO2, ozono' },
  { key: 'biodiversidad', label: 'Biodiversidad', icon: '🦋', color: 'bg-green-500', description: 'Especies observadas, conteo' },
  { key: 'residuos', label: 'Residuos', icon: '🗑️', color: 'bg-yellow-500', description: 'Tipo, cantidad, ubicación' },
  { key: 'suelo', label: 'Calidad del Suelo', icon: '🌱', color: 'bg-amber-700', description: 'pH, humedad, textura' },
  { key: 'ruido', label: 'Contaminación Acústica', icon: '🔊', color: 'bg-purple-500', description: 'Niveles de decibeles' },
  { key: 'vegetacion', label: 'Cobertura Vegetal', icon: '🌳', color: 'bg-emerald-600', description: 'Tipo, densidad, salud' },
];

export const SEVERITY_OPTIONS = [
  { key: 'bajo' as const, label: 'Bajo', color: 'text-green-600', bg: 'bg-green-100' },
  { key: 'medio' as const, label: 'Medio', color: 'text-yellow-600', bg: 'bg-yellow-100' },
  { key: 'alto' as const, label: 'Alto', color: 'text-orange-600', bg: 'bg-orange-100' },
  { key: 'critico' as const, label: 'Crítico', color: 'text-red-600', bg: 'bg-red-100' },
];
