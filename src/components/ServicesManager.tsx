import React, { useState } from 'react';
import { Search, Plus, Edit2, Trash2, ClipboardList, RefreshCw, Sparkles, Check, DollarSign } from 'lucide-react';
import { Servicio } from '../types';

interface ServicesManagerProps {
  servicios: Servicio[];
  onSaveServicio: (srv: Servicio) => Promise<void> | void;
  onDeleteServicio: (id: string) => Promise<void> | void;
}

export function ServicesManager({ servicios, onSaveServicio, onDeleteServicio }: ServicesManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingSrv, setEditingSrv] = useState<Partial<Servicio> | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Search filter
  const filtered = servicios.filter((s) => {
    const term = searchTerm.toLowerCase();
    return (
      s.nombre.toLowerCase().includes(term) ||
      (s.descripcion && s.descripcion.toLowerCase().includes(term)) ||
      s.id.toLowerCase().includes(term)
    );
  });

  const handleOpenNew = () => {
    // Generate simple ID like SRV-XXXXXX
    const randomHex = Math.random().toString(16).substring(2, 8).toUpperCase();
    setEditingSrv({
      id: `SRV-${randomHex}`,
      nombre: '',
      precio_estandar: 0,
      descripcion: ''
    });
    setErrorMessage(null);
    setIsFormOpen(true);
  };

  const handleEdit = (srv: Servicio) => {
    setEditingSrv({ ...srv });
    setErrorMessage(null);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar este servicio predefinido?')) {
      try {
        await onDeleteServicio(id);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSrv || !editingSrv.nombre || editingSrv.nombre.trim() === '') {
      setErrorMessage('El nombre del servicio es obligatorio.');
      return;
    }

    if (editingSrv.precio_estandar === undefined || editingSrv.precio_estandar < 0) {
      setErrorMessage('El precio estándar debe ser un número igual o mayor a 0.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      await onSaveServicio(editingSrv as Servicio);
      setIsFormOpen(false);
      setEditingSrv(null);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al guardar el servicio.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="services-manager" className="space-y-6">
      {/* Upper header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-blue-500" />
            Catálogo de Servicios Predefinidos
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Define servicios frecuentes (como cambio de aceite o pastillas de frenos) con precios estándar para cargarlos rápidamente al crear órdenes de trabajo.
          </p>
        </div>
        <button
          onClick={handleOpenNew}
          className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-black py-2.5 px-4 rounded-xl cursor-pointer shadow-md shadow-blue-600/10 active:scale-[0.98] transition-all flex items-center gap-2 shrink-0 self-stretch sm:self-auto justify-center"
        >
          <Plus className="w-4 h-4" />
          Nuevo Servicio Predefinido
        </button>
      </div>

      {/* Main interface layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Form panel / details panel */}
        {isFormOpen && editingSrv ? (
          <div className="lg:col-span-1 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
            <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
              <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-yellow-500" />
                {servicios.some(x => x.id === editingSrv.id) ? 'Editar Servicio' : 'Nuevo Servicio'}
              </h3>
              <span className="text-[9px] font-mono text-slate-500 font-bold bg-slate-950 px-2 py-0.5 rounded">
                {editingSrv.id}
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Nombre del Servicio (*)
                </label>
                <input
                  type="text"
                  required
                  placeholder="E.g. Cambio de Aceites de Motor"
                  value={editingSrv.nombre || ''}
                  onChange={(e) => setEditingSrv({ ...editingSrv, nombre: e.target.value })}
                  className="w-full bg-slate-950 text-white text-xs border border-slate-800 rounded-xl p-3 focus:outline-none focus:border-blue-500 transition-all font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Precio Estándar (USD) (*)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 font-mono">$</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="0"
                    placeholder="0.00"
                    value={editingSrv.precio_estandar ?? ''}
                    onChange={(e) => setEditingSrv({ ...editingSrv, precio_estandar: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 text-white text-xs border border-slate-800 rounded-xl pl-7 pr-3 py-3 focus:outline-none focus:border-blue-500 transition-all font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Descripción / Detalles de labor
                </label>
                <textarea
                  rows={3}
                  placeholder="E.g. Incluye vaciado de aceite viejo, cambio de arandela del cárter, instalación de filtro nuevo y verificación de fugas."
                  value={editingSrv.descripcion || ''}
                  onChange={(e) => setEditingSrv({ ...editingSrv, descripcion: e.target.value })}
                  className="w-full bg-slate-950 text-white text-xs border border-slate-800 rounded-xl p-3 focus:outline-none focus:border-blue-500 transition-all font-medium leading-relaxed"
                />
              </div>

              {errorMessage && (
                <div className="text-[11px] text-rose-500 font-semibold bg-rose-950/20 border border-rose-900/30 rounded-xl p-3">
                  {errorMessage}
                </div>
              )}

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsFormOpen(false);
                    setEditingSrv(null);
                  }}
                  className="flex-1 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs py-2.5 rounded-xl transition-all cursor-pointer text-center"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] disabled:opacity-50 text-white font-bold text-xs py-2.5 rounded-xl shadow-lg shadow-blue-600/10 cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                >
                  {loading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>Guardar</span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="lg:col-span-1 bg-slate-900/50 border border-slate-800/60 p-6 rounded-2xl text-center flex flex-col items-center justify-center min-h-[220px]">
            <Sparkles className="w-8 h-8 text-blue-500/40 mb-3 animate-pulse" />
            <h4 className="text-slate-300 font-black text-xs uppercase tracking-wider">Editor inactivo</h4>
            <p className="text-[11px] text-slate-500 mt-1 max-w-[200px] leading-relaxed">
              Haz clic en "Nuevo Servicio" o edita uno existente de la lista para modificar sus características.
            </p>
          </div>
        )}

        {/* List of services */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          {/* List Search header */}
          <div className="p-4 border-b border-slate-800 bg-slate-900 flex flex-col sm:flex-row gap-3 justify-between items-center">
            <div className="relative w-full sm:max-w-xs">
              <input
                type="text"
                placeholder="Buscar por nombre o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 text-white text-xs border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-600 font-medium"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
            <div className="text-[10px] text-slate-400 font-bold bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg">
              Total: {servicios.length} servicios ({filtered.length} filtrados)
            </div>
          </div>

          {/* List content */}
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
              <ClipboardList className="w-8 h-8 text-slate-700" />
              <p className="font-bold text-xs text-slate-400">No se encontraron servicios</p>
              <p className="text-[10px] text-slate-500 max-w-xs">
                Intenta buscar otro término o registra un nuevo servicio predefinido.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60 max-h-[500px] overflow-y-auto">
              {filtered.map((srv) => (
                <div key={srv.id} className="p-4 hover:bg-slate-950/40 transition-colors flex items-start justify-between gap-4">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-extrabold text-xs text-white truncate">{srv.nombre}</h4>
                      <span className="text-[8px] font-mono font-bold text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-850">
                        {srv.id}
                      </span>
                    </div>
                    {srv.descripcion ? (
                      <p className="text-[11px] text-slate-400 leading-relaxed font-normal">{srv.descripcion}</p>
                    ) : (
                      <p className="text-[10px] text-slate-600 italic font-normal">Sin descripción</p>
                    )}
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <span className="text-xs font-black text-emerald-400 font-mono flex items-center gap-0.5 justify-end">
                        <DollarSign className="w-3 h-3 text-emerald-500 shrink-0" />
                        {srv.precio_estandar.toFixed(2)}
                      </span>
                      <span className="text-[8px] font-extrabold text-slate-500 block uppercase tracking-wider">Precio Estándar</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEdit(srv)}
                        title="Editar servicio"
                        className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(srv.id)}
                        title="Eliminar servicio"
                        className="p-2 hover:bg-rose-950/40 text-slate-500 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
