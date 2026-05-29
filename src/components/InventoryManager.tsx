import React, { useState } from 'react';
import { Repuesto } from '../types';
import { Package, Plus, Search, Edit2, AlertTriangle, ShieldCheck, DollarSign, Loader2, RefreshCw } from 'lucide-react';

interface InventoryManagerProps {
  repuestos: Repuesto[];
  onSaveRepuesto: (repuesto: Repuesto) => void;
  onDeleteRepuesto: (id: string) => void;
}

export function InventoryManager({ repuestos, onSaveRepuesto, onDeleteRepuesto }: InventoryManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [editingRepuesto, setEditingRepuesto] = useState<Partial<Repuesto> | null>(null);

  // List of unique categories available
  const categories = ['Todas', ...Array.from(new Set(repuestos.map((r) => r.categoria)))];

  // Filtering logic
  const filtered = repuestos.filter((r) => {
    const matchesSearch =
      r.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.referencia.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'Todas' || r.categoria === selectedCategory;
    const matchesLowStock = !showLowStockOnly || r.cantidad <= r.stock_min;

    return matchesSearch && matchesCategory && matchesLowStock;
  });

  // Calculate high-level metrics
  const totalItems = repuestos.reduce((acc, r) => acc + Number(r.cantidad || 0), 0);
  const totalInvestment = repuestos.reduce((acc, r) => acc + (Number(r.costo || 0) * Number(r.cantidad || 0)), 0);
  const potentialRevenue = repuestos.reduce((acc, r) => acc + (Number(r.precio || 0) * Number(r.cantidad || 0)), 0);
  const potentialProfit = potentialRevenue - totalInvestment;
  const avgMargin = potentialRevenue > 0 ? (potentialProfit / potentialRevenue) * 100 : 0;

  // Handle addition or edit save
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRepuesto?.nombre || !editingRepuesto?.codigo) {
      alert('Favor ingresar código y nombre representativos.');
      return;
    }

    const item: Repuesto = {
      id: editingRepuesto.id || `REP-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      codigo: editingRepuesto.codigo,
      nombre: editingRepuesto.nombre,
      referencia: editingRepuesto.referencia || '',
      categoria: editingRepuesto.categoria || 'Generales',
      proveedor: editingRepuesto.proveedor || 'Proveedor General',
      cantidad: Number(editingRepuesto.cantidad || 0),
      stock_min: Number(editingRepuesto.stock_min || 5),
      precio: Number(editingRepuesto.precio || 0),
      costo: Number(editingRepuesto.costo || 0),
      ubicacion: editingRepuesto.ubicacion || 'Sin Ubicación',
      fecha_ingreso: editingRepuesto.fecha_ingreso || new Date().toISOString().split('T')[0],
    };

    onSaveRepuesto(item);
    setEditingRepuesto(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-center gap-4 shadow-xs">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg shrink-0">
            <Package className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-slate-500 block font-bold leading-tight">Cantidad Repuestos</span>
            <span className="text-base font-black text-slate-900 leading-tight block mt-0.5">{totalItems} uds</span>
            <span className="text-[9.5px] text-slate-400 block">{repuestos.length} referencias</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-center gap-4 shadow-xs">
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-lg shrink-0">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-slate-500 block font-bold leading-tight">Inversión Almacén</span>
            <span className="text-base font-black text-slate-900 leading-tight block mt-0.5">${totalInvestment.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
            <span className="text-[9.5px] text-slate-400 block">Costo de adquisición de stock</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-center gap-4 shadow-xs">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-slate-500 block font-bold leading-tight">Valor Venta Estimado</span>
            <span className="text-base font-black text-slate-900 leading-tight block mt-0.5">${potentialRevenue.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
            <span className="text-[9.5px] text-slate-400 block">Rendimiento estimado de stock</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-center gap-4 shadow-xs">
          <div className="p-2.5 bg-yellow-50 text-yellow-600 rounded-lg shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-slate-500 block font-bold leading-tight">Utilidad Potencial</span>
            <span className="text-base font-black text-slate-900 leading-tight block mt-0.5">${potentialProfit.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
            <span className="text-[9.5px] font-semibold text-emerald-600">+{Number(avgMargin ?? 0).toFixed(0)}% s/costos</span>
          </div>
        </div>
      </div>

      {/* Control bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por código, repuesto, ref..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Filters and Toggle */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-[11px] font-bold bg-slate-50 border border-slate-200 py-1.5 px-2.5 rounded-lg text-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                Categoría: {cat}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-1.5 cursor-pointer select-none text-[11px] text-slate-600 font-bold bg-slate-50 py-1.5 px-2.5 rounded-lg border border-slate-200">
            <input
              type="checkbox"
              checked={showLowStockOnly}
              onChange={(e) => setShowLowStockOnly(e.target.checked)}
              className="accent-emerald-600"
            />
            Stock Crítico
          </label>

          <button
            onClick={() => setEditingRepuesto({})}
            className="flex items-center gap-1 text-[11px] font-bold text-white bg-slate-900 hover:bg-slate-800 py-1.5 px-3.5 rounded-lg cursor-pointer transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Adicionar Item
          </button>
        </div>
      </div>

      {/* Main Table view */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                <th className="py-2.5 px-3">Código / Nombre</th>
                <th className="py-2.5 px-3">Categoría / Proveedor</th>
                <th className="py-2.5 px-3 text-center">Cantidad Stock</th>
                <th className="py-2.5 px-3 text-right">Costo Compra</th>
                <th className="py-2.5 px-3 text-right">Precio Venta</th>
                <th className="py-2.5 px-3 text-right">Margen / Ganancia</th>
                <th className="py-2.5 px-3">Ubicación</th>
                <th className="py-2.5 px-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-slate-400 italic">
                    Sin repuestos coincidentes en almacén.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => {
                  const isLow = r.cantidad <= r.stock_min;
                  const ganancia = r.precio - r.costo;
                  const marginPercent = r.costo > 0 ? (ganancia / r.precio) * 100 : 0;

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800 leading-tight">{r.nombre}</div>
                        <div className="flex items-center gap-1.5 mt-0.5 text-slate-400 text-xs">
                          <span className="font-mono bg-slate-100 text-slate-600 px-1 py-0.5 rounded-sm">
                            {r.codigo}
                          </span>
                          {r.referencia && <span className="opacity-75">Ref: {r.referencia}</span>}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-xs">
                        <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded-full font-medium">
                          {r.categoria}
                        </span>
                        <div className="text-slate-400 mt-1 max-w-[150px] truncate">{r.proveedor}</div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex flex-col items-center">
                          <span className={`text-sm font-black ${isLow ? 'text-red-600 font-extrabold' : 'text-slate-800'}`}>
                            {r.cantidad}
                          </span>
                          {isLow && (
                            <span className="flex items-center gap-0.5 text-[10px] text-red-500 font-bold bg-red-50 px-1 rounded-sm mt-0.5">
                              <AlertTriangle className="w-2.5 h-2.5" /> Mín. {r.stock_min}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right font-semibold text-slate-700 font-mono">
                        ${Number(r.costo ?? 0).toFixed(2)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-semibold text-slate-800 font-mono">
                        ${Number(r.precio ?? 0).toFixed(2)}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="font-bold text-emerald-600 font-mono">+${Number(ganancia ?? 0).toFixed(2)}</div>
                        <div className="text-[10px] text-emerald-500 font-medium">{Number(marginPercent ?? 0).toFixed(0)}% margen</div>
                      </td>

                      <td className="py-3.5 px-4 text-xs text-slate-500 font-medium">
                        {r.ubicacion || '—'}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditingRepuesto(r)}
                            className="p-1 px-2 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-sm cursor-pointer border border-slate-200"
                          >
                            Editar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Editing / Addition Drawer Modal */}
      {editingRepuesto && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
            <div className="bg-slate-950 text-white p-5">
              <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-400" />
                {editingRepuesto.id ? 'Modificar Repuesto' : 'Ingresar Nuevo Repuesto'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Ajuste los valores de inventario, stock y configure la relación de costos/precios de venta para la utilidad.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
              {/* Code and Name */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-500 uppercase mb-1">Código Único (Fijo)</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. REP-0005"
                    disabled={!!editingRepuesto.id}
                    value={editingRepuesto.codigo || ''}
                    onChange={(e) => setEditingRepuesto({ ...editingRepuesto, codigo: e.target.value })}
                    className="w-full text-xs font-mono p-2 border border-slate-200 rounded-lg bg-slate-50 disabled:bg-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-500 uppercase mb-1">Categoría</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. Lubricantes, Frenos"
                    value={editingRepuesto.categoria || ''}
                    onChange={(e) => setEditingRepuesto({ ...editingRepuesto, categoria: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-500 uppercase mb-1">Nombre Comercial del Repuesto</label>
                <input
                  type="text"
                  required
                  placeholder="E.g. Filtro Aire Premium Corolla"
                  value={editingRepuesto.nombre || ''}
                  onChange={(e) => setEditingRepuesto({ ...editingRepuesto, nombre: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Reference and Brand */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-500 uppercase mb-1">Referencia Fabricante</label>
                  <input
                    type="text"
                    placeholder="E.g. SP-124-TR"
                    value={editingRepuesto.referencia || ''}
                    onChange={(e) => setEditingRepuesto({ ...editingRepuesto, referencia: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-500 uppercase mb-1">Marca / Proveedor</label>
                  <input
                    type="text"
                    placeholder="E.g. Distribuidora Caracas"
                    value={editingRepuesto.proveedor || ''}
                    onChange={(e) => setEditingRepuesto({ ...editingRepuesto, proveedor: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* FINANCES (Costo vs Venta) */}
              <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 flex flex-col gap-3">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Manejo Financiero (EconoGRAPH)</span>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-600 mb-1">Costo de Compra (Taller)</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-xs text-slate-400 font-mono">$</span>
                      <input
                        type="number"
                        step="0.01"
                        required
                        min="0"
                        placeholder="0.00"
                        value={editingRepuesto.costo ?? ''}
                        onChange={(e) => setEditingRepuesto({ ...editingRepuesto, costo: parseFloat(e.target.value) || 0 })}
                        className="w-full pl-6 pr-2 py-1.5 text-xs text-slate-800 font-mono font-semibold border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-600 mb-1">Precio de Venta (Al Cliente)</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-xs text-slate-400 font-mono">$</span>
                      <input
                        type="number"
                        step="0.01"
                        required
                        min="0"
                        placeholder="0.00"
                        value={editingRepuesto.precio ?? ''}
                        onChange={(e) => setEditingRepuesto({ ...editingRepuesto, precio: parseFloat(e.target.value) || 0 })}
                        className="w-full pl-6 pr-2 py-1.5 text-xs text-slate-800 font-mono font-semibold border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-emerald-800 font-medium flex items-center justify-between mt-1 bg-white p-2 rounded-lg border border-emerald-100">
                  <span>Ganancia Unit. Estimada:</span>
                  <span className="font-extrabold">
                    ${(Number(editingRepuesto.precio || 0) - Number(editingRepuesto.costo || 0)).toFixed(2)}
                    {' '}({Number(editingRepuesto.costo || 0) ? (((Number(editingRepuesto.precio || 0) - Number(editingRepuesto.costo || 0)) / (Number(editingRepuesto.costo || 1) || 1) * 100).toFixed(0)) : 0}% margen)
                  </span>
                </div>
              </div>

              {/* Quantities & Location */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-500 uppercase mb-1">Cant. Inicial</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="0"
                    value={editingRepuesto.cantidad ?? ''}
                    onChange={(e) => setEditingRepuesto({ ...editingRepuesto, cantidad: parseInt(e.target.value) || 0 })}
                    className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-500 uppercase mb-1">Stock Mínimo</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="5"
                    value={editingRepuesto.stock_min ?? ''}
                    onChange={(e) => setEditingRepuesto({ ...editingRepuesto, stock_min: parseInt(e.target.value) || 0 })}
                    className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-500 uppercase mb-1">Ubicación Física</label>
                  <input
                    type="text"
                    placeholder="E.g. Estante A-2"
                    value={editingRepuesto.ubicacion || ''}
                    onChange={(e) => setEditingRepuesto({ ...editingRepuesto, ubicacion: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Footer CTA */}
              <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                {editingRepuesto.id ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('¿Confirma eliminar este producto de su listado? Las órdenes pasadas mantendrán históricos.')) {
                        onDeleteRepuesto(editingRepuesto.id!);
                        setEditingRepuesto(null);
                      }
                    }}
                    className="text-xs font-bold text-red-500 hover:text-red-700 bg-red-50 px-3 py-2 rounded-lg cursor-pointer transition-colors"
                  >
                    Eliminar Repuesto
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingRepuesto(null)}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-50 px-4 py-2 rounded-lg cursor-pointer"
                  >
                    Cerrar
                  </button>
                  <button
                    type="submit"
                    className="text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 px-5 py-2 rounded-lg cursor-pointer"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
