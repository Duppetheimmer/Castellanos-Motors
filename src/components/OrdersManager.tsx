import React, { useState } from 'react';
import { Orden, Cliente, Vehiculo, Trabajador, Repuesto, EstadoOrden, OrdenRepuestoItem } from '../types';
import { FileText, Plus, Search, Edit2, Play, CheckCircle2, AlertCircle, ShoppingCart, HelpCircle, User, Wrench, RefreshCw, Calendar } from 'lucide-react';
import { SparePartSearchPicker } from './SparePartSearchPicker';

interface OrdersManagerProps {
  ordenes: Orden[];
  clientes: Cliente[];
  vehiculos: Vehiculo[];
  trabajadores: Trabajador[];
  repuestos: Repuesto[];
  onSaveOrden: (orden: Orden) => void;
  onDeleteOrden: (id: string) => void;
  onUpdateInventoryStock: (sparePartsUsed: { id: string; qty: number }[]) => void;
  onSaveCliente: (cliente: Cliente) => void;
  onSaveVehiculo: (vehiculo: Vehiculo) => void;
}

export function OrdersManager({
  ordenes,
  clientes,
  vehiculos,
  trabajadores,
  repuestos,
  onSaveOrden,
  onDeleteOrden,
  onUpdateInventoryStock,
  onSaveCliente,
  onSaveVehiculo
}: OrdersManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEstado, setSelectedEstado] = useState<string>('Todas');
  const [selectedMecanico, setSelectedMecanico] = useState<string>('Todos');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  const [editingOrden, setEditingOrden] = useState<Partial<Orden> | null>(null);

  // States for Quick-add overlays
  const [showAddClient, setShowAddClient] = useState(false);
  const [showAddVehiculo, setShowAddVehiculo] = useState(false);

  // States for Quick-add Client Form
  const [quickClient, setQuickClient] = useState({
    nombre: '',
    cedula: '',
    telefono: '',
    email: '',
    direccion: '',
    observaciones: ''
  });

  // States for Quick-add Vehicle Form
  const [quickVehiculo, setQuickVehiculo] = useState({
    marca: '',
    modelo: '',
    placa: '',
    anio: new Date().getFullYear(),
    color: '#A1A1A1',
    km: 0,
    observaciones: ''
  });

  const handleQuickSaveClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickClient.nombre || !quickClient.cedula) {
      alert('Por favor complete los campos obligatorios: Nombre y Cédula');
      return;
    }

    const newClientId = `CLI-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    const clientToSave: Cliente = {
      id: newClientId,
      nombre: quickClient.nombre,
      cedula: quickClient.cedula,
      telefono: quickClient.telefono || '',
      email: quickClient.email || '',
      direccion: quickClient.direccion || '',
      nacimiento: '',
      observaciones: quickClient.observaciones || '',
      fecha_reg: new Date().toISOString().split('T')[0]
    };

    onSaveCliente(clientToSave);
    
    // Automatically select the newly created client
    if (editingOrden) {
      setEditingOrden({
        ...editingOrden,
        cliente_id: newClientId,
        auto_id: '' // reset auto because client changed
      });
    }

    // Reset fields and close
    setQuickClient({
      nombre: '',
      cedula: '',
      telefono: '',
      email: '',
      direccion: '',
      observaciones: ''
    });
    setShowAddClient(false);
  };

  const handleQuickSaveVehiculo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrden?.cliente_id) {
      alert('Debe tener un cliente seleccionado para agregarle un vehículo.');
      return;
    }
    if (!quickVehiculo.marca || !quickVehiculo.modelo || !quickVehiculo.placa) {
      alert('Por favor complete los campos obligatorios: Marca, Modelo y Placa');
      return;
    }

    const newVehId = `VEH-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    const vehToSave: Vehiculo = {
      id: newVehId,
      cliente_id: editingOrden.cliente_id,
      marca: quickVehiculo.marca,
      modelo: quickVehiculo.modelo,
      placa: quickVehiculo.placa.toUpperCase(),
      anio: Number(quickVehiculo.anio ?? new Date().getFullYear()),
      color: quickVehiculo.color || '#A1A1A1',
      vin: '',
      km: Number(quickVehiculo.km ?? 0),
      observaciones: quickVehiculo.observaciones || '',
      fecha_reg: new Date().toISOString().split('T')[0]
    };

    onSaveVehiculo(vehToSave);

    // Automatically select the newly created vehicle
    if (editingOrden) {
      setEditingOrden({
        ...editingOrden,
        auto_id: newVehId
      });
    }

    // Reset fields and close
    setQuickVehiculo({
      marca: '',
      modelo: '',
      placa: '',
      anio: new Date().getFullYear(),
      color: '#A1A1A1',
      km: 0,
      observaciones: ''
    });
    setShowAddVehiculo(false);
  };

  // Helper selectors
  const getClienteName = (id: string | null) => {
    if (!id) return 'Sin Cliente';
    return clientes.find((c) => c.id === id)?.nombre || 'Desconocido';
  };

  const getVehiculoPlaca = (id: string | null) => {
    if (!id) return 'Sin Placa';
    const v = vehiculos.find((vh) => vh.id === id);
    return v ? `${v.marca} ${v.modelo} (${v.placa})` : 'Desconocido';
  };

  const getTrabajadorName = (id: string | null) => {
    if (!id) return 'Sin Asignar';
    return trabajadores.find((t) => t.id === id)?.nombre || 'Desconocido';
  };

  // Filters logic
  const filtered = ordenes.filter((o) => {
    const cliName = getClienteName(o.cliente_id).toLowerCase();
    const vehPlaca = getVehiculoPlaca(o.auto_id).toLowerCase();
    const desc = o.descripcion.toLowerCase();
    const matchesSearch =
      cliName.includes(searchTerm.toLowerCase()) ||
      vehPlaca.includes(searchTerm.toLowerCase()) ||
      desc.includes(searchTerm.toLowerCase()) ||
      o.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesEstado = selectedEstado === 'Todas' || o.estado === selectedEstado;
    const matchesMecanico = selectedMecanico === 'Todos' || o.trabajador_id === selectedMecanico;

    let matchesDate = true;
    if (filterStartDate) {
      matchesDate = matchesDate && (o.fecha >= filterStartDate);
    }
    if (filterEndDate) {
      matchesDate = matchesDate && (o.fecha <= filterEndDate);
    }

    return matchesSearch && matchesEstado && matchesMecanico && matchesDate;
  });

  // Handle addition of a part into the order edit/creation form
  const [selectedPartId, setSelectedPartId] = useState('');
  const [selectedPartQty, setSelectedPartQty] = useState(1);

  const handleAddPart = () => {
    if (!selectedPartId) return;
    const rep = repuestos.find((r) => r.id === selectedPartId);
    if (!rep) return;

    if (rep.cantidad < selectedPartQty) {
      alert(`Stock insuficiente. Solo quedan ${rep.cantidad} unidades.`);
      return;
    }

    const currentParts = editingOrden?.repuestos || [];
    const existingIndex = currentParts.findIndex((p) => p.id === selectedPartId);

    let updatedParts: OrdenRepuestoItem[];
    if (existingIndex > -1) {
      updatedParts = [...currentParts];
      updatedParts[existingIndex] = {
        ...updatedParts[existingIndex],
        qty: updatedParts[existingIndex].qty + selectedPartQty
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

    setEditingOrden({ ...editingOrden, repuestos: updatedParts });
    setSelectedPartId('');
    setSelectedPartQty(1);
  };

  const handleRemovePart = (index: number) => {
    const currentParts = editingOrden?.repuestos || [];
    const updatedParts = currentParts.filter((_, i) => i !== index);
    setEditingOrden({ ...editingOrden, repuestos: updatedParts });
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrden?.cliente_id || !editingOrden?.auto_id || !editingOrden?.trabajador_id) {
      alert('Favor seleccionar Cliente, Vehículo y Trabajor.');
      return;
    }

    const originalOrder = editingOrden.id ? ordenes.find(o => o.id === editingOrden.id) : null;
    const stateTransitionToCompleted = editingOrden.estado === 'terminada' && (!originalOrder || originalOrder.estado !== 'terminada');

    const assignedWorker = trabajadores.find((t) => t.id === editingOrden.trabajador_id);
    const finalOrder: Orden = {
      id: editingOrden.id || `ORD-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      cliente_id: editingOrden.cliente_id,
      auto_id: editingOrden.auto_id,
      fecha: editingOrden.fecha || new Date().toISOString().split('T')[0],
      descripcion: editingOrden.descripcion || '',
      repuestos: editingOrden.repuestos || [],
      observaciones: editingOrden.observaciones || '',
      labor_cost: Number(editingOrden.labor_cost || 0),
      km_ingreso: Number(editingOrden.km_ingreso || 0),
      estado: (editingOrden.estado || 'abierta') as EstadoOrden,
      creado_en: editingOrden.creado_en || new Date().toISOString(),
      trabajador_id: editingOrden.trabajador_id,
      diagnostico: editingOrden.diagnostico || '',
      comision_porcentaje: Number(editingOrden.comision_porcentaje ?? assignedWorker?.comision_porcentaje ?? 40),
    };

    // If we transition to "terminada", discount stock of items used
    if (stateTransitionToCompleted) {
      const inventoryChanges = finalOrder.repuestos.map(item => ({
        id: item.id,
        qty: item.qty
      }));
      onUpdateInventoryStock(inventoryChanges);
    }

    onSaveOrden(finalOrder);
    setEditingOrden(null);
  };

  // Calculate order item financial overview in-form
  const calculateTotalOrderCost = (parts: OrdenRepuestoItem[], labor: number) => {
    const partsTotal = parts.reduce((sum, item) => sum + (Number(item.precio || 0) * Number(item.qty || 0)), 0);
    return partsTotal + Number(labor || 0);
  };

  const calculateTotalOrderPartInvestment = (parts: OrdenRepuestoItem[]) => {
    return parts.reduce((sum, item) => {
      const partCost = Number(item.costo || (Number(item.precio || 0) * 0.6));
      return sum + (partCost * Number(item.qty || 0));
    }, 0);
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-slate-100 shadow-xs">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por placa, cliente o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Filters Panel */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          {/* Exact Date Range Filter */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 py-1.5 px-2.5 rounded-lg text-xs text-slate-600 shrink-0">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-semibold text-[10px] text-slate-500">Desde:</span>
            <input
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="bg-transparent border-0 focus:outline-none focus:ring-0 text-slate-700 text-[11px] py-0 px-1 font-semibold w-24"
            />
            <span className="font-semibold text-[10px] text-slate-500">Hasta:</span>
            <input
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="bg-transparent border-0 focus:outline-none focus:ring-0 text-slate-700 text-[11px] py-0 px-1 font-semibold w-24"
            />
            {(filterStartDate || filterEndDate) && (
              <button
                type="button"
                onClick={() => {
                  setFilterStartDate('');
                  setFilterEndDate('');
                }}
                className="text-[9px] bg-slate-200 hover:bg-slate-300 text-slate-700 px-1.5 py-0.5 rounded font-black cursor-pointer transition-colors"
                title="Limpiar rango de fechas"
              >
                Limpiar
              </button>
            )}
          </div>

          <select
            value={selectedEstado}
            onChange={(e) => setSelectedEstado(e.target.value)}
            className="text-xs font-semibold bg-slate-50 border border-slate-200 py-2 px-3 rounded-lg text-slate-600 focus:outline-none"
          >
            <option value="Todas">Estados: Todos</option>
            <option value="abierta">Abiertas 📥</option>
            <option value="en_proceso">En Proceso ⚙️</option>
            <option value="terminada">Terminadas ✅</option>
          </select>

          <select
            value={selectedMecanico}
            onChange={(e) => setSelectedMecanico(e.target.value)}
            className="text-xs font-semibold bg-slate-50 border border-slate-200 py-2 px-3 rounded-lg text-slate-600 focus:outline-none"
          >
            <option value="Todos">Trabajador: Todos</option>
            {trabajadores.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre}
              </option>
            ))}
          </select>

          <button
            onClick={() => setEditingOrden({ repuestos: [], estado: 'abierta', labor_cost: 0, fecha: new Date().toISOString().split('T')[0] })}
            className="flex items-center gap-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 py-2 px-4 rounded-lg cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            Nueva Orden
          </button>
        </div>
      </div>

      {/* Grid of Active Orders */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.length === 0 ? (
          <div className="col-span-full bg-slate-50 rounded-2xl p-12 text-center text-xs text-slate-400 italic border border-dashed border-slate-200">
            Ninguna orden de trabajo coincide con los filtros aplicados.
          </div>
        ) : (
          filtered.map((ord) => {
            const labor = ord.labor_cost;
            const partsSold = ord.repuestos.reduce((sum, item) => sum + (Number(item.precio || 0) * item.qty), 0);
            const partsCostObj = ord.repuestos.reduce((sum, item) => sum + (Number(item.costo || (Number(item.precio || 0) * 0.6)) * item.qty), 0);
            const totalBill = labor + partsSold;
            
            // Commission
            const mech = trabajadores.find((t) => t.id === ord.trabajador_id);
            const commissionRate = mech?.comision_porcentaje ?? ord.comision_porcentaje ?? 40;
            const mechEarnings = (labor * commissionRate) / 100;
            const workshopPartsProfit = partsSold - partsCostObj;
            const workshopNetProfit = totalBill - mechEarnings - partsCostObj;

            // State styling
            let statusBadge = (
              <span className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                <Play className="w-3 h-3 fill-blue-600" /> Abierta
              </span>
            );
            if (ord.estado === 'en_proceso') {
              statusBadge = (
                <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
                  <RefreshCw className="w-3 h-3 animate-spin" /> En Proceso
                </span>
              );
            } else if (ord.estado === 'terminada') {
              statusBadge = (
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3" /> Terminada
                </span>
              );
            }

            return (
              <div key={ord.id} className="bg-white rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between">
                <div>
                  {/* Order Top Bar Info */}
                  <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                    <span className="text-xs font-mono font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-sm">
                      {ord.id}
                    </span>
                    {statusBadge}
                  </div>

                  {/* Client & Car info */}
                  <div className="space-y-1">
                    <h4 className="text-base font-black text-slate-800 hover:text-emerald-700 transition-colors">
                      {getClienteName(ord.cliente_id)}
                    </h4>
                    <p className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                      <Wrench className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {getVehiculoPlaca(ord.auto_id)}
                    </p>
                  </div>

                  {/* Task Description */}
                  <p className="text-xs text-slate-600 mt-3 line-clamp-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100 italic min-h-[50px]">
                    &ldquo;{ord.descripcion}&rdquo;
                  </p>

                  {/* Responsible mechanic and dates */}
                  <div className="mt-4 flex items-center justify-between text-xs text-slate-400 font-semibold">
                    <span className="flex items-center gap-1 text-slate-500">
                      <User className="w-3.5 h-3.5 text-emerald-500" />
                      Mech: {getTrabajadorName(ord.trabajador_id)}
                    </span>
                    <span>{ord.fecha}</span>
                  </div>

                  {/* Parts used display count */}
                  {ord.repuestos.length > 0 && (
                    <div className="mt-4 border-t border-slate-100 pt-3">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                        Insumos Consumidos
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {ord.repuestos.map((item) => {
                          const partName = repuestos.find((r) => r.id === item.id)?.nombre || 'Repuesto';
                          return (
                            <span key={item.id} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-sm font-medium">
                              {partName} (x{item.qty})
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Pricing / Finance Summary Footer */}
                <div className="mt-5 border-t border-slate-100 pt-4 flex flex-col gap-2 bg-slate-50/50 p-3 rounded-b-2xl -mx-5 -mb-5 border-b border-r border-l">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Mano de Obra (Labor):</span>
                    <span className="font-bold text-slate-700 font-mono">${Number(labor ?? 0).toFixed(2)}</span>
                  </div>
                  {partsSold > 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Venta Repuestos:</span>
                      <span className="font-bold text-slate-700 font-mono">${Number(partsSold ?? 0).toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm py-1 border-t border-slate-200">
                    <span className="font-bold text-slate-800">Total Facturado:</span>
                    <span className="font-black text-emerald-600 font-mono">${Number(totalBill ?? 0).toFixed(2)}</span>
                  </div>

                  {/* Workers commission & workshop cut breakdown */}
                  <div className="border-t border-slate-100 pt-1.5 flex justify-between text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                    <span>Mecánico: <strong className="text-blue-600">${Number(mechEarnings ?? 0).toFixed(2)}</strong></span>
                    <span>Taller Neto: <strong className="text-emerald-700">${Number(workshopNetProfit ?? 0).toFixed(2)}</strong></span>
                  </div>

                  <button
                    onClick={() => setEditingOrden(ord)}
                    className="mt-3 w-full py-1.5 text-xs text-center font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer shadow-2xs transition-all"
                  >
                    Detalles y Editar
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Editing Drawer Form Overlay */}
      {editingOrden && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
            <div className="bg-slate-950 text-white p-5">
              <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                {editingOrden.id ? `Detalles Orden ${editingOrden.id}` : 'Crear Orden de Trabajo'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Relacione el cliente con un carro de su propiedad, fije los costos de mano de obra y cargue repuestos.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[72vh] text-left">
              {/* Core relations: Client, Car, Worker */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-500 uppercase mb-1">Cliente Solicitante (*)</label>
                  <select
                    required
                    value={editingOrden.cliente_id || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'ADD_NEW_CLIENT') {
                        setShowAddClient(true);
                      } else {
                        setEditingOrden({ ...editingOrden, cliente_id: val, auto_id: '' });
                      }
                    }}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none"
                  >
                    <option value="">Seleccione Cliente...</option>
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} ({c.cedula})
                      </option>
                    ))}
                    <option value="ADD_NEW_CLIENT" className="text-emerald-600 font-bold bg-emerald-50">
                      + Registrar Nuevo Cliente...
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-500 uppercase mb-1">Vehículo Asociado (*)</label>
                  <select
                    required
                    value={editingOrden.auto_id || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'ADD_NEW_VEHICULO') {
                        if (!editingOrden.cliente_id) {
                          alert('Por favor, seleccione un Cliente Solicitante primero para poder registrarle un vehículo.');
                        } else {
                          setShowAddVehiculo(true);
                        }
                      } else {
                        setEditingOrden({ ...editingOrden, auto_id: val });
                      }
                    }}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none"
                  >
                    <option value="">Seleccione Carro...</option>
                    {/* Filter vehicles belonging to the selected client or show all if none selected */}
                    {vehiculos
                      .filter((v) => !editingOrden.cliente_id || v.cliente_id === editingOrden.cliente_id)
                      .map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.marca} {v.modelo} ({v.placa})
                        </option>
                      ))}
                    <option value="ADD_NEW_VEHICULO" className="text-emerald-600 font-bold bg-emerald-50">
                      + Registrar Nuevo Vehículo...
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-500 uppercase mb-1">Mecánico Asignado (*)</label>
                  <select
                    required
                    value={editingOrden.trabajador_id || ''}
                    onChange={(e) => {
                      const workerId = e.target.value;
                      const workerObj = trabajadores.find(t => t.id === workerId);
                      setEditingOrden({
                        ...editingOrden,
                        trabajador_id: workerId,
                        comision_porcentaje: workerObj ? workerObj.comision_porcentaje : 40
                      });
                    }}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none"
                  >
                    <option value="">Asigne Trabajador...</option>
                    {trabajadores.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nombre} ({t.especialidad})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description and Date */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="sm:col-span-3">
                  <label className="block text-xs font-extrabold text-slate-500 uppercase mb-1">Motivo de Ingreso / Tarea a Realizar (*)</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. Cambio de pastillas delanteras, alineación y balanceo..."
                    value={editingOrden.descripcion || ''}
                    onChange={(e) => setEditingOrden({ ...editingOrden, descripcion: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-500 uppercase mb-1">Kilometraje de Ingreso</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="120000"
                    value={editingOrden.km_ingreso ?? ''}
                    onChange={(e) => setEditingOrden({ ...editingOrden, km_ingreso: parseInt(e.target.value) || 0 })}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none"
                  />
                </div>
              </div>

              {/* Diagnostic and Status details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-extrabold text-slate-500 uppercase mb-1">Diagnóstico / Reporte Técnico Técnico</label>
                  <input
                    type="text"
                    placeholder="E.g. Discos con micro-fisuras, pistones lubricados, batería desgastada..."
                    value={editingOrden.diagnostico || ''}
                    onChange={(e) => setEditingOrden({ ...editingOrden, diagnostico: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-500 uppercase mb-1">Estado de Orden</label>
                  <select
                    value={editingOrden.estado || 'abierta'}
                    onChange={(e) => setEditingOrden({ ...editingOrden, estado: e.target.value as EstadoOrden })}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none font-bold"
                  >
                    <option value="abierta" className="text-blue-600 font-bold">📥 Abierta</option>
                    <option value="en_proceso" className="text-amber-600 font-bold">⚙️ En Proceso</option>
                    <option value="terminada" className="text-emerald-600 font-bold">✅ Terminada / Facturada</option>
                  </select>
                </div>
              </div>

              {/* SPARE PARTS ASSIGNED TO THE ORDER */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wide block mb-2 flex items-center gap-1">
                  <ShoppingCart className="w-4 h-4 text-emerald-500" />
                  Repuestos & Artículos Usados
                </span>

                {/* Add a material item layout */}
                <div className="flex gap-2.5 items-end bg-white p-3 rounded-lg border border-slate-250/30 shadow-2xs mb-4">
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Elegir Repuesto Disponible</label>
                    <SparePartSearchPicker
                      repuestos={repuestos}
                      selectedId={selectedPartId}
                      onSelect={(id) => setSelectedPartId(id)}
                      placeholder="Escribe código, nombre o categoría..."
                    />
                  </div>
                  <div className="w-20">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Cant.</label>
                    <input
                      type="number"
                      min="1"
                      value={selectedPartQty}
                      onChange={(e) => setSelectedPartQty(parseInt(e.target.value) || 1)}
                      className="w-full text-[11px] p-2 border border-slate-200 rounded-md bg-slate-50"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddPart}
                    className="p-2 py-2 px-4 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-md shrink-0 cursor-pointer"
                  >
                    Adicionar
                  </button>
                </div>

                {/* Current Table of parts in the order */}
                {(!editingOrden.repuestos || editingOrden.repuestos.length === 0) ? (
                  <p className="text-xs text-slate-400 italic text-center py-2">Ningún repuesto asignado preventivamente.</p>
                ) : (
                  <div className="bg-white rounded-lg border border-slate-100 overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-100/50 text-slate-500 font-bold uppercase text-[9px]">
                          <th className="py-2 px-3">Nombre Repuesto</th>
                          <th className="py-2 px-3 text-center">Cant</th>
                          <th className="py-2 px-3 text-right">Precio Venta</th>
                          <th className="py-2 px-3 text-right">Costo Compra</th>
                          <th className="py-2 px-3 text-right">Total Item</th>
                          <th className="py-2 px-3 text-right">Quitar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {editingOrden.repuestos.map((item, index) => {
                          const originalItem = repuestos.find((r) => r.id === item.id);
                          return (
                            <tr key={`${item.id}-${index}`} className="hover:bg-slate-50">
                              <td className="py-2 px-3 font-semibold text-slate-700">
                                {originalItem?.nombre || 'Repuesto Eliminado'}
                              </td>
                              <td className="py-2 px-3 text-center font-bold text-slate-800">{item.qty}</td>
                              <td className="py-2 px-3 text-right font-mono">${Number(item.precio ?? 0).toFixed(2)}</td>
                              <td className="py-2 px-3 text-right font-mono text-slate-400">${Number(item.costo ?? 0).toFixed(2)}</td>
                              <td className="py-2 px-3 text-right font-bold text-slate-800 font-mono">
                                ${(Number(item.precio ?? 0) * item.qty).toFixed(2)}
                              </td>
                              <td className="py-2 px-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleRemovePart(index)}
                                  className="text-[10px] font-bold text-red-500 hover:underline cursor-pointer"
                                >
                                  Quitar
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Labor Cost & Comments */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-600 mb-1">Costo Mano de Obra (Labor Cost)</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-xs font-semibold text-slate-500 font-mono">$</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      min="0"
                      placeholder="0.00"
                      value={editingOrden.labor_cost ?? ''}
                      onChange={(e) => setEditingOrden({ ...editingOrden, labor_cost: parseFloat(e.target.value) || 0 })}
                      className="w-full pl-6 pr-2 py-1.5 text-xs text-slate-800 font-mono font-bold border border-slate-200 rounded-lg bg-slate-50 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-extrabold text-slate-500 uppercase mb-1">Ubicación física / Notas generales adicionales</label>
                  <input
                    type="text"
                    placeholder="E.g. Se entregó lavado. Llaves en oficina..."
                    value={editingOrden.observaciones || ''}
                    onChange={(e) => setEditingOrden({ ...editingOrden, observaciones: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none"
                  />
                </div>
              </div>

              {/* FINANCIAL PROJECTION REVIEW IN-FORM */}
              <div className="bg-slate-900 text-slate-300 p-4 rounded-xl text-xs space-y-1.5 font-medium border border-slate-800">
                <span className="text-[10px] font-bold text-emerald-400 uppercase block tracking-wider mb-1">Resumen Tarifario de Orden</span>
                <div className="flex justify-between">
                  <span>Mano de obra (Labor):</span>
                  <span>${Number(editingOrden.labor_cost || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Repuestos de la orden:</span>
                  <span>${Number(((editingOrden.repuestos || []).reduce((sum, item) => sum + (Number(item.precio ?? 0) * item.qty), 0))).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-white text-sm py-1 border-t border-slate-800">
                  <span>Monto Total a Cobrar al Cliente:</span>
                  <span className="text-emerald-400">
                    ${Number(calculateTotalOrderCost(editingOrden.repuestos || [], editingOrden.labor_cost || 0)).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                {editingOrden.trabajador_id && (
                  <div className="flex justify-between text-[10px] text-slate-400 border-t border-slate-800 pt-1">
                    <span>Mecánico recibe ({trabajadores.find(t => t.id === editingOrden.trabajador_id)?.comision_porcentaje || 40}% comision de Mano de Obra):</span>
                    <span className="font-bold text-blue-400 font-mono">
                      ${Number(((Number(editingOrden.labor_cost || 0) * (trabajadores.find(t => t.id === editingOrden.trabajador_id)?.comision_porcentaje || 40)) / 100)).toFixed(2)}
                    </span>
                  </div>
                )}
                {editingOrden.repuestos && editingOrden.repuestos.length > 0 && (
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Inversión/Costo neto repuestos cargados:</span>
                    <span className="font-bold text-red-400 font-mono">
                      -${Number(calculateTotalOrderPartInvestment(editingOrden.repuestos)).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              {/* Submission buttons */}
              <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                {editingOrden.id ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('¿Desea eliminar de forma permanente esta orden de trabajo?')) {
                        onDeleteOrden(editingOrden.id!);
                        setEditingOrden(null);
                      }
                    }}
                    className="text-xs font-bold text-red-500 hover:text-red-700 bg-red-50 px-3 py-2 rounded-lg cursor-pointer cursor-pointer transition-colors"
                  >
                    Eliminar Orden
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingOrden(null)}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-50 px-4 py-2 rounded-lg cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 px-5 py-2 rounded-lg cursor-pointer"
                  >
                    {editingOrden.id ? 'Actualizar Orden' : 'Registrar Orden'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Add Client Sub-modal */}
      {showAddClient && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-55">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
            <div className="bg-slate-900 text-white p-4">
              <h4 className="font-bold text-sm tracking-tight flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-400" />
                Registrar Nuevo Cliente
              </h4>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Ingrese la información para crear un nuevo perfil de cliente solicitante.
              </p>
            </div>
            
            <form onSubmit={handleQuickSaveClient} className="p-5 space-y-3.5 text-left text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Nombre Completo (*)</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Juan Pérez"
                  value={quickClient.nombre}
                  onChange={(e) => setQuickClient({ ...quickClient, nombre: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Cédula / Documento (*)</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. V-12345678"
                  value={quickClient.cedula}
                  onChange={(e) => setQuickClient({ ...quickClient, cedula: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Teléfono</label>
                  <input
                    type="tel"
                    placeholder="Ej. 0414-1234567"
                    value={quickClient.telefono}
                    onChange={(e) => setQuickClient({ ...quickClient, telefono: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="Ej. juan@gmail.com"
                    value={quickClient.email}
                    onChange={(e) => setQuickClient({ ...quickClient, email: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Dirección</label>
                <input
                  type="text"
                  placeholder="Calle, Sector, Ciudad..."
                  value={quickClient.direccion}
                  onChange={(e) => setQuickClient({ ...quickClient, direccion: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Observaciones</label>
                <textarea
                  rows={2}
                  placeholder="Notas adicionales sobre el cliente..."
                  value={quickClient.observaciones}
                  onChange={(e) => setQuickClient({ ...quickClient, observaciones: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-1 focus:ring-slate-400 resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddClient(false)}
                  className="px-3.5 py-1.5 font-bold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors cursor-pointer"
                >
                  Guardar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Add Vehicle Sub-modal */}
      {showAddVehiculo && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-55">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
            <div className="bg-slate-900 text-white p-4">
              <h4 className="font-bold text-sm tracking-tight flex items-center gap-2">
                <Wrench className="w-4 h-4 text-emerald-400" />
                Registrar Nuevo Vehículo
              </h4>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Asociar un nuevo carro para: <strong className="text-emerald-300">{clientes.find(c => c.id === editingOrden?.cliente_id)?.nombre || 'Cliente seleccionado'}</strong>
              </p>
            </div>
            
            <form onSubmit={handleQuickSaveVehiculo} className="p-5 space-y-3.5 text-left text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Marca (*)</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Toyota"
                    value={quickVehiculo.marca}
                    onChange={(e) => setQuickVehiculo({ ...quickVehiculo, marca: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Modelo (*)</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Corolla"
                    value={quickVehiculo.modelo}
                    onChange={(e) => setQuickVehiculo({ ...quickVehiculo, modelo: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Placa (*)</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. AA123BB"
                    value={quickVehiculo.placa}
                    onChange={(e) => setQuickVehiculo({ ...quickVehiculo, placa: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Año</label>
                  <input
                    type="number"
                    value={quickVehiculo.anio}
                    onChange={(e) => setQuickVehiculo({ ...quickVehiculo, anio: parseInt(e.target.value) || new Date().getFullYear() })}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Color</label>
                  <input
                    type="text"
                    placeholder="Ej. Gris Plata"
                    value={quickVehiculo.color}
                    onChange={(e) => setQuickVehiculo({ ...quickVehiculo, color: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Kilometraje</label>
                  <input
                    type="number"
                    placeholder="Ej. 120000"
                    value={quickVehiculo.km}
                    onChange={(e) => setQuickVehiculo({ ...quickVehiculo, km: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Observaciones</label>
                <textarea
                  rows={2}
                  placeholder="Detalles de carrocería, choques previos, etc..."
                  value={quickVehiculo.observaciones}
                  onChange={(e) => setQuickVehiculo({ ...quickVehiculo, observaciones: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-1 focus:ring-slate-400 resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddVehiculo(false)}
                  className="px-3.5 py-1.5 font-bold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors cursor-pointer"
                >
                  Guardar Vehículo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
