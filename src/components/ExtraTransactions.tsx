import React, { useState } from 'react';
import { TransaccionExtra } from '../types';
import { DollarSign, Plus, Trash2, ArrowUpRight, ArrowDownRight, Tag, BookOpen, Calendar, HelpCircle } from 'lucide-react';

interface ExtraTransactionsProps {
  transacciones: TransaccionExtra[];
  onAddTransaccion: (tx: TransaccionExtra) => void;
  onDeleteTransaccion: (id: string) => void;
}

export function ExtraTransactions({ transacciones, onAddTransaccion, onDeleteTransaccion }: ExtraTransactionsProps) {
  const [showForm, setShowForm] = useState(false);
  const [tipo, setTipo] = useState<'entrada' | 'salida'>('salida');
  const [categoria, setCategoria] = useState('Alquiler');
  const [descripcion, setDescripcion] = useState('');
  const [monto, setMonto] = useState<number>(0);
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);

  // Exclude mechanical salary payments to show true separate office expenses
  const displayedTxs = transacciones.filter(t => !t.categoria.startsWith('Pago Mecánico:'));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (monto <= 0 || !descripcion || !categoria) {
      alert('Favor rellenar todos los campos con valores correctos.');
      return;
    }

    const newTx: TransaccionExtra = {
      id: `TX-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      tipo,
      categoria,
      descripcion,
      monto,
      fecha,
      creado_en: new Date().toISOString()
    };

    onAddTransaccion(newTx);
    setDescripcion('');
    setMonto(0);
    setShowForm(false);
  };

  const totalInflows = displayedTxs.filter(t => t.tipo === 'entrada').reduce((sum, t) => sum + t.monto, 0);
  const totalOutflows = displayedTxs.filter(t => t.tipo === 'salida').reduce((sum, t) => sum + t.monto, 0);

  return (
    <div className="space-y-6 text-left">
      {/* Header section with summaries */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Inflows card */}
        <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest block">Otros Ingresos (Extras)</span>
            <span className="text-xl font-black text-emerald-950 font-mono">
              +${totalInflows.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <ArrowUpRight className="w-5 h-5 text-emerald-600 bg-emerald-100 p-1.5 rounded-full shrink-0" />
        </div>

        {/* Total Outflows card */}
        <div className="bg-rose-50 rounded-xl p-4 border border-rose-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-rose-800 uppercase tracking-widest block font-medium">Gastos de Local y Operación</span>
            <span className="text-xl font-black text-rose-950 font-mono">
              -${totalOutflows.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <ArrowDownRight className="w-5 h-5 text-rose-600 bg-rose-100 p-1.5 rounded-full shrink-0" />
        </div>

        {/* Action Button Card */}
        <div className="bg-slate-50 border border-slate-150/40 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 block font-bold uppercase">Registros Administrativos</span>
            <span className="text-sm text-slate-700 font-semibold block">{displayedTxs.length} transferencias</span>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="text-xs font-extrabold text-white bg-slate-900 hover:bg-slate-800 py-2 px-4 rounded-lg cursor-pointer transition-all"
          >
            Registrar Movimiento
          </button>
        </div>
      </div>

      {/* Main Table index */}
      <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-2xs">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
              <th className="py-2.5 px-4 font-bold">Fecha / ID</th>
              <th className="py-2.5 px-4 font-bold">Tipo</th>
              <th className="py-2.5 px-4 font-bold">Categoría</th>
              <th className="py-2.5 px-4 font-bold">Descripción</th>
              <th className="py-2.5 px-4 text-right font-bold">Monto ($)</th>
              <th className="py-2.5 px-4 text-right font-bold">Eliminar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {displayedTxs.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400 italic">No hay transacciones extras registradas.</td>
              </tr>
            ) : (
              displayedTxs.map((t) => {
                const isSalida = t.tipo === 'salida';
                return (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-600">
                      <div>{t.fecha}</div>
                      <span className="text-[9px] text-slate-400 font-mono">{t.id}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        isSalida ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {isSalida ? 'Egreso (Salida)' : 'Ingreso (Entrada)'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700">
                      <span className="flex items-center gap-1">
                        <Tag className="w-3 h-3 text-slate-400 shrink-0" />
                        {t.categoria}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 italic max-w-xs truncate" title={t.descripcion}>
                      {t.descripcion}
                    </td>
                    <td className={`py-3 px-4 text-right font-bold font-mono text-sm ${
                      isSalida ? 'text-rose-600' : 'text-emerald-600'
                    }`}>
                      {isSalida ? '-' : '+'}${t.monto.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          if (confirm('¿Desea borrar esta transacción de manera permanente?')) {
                            onDeleteTransaccion(t.id);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Transaction Addition Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-slate-800">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="bg-slate-950 text-white p-5">
              <h3 className="text-sm font-black tracking-tight flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-emerald-400" />
                Registrar Movimiento Financiero
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Escriba los detalles del flujo de caja administrativo que no pertenezca directamente a una orden de taller.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Cash Type selection */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo de Flujo</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setTipo('salida')}
                    className={`py-1.5 text-xs font-bold rounded-md ${
                      tipo === 'salida' ? 'bg-rose-600 text-white' : 'text-slate-600 hover:text-slate-800'
                    }`}
                  >
                    Egreso / Gasto
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipo('entrada')}
                    className={`py-1.5 text-xs font-bold rounded-md ${
                      tipo === 'entrada' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-800'
                    }`}
                  >
                    Ingreso / Entrada
                  </button>
                </div>
              </div>

              {/* Category, Date, Amount */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Categoría</label>
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-slate-50"
                  >
                    {tipo === 'salida' ? (
                      <>
                        <option value="Gastos Alternos">Gastos Alternos (Servicios, alimentos, etc.)</option>
                        <option value="Alquiler">Alquiler</option>
                        <option value="Servicios">Servicios (Luz, Agua)</option>
                        <option value="Suministros">Suministros / Herramientas</option>
                        <option value="Impuestos">Impuestos</option>
                        <option value="Publicidad">Publicidad y Marketing</option>
                        <option value="Otros Gastos">Otros Gastos</option>
                      </>
                    ) : (
                      <>
                        <option value="Servicios Extras">Servicios Externos</option>
                        <option value="Comisiones Ventas">Venta chatarra/metales</option>
                        <option value="Inyeccion Capital">Inyección Capital</option>
                        <option value="Otros Ingresos">Otros Ingresos</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fecha de Registro</label>
                  <input
                    type="date"
                    required
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-slate-50"
                  />
                </div>
              </div>

              {/* Amount USD */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Monto de Operación ($ USD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-mono font-bold text-slate-400">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0.00"
                    value={monto || ''}
                    onChange={(e) => setMonto(parseFloat(e.target.value) || 0)}
                    className="w-full pl-7 pr-3 py-1.5 text-xs font-mono font-bold border border-slate-200 rounded-lg bg-slate-50 focus:outline-none"
                  />
                </div>
              </div>

              {/* Explanation Description */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Descripción explicativa (*)</label>
                <input
                  type="text"
                  required
                  placeholder="E.g. Compra de llaves allen marca Stanley..."
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none"
                />
              </div>

              {/* Submit triggers */}
              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-50 px-4 py-2 rounded-lg cursor-pointer"
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  className={`text-xs font-bold text-white px-5 py-2 rounded-lg cursor-pointer ${
                    tipo === 'salida' ? 'bg-rose-600 hover:bg-rose-500' : 'bg-emerald-600 hover:bg-emerald-500'
                  }`}
                >
                  {tipo === 'salida' ? 'Registrar Gasto' : 'Registrar Ingreso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
