import React, { useState } from 'react';
import { ShoppingBag, Plus, Trash2, Calendar, User, FileText, Percent, Info, AlertTriangle, CheckCircle, ArrowRight, RefreshCw, X, Search } from 'lucide-react';
import { VentaIndividual, VentaIndividualItem, Repuesto } from '../types';

interface VentasIndividualesManagerProps {
  ventasIndividuales: VentaIndividual[];
  repuestos: Repuesto[];
  onSaveVenta: (venta: VentaIndividual) => void;
  onDeleteVenta: (id: string) => void;
  onRefundItem: (ventaId: string, itemId: string, qty: number) => void;
}

export const VentasIndividualesManager: React.FC<VentasIndividualesManagerProps> = ({
  ventasIndividuales,
  repuestos,
  onSaveVenta,
  onDeleteVenta,
  onRefundItem
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [errorVal, setErrorVal] = useState<string | null>(null);
  const [activeRefundVentaId, setActiveRefundVentaId] = useState<string | null>(null);

  // Filter states
  const [salesSearch, setSalesSearch] = useState('');
  const [salesStartDate, setSalesStartDate] = useState('');
  const [salesEndDate, setSalesEndDate] = useState('');

  // Form states
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteCedula, setClienteCedula] = useState('');
  const [fecha, setFecha] = useState(() => new Date().toISOString().split('T')[0]);
  const [tasaUsdt, setTasaUsdt] = useState(44.50);
  const [cartItems, setCartItems] = useState<VentaIndividualItem[]>([]);

  // Cart item selector states
  const [selectedRepuestoId, setSelectedRepuestoId] = useState('');
  const [customPrecio, setCustomPrecio] = useState<string>('');
  const [customQty, setCustomQty] = useState<number>(1);

  // Filtered sales list computation
  const filteredVentas = ventasIndividuales.filter((venta) => {
    // Search filter
    const matchesSearch = !salesSearch ||
      venta.cliente_nombre.toLowerCase().includes(salesSearch.toLowerCase()) ||
      (venta.cliente_cedula && venta.cliente_cedula.toLowerCase().includes(salesSearch.toLowerCase())) ||
      venta.id.toLowerCase().includes(salesSearch.toLowerCase());
      
    // Exact Date range filter
    let matchesDate = true;
    if (salesStartDate) {
      matchesDate = matchesDate && (venta.fecha >= salesStartDate);
    }
    if (salesEndDate) {
      matchesDate = matchesDate && (venta.fecha <= salesEndDate);
    }
    
    return matchesSearch && matchesDate;
  });

  // Handle selected spare part change to preset its price
  const handleRepuestoSelection = (id: string) => {
    setSelectedRepuestoId(id);
    const item = repuestos.find(r => r.id === id);
    if (item) {
      setCustomPrecio(item.precio.toString());
      setCustomQty(1);
    } else {
      setCustomPrecio('');
    }
  };

  const handleAddItemToCart = () => {
    if (!selectedRepuestoId) {
      setErrorVal('Por favor selecciona un repuesto del inventario.');
      return;
    }
    const item = repuestos.find(r => r.id === selectedRepuestoId);
    if (!item) return;

    if (customQty <= 0) {
      setErrorVal('La cantidad debe ser mayor a 0.');
      return;
    }

    if (customQty > item.cantidad) {
      setErrorVal(`Stock insuficiente en inventario. Solo quedan ${item.cantidad} unidades disponibles.`);
      return;
    }

    const priceNum = parseFloat(customPrecio);
    if (isNaN(priceNum) || priceNum < 0) {
      setErrorVal('El precio ingresado no es válido.');
      return;
    }

    // Check if already in cart
    if (cartItems.some(i => i.id === selectedRepuestoId)) {
      setErrorVal('Este repuesto ya está en la lista. Por favor quítalo primero para cambiar la cantidad.');
      return;
    }

    const cartItem: VentaIndividualItem = {
      id: item.id,
      nombre: `${item.nombre} [${item.codigo}]`,
      qty: customQty,
      precio: priceNum,
      costo: item.costo || (item.precio * 0.6)
    };

    setCartItems([...cartItems, cartItem]);
    setSelectedRepuestoId('');
    setCustomPrecio('');
    setCustomQty(1);
    setErrorVal(null);
  };

  const handleRemoveFromCart = (idx: number) => {
    setCartItems(cartItems.filter((_, i) => i !== idx));
  };

  const calculateCartTotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.precio * item.qty), 0);
  };

  const handleSubmitSale = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorVal(null);

    if (!clienteNombre.trim()) {
      setErrorVal('El nombre del cliente es obligatorio.');
      return;
    }

    if (cartItems.length === 0) {
      setErrorVal('La venta debe tener al menos un repuesto en la lista.');
      return;
    }

    const totalUsd = calculateCartTotal();
    const newSale: VentaIndividual = {
      id: `VNT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      fecha,
      cliente_nombre: clienteNombre,
      cliente_cedula: clienteCedula || undefined,
      items: cartItems,
      tasa_usdt: tasaUsdt,
      total_usd: totalUsd,
      creado_en: new Date().toISOString()
    };

    onSaveVenta(newSale);

    // Reset Form
    setClienteNombre('');
    setClienteCedula('');
    setCartItems([]);
    setIsAdding(false);
    setErrorVal(null);
  };

  return (
    <div id="ventas-individuales-view" className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-250 shadow-xs">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-blue-600" />
            <span>Ventas Rectas de Repuestos</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Facturación de mostrador directa de repuestos al cliente (sin orden de trabajo de taller)
          </p>
        </div>
        
        {!isAdding && (
          <button
            onClick={() => {
              setIsAdding(true);
              setFecha(new Date().toISOString().split('T')[0]);
            }}
            className="flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition px-4 py-2.5 rounded-xl shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Venta Directa</span>
          </button>
        )}
      </div>

      {/* FORM MODAL AREA */}
      {isAdding && (
        <div id="venta-directa-form-card" className="bg-white rounded-2xl border border-slate-250 p-6 shadow-sm max-w-4xl mx-auto">
          <div className="border-b border-slate-150 pb-3 mb-5 flex justify-between items-center">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-600" />
              <span>Registrar Venta Directa</span>
            </h3>
            <button
              onClick={() => {
                setIsAdding(false);
                setErrorVal(null);
                setCartItems([]);
              }}
              className="text-slate-450 hover:text-slate-700 text-xs font-bold transition px-2.5 py-1.5 rounded-lg border border-slate-200 cursor-pointer"
            >
              Cancelar
            </button>
          </div>

          {errorVal && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="font-medium">{errorVal}</span>
            </div>
          )}

          <form onSubmit={handleSubmitSale} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-500 mb-1">
                  Nombre de Cliente *
                </label>
                <input
                  type="text"
                  required
                  value={clienteNombre}
                  onChange={(e) => setClienteNombre(e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-500 mb-1">
                  Cédula (Opcional)
                </label>
                <input
                  type="text"
                  value={clienteCedula}
                  onChange={(e) => setClienteCedula(e.target.value)}
                  placeholder="Ej: V-12345678"
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-500 mb-1">
                  Fecha de Venta
                </label>
                <input
                  type="date"
                  required
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-500 mb-1">
                  Tasa Cambiaria (Bs/USDT)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={tasaUsdt}
                  onChange={(e) => setTasaUsdt(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white text-blue-700"
                />
              </div>
            </div>

            {/* SPARE PART SELECTION FOR CART */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <span className="block text-[10px] uppercase tracking-widest font-black text-slate-500 mb-3">
                Añadir Repuesto a la Venta (con Descuento/Oferta Flexible)
              </span>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                <div className="md:col-span-6">
                  <label className="block text-[9px] font-bold text-slate-450 mb-1">Seleccionar Repuesto</label>
                  <select
                    value={selectedRepuestoId}
                    onChange={(e) => handleRepuestoSelection(e.target.value)}
                    className="w-full text-xs font-semibold bg-white border border-slate-250 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="">-- Elige un repuesto del stock disponible --</option>
                    {repuestos
                      .filter(r => r.cantidad > 0)
                      .map(r => (
                        <option key={r.id} value={r.id}>
                          {r.nombre} ({r.codigo}) — Stock: {r.cantidad} u • Ref: ${r.precio}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[9px] font-bold text-slate-450 mb-1">Precio Unitario ($)</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      value={customPrecio}
                      onChange={(e) => setCustomPrecio(e.target.value)}
                      placeholder="Precio Venta"
                      className="w-full text-xs font-mono font-bold bg-white border border-slate-250 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    {selectedRepuestoId && (
                      <span className="absolute right-2 top-2 text-[9px] text-slate-400 font-bold">
                        PVP: ${repuestos.find(r => r.id === selectedRepuestoId)?.precio}
                      </span>
                    )}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[9px] font-bold text-slate-450 mb-1">Cantidad a vender</label>
                  <input
                    type="number"
                    min="1"
                    value={customQty}
                    onChange={(e) => setCustomQty(parseInt(e.target.value) || 1)}
                    className="w-full text-xs font-mono font-bold bg-white border border-slate-250 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <button
                    type="button"
                    onClick={handleAddItemToCart}
                    className="w-full flex items-center justify-center gap-1 text-xs font-bold text-slate-800 bg-white hover:bg-slate-100 border border-slate-350 transition py-2 px-3 rounded-lg shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-blue-600" />
                    <span>Agregar</span>
                  </button>
                </div>
              </div>
              
              {selectedRepuestoId && (
                <div className="mt-2.5 text-[10px] text-blue-700 font-semibold flex items-center gap-1.5 bg-blue-50 p-2 rounded-lg border border-blue-150">
                  <Info className="w-3.5 h-3.5 text-blue-500" />
                  <span>
                    Puedes cambiar libremente el precio unitario arriba para aplicar un descuento u oferta del mostrador.
                  </span>
                </div>
              )}
            </div>

            {/* CART LIST PREVIEW */}
            <div className="space-y-2">
              <span className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-500">
                Lista de Repuestos a Facturar ({cartItems.length} items)
              </span>

              {cartItems.length === 0 ? (
                <div className="p-8 border border-dashed border-slate-300 rounded-xl text-center text-slate-450 text-xs italic">
                  No has agregado ningún artículo a la venta aún.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-150">
                  {cartItems.map((item, idx) => {
                    const origPrice = Number(repuestos.find(r => r.id === item.id)?.precio ?? item.precio ?? 0);
                    const itemPrice = Number(item.precio ?? 0);
                    const discountPercent = origPrice > itemPrice && origPrice > 0
                      ? (((origPrice - itemPrice) / origPrice) * 100).toFixed(0)
                      : '0';

                    return (
                      <div key={idx} className="flex items-center justify-between p-3.5 bg-white text-xs hover:bg-slate-50 transition">
                        <div>
                          <p className="font-extrabold text-slate-950">{item.nombre}</p>
                          <div className="flex items-center gap-2 text-[10.5px] text-slate-500 mt-0.5">
                            <span>Cant: <strong className="text-slate-800 font-mono">{item.qty}</strong></span>
                            <span>•</span>
                            <span>Precio Unitario: <strong className="text-slate-800 font-mono">${itemPrice.toFixed(2)}</strong></span>
                            {parseFloat(discountPercent) > 0 && (
                              <span className="inline-flex items-center gap-0.5 px-1 py-0.2 select-none bg-emerald-50 text-emerald-700 text-[9.5px] font-black rounded border border-emerald-150">
                                <Percent className="w-2.5 h-2.5" />
                                {discountPercent}% Descuento
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right font-mono">
                            <span className="text-slate-900 font-black block">${(itemPrice * Number(item.qty || 1)).toFixed(2)}</span>
                            <span className="text-[10px] text-slate-450">
                              Bs {(itemPrice * Number(item.qty || 1) * Number(tasaUsdt || 1)).toFixed(1)}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveFromCart(idx)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition border border-rose-100 bg-rose-50/10 cursor-pointer"
                            title="Quitar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* CART STATS CLOSURE */}
                  <div className="bg-slate-50 p-4 flex justify-between items-center text-xs">
                    <div>
                      <span className="text-slate-500 font-medium block">Tasa de cambio: Bs {Number(tasaUsdt || 0).toFixed(2)} / $</span>
                      <span className="text-slate-400 block text-[10px]">Tasa fija guardada para esta venta</span>
                    </div>

                    <div className="text-right">
                      <span className="text-slate-500 font-bold block uppercase tracking-wider text-[9px]">TOTAL ESTIMADO</span>
                      <span className="text-base font-black text-blue-700 font-mono">${calculateCartTotal().toFixed(2)} USD</span>
                      <strong className="block text-xs text-slate-700 font-mono">
                        Bs {(calculateCartTotal() * Number(tasaUsdt || 1)).toLocaleString('es-VE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} VEF
                      </strong>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ACTION BLOCK FORM */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setErrorVal(null);
                  setCartItems([]);
                }}
                className="text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition py-2.5 px-4 rounded-xl border border-slate-250 cursor-pointer"
              >
                Cerrar Formulario
              </button>

              <button
                type="submit"
                className="flex items-center gap-1 text-xs font-black text-white bg-blue-600 hover:bg-blue-700 transition py-2.5 px-5 rounded-xl shadow-xs cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Confirmar y Salvar Venta</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SALES RECORD HISTORY TABLE */}
      <div className="bg-white border border-slate-250 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-2 border-b border-slate-100">
          <h3 className="text-xs uppercase tracking-widest font-black text-slate-400">
            Registro Histórico de Facturación Directa ({filteredVentas.length} de {ventasIndividuales.length} Ventas)
          </h3>
        </div>

        {ventasIndividuales.length > 0 && (
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200/60 mb-4 text-xs">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por cliente, cédula, id..."
                value={salesSearch}
                onChange={(e) => setSalesSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700"
              />
            </div>

            {/* Exact Date Range Filter */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
              <div className="flex items-center gap-1 bg-white border border-slate-200 py-1 px-2 rounded-lg text-xs text-slate-600 shrink-0">
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="font-semibold text-[10px] text-slate-500">Desde:</span>
                <input
                  type="date"
                  value={salesStartDate}
                  onChange={(e) => setSalesStartDate(e.target.value)}
                  className="bg-transparent border-0 focus:outline-none focus:ring-0 text-slate-700 text-[11px] py-0 px-1 font-semibold w-24"
                />
                <span className="font-semibold text-[10px] text-slate-500">Hasta:</span>
                <input
                  type="date"
                  value={salesEndDate}
                  onChange={(e) => setSalesEndDate(e.target.value)}
                  className="bg-transparent border-0 focus:outline-none focus:ring-0 text-slate-700 text-[11px] py-0 px-1 font-semibold w-24"
                />
                {(salesStartDate || salesEndDate || salesSearch) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSalesStartDate('');
                      setSalesEndDate('');
                      setSalesSearch('');
                    }}
                    className="text-[9px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-black cursor-pointer transition-colors border border-slate-200"
                    title="Limpiar filtros"
                  >
                    Limpiar
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {ventasIndividuales.length === 0 ? (
          <div className="p-12 border border-dashed border-slate-200 rounded-xl text-center text-slate-450 text-xs italic">
            Ninguna venta directa ha sido efectuada todavía. Utiliza el botón "Nueva Venta Directa" para registrar la primera.
          </div>
        ) : filteredVentas.length === 0 ? (
          <div className="p-12 border border-dashed border-slate-200 rounded-xl text-center text-slate-450 text-xs italic">
            No se encontraron ventas para los filtros seleccionados.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredVentas.map((venta) => {
              const totalItemsCount = venta.items.reduce((sum, i) => sum + i.qty, 0);

              return (
                <div
                  key={venta.id}
                  id={`venta-item-${venta.id}`}
                  className="bg-slate-50/50 border border-slate-150 rounded-xl p-4 hover:border-slate-300 hover:bg-slate-50 transition"
                >
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    {/* LEFT COLUMN: BASIC INFO */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center text-[10px] bg-slate-900 text-white font-extrabold px-2 py-0.5 rounded font-mono">
                          {venta.id}
                        </span>
                        <span className="text-[11px] text-slate-450 font-semibold flex items-center gap-1 font-mono">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {venta.fecha}
                        </span>
                      </div>

                      <div className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5 pb-0.5">
                        <User className="w-3.5 h-3.5 text-slate-450" />
                        <span>{venta.cliente_nombre}</span>
                        {venta.cliente_cedula && (
                          <span className="text-[10px] text-slate-500 font-bold font-mono">
                            ({venta.cliente_cedula})
                          </span>
                        )}
                      </div>

                      <div className="text-[10px] text-slate-500 font-medium">
                        Artículos comprados: <strong className="text-slate-800">{totalItemsCount}</strong> • Tasa registrada: <span className="font-mono text-slate-700">Bs {Number(venta.tasa_usdt || 0).toFixed(2)}</span>
                      </div>
                    </div>
                         {/* CENTER COLUMN: PRESET PRODUCTS */}
                    <div className="max-w-md flex-1 text-left md:text-center text-[10.5px] text-slate-600 bg-white/70 border border-slate-200/50 p-2.5 rounded-lg font-sans">
                      <span className="block text-[8px] uppercase tracking-wider font-extrabold text-slate-450 text-left mb-1">
                        Detalle Facturado
                      </span>
                      <div className="flex flex-wrap gap-1.5 justify-start md:justify-center">
                        {venta.items.map((it, i) => {
                          const devQty = it.qty_devuelta || 0;
                          return (
                            <span key={i} className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-1 rounded-md font-medium text-[9.5px] border border-slate-200">
                              {it.nombre} 
                              <strong className="text-slate-950 font-mono">({it.qty})</strong>
                              {devQty > 0 && (
                                <span className="text-amber-600 font-extrabold text-[9px] bg-amber-50 px-1 rounded ml-1 border border-amber-200">
                                  {devQty} Devueltos
                                </span>
                              )}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* RIGHT COLUMN: FINANCIAL AND DELETE */}
                    <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-3 md:pt-0 border-t border-slate-200/60 md:border-t-0">
                      <div className="text-left md:text-right font-mono pr-2">
                        <span className="text-sm font-black text-emerald-700 block">${Number(venta.total_usd || 0).toFixed(2)}</span>
                        <span className="text-[10px] font-bold text-slate-500 block leading-tight">
                          Bs {(Number(venta.total_usd || 0) * Number(venta.tasa_usdt || 1)).toLocaleString('es-VE', { maximumFractionDigits: 1 })}
                        </span>
                      </div>

                      <button
                        onClick={() => setActiveRefundVentaId(activeRefundVentaId === venta.id ? null : venta.id)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition shrink-0 cursor-pointer ${
                          activeRefundVentaId === venta.id
                            ? 'bg-amber-600 text-white border-amber-600 hover:bg-amber-700'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-250 hover:border-slate-400'
                        }`}
                        title="Procesar devolución o reembolso parcial/total"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${activeRefundVentaId === venta.id ? 'animate-spin' : ''}`} />
                        <span>Devolución</span>
                      </button>

                      <button
                        onClick={() => {
                          if (window.confirm('¿Estás seguro de que deseas eliminar esta venta directa? Los repuestos vendidos serán devueltos automáticamente al stock de inventario.')) {
                            onDeleteVenta(venta.id);
                          }
                        }}
                        className="p-2 text-rose-500 hover:text-white hover:bg-rose-600 transition duration-150 rounded-xl border border-slate-200 hover:border-rose-600 bg-white flex items-center justify-center shrink-0 cursor-pointer shadow-xs"
                        title="Eliminar venta y devolver mercancía al stock"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* NESTED EXPANDABLE REFUND PANEL */}
                  {activeRefundVentaId === venta.id && (
                    <div className="mt-4 p-4.5 bg-amber-50/50 border border-amber-200 rounded-xl space-y-3 font-sans">
                      <div className="flex justify-between items-center pb-2 border-b border-amber-200">
                        <h4 className="text-xs uppercase tracking-wide font-black text-amber-800 flex items-center gap-1.5">
                          <RefreshCw className="w-3.5 h-3.5 animate-pulse" /> 
                          <span>Panel de Devolución Contable / Reabastecimiento de Inventario</span>
                        </h4>
                        <button 
                          onClick={() => setActiveRefundVentaId(null)}
                          className="text-amber-700 hover:text-amber-900 text-xs font-bold flex items-center gap-0.5 border border-amber-200 px-2 py-1 rounded bg-white hover:bg-amber-50"
                        >
                          <X className="w-3 h-3" />
                          <span>Cerrar</span>
                        </button>
                      </div>

                      <div className="divide-y divide-amber-100 bg-white border border-amber-200/60 rounded-lg overflow-hidden">
                        {venta.items.map((item) => {
                          const devueltosAct = item.qty_devuelta || 0;
                          const restQty = item.qty - devueltosAct;

                          return (
                            <div key={item.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3.5 gap-3 bg-white hover:bg-amber-50/10 transition">
                              <div>
                                <p className="font-extrabold text-slate-850 text-xs">{item.nombre}</p>
                                <div className="text-[10.5px] text-slate-500 font-semibold space-x-2 mt-0.5">
                                  <span>Precio Unit: <strong className="text-slate-800">${Number(item.precio || 0).toFixed(2)}</strong></span>
                                  <span>•</span>
                                  <span>Cant. Original: <strong className="text-slate-800 font-mono">{item.qty} u</strong></span>
                                  {devueltosAct > 0 && (
                                    <>
                                      <span>•</span>
                                      <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-mono font-bold">Ya devueltos: {devueltosAct} u</span>
                                    </>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 select-none self-end sm:self-auto">
                                {restQty > 0 ? (
                                  <>
                                    <label className="text-[10.5px] text-slate-550 font-bold">Cant. a Devolver:</label>
                                    <input
                                      type="number"
                                      min="1"
                                      max={restQty}
                                      defaultValue={1}
                                      id={`refund-qty-input-${venta.id}-${item.id}`}
                                      className="w-16 text-center font-mono font-black border border-slate-300 rounded-lg p-1 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                                    />
                                    <button
                                      onClick={() => {
                                        const inp = document.getElementById(`refund-qty-input-${venta.id}-${item.id}`) as HTMLInputElement;
                                        const val = parseInt(inp?.value || '1', 10) || 1;
                                        if (val <= 0 || val > restQty) {
                                          alert(`Ingresa una cantidad válida entre 1 y ${restQty}`);
                                          return;
                                        }
                                        onRefundItem(venta.id, item.id, val);
                                      }}
                                      className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded-lg text-[11px] transition shadow-xs cursor-pointer flex items-center gap-1"
                                    >
                                      <span>Aplicar Retorno</span>
                                    </button>
                                  </>
                                ) : (
                                  <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 text-[10.5px] font-bold flex items-center gap-1">
                                    ✓ Todo devuelto a stock
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      <div className="text-[10px] text-amber-800 bg-amber-150/40 p-2.5 rounded-lg border border-amber-200/40 font-medium">
                        * Al devolver una pieza, el valor monetario correspondiente a la devolución será restado del total de la factura y la cantidad física retornará automáticamente al stock general del panel de Inventario.
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
