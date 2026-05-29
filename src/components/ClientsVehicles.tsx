import React, { useState } from 'react';
import { Cliente, Vehiculo } from '../types';
import { Users, Plus, Edit2, Wrench, Search, Phone, Mail, FileCheck2, CreditCard, Calendar, Palette, Milestone } from 'lucide-react';

interface ClientsVehiclesProps {
  clientes: Cliente[];
  vehiculos: Vehiculo[];
  onSaveCliente: (cliente: Cliente) => void;
  onDeleteCliente: (id: string) => void;
  onSaveVehiculo: (vehiculo: Vehiculo) => void;
  onDeleteVehiculo: (id: string) => void;
}

export function ClientsVehicles({
  clientes,
  vehiculos,
  onSaveCliente,
  onDeleteCliente,
  onSaveVehiculo,
  onDeleteVehiculo
}: ClientsVehiclesProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'clientes' | 'vehiculos'>('clientes');

  const [editingCliente, setEditingCliente] = useState<Partial<Cliente> | null>(null);
  const [editingVehiculo, setEditingVehiculo] = useState<Partial<Vehiculo> | null>(null);

  // Filters logic
  const filteredClientes = clientes.filter((c) => {
    const search = searchTerm.toLowerCase();
    return (
      c.nombre.toLowerCase().includes(search) ||
      c.cedula.toLowerCase().includes(search) ||
      c.telefono.toLowerCase().includes(search) ||
      c.email.toLowerCase().includes(search)
    );
  });

  const filteredVehiculos = vehiculos.filter((v) => {
    const search = searchTerm.toLowerCase();
    const ownerName = clientes.find((c) => c.id === v.cliente_id)?.nombre || '';
    return (
      v.placa.toLowerCase().includes(search) ||
      v.marca.toLowerCase().includes(search) ||
      v.modelo.toLowerCase().includes(search) ||
      ownerName.toLowerCase().includes(search) ||
      (v.vin || '').toLowerCase().includes(search)
    );
  });

  const getOwnerName = (clientId: string | null) => {
    if (!clientId) return 'Sin Propietario';
    return clientes.find((c) => c.id === clientId)?.nombre || 'Desconocido';
  };

  const handleClienteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCliente?.nombre || !editingCliente?.cedula) {
      alert('Favor ingresar nombre y cédula del cliente.');
      return;
    }

    const clientItem: Cliente = {
      id: editingCliente.id || `CLI-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
      nombre: editingCliente.nombre,
      telefono: editingCliente.telefono || '',
      email: editingCliente.email || '',
      cedula: editingCliente.cedula,
      nacimiento: editingCliente.nacimiento || '',
      direccion: editingCliente.direccion || '',
      observaciones: editingCliente.observaciones || '',
      fecha_reg: editingCliente.fecha_reg || new Date().toISOString().split('T')[0],
    };

    onSaveCliente(clientItem);
    setEditingCliente(null);
  };

  const handleVehiculoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVehiculo?.marca || !editingVehiculo?.modelo || !editingVehiculo?.placa) {
      alert('Favor ingresar marca, modelo y número de placa del coche.');
      return;
    }

    const vehicleItem: Vehiculo = {
      id: editingVehiculo.id || `VEH-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
      cliente_id: editingVehiculo.cliente_id || null,
      marca: editingVehiculo.marca,
      modelo: editingVehiculo.modelo,
      anio: Number(editingVehiculo.anio ?? new Date().getFullYear()),
      placa: editingVehiculo.placa.toUpperCase(),
      color: editingVehiculo.color || '#000000',
      vin: (editingVehiculo.vin || '').toUpperCase(),
      km: Number(editingVehiculo.km ?? 0),
      observaciones: editingVehiculo.observaciones || '',
      fecha_reg: editingVehiculo.fecha_reg || new Date().toISOString().split('T')[0],
    };

    onSaveVehiculo(vehicleItem);
    setEditingVehiculo(null);
  };

  return (
    <div className="space-y-6 text-left">
      {/* Tab Selectors & Inner Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-slate-100 shadow-xs">
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => {
              setActiveTab('clientes');
              setSearchTerm('');
            }}
            className={`text-xs font-bold px-4 py-1.5 rounded-md cursor-pointer transition-all ${
              activeTab === 'clientes'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Listado de Clientes
          </button>
          <button
            onClick={() => {
              setActiveTab('vehiculos');
              setSearchTerm('');
            }}
            className={`text-xs font-bold px-4 py-1.5 rounded-md cursor-pointer transition-all ${
              activeTab === 'vehiculos'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Unidades Vehiculares
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder={activeTab === 'clientes' ? "Buscar por cédula, nombre..." : "Buscar por placa, dueño, marca..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-505"
            />
          </div>

          <button
            onClick={() => {
              if (activeTab === 'clientes') {
                setEditingCliente({ fecha_reg: new Date().toISOString().split('T')[0] });
              } else {
                setEditingVehiculo({ color: '#A1A1A1', anio: new Date().getFullYear(), fecha_reg: new Date().toISOString().split('T')[0], km: 0 });
              }
            }}
            className="flex items-center gap-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 py-1.5 px-3.5 rounded-lg cursor-pointer shrink-0 transition-all"
          >
            <Plus className="w-4 h-4" />
            {activeTab === 'clientes' ? 'Agregar Cliente' : 'Cargar Coche'}
          </button>
        </div>
      </div>

      {/* RENDER TAB 1: CLIENTES */}
      {activeTab === 'clientes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClientes.length === 0 ? (
            <div className="col-span-full text-center text-xs text-slate-400 italic py-8 bg-slate-50 rounded-lg border border-dashed border-slate-200">
              Ningún propietario en sintonía con su búsqueda.
            </div>
          ) : (
            filteredClientes.map((c) => {
              // Retrieve cars belonging to this client
              const cars = vehiculos.filter((v) => v.cliente_id === c.id);

              return (
                <div key={c.id} className="bg-white rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between">
                  <div>
                    {/* Header ID/Cedula block */}
                    <div className="flex items-center justify-between border-b border-slate-50 pb-2 mb-3">
                      <span className="text-xs text-slate-400 font-mono font-bold">{c.id}</span>
                      <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-sm flex items-center gap-1">
                        <CreditCard className="w-3.5 h-3.5" /> ID: {c.cedula}
                      </span>
                    </div>

                    <h4 className="text-base font-black text-slate-800">{c.nombre}</h4>
                    
                    <div className="mt-3.5 space-y-1.5 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{c.telefono || 'Sin Teléfono'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{c.email || 'Sin Correo'}</span>
                      </div>
                      {c.direccion && (
                        <div className="flex items-start gap-2 pt-1 border-t border-slate-50 mt-1">
                          <Milestone className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-2 italic">{c.direccion}</span>
                        </div>
                      )}
                    </div>

                    {/* Associated Cars Display */}
                    <div className="mt-4 border-t border-slate-50 pt-3">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">Vehículos Registrados ({cars.length})</span>
                      {cars.length === 0 ? (
                        <p className="text-[11px] text-slate-400 italic">Ninguno cargado</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {cars.map((v) => (
                            <span
                              key={v.id}
                              className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-sm border border-indigo-100 flex items-center gap-1"
                            >
                              <Wrench className="w-3 h-3 text-indigo-400" />
                              {v.placa} ({v.marca})
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="mt-5 border-t border-slate-150/40 pt-4 flex gap-2 justify-between">
                    {c.observaciones && (
                      <span className="text-[10px] bg-amber-50 text-amber-900 px-2 py-1 rounded-sm line-clamp-1 max-w-[150px] font-medium" title={c.observaciones}>
                        Obs: {c.observaciones}
                      </span>
                    )}
                    <button
                      onClick={() => setEditingCliente(c)}
                      className="ml-auto text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 py-1.5 px-3 rounded-lg border border-slate-200 cursor-pointer"
                    >
                      Editar Cliente
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* RENDER TAB 2: VEHICULOS */}
      {activeTab === 'vehiculos' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVehiculos.length === 0 ? (
            <div className="col-span-full text-center text-xs text-slate-400 italic py-8 bg-slate-50 rounded-lg border border-dashed border-slate-200">
              Ningún coche coincide con los criterios de búsqueda.
            </div>
          ) : (
            filteredVehiculos.map((v) => {
              return (
                <div key={v.id} className="bg-white rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between">
                  <div>
                    {/* Header vehicle card info */}
                    <div className="flex items-center justify-between border-b border-slate-50 pb-2 mb-3">
                      <span className="text-xs text-slate-400 font-mono font-bold">{v.id}</span>
                      <span className="text-xs font-black text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-sm flex items-center gap-1.5">
                        <Palette className="w-3.5 h-3.5" style={{ color: v.color }} />
                        PLACA: {v.placa}
                      </span>
                    </div>

                    <h4 className="text-base font-black text-slate-800">
                      {v.marca} {v.modelo}
                    </h4>
                    <p className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md w-fit mt-1">
                      Dueño: {getOwnerName(v.cliente_id)}
                    </p>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-600 border-t border-slate-50 pt-3">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Año Modelo</span>
                        <span className="font-semibold text-slate-800">{v.anio || '—'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Kilometraje</span>
                        <span className="font-semibold text-slate-800 font-mono">{(v.km || 0).toLocaleString()} km</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Código VIN de Carrocería</span>
                        <span className="font-mono text-[11px] text-slate-700 font-bold block max-w-full truncate">
                          {v.vin || '—'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="mt-5 border-t border-slate-55 pb-1 pt-4 flex gap-2 justify-between items-center">
                    {v.observaciones ? (
                      <span className="text-[10px] text-slate-400 line-clamp-1 italic max-w-[170px]" title={v.observaciones}>
                        &ldquo;{v.observaciones}&rdquo;
                      </span>
                    ) : <div />}
                    <button
                      onClick={() => setEditingVehiculo(v)}
                      className="ml-auto text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 py-1.5 px-3 rounded-lg border border-slate-200 cursor-pointer"
                    >
                      Editar Vehículo
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* MODAL EDITAR / CREAR CLIENTE */}
      {editingCliente && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-slate-800">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="bg-slate-950 text-white p-5">
              <h3 className="text-base font-black tracking-tight flex items-center gap-1.5">
                <Users className="w-5 h-5 text-indigo-400" />
                {editingCliente.id ? 'Modificar Registro del Cliente' : 'Agregar Nuevo Propietario'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Escriba la información de contacto y fiscal para facturación y asignación de órdenes.
              </p>
            </div>

            <form onSubmit={handleClienteSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-extrabold text-slate-500 uppercase mb-1">Nombre Completo (*)</label>
                  <input
                    type="text"
                    required
                    placeholder="Carlos Eduardo Mendoza"
                    value={editingCliente.nombre || ''}
                    onChange={(e) => setEditingCliente({ ...editingCliente, nombre: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-1"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-500 uppercase mb-1">Cédula / Identificación (*)</label>
                  <input
                    type="text"
                    required
                    placeholder="V-15.342.198"
                    value={editingCliente.cedula || ''}
                    onChange={(e) => setEditingCliente({ ...editingCliente, cedula: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-1"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-500 uppercase mb-1">Teléfono (*)</label>
                  <input
                    type="text"
                    required
                    placeholder="0414-123-4567"
                    value={editingCliente.telefono || ''}
                    onChange={(e) => setEditingCliente({ ...editingCliente, telefono: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-500 uppercase mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    placeholder="ejemplo@email.com"
                    value={editingCliente.email || ''}
                    onChange={(e) => setEditingCliente({ ...editingCliente, email: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-1"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-500 uppercase mb-1">Fecha Nacimiento</label>
                  <input
                    type="date"
                    value={editingCliente.nacimiento || ''}
                    onChange={(e) => setEditingCliente({ ...editingCliente, nacimiento: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-500 uppercase mb-1">Dirección de Domicilio</label>
                <input
                  type="text"
                  placeholder="Calle, Edificio, Apto, Urbanización, Ciudad"
                  value={editingCliente.direccion || ''}
                  onChange={(e) => setEditingCliente({ ...editingCliente, direccion: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-1"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-500 uppercase mb-1">Observaciones / Preferencias</label>
                <textarea
                  rows={2}
                  placeholder="Preferencia de contacto, hábitos de pago, etc."
                  value={editingCliente.observaciones || ''}
                  onChange={(e) => setEditingCliente({ ...editingCliente, observaciones: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none resize-none"
                />
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                {editingCliente.id ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('¿Eliminar el cliente? Solo proceder si no tiene vehículos u órdenes asignadas.')) {
                        onDeleteCliente(editingCliente.id!);
                        setEditingCliente(null);
                      }
                    }}
                    className="text-xs font-bold text-red-500 hover:text-red-700 bg-red-50 px-3 py-2 rounded-lg cursor-pointer transition-colors"
                  >
                    Eliminar
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingCliente(null)}
                    className="text-xs font-bold text-slate-500 bg-slate-50 px-4 py-2 rounded-lg cursor-pointer"
                  >
                    Cerrar
                  </button>
                  <button
                    type="submit"
                    className="text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 px-5 py-2 rounded-lg cursor-pointer"
                  >
                    Guardar Cliente
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDITAR / CREAR VEHICULO */}
      {editingVehiculo && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-slate-800">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="bg-slate-950 text-white p-5">
              <h3 className="text-base font-black tracking-tight flex items-center gap-1.5">
                <Wrench className="w-5 h-5 text-indigo-400" />
                {editingVehiculo.id ? 'Modificar Registro Vehicular' : 'Vincular Coche en Almacén'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Coloque las especificaciones físicas de identificación del vehículo automotor a ingresar.
              </p>
            </div>

            <form onSubmit={handleVehiculoSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-500 uppercase mb-1">Nombre del Propietario (*)</label>
                <select
                  required
                  value={editingVehiculo.cliente_id || ''}
                  onChange={(e) => setEditingVehiculo({ ...editingVehiculo, cliente_id: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none"
                >
                  <option value="">Seleccione al Dueño...</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} ({c.cedula})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-500 uppercase mb-1">Marca o Fabricante (*)</label>
                  <input
                    type="text"
                    required
                    placeholder="Toyota, Ford, Chevrolet"
                    value={editingVehiculo.marca || ''}
                    onChange={(e) => setEditingVehiculo({ ...editingVehiculo, marca: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-500 uppercase mb-1">Modelo de Línea (*)</label>
                  <input
                    type="text"
                    required
                    placeholder="Corolla, Fiesta, Silverado"
                    value={editingVehiculo.modelo || ''}
                    onChange={(e) => setEditingVehiculo({ ...editingVehiculo, modelo: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 font-semibold text-slate-800">
                <div>
                  <label className="block text-xs font-extrabold text-slate-500 uppercase mb-1">Patente/Placa (*)</label>
                  <input
                    type="text"
                    required
                    placeholder="AB123CD"
                    value={editingVehiculo.placa || ''}
                    onChange={(e) => setEditingVehiculo({ ...editingVehiculo, placa: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none text-center font-bold font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-500 uppercase mb-1">Color (Hex)</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={editingVehiculo.color || '#A1A1A1'}
                      onChange={(e) => setEditingVehiculo({ ...editingVehiculo, color: e.target.value })}
                      className="w-8 h-8 rounded border-none cursor-pointer shrink-0"
                    />
                    <input
                      type="text"
                      placeholder="#FFF"
                      value={editingVehiculo.color || ''}
                      onChange={(e) => setEditingVehiculo({ ...editingVehiculo, color: e.target.value })}
                      className="w-full text-[10px] p-1 border border-slate-200 rounded"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-500 uppercase mb-1">Año Modelo</label>
                  <input
                    type="number"
                    placeholder="2018"
                    value={editingVehiculo.anio ?? ''}
                    onChange={(e) => setEditingVehiculo({ ...editingVehiculo, anio: parseInt(e.target.value) || 2018 })}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-500 uppercase mb-1">KM del Odómetro</label>
                  <input
                    type="number"
                    placeholder="120000"
                    value={editingVehiculo.km ?? ''}
                    onChange={(e) => setEditingVehiculo({ ...editingVehiculo, km: parseInt(e.target.value) || 0 })}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-500 uppercase mb-1">ID Serial de Chasis (VIN)</label>
                  <input
                    type="text"
                    placeholder="17 dígitos"
                    value={editingVehiculo.vin || ''}
                    onChange={(e) => setEditingVehiculo({ ...editingVehiculo, vin: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-500 uppercase mb-1">Anotaciones del Chasis / Detalles Previos</label>
                <textarea
                  rows={2}
                  placeholder="Detalles mecánicos previos apreciados en la carrocería."
                  value={editingVehiculo.observaciones || ''}
                  onChange={(e) => setEditingVehiculo({ ...editingVehiculo, observaciones: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none resize-none"
                />
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                {editingVehiculo.id ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('¿Eliminar coche permanentemente del panel?')) {
                        onDeleteVehiculo(editingVehiculo.id!);
                        setEditingVehiculo(null);
                      }
                    }}
                    className="text-xs font-bold text-red-500 hover:text-red-700 bg-red-50 px-3 py-2 rounded-lg cursor-pointer transition-colors"
                  >
                    Eliminar
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingVehiculo(null)}
                    className="text-xs font-bold text-slate-500 bg-slate-50 px-4 py-2 rounded-lg cursor-pointer"
                  >
                    Salir
                  </button>
                  <button
                    type="submit"
                    className="text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 px-5 py-2 rounded-lg cursor-pointer"
                  >
                    Completar Carga
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
