import React, { useState } from 'react';
import { Trabajador, Orden, TransaccionExtra, Repuesto, OrdenRepuestoItem } from '../types';
import { 
  Users, Plus, Percent, DollarSign, Calendar, Phone, Award, 
  ClipboardList, Wallet, Trash2, Search, Info, TrendingUp, 
  Sparkles, CheckCircle2, ShoppingCart, Tag, ArrowRight 
} from 'lucide-react';

interface WorkersManagerProps {
  trabajadores: Trabajador[];
  ordenes: Orden[];
  transacciones: TransaccionExtra[];
  repuestos: Repuesto[];
  onSaveTrabajador: (trabajador: Trabajador) => void;
  onDeleteTrabajador: (id: string) => void;
  onRecordPayout: (workerId: string, amount: number) => void;
  onSaveOrden: (orden: Orden) => void;
  onDeleteOrden: (id: string) => void;
  onUpdateInventoryStock: (sparePartsUsed: { id: string; qty: number }[]) => void;
}

export function WorkersManager({
  trabajadores,
  ordenes,
  transacciones,
  repuestos,
  onSaveTrabajador,
  onDeleteTrabajador,
  onRecordPayout,
  onSaveOrden,
  onDeleteOrden,
  onUpdateInventoryStock
}: WorkersManagerProps) {
  const [editingTrabajador, setEditingTrabajador] = useState<Partial<Trabajador> | null>(null);
  const [payoutWorkerId, setPayoutWorkerId] = useState<string | null>(null);
  const [payoutAmount, setPayoutAmount] = useState<number>(0);
  
  // Production Log State
  const [loggingProduction, setLoggingProduction] = useState<Partial<Orden> | null>(null);
  const [selectedPartId, setSelectedPartId] = useState<string>('');
  const [selectedPartQty, setSelectedPartQty] = useState<number>(1);
  const [selectedWorkFilter, setSelectedWorkFilter] = useState<string>('Todos');
  const [searchWorkTerm, setSearchWorkTerm] = useState<string>('');

  // Computes statistics per worker
  const getWorkerStats = (workerId: string, commissionPercent: number) => {
    // We filter orders assigned to this worker (whether they lack a client/vehicle or not)
    const completedOrders = ordenes.filter(
      (o) => o.trabajador_id === workerId && o.estado === 'terminada'
    );
    const totalLaborSold = completedOrders.reduce((sum, o) => sum + Number(o.labor_cost || 0), 0);
    const totalEarnings = (totalLaborSold * Number(commissionPercent || 40)) / 100;

    // Direct payout transactions made to this worker
    const paysRecorded = transacciones.filter(
      (t) => t.tipo === 'salida' && t.categoria === `Pago Mecánico: ${workerId}`
    );
    const totalPaid = paysRecorded.reduce((sum, t) => sum + Number(t.monto || 0), 0);
    const pendingBalance = totalEarnings - totalPaid;

    return {
      completedJobsCount: completedOrders.length,
      totalLaborSold,
      totalEarnings,
      totalPaid,
      pendingBalance,
      payoutHistory: paysRecorded
    };
  };

  // Global Workers Stats Summarized
  const totalProducedLabor = ordenes.filter(o => o.estado === 'terminada').reduce((sum, o) => sum + Number(o.labor_cost || 0), 0);
  const totalCommissionsEarned = trabajadores.reduce((sum, t) => {
    const stats = getWorkerStats(t.id, t.comision_porcentaje);
    return sum + stats.totalEarnings;
  }, 0);
  const totalCommissionsPaid = trabajadores.reduce((sum, t) => {
    const stats = getWorkerStats(t.id, t.comision_porcentaje);
    return sum + stats.totalPaid;
  }, 0);
  const totalCommissionsPending = totalCommissionsEarned - totalCommissionsPaid;

  const handleSubmitWorker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrabajador?.nombre || !editingTrabajador?.especialidad) {
      alert('Favor ingresar el nombre y la especialidad del trabajador.');
      return;
    }

    const worker: Trabajador = {
      id: editingTrabajador.id || `TRA-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
      nombre: editingTrabajador.nombre,
      especialidad: editingTrabajador.especialidad,
      telefono: editingTrabajador.telefono || '',
      fecha_ingreso: editingTrabajador.fecha_ingreso || new Date().toISOString().split('T')[0],
      comision_porcentaje: Number(editingTrabajador.comision_porcentaje ?? 40)
    };

    onSaveTrabajador(worker);
    setEditingTrabajador(null);
  };

  const handlePaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoutWorkerId || payoutAmount <= 0) return;

    onRecordPayout(payoutWorkerId, payoutAmount);
    setPayoutWorkerId(null);
    setPayoutAmount(0);
  };

  // Logging Production Form Actions
  const handleAddPartToWork = () => {
    if (!selectedPartId) return;
    const rep = repuestos.find((r) => r.id === selectedPartId);
    if (!rep) return;

    if (rep.cantidad < selectedPartQty) {
      alert(`Stock insuficiente de repuesto. Quedan ${rep.cantidad} unidades.`);
      return;
    }

    const currentParts = loggingProduction?.repuestos || [];
    const existingIndex = currentParts.findIndex((p) => p.id === selectedPartId);

    let updatedParts: OrdenRepuestoItem[];
    if (existingIndex > -1) {
      updatedParts = [...currentParts];
      const newQty = updatedParts[existingIndex].qty + selectedPartQty;
      if (rep.cantidad < newQty) {
        alert(`Stock insuficiente de repuesto. No puedes asignar ${newQty} uds.`);
        return;
      }
      updatedParts[existingIndex] = {
        ...updatedParts[existingIndex],
        qty: newQty
      };
    } else {
      updatedParts = [
        ...currentParts,
        {
          id: selectedPartId,
          qty: selectedPartQty,
          precio: rep.precio,
          costo: rep.costo
        }
      ];
    }

    setLoggingProduction({ ...loggingProduction, repuestos: updatedParts });
    setSelectedPartId('');
    setSelectedPartQty(1);
  };

  const handleRemovePartFromWork = (index: number) => {
    const currentParts = loggingProduction?.repuestos || [];
    const updatedParts = currentParts.filter((_, i) => i !== index);
    setLoggingProduction({ ...loggingProduction, repuestos: updatedParts });
  };

  const handleSaveProduction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggingProduction?.trabajador_id) {
      alert('Por favor selecciona el Trabajador encargado.');
      return;
    }
    if (!loggingProduction.descripcion) {
      alert('Favor ingresa la descripción de la producción de trabajo.');
      return;
    }

    const finalOrder: Orden = {
      id: loggingProduction.id || `ORD-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      cliente_id: null,
      auto_id: null,
      fecha: loggingProduction.fecha || new Date().toISOString().split('T')[0],
      descripcion: loggingProduction.descripcion,
      repuestos: loggingProduction.repuestos || [],
      observaciones: 'Estudio de Ingresos - Control Simplificado',
      labor_cost: Number(loggingProduction.labor_cost || 0),
      km_ingreso: 0,
      estado: 'terminada',
      creado_en: new Date().toISOString(),
      trabajador_id: loggingProduction.trabajador_id,
      diagnostico: 'Grabado directamente'
    };

    // Discount parts from stock
    if (finalOrder.repuestos.length > 0) {
      const inventoryChanges = finalOrder.repuestos.map(item => ({
        id: item.id,
        qty: item.qty
      }));
      onUpdateInventoryStock(inventoryChanges);
    }

    onSaveOrden(finalOrder);
    setLoggingProduction(null);
  };

  // Filter logs logic
  const filteredCompletedJobs = ordenes.filter(o => o.estado === 'terminada').filter(o => {
    const workerName = trabajadores.find(t => t.id === o.trabajador_id)?.nombre.toLowerCase() || 'desconocido';
    const desc = o.descripcion.toLowerCase();
    const matchSearch = workerName.includes(searchWorkTerm.toLowerCase()) || desc.includes(searchWorkTerm.toLowerCase());
    const matchWorker = selectedWorkFilter === 'Todos' || o.trabajador_id === selectedWorkFilter;
    return matchSearch && matchWorker;
  });

  return (
    <div className="space-y-6">
      {/* Dynamic Summary Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-center gap-3.5 shadow-xs">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Mano de Obra Producida</span>
            <span className="text-base font-black text-slate-900 block leading-tight mt-0.5">${totalProducedLabor.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
            <span className="text-[9.5px] text-slate-400 block">Total cobrado por servicios</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-center gap-3.5 shadow-xs">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
            <Percent className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Comisiones Acumuladas</span>
            <span className="text-base font-black text-slate-900 block leading-tight mt-0.5">${totalCommissionsEarned.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
            <span className="text-[9.5px] text-slate-400 block">Porcentaje asignado</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-center gap-3.5 shadow-xs">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Comisiones Liquidadas</span>
            <span className="text-base font-black text-slate-900 block leading-tight mt-0.5">${totalCommissionsPaid.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
            <span className="text-[9.5px] text-slate-400 block">Pagos efectuados</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-center gap-3.5 shadow-xs">
          <div className="p-2.5 bg-yellow-50 text-yellow-600 rounded-lg shrink-0">
            <Wallet className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Balance x Liquidar</span>
            <span className="text-base font-black text-slate-900 block leading-tight mt-0.5">${totalCommissionsPending.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
            <span className="text-[9.5px] font-semibold text-amber-600 block">Pendiente por pagar</span>
          </div>
        </div>
      </div>

      {/* Control Action Headers */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-extrabold text-slate-950 flex items-center gap-1.5 leading-tight">
            <Users className="w-4 h-4 text-blue-600" /> Control de Personal y Producción
          </h2>
          <p className="text-[10.5px] text-slate-500 font-medium">Configure comisiones de mecánicos por mano de obra e ingrese los trabajos producidos sin rodeos.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLoggingProduction({ fecha: new Date().toISOString().split('T')[0], repuestos: [], labor_cost: 0 })}
            className="flex items-center gap-1 text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-700 py-1.5 px-3 rounded-lg cursor-pointer transition-all shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Registrar Trabajo Producido
          </button>
          <button
            onClick={() => setEditingTrabajador({ comision_porcentaje: 40, fecha_ingreso: new Date().toISOString().split('T')[0] })}
            className="flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 py-1.5 px-3 rounded-lg cursor-pointer border border-slate-200 transition-all shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Adicionar Técnico
          </button>
        </div>
      </div>

      {/* Workers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {trabajadores.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 border-dashed rounded-xl p-8 text-center text-slate-400 col-span-full italic text-xs">
            No hay trabajadores registrados. Favor adicionar un técnico para iniciar el estudio de ingresos.
          </div>
        ) : (
          trabajadores.map((t) => {
            const stats = getWorkerStats(t.id, t.comision_porcentaje);

            return (
              <div key={t.id} className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-sm transition-all overflow-hidden flex flex-col justify-between">
                <div className="p-4 flex-1">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 bg-slate-900 text-white rounded-lg flex items-center justify-center font-mono font-black text-sm uppercase">
                        {t.nombre.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-xs font-black text-slate-900 leading-tight">{t.nombre}</h3>
                        <span className="text-[10px] text-blue-600 font-bold flex items-center gap-0.5 mt-0.5">
                          <Award className="w-3 h-3" /> {t.especialidad}
                        </span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => setEditingTrabajador(t)}
                      className="text-[10px] font-bold text-slate-500 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 py-1 px-2.5 rounded border border-slate-200 cursor-pointer"
                    >
                      Editar
                    </button>
                  </div>

                  {/* Worker Metadata fields */}
                  <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] text-slate-500 border-t border-b border-slate-100 py-2.5 my-3">
                    <div className="flex items-center gap-1 px-1 font-semibold">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{t.telefono || 'Sin Contacto'}</span>
                    </div>
                    <div className="flex items-center gap-1 px-1 font-semibold">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>Ingreso: {t.fecha_ingreso}</span>
                    </div>
                  </div>

                  {/* Historical numbers */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10.5px]">
                      <span className="text-slate-500 font-semibold flex items-center gap-1">
                        <ClipboardList className="w-3 h-3 text-slate-400" /> Trabajos Registrados:
                      </span>
                      <span className="font-bold text-slate-800">{stats.completedJobsCount} logs</span>
                    </div>

                    <div className="flex justify-between items-center text-[10.5px]">
                      <span className="text-slate-500 font-semibold">Mano de Obra Producida:</span>
                      <span className="font-bold text-slate-800 font-mono">${stats.totalLaborSold.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between items-center text-[10.5px]">
                      <span className="text-slate-500 font-semibold flex items-center gap-1">
                        <Percent className="w-3 h-3 text-blue-500" /> Comisión de Mano de Obra:
                      </span>
                      <span className="font-black text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded text-[10px]">
                        {t.comision_porcentaje}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 border-t border-slate-200/80 flex flex-col gap-2.5">
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="bg-white p-1.5 rounded border border-slate-200">
                      <span className="text-[9px] uppercase font-bold text-slate-450 block tracking-wider">Acumulado</span>
                      <span className="text-xs font-bold text-slate-700 font-mono">
                        ${stats.totalEarnings.toFixed(2)}
                      </span>
                    </div>
                    <div className="bg-white p-1.5 rounded border border-slate-200">
                      <span className="text-[9px] uppercase font-bold text-slate-450 block tracking-wider">Monto Pagado</span>
                      <span className="text-xs font-bold text-slate-600 font-mono">
                        ${stats.totalPaid.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Pending worker liquid balance */}
                  <div className="bg-slate-900 text-white rounded-lg p-2.5 flex items-center justify-between">
                    <div>
                      <span className="text-[8.5px] uppercase font-medium text-slate-400 tracking-wider block">Por Liquidar</span>
                      <span className="text-xs font-bold font-mono text-emerald-400">
                        ${stats.pendingBalance.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex gap-1.5">
                      <button
                        onClick={() => setLoggingProduction({ trabajador_id: t.id, fecha: new Date().toISOString().split('T')[0], repuestos: [], labor_cost: 0 })}
                        className="p-1 px-1.5 text-[9px] font-black bg-blue-600 text-white hover:bg-blue-500 border border-blue-600 rounded cursor-pointer leading-tight"
                        title="Agregar trabajo realizado"
                      >
                        Log Trabajo
                      </button>
                      <button
                        disabled={stats.pendingBalance <= 0}
                        onClick={() => {
                          setPayoutWorkerId(t.id);
                          setPayoutAmount(Number(stats.pendingBalance.toFixed(2)));
                        }}
                        className={`flex items-center gap-0.5 text-[9px] font-black p-1 px-1.5 rounded border cursor-pointer select-none leading-tight transition-all ${
                          stats.pendingBalance > 0 
                            ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-505' 
                            : 'bg-slate-800 text-slate-400 border-slate-700 cursor-not-allowed opacity-50'
                        }`}
                        title="Liquidar comisiones acumuladas"
                      >
                        Pagar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Production Log History Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Historial de Trabajos y Producción de Ingresos</h3>
            <p className="text-[10.5px] text-slate-450 mt-0.5">Estudio financiero pormenorizado del valor del servicio, costos de repuestos usados y márgenes netos del negocio.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Worker Filter */}
            <select
              value={selectedWorkFilter}
              onChange={(e) => setSelectedWorkFilter(e.target.value)}
              className="text-[11px] font-bold bg-slate-50 border border-slate-200 py-1.5 px-2.5 rounded-lg text-slate-600 focus:outline-none"
            >
              <option value="Todos">Todos los Técnicos</option>
              {trabajadores.map(t => (
                <option key={t.id} value={t.id}>{t.nombre}</option>
              ))}
            </select>

            {/* General Log Search */}
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar trabajo o repuesto..."
                value={searchWorkTerm}
                onChange={(e) => setSearchWorkTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-550 italic">
                <th className="py-2 px-3 text-center">Fecha</th>
                <th className="py-2 px-3">Técnico encargado</th>
                <th className="py-2 px-3">Descripción Trabajo</th>
                <th className="py-2 px-3 text-right">Mano Obra ($)</th>
                <th className="py-2 px-3 text-right">Comisión (%)</th>
                <th className="py-2 px-3 text-right">Repuestos (PV / Coste)</th>
                <th className="py-2 px-4 text-right bg-blue-50/50 text-blue-900 border-l border-blue-100 font-black">Utilidad Neta Taller ($)</th>
                <th className="py-2 px-3 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 text-xs">
              {filteredCompletedJobs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[11px] text-slate-400 italic">
                    Sin registros de producción de trabajo para los criterios seleccionados.
                  </td>
                </tr>
              ) : (
                filteredCompletedJobs.map((o) => {
                  const workerObj = trabajadores.find(t => t.id === o.trabajador_id);
                  const workerName = workerObj?.nombre || 'Desconocido';
                  const comPercent = Number(o.comision_porcentaje ?? workerObj?.comision_porcentaje ?? 40);
                  const comAmount = (Number(o.labor_cost || 0) * comPercent) / 100;

                  // Spares analysis
                  const totalPartsRetail = o.repuestos.reduce((sum, item) => sum + (Number(item.precio ?? 0) * item.qty), 0);
                  const totalPartsCost = o.repuestos.reduce((sum, item) => sum + (Number(item.costo || (Number(item.precio ?? 0) * 0.6)) * item.qty), 0);
                  const partsNetGain = totalPartsRetail - totalPartsCost;

                  // Operating income for workshop
                  // Business profits on labor (Retail labor cost charged - paid commission) + profit from selling price over cost of spares
                  const workshopRevenue = (Number(o.labor_cost || 0) - comAmount) + partsNetGain;

                  return (
                    <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 text-center font-mono text-[10.5px] text-slate-500 whitespace-nowrap">{o.fecha}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-800 leading-tight">{workerName}</div>
                        <span className="text-[9.5px] text-slate-400 font-medium">Comisión: {comPercent}%</span>
                      </td>
                      <td className="py-2.5 px-3 max-w-xs">
                        <div className="truncate font-semibold text-slate-700" title={o.descripcion}>{o.descripcion}</div>
                        {o.repuestos.length > 0 && (
                          <div className="text-[9.5px] text-indigo-505 font-mono truncate leading-none mt-0.5">
                            {o.repuestos.map(item => {
                              const repName = repuestos.find(r => r.id === item.id)?.nombre || 'Repuesto';
                              return `${repName} (x${item.qty})`;
                            }).join(', ')}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-800 font-mono">${o.labor_cost.toLocaleString('es-VE', { minimumFractionDigits: 1 })}</td>
                      <td className="py-2.5 px-3 text-right text-slate-500 text-[11px]">
                        <div className="font-bold text-slate-700 font-mono">${comAmount.toFixed(1)}</div>
                        <span className="text-[9px] block text-slate-400 leading-tight">para técnico</span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        {o.repuestos.length === 0 ? (
                          <span className="text-slate-350 italic text-[10px]">Sin repuestos</span>
                        ) : (
                          <>
                            <div className="text-emerald-700 font-bold">${totalPartsRetail.toFixed(1)} <span className="text-[9px] text-slate-450 font-normal">Venta</span></div>
                            <div className="text-slate-500 text-[10px]">${totalPartsCost.toFixed(1)} <span className="text-[9px] text-slate-400 font-normal">Costo</span></div>
                          </>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-right bg-blue-50/20 text-blue-900 border-l border-blue-100 font-bold font-mono">
                        <div className={workshopRevenue >= 0 ? 'text-blue-800 font-black' : 'text-rose-700 font-black'}>
                          ${workshopRevenue.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                        </div>
                        <span className="text-[9px] text-slate-400 block font-normal leading-none mt-0.5">(${partsNetGain >= 0 ? `+${partsNetGain.toFixed(1)}` : partsNetGain.toFixed(1)} marg. rep)</span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => {
                            if (confirm('¿Restablecer e inactivar este registro de producción? (Se devolverán los materiales si aplica)')) {
                              onDeleteOrden(o.id);
                            }
                          }}
                          className="p-1 px-1.5 bg-red-50 hover:bg-red-100 font-bold text-red-500 rounded border border-red-200 hover:border-red-300 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Logging Production Form Modal Component */}
      {loggingProduction && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-slate-800">
          <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl border border-slate-250 overflow-hidden">
            <div className="bg-slate-900 text-white p-4">
              <h3 className="text-sm font-black tracking-tight flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400" />
                Registrar Producción / Trabajo Realizado
              </h3>
              <p className="text-[10.5px] text-slate-400 mt-0.5">Modo simplificado para acumular ingresos por servicio, determinar salarios liquidables y calcular ganancias inmediatas.</p>
            </div>

            <form onSubmit={handleSaveProduction} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10.5px] font-bold text-slate-500 uppercase mb-1">Técnico Responsable (*)</label>
                  <select
                    required
                    value={loggingProduction.trabajador_id || ''}
                    onChange={(e) => setLoggingProduction({ ...loggingProduction, trabajador_id: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none"
                  >
                    <option value="">Selecciona Técnico...</option>
                    {trabajadores.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nombre} ({t.comision_porcentaje}% comision)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10.5px] font-bold text-slate-500 uppercase mb-1">Fecha de Ejecución (*)</label>
                  <input
                    type="date"
                    required
                    value={loggingProduction.fecha || ''}
                    onChange={(e) => setLoggingProduction({ ...loggingProduction, fecha: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10.5px] font-bold text-slate-500 uppercase mb-1">Descripción de Trabajo Producido (*)</label>
                <input
                  type="text"
                  required
                  placeholder="E.g. Rectificación de Motor / Afinación de Frenos"
                  value={loggingProduction.descripcion || ''}
                  onChange={(e) => setLoggingProduction({ ...loggingProduction, descripcion: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Labor Charges */}
                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Cobro por Mano de Obra</label>
                    {loggingProduction.trabajador_id && (
                      <span className="text-[9px] text-blue-600 bg-white border border-blue-100 px-1 py-0.5 rounded font-black">
                        Com: {trabajadores.find(t => t.id === loggingProduction.trabajador_id)?.comision_porcentaje}%
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2.5 text-xs font-mono font-bold text-slate-400">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      placeholder="Mano de obra producida"
                      value={loggingProduction.labor_cost || ''}
                      onChange={(e) => setLoggingProduction({ ...loggingProduction, labor_cost: parseFloat(e.target.value) || 0 })}
                      className="w-full text-xs font-mono font-bold pl-6 pr-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none"
                    />
                  </div>
                  <p className="text-[9px] text-slate-400 leading-tight">De este cobro, se descontará el sueldo adjudicado al técnico por su comisión.</p>
                </div>

                {/* Spare parts consumption details summary */}
                <div className="bg-blue-50/50 border border-blue-100 p-3.5 rounded-xl flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-blue-900 tracking-wider block">Real-time Margin Estimated</span>
                    <div className="mt-2 space-y-1 text-[10.5px]">
                      <div className="flex justify-between font-mono">
                        <span className="text-slate-500">Net Labor Margin:</span>
                        <span className="font-bold">
                          ${(
                            Number(loggingProduction.labor_cost || 0) - 
                            (((Number(loggingProduction.labor_cost || 0) * Number(trabajadores.find(t => t.id === loggingProduction.trabajador_id)?.comision_porcentaje || 0)) / 100))
                          ).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between font-mono">
                        <span className="text-slate-500">Net Spare profit:</span>
                        <span className="font-bold text-emerald-700">
                          ${(
                            (loggingProduction.repuestos || []).reduce((sum, item) => sum + (Number(item.precio ?? 0) * item.qty), 0) -
                            (loggingProduction.repuestos || []).reduce((sum, item) => sum + (Number(item.costo || (Number(item.precio ?? 0) * 0.6)) * item.qty), 0)
                          ).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-blue-150 pt-2 flex justify-between items-center text-xs font-black text-blue-950 font-mono mt-2">
                    <span>Workshop Net Profit:</span>
                    <span>
                      ${(
                        (Number(loggingProduction.labor_cost || 0) - 
                        (((Number(loggingProduction.labor_cost || 0) * Number(loggingProduction.comision_porcentaje ?? trabajadores.find(t => t.id === loggingProduction.trabajador_id)?.comision_porcentaje ?? 40)) / 100))) +
                        ((loggingProduction.repuestos || []).reduce((sum, item) => sum + (Number(item.precio ?? 0) * item.qty), 0) -
                        (loggingProduction.repuestos || []).reduce((sum, item) => sum + (Number(item.costo || (Number(item.precio ?? 0) * 0.6)) * item.qty), 0))
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Spare Parts Integration Picker */}
              <div className="border border-slate-200 rounded-xl p-3.5 space-y-3.5 bg-slate-50">
                <div className="flex items-center justify-between border-b pb-2 border-slate-200/60">
                  <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                    <ShoppingCart className="w-3.5 h-3.5 text-slate-400" /> Asignar Repuestos Usados del Inventario (Establece precio Coste y Venta automáticamente)
                  </span>
                </div>

                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="block text-[9.5px] text-slate-500 font-bold mb-0.5">Buscar Repuesto en Stock</label>
                    <select
                      value={selectedPartId}
                      onChange={(e) => setSelectedPartId(e.target.value)}
                      className="w-full text-xs p-1.5 border border-slate-200 rounded bg-white focus:outline-none"
                    >
                      <option value="">Selecciona repuesto...</option>
                      {repuestos.filter(r => r.cantidad > 0).map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.nombre} - Cd: {r.codigo} (${r.precio} VTA / Coste: ${r.costo}) [Stock: {r.cantidad} uds]
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-20">
                    <label className="block text-[9.5px] text-slate-500 font-bold mb-0.5">Cant.</label>
                    <input
                      type="number"
                      min="1"
                      className="w-full text-xs p-1.5 border border-slate-200 rounded bg-white focus:outline-none text-center font-bold"
                      value={selectedPartQty}
                      onChange={(e) => setSelectedPartQty(parseInt(e.target.value) || 1)}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleAddPartToWork}
                    className="p-1.5 px-3 bg-slate-900 border border-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded cursor-pointer leading-tight mb-[1px]"
                  >
                    Asignar
                  </button>
                </div>

                {/* Sub-table with current selected parts */}
                {(loggingProduction.repuestos || []).length > 0 ? (
                  <div className="bg-white rounded-lg border border-slate-150/80 overflow-hidden divide-y divide-slate-100 max-h-[140px] overflow-y-auto">
                    {(loggingProduction.repuestos || []).map((item, index) => {
                      const repItem = repuestos.find(r => r.id === item.id);
                      const repName = repItem?.nombre || 'Repuesto';
                      return (
                        <div key={`${item.id}-${index}`} className="p-2 flex items-center justify-between text-[11px] gap-2">
                          <div className="font-semibold text-slate-700 flex-1 truncate">
                            {repName} <span className="text-[10px] text-slate-400 font-normal">({item.qty} uds)</span>
                          </div>
                          
                          <div className="flex gap-4 shrink-0 font-mono text-right items-center">
                            <div>
                              <span className="text-emerald-700 font-bold block">${(Number(item.precio ?? 0) * item.qty).toFixed(1)} <span className="text-[9px] text-slate-400 font-normal">PV</span></span>
                              <span className="text-slate-500 block text-[9.5px] leading-tight">Coste: ${(Number(item.costo || (Number(item.precio ?? 0) * 0.6)) * item.qty).toFixed(1)}</span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemovePartFromWork(index)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded font-bold transition-colors cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-400 italic text-center py-2">
                    Sin repuestos cargados para este trabajo (Mano de obra pura).
                  </p>
                )}
              </div>

              {/* CTAs */}
              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setLoggingProduction(null)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-50 px-4 py-2 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-lg cursor-pointer flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Grabar Producción
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Worker Modal */}
      {editingTrabajador && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-slate-800">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="bg-slate-900 text-white p-4">
              <h3 className="text-sm font-black tracking-tight flex items-center gap-2">
                <Users className="w-4.5 h-4.5 text-blue-400" />
                {editingTrabajador.id ? 'Modificar Registro de Tecnico' : 'Registrar Nuevo Técnico'}
              </h3>
              <p className="text-[10.5px] text-slate-450 mt-0.5">Configure la especialidad asignada y la cuota de comisión estipulada para el cálculo automático de comisiones.</p>
            </div>

            <form onSubmit={handleSubmitWorker} className="p-5 space-y-4">
              <div>
                <label className="block text-[10.5px] font-bold text-slate-500 uppercase mb-1">Nombre Completo (*)</label>
                <input
                  type="text"
                  required
                  placeholder="E.g. Wilmer Castellanos"
                  value={editingTrabajador.nombre || ''}
                  onChange={(e) => setEditingTrabajador({ ...editingTrabajador, nombre: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[10.5px] font-bold text-slate-500 uppercase mb-1">Especialidad Técnica (*)</label>
                <input
                  type="text"
                  required
                  placeholder="E.g. Mecánica de Motores, Alineador, Electricista"
                  value={editingTrabajador.especialidad || ''}
                  onChange={(e) => setEditingTrabajador({ ...editingTrabajador, especialidad: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10.5px] font-bold text-slate-500 uppercase mb-1">Teléfono</label>
                  <input
                    type="text"
                    placeholder="E.g. 0412-5551122"
                    value={editingTrabajador.telefono || ''}
                    onChange={(e) => setEditingTrabajador({ ...editingTrabajador, telefono: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10.5px] font-bold text-slate-500 uppercase mb-1">Fecha Ingreso</label>
                  <input
                    type="date"
                    required
                    value={editingTrabajador.fecha_ingreso || ''}
                    onChange={(e) => setEditingTrabajador({ ...editingTrabajador, fecha_ingreso: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="bg-slate-55 bg-blue-50/50 p-4 border border-blue-100 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-blue-950 uppercase">% de Comisión Adjudicada</span>
                  <span className="text-xs font-black text-blue-700 bg-white border border-blue-200 px-2 py-0.5 rounded font-mono">
                    {editingTrabajador.comision_porcentaje}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={editingTrabajador.comision_porcentaje ?? 40}
                  onChange={(e) => setEditingTrabajador({ ...editingTrabajador, comision_porcentaje: parseInt(e.target.value) })}
                  className="w-full h-1 bg-blue-200 rounded appearance-none cursor-pointer accent-blue-600"
                />
                <p className="text-[9.2px] text-blue-900 italic leading-snug">
                  Los técnicos acumularán esta fracción de la mano de obra producida en su cuenta liquidable por cada trabajo guardado.
                </p>
              </div>

              {/* CTAs */}
              <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                {editingTrabajador.id ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('¿Eliminar permanente de la nómina? Se mantendrán sus registros históricos.')) {
                        onDeleteTrabajador(editingTrabajador.id!);
                        setEditingTrabajador(null);
                      }
                    }}
                    className="text-xs font-bold text-red-500 hover:text-red-700 bg-red-50 px-3 py-1.5 rounded-lg border border-red-200 cursor-pointer"
                  >
                    Eliminar Registro
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingTrabajador(null)}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-50 px-4 py-2 rounded-lg cursor-pointer"
                  >
                    Salir
                  </button>
                  <button
                    type="submit"
                    className="text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 px-5 py-2 rounded-lg cursor-pointer"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record payout modal */}
      {payoutWorkerId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-slate-800">
          <div className="bg-white rounded-xl max-w-sm w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="bg-slate-900 text-white p-4">
              <h3 className="text-xs font-black tracking-tight flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-emerald-400" />
                Registrar Pago de Comisión Realizado
              </h3>
              <p className="text-[10.5px] text-slate-400 mt-0.5">
                Valide el monto entregado en efectivo, transferencia o abono al canjear comisiones de {trabajadores.find((t) => t.id === payoutWorkerId)?.nombre}.
              </p>
            </div>

            <form onSubmit={handlePaySubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-[10.5px] font-bold text-slate-500 uppercase mb-1">Monto a Liquidar ($ USD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-mono font-bold text-slate-450">$</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="0.01"
                    placeholder="Monto"
                    value={payoutAmount || ''}
                    onChange={(e) => setPayoutAmount(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs font-mono font-bold pl-7 pr-4 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setPayoutWorkerId(null);
                    setPayoutAmount(0);
                  }}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-50 px-4 py-2 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-505 px-5 py-2 rounded-lg cursor-pointer"
                >
                  Liquidar Pago
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
