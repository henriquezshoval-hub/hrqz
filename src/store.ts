import { EnvironmentalRecord } from './types';

const STORAGE_KEY = 'ecomonitor_records';

export function getAllRecords(): EnvironmentalRecord[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveRecord(record: EnvironmentalRecord): void {
  const records = getAllRecords();
  const existingIndex = records.findIndex(r => r.id === record.id);
  if (existingIndex >= 0) {
    records[existingIndex] = record;
  } else {
    records.push(record);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export function deleteRecord(id: string): void {
  const records = getAllRecords().filter(r => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function getStats() {
  const records = getAllRecords();
  const total = records.length;
  const verified = records.filter(r => r.verified).length;
  const byCategory: Record<string, number> = {};
  const bySeverity: Record<string, number> = {};
  
  records.forEach(r => {
    byCategory[r.category] = (byCategory[r.category] || 0) + 1;
    bySeverity[r.severity] = (bySeverity[r.severity] || 0) + 1;
  });

  return { total, verified, byCategory, bySeverity, records };
}
