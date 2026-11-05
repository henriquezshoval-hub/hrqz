import { useState, useEffect, useCallback } from 'react';
import { EnvironmentalRecord, CATEGORIES, SEVERITY_OPTIONS } from './types';
import { getAllRecords, saveRecord, deleteRecord, generateId, getStats } from './store';
import * as XLSX from 'xlsx';

type Tab = 'dashboard' | 'new' | 'records' | 'gps' | 'export';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [records, setRecords] = useState<EnvironmentalRecord[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    setRecords(getAllRecords());
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const refreshRecords = () => setRecords(getAllRecords());

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 pb-20">
      {/* Header */}
      <header className="bg-green-700 text-white px-4 py-3 shadow-lg sticky top-0 z-50">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌿</span>
            <div>
              <h1 className="text-lg font-bold leading-tight">EcoMonitor</h1>
              <p className="text-xs text-green-200">Registro Ambiental Offline</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${isOnline ? 'bg-green-500 text-white' : 'bg-orange-500 text-white'}`}>
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-white animate-pulse' : 'bg-white'}`}></span>
              {isOnline ? 'En línea' : 'Sin señal'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-4">
        {activeTab === 'dashboard' && <Dashboard records={records} />}
        {activeTab === 'new' && <RecordForm onSave={refreshRecords} />}
        {activeTab === 'records' && <RecordList records={records} onRefresh={refreshRecords} />}
        {activeTab === 'gps' && <GPSPanel />}
        {activeTab === 'export' && <ExportPanel records={records} />}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="max-w-4xl mx-auto flex justify-around">
          {[
            { id: 'dashboard' as Tab, icon: '📊', label: 'Inicio' },
            { id: 'new' as Tab, icon: '➕', label: 'Nuevo' },
            { id: 'records' as Tab, icon: '📋', label: 'Registros' },
            { id: 'gps' as Tab, icon: '📍', label: 'GPS' },
            { id: 'export' as Tab, icon: '📥', label: 'Exportar' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center py-2 px-3 min-w-0 flex-1 transition-colors ${
                activeTab === tab.id ? 'text-green-700 border-t-2 border-green-700' : 'text-gray-500'
              }`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span className="text-xs mt-0.5 truncate">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

// ============ DASHBOARD ============
function Dashboard({ records }: { records: EnvironmentalRecord[] }) {
  const stats = getStats();
  const recentRecords = records.slice(-5).reverse();

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm p-4 border border-green-100">
        <h2 className="text-lg font-bold text-gray-800 mb-3">📊 Resumen General</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-green-700">{stats.total}</p>
            <p className="text-xs text-gray-600">Total Registros</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-blue-700">{stats.verified}</p>
            <p className="text-xs text-gray-600">Verificados</p>
          </div>
          <div className="bg-amber-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-amber-700">{Object.keys(stats.byCategory).length}</p>
            <p className="text-xs text-gray-600">Categorías</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-purple-700">
              {records.filter(r => r.latitude).length}
            </p>
            <p className="text-xs text-gray-600">Con GPS</p>
          </div>
        </div>
      </div>

      {/* Por categoría */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-green-100">
        <h3 className="font-semibold text-gray-800 mb-2">📂 Por Categoría</h3>
        <div className="space-y-2">
          {CATEGORIES.map(cat => {
            const count = stats.byCategory[cat.key] || 0;
            const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
            return (
              <div key={cat.key} className="flex items-center gap-2">
                <span className="text-lg">{cat.icon}</span>
                <div className="flex-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">{cat.label}</span>
                    <span className="text-gray-500">{count}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className={`h-2 rounded-full ${cat.color}`} style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Por severidad */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-green-100">
        <h3 className="font-semibold text-gray-800 mb-2">⚠️ Por Severidad</h3>
        <div className="flex gap-2 flex-wrap">
          {SEVERITY_OPTIONS.map(sev => (
            <div key={sev.key} className={`${sev.bg} rounded-lg px-3 py-2 text-center flex-1 min-w-[70px]`}>
              <p className={`text-lg font-bold ${sev.color}`}>{stats.bySeverity[sev.key] || 0}</p>
              <p className="text-xs text-gray-600">{sev.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recientes */}
      {recentRecords.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-4 border border-green-100">
          <h3 className="font-semibold text-gray-800 mb-2">🕐 Registros Recientes</h3>
          <div className="space-y-2">
            {recentRecords.map(r => {
              const cat = CATEGORIES.find(c => c.key === r.category);
              return (
                <div key={r.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <span className="text-lg">{cat?.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{r.title}</p>
                    <p className="text-xs text-gray-500">{new Date(r.timestamp).toLocaleDateString('es')}</p>
                  </div>
                  {r.verified && <span className="text-green-500 text-sm">✓</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Info offline */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
        <h3 className="font-semibold text-blue-800 mb-1">📱 Funciona sin internet</h3>
        <p className="text-sm text-blue-700">
          Esta app guarda todo en tu dispositivo. El GPS funciona sin señal. 
          Cuando tengas internet, podrás exportar tus datos a Excel.
        </p>
      </div>
    </div>
  );
}

// ============ FORMULARIO NUEVO REGISTRO ============
function RecordForm({ onSave }: { onSave: () => void }) {
  const [category, setCategory] = useState<EnvironmentalRecord['category']>('agua');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<EnvironmentalRecord['severity']>('medio');
  const [notes, setNotes] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [altitude, setAltitude] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [saved, setSaved] = useState(false);
  const [customFields, setCustomFields] = useState<Record<string, string>>({});

  const getLocation = useCallback(() => {
    setGpsLoading(true);
    setGpsError('');
    
    if (!navigator.geolocation) {
      setGpsError('Tu dispositivo no soporta GPS');
      setGpsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setAltitude(position.coords.altitude);
        setAccuracy(position.coords.accuracy);
        setGpsLoading(false);
      },
      (error) => {
        let msg = 'Error al obtener ubicación';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            msg = 'Permiso de ubicación denegado. Actívalo en ajustes.';
            break;
          case error.POSITION_UNAVAILABLE:
            msg = 'Ubicación no disponible. Intenta al aire libre.';
            break;
          case error.TIMEOUT:
            msg = 'Tiempo agotado. Intenta de nuevo.';
            break;
        }
        setGpsError(msg);
        setGpsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 0
      }
    );
  }, []);

  const handleSave = () => {
    if (!title.trim()) {
      alert('Por favor escribe un título para el registro');
      return;
    }

    const record: EnvironmentalRecord = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      category,
      title: title.trim(),
      description: description.trim(),
      latitude,
      longitude,
      altitude,
      accuracy,
      verified: false,
      verifiedAt: null,
      notes: notes.trim(),
      severity,
      photos: [],
      customFields,
    };

    saveRecord(record);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setTitle('');
      setDescription('');
      setNotes('');
      setCustomFields({});
      onSave();
    }, 2000);
  };

  const currentCat = CATEGORIES.find(c => c.key === category);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm p-4 border border-green-100">
        <h2 className="text-lg font-bold text-gray-800 mb-3">➕ Nuevo Registro Ambiental</h2>

        {saved && (
          <div className="bg-green-100 border border-green-300 text-green-800 rounded-lg p-3 mb-3 text-center font-medium">
            ✅ ¡Registro guardado exitosamente!
          </div>
        )}

        {/* Categoría */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat.key}
                onClick={() => setCategory(cat.key)}
                className={`p-2 rounded-lg border-2 text-left transition-all ${
                  category === cat.key
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="text-lg">{cat.icon}</span>
                <p className="text-xs font-medium text-gray-800 mt-0.5">{cat.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Título */}
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Ej: Contaminación en río..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>

        {/* Descripción */}
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Describe lo que observas..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>

        {/* Severidad */}
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Nivel de Severidad</label>
          <div className="flex gap-2">
            {SEVERITY_OPTIONS.map(sev => (
              <button
                key={sev.key}
                onClick={() => setSeverity(sev.key)}
                className={`flex-1 py-2 rounded-lg text-xs font-medium border-2 transition-all ${
                  severity === sev.key
                    ? `${sev.bg} border-current ${sev.color}`
                    : 'border-gray-200 text-gray-500'
                }`}
              >
                {sev.label}
              </button>
            ))}
          </div>
        </div>

        {/* GPS */}
        <div className="mb-3 bg-gray-50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">📍 Ubicación GPS</label>
            <button
              onClick={getLocation}
              disabled={gpsLoading}
              className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 disabled:opacity-50"
            >
              {gpsLoading ? '⏳ Buscando...' : '📡 Obtener GPS'}
            </button>
          </div>
          
          {gpsError && (
            <p className="text-xs text-red-600 mb-2">{gpsError}</p>
          )}

          {latitude !== null && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white rounded p-2">
                <span className="text-gray-500">Latitud:</span>
                <p className="font-mono font-medium">{latitude?.toFixed(6)}</p>
              </div>
              <div className="bg-white rounded p-2">
                <span className="text-gray-500">Longitud:</span>
                <p className="font-mono font-medium">{longitude?.toFixed(6)}</p>
              </div>
              {altitude !== null && (
                <div className="bg-white rounded p-2">
                  <span className="text-gray-500">Altitud:</span>
                  <p className="font-mono font-medium">{altitude.toFixed(1)} m</p>
                </div>
              )}
              {accuracy !== null && (
                <div className="bg-white rounded p-2">
                  <span className="text-gray-500">Precisión:</span>
                  <p className="font-mono font-medium">±{accuracy.toFixed(0)} m</p>
                </div>
              )}
            </div>
          )}
          <p className="text-xs text-gray-500 mt-2">
            💡 El GPS funciona sin internet. Solo necesita cielo visible.
          </p>
        </div>

        {/* Notas */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Notas adicionales</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Observaciones, condiciones climáticas, etc."
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>

        {/* Botón guardar */}
        <button
          onClick={handleSave}
          className="w-full py-3 bg-green-600 text-white rounded-xl font-bold text-lg hover:bg-green-700 active:scale-95 transition-all shadow-lg"
        >
          💾 Guardar Registro
        </button>
      </div>
    </div>
  );
}

// ============ LISTA DE REGISTROS ============
function RecordList({ records, onRefresh }: { records: EnvironmentalRecord[]; onRefresh: () => void }) {
  const [filter, setFilter] = useState<string>('todos');
  const [selectedRecord, setSelectedRecord] = useState<EnvironmentalRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRecords = records
    .filter(r => filter === 'todos' || r.category === filter)
    .filter(r => !searchTerm || r.title.toLowerCase().includes(searchTerm.toLowerCase()) || r.description.toLowerCase().includes(searchTerm.toLowerCase()))
    .reverse();

  const handleVerify = (record: EnvironmentalRecord) => {
    record.verified = !record.verified;
    record.verifiedAt = record.verified ? new Date().toISOString() : null;
    saveRecord(record);
    onRefresh();
    if (selectedRecord?.id === record.id) {
      setSelectedRecord({ ...record });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Eliminar este registro?')) {
      deleteRecord(id);
      onRefresh();
      setSelectedRecord(null);
    }
  };

  if (selectedRecord) {
    const cat = CATEGORIES.find(c => c.key === selectedRecord.category);
    const sev = SEVERITY_OPTIONS.find(s => s.key === selectedRecord.severity);
    return (
      <div className="space-y-4">
        <button onClick={() => setSelectedRecord(null)} className="text-green-700 font-medium flex items-center gap-1">
          ← Volver a lista
        </button>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-green-100">
          <div className="flex items-start justify-between mb-3">
            <div>
              <span className="text-2xl">{cat?.icon}</span>
              <h2 className="text-lg font-bold text-gray-800">{selectedRecord.title}</h2>
              <p className="text-sm text-gray-500">{cat?.label}</p>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${sev?.bg} ${sev?.color}`}>
              {sev?.label}
            </span>
          </div>

          <div className="space-y-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-700">{selectedRecord.description || 'Sin descripción'}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-gray-50 rounded p-2">
                <span className="text-gray-500 text-xs">Fecha:</span>
                <p className="font-medium">{new Date(selectedRecord.timestamp).toLocaleString('es')}</p>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <span className="text-gray-500 text-xs">Verificado:</span>
                <p className="font-medium">{selectedRecord.verified ? '✅ Sí' : '❌ No'}</p>
              </div>
            </div>

            {selectedRecord.latitude !== null && (
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-sm font-medium text-blue-800 mb-1">📍 Coordenadas</p>
                <p className="text-sm font-mono text-blue-700">
                  Lat: {selectedRecord.latitude.toFixed(6)}
                </p>
                <p className="text-sm font-mono text-blue-700">
                  Lon: {selectedRecord.longitude?.toFixed(6)}
                </p>
                {selectedRecord.altitude !== null && (
                  <p className="text-sm text-blue-700">Alt: {selectedRecord.altitude.toFixed(1)}m</p>
                )}
                {selectedRecord.accuracy !== null && (
                  <p className="text-sm text-blue-600">Precisión: ±{selectedRecord.accuracy.toFixed(0)}m</p>
                )}
                <a
                  href={`https://www.google.com/maps?q=${selectedRecord.latitude},${selectedRecord.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-2 text-xs bg-blue-600 text-white px-3 py-1 rounded"
                >
                  Ver en mapa →
                </a>
              </div>
            )}

            {selectedRecord.notes && (
              <div className="bg-yellow-50 rounded-lg p-3">
                <p className="text-sm font-medium text-yellow-800 mb-1">📝 Notas:</p>
                <p className="text-sm text-yellow-700">{selectedRecord.notes}</p>
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={() => handleVerify(selectedRecord)}
              className={`flex-1 py-2 rounded-lg font-medium text-sm ${
                selectedRecord.verified
                  ? 'bg-gray-200 text-gray-700'
                  : 'bg-green-600 text-white'
              }`}
            >
              {selectedRecord.verified ? '✓ Verificado' : 'Verificar'}
            </button>
            <button
              onClick={() => handleDelete(selectedRecord.id)}
              className="py-2 px-4 bg-red-100 text-red-700 rounded-lg font-medium text-sm"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm p-4 border border-green-100">
        <h2 className="text-lg font-bold text-gray-800 mb-3">📋 Mis Registros ({filteredRecords.length})</h2>
        
        {/* Búsqueda */}
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="🔍 Buscar registros..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 text-sm"
        />

        {/* Filtros */}
        <div className="flex gap-1 flex-wrap mb-3">
          <button
            onClick={() => setFilter('todos')}
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              filter === 'todos' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            Todos
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              onClick={() => setFilter(cat.key)}
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                filter === cat.key ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {cat.icon} {cat.label.split(' ')[0]}
            </button>
          ))}
        </div>

        {/* Lista */}
        {filteredRecords.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-3xl mb-2">📭</p>
            <p className="text-sm">No hay registros aún</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredRecords.map(record => {
              const cat = CATEGORIES.find(c => c.key === record.category);
              return (
                <button
                  key={record.id}
                  onClick={() => setSelectedRecord(record)}
                  className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-3"
                >
                  <span className="text-xl">{cat?.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{record.title}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(record.timestamp).toLocaleDateString('es')} 
                      {record.latitude !== null && ' • 📍'}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {record.verified && <span className="text-green-500 text-xs">✓ Verif.</span>}
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      SEVERITY_OPTIONS.find(s => s.key === record.severity)?.bg
                    } ${SEVERITY_OPTIONS.find(s => s.key === record.severity)?.color}`}>
                      {SEVERITY_OPTIONS.find(s => s.key === record.severity)?.label}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ============ PANEL GPS ============
function GPSPanel() {
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [altitude, setAltitude] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [speed, setSpeed] = useState<number | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [watching, setWatching] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [history, setHistory] = useState<Array<{lat: number; lon: number; time: string}>>([]);

  const getOnce = () => {
    setLoading(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setAltitude(pos.coords.altitude);
        setAccuracy(pos.coords.accuracy);
        setSpeed(pos.coords.speed);
        setHeading(pos.coords.heading);
        setLoading(false);
        setHistory(prev => [...prev.slice(-19), {
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          time: new Date().toLocaleTimeString('es')
        }]);
      },
      (err) => {
        setError(getGeoErrorMessage(err));
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 }
    );
  };

  const toggleWatch = () => {
    if (watching && watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatching(false);
      setWatchId(null);
    } else {
      setError('');
      const id = navigator.geolocation.watchPosition(
        (pos) => {
          setLatitude(pos.coords.latitude);
          setLongitude(pos.coords.longitude);
          setAltitude(pos.coords.altitude);
          setAccuracy(pos.coords.accuracy);
          setSpeed(pos.coords.speed);
          setHeading(pos.coords.heading);
          setHistory(prev => [...prev.slice(-49), {
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            time: new Date().toLocaleTimeString('es')
          }]);
        },
        (err) => setError(getGeoErrorMessage(err)),
        { enableHighAccuracy: true, timeout: 30000, maximumAge: 5000 }
      );
      setWatchId(id);
      setWatching(true);
    }
  };

  const copyCoords = () => {
    if (latitude !== null && longitude !== null) {
      const text = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      navigator.clipboard.writeText(text).then(() => {
        alert('Coordenadas copiadas: ' + text);
      }).catch(() => {
        prompt('Copia estas coordenadas:', text);
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm p-4 border border-green-100">
        <h2 className="text-lg font-bold text-gray-800 mb-3">📍 GPS - Coordenadas</h2>
        
        <div className="bg-blue-50 rounded-lg p-3 mb-4">
          <p className="text-sm text-blue-800">
            💡 <strong>El GPS funciona sin internet.</strong> Solo necesitas cielo visible. 
            Funciona incluso sin señal celular.
          </p>
        </div>

        <div className="flex gap-2 mb-4">
          <button
            onClick={getOnce}
            disabled={loading}
            className="flex-1 py-2 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? '⏳ Buscando...' : '📡 Obtener Posición'}
          </button>
          <button
            onClick={toggleWatch}
            className={`flex-1 py-2 rounded-lg font-medium text-sm ${
              watching ? 'bg-red-500 text-white' : 'bg-blue-600 text-white'
            }`}
          >
            {watching ? '⏹ Detener' : '▶ Monitorear'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {latitude !== null && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Latitud</p>
                <p className="font-mono font-bold text-gray-800">{latitude.toFixed(6)}°</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Longitud</p>
                <p className="font-mono font-bold text-gray-800">{longitude?.toFixed(6)}°</p>
              </div>
              {altitude !== null && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Altitud</p>
                  <p className="font-mono font-bold text-gray-800">{altitude.toFixed(1)} m</p>
                </div>
              )}
              {accuracy !== null && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Precisión</p>
                  <p className="font-mono font-bold text-gray-800">±{accuracy.toFixed(0)} m</p>
                </div>
              )}
              {speed !== null && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Velocidad</p>
                  <p className="font-mono font-bold text-gray-800">{(speed * 3.6).toFixed(1)} km/h</p>
                </div>
              )}
              {heading !== null && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Dirección</p>
                  <p className="font-mono font-bold text-gray-800">{heading.toFixed(0)}°</p>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={copyCoords}
                className="flex-1 py-2 bg-gray-700 text-white rounded-lg text-sm font-medium"
              >
                📋 Copiar Coordenadas
              </button>
              <a
                href={navigator.onLine ? `https://www.google.com/maps?q=${latitude},${longitude}` : '#'}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex-1 py-2 text-center rounded-lg text-sm font-medium ${
                  navigator.onLine ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-500'
                }`}
              >
                🗺️ {navigator.onLine ? 'Ver en Mapa' : 'Sin internet'}
              </a>
            </div>

            {/* Historial de posiciones */}
            {history.length > 1 && (
              <div className="mt-3">
                <p className="text-sm font-medium text-gray-700 mb-1">📍 Historial de posiciones:</p>
                <div className="max-h-32 overflow-y-auto bg-gray-50 rounded-lg p-2 space-y-1">
                  {history.slice().reverse().map((h, i) => (
                    <p key={i} className="text-xs font-mono text-gray-600">
                      {h.time} → {h.lat.toFixed(6)}, {h.lon.toFixed(6)}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tips GPS */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-green-100">
        <h3 className="font-semibold text-gray-800 mb-2">💡 Tips para mejor señal GPS</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Sal al aire libre, lejos de edificios altos</li>
          <li>• Espera 30-60 segundos para mejor precisión</li>
          <li>• El GPS funciona SIN internet ni datos</li>
          <li>• Los satélites son los que dan la posición</li>
          <li>• Días nublados pueden afectar la precisión</li>
        </ul>
      </div>
    </div>
  );
}

function getGeoErrorMessage(error: GeolocationPositionError): string {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return 'Permiso denegado. Ve a Ajustes > Ubicación y actívalo para esta app.';
    case error.POSITION_UNAVAILABLE:
      return 'Ubicación no disponible. Sal al aire libre e intenta de nuevo.';
    case error.TIMEOUT:
      return 'Tiempo agotado. El GPS está tardando. Intenta en un lugar con cielo visible.';
    default:
      return 'Error desconocido al obtener ubicación.';
  }
}

// ============ EXPORTAR A EXCEL ============
function ExportPanel({ records }: { records: EnvironmentalRecord[] }) {
  const [exportFilter, setExportFilter] = useState<string>('todos');

  const exportToExcel = () => {
    const filtered = exportFilter === 'todos' 
      ? records 
      : records.filter(r => r.category === exportFilter);

    if (filtered.length === 0) {
      alert('No hay registros para exportar');
      return;
    }

    const data = filtered.map(r => {
      const cat = CATEGORIES.find(c => c.key === r.category);
      const sev = SEVERITY_OPTIONS.find(s => s.key === r.severity);
      return {
        'ID': r.id,
        'Fecha/Hora': new Date(r.timestamp).toLocaleString('es'),
        'Categoría': cat?.label || r.category,
        'Título': r.title,
        'Descripción': r.description,
        'Severidad': sev?.label || r.severity,
        'Latitud': r.latitude !== null ? r.latitude.toFixed(6) : '',
        'Longitud': r.longitude !== null ? r.longitude.toFixed(6) : '',
        'Altitud (m)': r.altitude !== null ? r.altitude.toFixed(1) : '',
        'Precisión GPS (m)': r.accuracy !== null ? r.accuracy.toFixed(0) : '',
        'Verificado': r.verified ? 'Sí' : 'No',
        'Fecha Verificación': r.verifiedAt ? new Date(r.verifiedAt).toLocaleString('es') : '',
        'Notas': r.notes,
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Registros Ambientales');

    // Ajustar anchos de columna
    const colWidths = Object.keys(data[0]).map(key => ({
      wch: Math.max(key.length, ...data.map(d => String(d[key as keyof typeof d] || '').length)) + 2
    }));
    ws['!cols'] = colWidths;

    const fileName = `EcoMonitor_${new Date().toISOString().split('T')[0]}_${exportFilter}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const exportToCSV = () => {
    const filtered = exportFilter === 'todos' 
      ? records 
      : records.filter(r => r.category === exportFilter);

    if (filtered.length === 0) {
      alert('No hay registros para exportar');
      return;
    }

    const data = filtered.map(r => {
      const cat = CATEGORIES.find(c => c.key === r.category);
      const sev = SEVERITY_OPTIONS.find(s => s.key === r.severity);
      return {
        'ID': r.id,
        'Fecha': new Date(r.timestamp).toLocaleString('es'),
        'Categoria': cat?.label || r.category,
        'Titulo': r.title,
        'Descripcion': r.description,
        'Severidad': sev?.label || r.severity,
        'Latitud': r.latitude?.toFixed(6) || '',
        'Longitud': r.longitude?.toFixed(6) || '',
        'Altitud': r.altitude?.toFixed(1) || '',
        'Precision_m': r.accuracy?.toFixed(0) || '',
        'Verificado': r.verified ? 'Si' : 'No',
        'Notas': r.notes,
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `EcoMonitor_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm p-4 border border-green-100">
        <h2 className="text-lg font-bold text-gray-800 mb-3">📥 Exportar a Excel</h2>
        
        <div className="bg-green-50 rounded-lg p-3 mb-4">
          <p className="text-sm text-green-800">
            📊 Exporta todos tus registros a un archivo Excel (.xlsx) o CSV. 
            El archivo se descarga a tu dispositivo y puedes abrirlo en Excel, Google Sheets, etc.
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Filtrar por categoría:</label>
          <select
            value={exportFilter}
            onChange={e => setExportFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="todos">📋 Todos los registros ({records.length})</option>
            {CATEGORIES.map(cat => {
              const count = records.filter(r => r.category === cat.key).length;
              return (
                <option key={cat.key} value={cat.key}>
                  {cat.icon} {cat.label} ({count})
                </option>
              );
            })}
          </select>
        </div>

        <div className="space-y-2">
          <button
            onClick={exportToExcel}
            className="w-full py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span className="text-xl">📊</span>
            Descargar Excel (.xlsx)
          </button>
          <button
            onClick={exportToCSV}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span className="text-xl">📄</span>
            Descargar CSV
          </button>
        </div>

        {records.length === 0 && (
          <div className="mt-4 text-center text-gray-500">
            <p className="text-2xl mb-1">📭</p>
            <p className="text-sm">No hay registros para exportar</p>
          </div>
        )}
      </div>

      {/* Info del archivo */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-green-100">
        <h3 className="font-semibold text-gray-800 mb-2">📋 El archivo incluye:</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>✅ Fecha y hora de cada registro</li>
          <li>✅ Categoría y descripción</li>
          <li>✅ Nivel de severidad</li>
          <li>✅ Coordenadas GPS (latitud, longitud)</li>
          <li>✅ Altitud y precisión del GPS</li>
          <li>✅ Estado de verificación</li>
          <li>✅ Notas adicionales</li>
        </ul>
      </div>
    </div>
  );
}

export default App;
