import React, { useState, useMemo } from 'react';
import { 
  Package, 
  Search, 
  Filter, 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight, 
  ShoppingBag, 
  FileText, 
  User, 
  Percent,
  Tag
} from 'lucide-react';
import { Orden, VentaIndividual, Repuesto, Cliente } from '../types';

interface RepuestosMovimientosProps {
  ordenes: Orden[];
  ventasIndividuales: VentaIndividual[];
  repuestos: Repuesto[];
  clientes: Cliente[];
}

interface MovimientoRepuesto {
  id: string; // unique synthetic ID for rendering
  idRepuesto: string;
  nombre: string;
  codigo: string;
  categoria: string;
  tipo: 'venta_directa' | 'orden_trabajo';
  origenId: string; // Venta id or Orden id
  fecha: string;
  clienteNombre: string;
  cantidadOriginal: number;
  cantidadDevuelta: number;
  cantidadEfectiva: number;
  precioUnitario: number;
  costoUnitario: number;
  totalPrecio: number;
  totalCosto: number;
  totalUtilidad: number;
}

export const RepuestosMovimientos: React.FC<RepuestosMovimientosProps> = ({
  ordenes,
  ventasIndividuales,
  repuestos,
  clientes,
}) => {
  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [metodoFilter, setMetodoFilter] = useState<'todos' | 'venta_directa' | 'orden_trabajo'>('todos');
  const [categoriaFilter, setCategoriaFilter] = useState<string>('todos');
  const [sortBy, setSortBy] = useState<'fecha_desc' | 'fecha_asc' | 'utilidad_desc' | 'cantidad_desc'>('fecha_desc');

  // Convert all direct sales and completed/in-progress work orders to unified list
  const todosMovimientos = useMemo(() => {
    const list: MovimientoRepuesto[] = [];

    // 1. Process VentaIndividual
    ventasIndividuales.forEach((venta) => {
      const items = venta.items || [];
      items.forEach((item, idx) => {
        const qty_original = item.qty || 0;
        const qty_devuelta = item.qty_devuelta || 0;
        const qty_efectiva = Math.max(0, qty_original - qty_devuelta);
        const precio = item.precio || 0;
        const costo = item.costo || 0;

        const originalRepuesto = repuestos.find((r) => r.id === item.id);
        const codigo = originalRepuesto?.codigo || 'S/C';
        const categoria = originalRepuesto?.categoria || 'Sin Categoría';

        list.push({
          id: `vd-${venta.id}-${item.id}-${idx}`,
          idRepuesto: item.id,
          nombre: item.nombre || originalRepuesto?.nombre || 'Repuesto Desconocido',
          codigo,
          categoria,
          tipo: 'venta_directa',
          origenId: venta.id,
          fecha: venta.fecha || '',
          clienteNombre: venta.cliente_nombre || 'Cliente Particular',
          cantidadOriginal: qty_original,
          cantidadDevuelta: qty_devuelta,
          cantidadEfectiva: qty_efectiva,
          precioUnitario: precio,
          costoUnitario: costo,
          totalPrecio: qty_efectiva * precio,
          totalCosto: qty_efectiva * costo,
          totalUtilidad: qty_efectiva * (precio - costo),
        });
      });
    });

    // 2. Process Ordenes
    ordenes.forEach((order) => {
      const parts = order.repuestos || [];
      // Resolve client name
      const matchingCliente = clientes.find((c) => c.id === order.cliente_id);
      const clienteNome = matchingCliente?.nombre || 'Cliente General / Taller';

      parts.forEach((item, idx) => {
        const qty = item.qty || 0;
        const precio = item.precio || 0;
        const costo = item.costo || 0;

        const originalRepuesto = repuestos.find((r) => r.id === item.id);
        const nombre = originalRepuesto?.nombre || 'Repuesto de Orden';
        const codigo = originalRepuesto?.codigo || 'S/C';
        const categoria = originalRepuesto?.categoria || 'Sin Categoría';

        list.push({
          id: `ot-${order.id}-${item.id}-${idx}`,
          idRepuesto: item.id,
          nombre,
          codigo,
          categoria,
          tipo: 'orden_trabajo',
          origenId: order.id,
          fecha: order.fecha || '',
          clienteNombre: clienteNome,
          cantidadOriginal: qty,
          cantidadDevuelta: 0,
          cantidadEfectiva: qty,
          precioUnitario: precio,
          costoUnitario: costo,
          totalPrecio: qty * precio,
          totalCosto: qty * costo,
          totalUtilidad: qty * (precio - costo),
        });
      });
    });

    return list;
  }, [ordenes, ventasIndividuales, repuestos, clientes]);

  // Extract unique categories for filtering
  const categoriasDisponibles = useMemo(() => {
    const cats = new Set<string>();
    todosMovimientos.forEach((m) => {
      if (m.categoria) cats.add(m.categoria);
    });
    return Array.from(cats).sort();
  }, [todosMovimientos]);

  // Apply filters and sorting
  const filteredMovimientos = useMemo(() => {
    let result = [...todosMovimientos];

    // Method Filter
    if (metodoFilter !== 'todos') {
      result = result.filter(m => m.tipo === metodoFilter);
    }

    // Category Filter
    if (categoriaFilter !== 'todos') {
      result = result.filter(m => m.categoria === categoriaFilter);
    }

    // Search term text filter (matching spare part name, code, client name, or original reference/origin ID)
    if (searchTerm.trim() !== '') {
      const query = searchTerm.toLowerCase();
      result = result.filter((m) => 
        m.nombre.toLowerCase().includes(query) ||
        m.codigo.toLowerCase().includes(query) ||
        m.clienteNombre.toLowerCase().includes(query) ||
        m.categoria.toLowerCase().includes(query)
      );
    }

    // Sorting logic
    result.sort((a, b) => {
      if (sortBy === 'fecha_desc') {
        return b.fecha.localeCompare(a.fecha);
      }
      if (sortBy === 'fecha_asc') {
        return a.fecha.localeCompare(b.fecha);
      }
      if (sortBy === 'utilidad_desc') {
        return b.totalUtilidad - a.totalUtilidad;
      }
      if (sortBy === 'cantidad_desc') {
        return b.cantidadEfectiva - a.cantidadEfectiva;
      }
      return 0;
    });

    return result;
  }, [todosMovimientos, metodoFilter, categoriaFilter, searchTerm, sortBy]);

  // KPI Calculations
  const metrics = useMemo(() => {
    let totalVendidos = 0;
    let ingresoTotal = 0;
    let costoTotal = 0;
    let deueltasCount = 0;

    filteredMovimientos.forEach((m) => {
      totalVendidos += m.cantidadEfectiva;
      ingresoTotal += m.totalPrecio;
      costoTotal += m.totalCosto;
      deueltasCount += m.cantidadDevuelta;
    });

    const utilidadTotal = ingresoTotal - costoTotal;
    const margenPromedio = ingresoTotal > 0 ? (utilidadTotal / ingresoTotal) * 100 : 0;

    return {
      totalVendidos,
      ingresoTotal,
      costoTotal,
      deueltasCount,
      utilidadTotal,
      margenPromedio
    };
  }, [filteredMovimientos]);

  return (
    <div className="space-y-6 font-sans">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-2xl shadow-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Package className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-bold tracking-tight">Kardex y Control de Repuestos</h2>
          </div>
          <p className="text-xs text-slate-400">
            Visualización integrada de ingresos, costos y movimientos por inventario (Órdenes de Trabajo + Ventas Directas).
          </p>
        </div>
        <div className="bg-slate-800 px-4 py-2 rounded-xl text-center border border-slate-700 md:self-center">
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Registros Consultados</span>
          <span className="text-lg font-black text-blue-400 font-mono">{filteredMovimientos.length} de {todosMovimientos.length}</span>
        </div>
      </div>

      {/* RENDER FINANCIAL KPI SHELF */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI: TOTAL REVENUE */}
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block leading-none">Ingreo por Repuestos</span>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono mt-2.5">
              ${metrics.ingresoTotal.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="text-[10.5px] font-bold text-emerald-700 flex items-center bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100 self-start mt-3">
            <ArrowUpRight className="w-3 h-3 mr-0.5" />
            <span>Remanente contable bruto</span>
          </div>
        </div>

        {/* KPI: TOTAL COSt */}
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block leading-none">Costo de Inversión</span>
              <DollarSign className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-black text-slate-700 font-mono mt-2.5">
              ${metrics.costoTotal.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="text-[10.5px] font-bold text-slate-650 flex items-center bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200 self-start mt-3">
            <span>Costo de adquisición</span>
          </div>
        </div>

        {/* KPI: NET UTILITY */}
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block leading-none">Ganancia Neta Repuestos</span>
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-blue-800 font-mono mt-2.5">
              ${metrics.utilidadTotal.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="text-[10.5px] font-bold text-blue-700 flex items-center bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100 self-start mt-3">
            <Percent className="w-3 h-3 mr-0.5 text-blue-600" />
            <span>Retorno: {metrics.margenPromedio.toFixed(1)}% promedio</span>
          </div>
        </div>

        {/* KPI: QUANTITY ISSUED */}
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block leading-none">Cantidad Comercializada</span>
              <Tag className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono mt-2.5">
              {metrics.totalVendidos} <span className="text-xs text-slate-450 font-normal">uds</span>
            </div>
          </div>
          {metrics.deueltasCount > 0 ? (
            <div className="text-[10.5px] font-bold text-amber-700 flex items-center bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100 self-start mt-3">
              <ArrowDownRight className="w-3 h-3 mr-0.5" />
              <span>{metrics.deueltasCount} uds devueltas a stock</span>
            </div>
          ) : (
            <div className="text-[10.5px] font-bold text-purple-700 flex items-center bg-purple-50/75 px-2 py-0.5 rounded-lg border border-purple-100 self-start mt-3">
              <span>Todo el stock garantizado</span>
            </div>
          )}
        </div>
      </div>

      {/* CONTROLS BAR: SEARCH & FILTERS */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Main search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por repuesto, código, cliente, categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-250 rounded-xl text-xs bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
            />
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            {/* Filter by Method Badge */}
            <div className="flex items-center gap-1.5 border border-slate-200 px-2.5 py-1.5 rounded-xl bg-slate-50/50">
              <Filter className="w-3 h-3 text-slate-400" />
              <span className="text-[10px] text-slate-500 font-bold uppercase mr-1">Método:</span>
              <button
                onClick={() => setMetodoFilter('todos')}
                className={`px-2 py-0.5 rounded font-black tracking-tight ${
                  metodoFilter === 'todos' 
                    ? 'bg-blue-600 text-white shadow-xs' 
                    : 'text-slate-600 hover:bg-slate-150'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setMetodoFilter('venta_directa')}
                className={`px-2 py-0.5 rounded font-black tracking-tight ${
                  metodoFilter === 'venta_directa' 
                    ? 'bg-blue-600 text-white shadow-xs' 
                    : 'text-slate-600 hover:bg-slate-150'
                }`}
              >
                Directa
              </button>
              <button
                onClick={() => setMetodoFilter('orden_trabajo')}
                className={`px-2 py-0.5 rounded font-black tracking-tight ${
                  metodoFilter === 'orden_trabajo' 
                    ? 'bg-blue-600 text-white shadow-xs' 
                    : 'text-slate-600 hover:bg-slate-150'
                }`}
              >
                Ordenes
              </button>
            </div>

            {/* Filter by Category */}
            <select
              value={categoriaFilter}
              onChange={(e) => setCategoriaFilter(e.target.value)}
              className="border border-slate-250 bg-slate-50/50 rounded-xl px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="todos">Categoría: Todas</option>
              {categoriasDisponibles.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="border border-slate-250 bg-slate-50/50 rounded-xl px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="fecha_desc">Fecha: Más Reciente</option>
              <option value="fecha_asc">Fecha: Antiguo Primero</option>
              <option value="utilidad_desc">Ganancia: Mayor a Menor</option>
              <option value="cantidad_desc">Cantidad: Más Vendida</option>
            </select>
          </div>
        </div>
      </div>

      {/* DATA VIEW AREA */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {filteredMovimientos.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Package className="w-12 h-12 text-slate-305 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-800">No se encontraron movimientos registrados</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Comienza a vender repuestos en Ventas Directas o agrégalos como material en las Órdenes de Trabajo del taller para verlos aquí.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200 text-[10px] text-slate-450 uppercase font-extrabold select-none">
                  <th className="py-3.5 px-4">Fecha</th>
                  <th className="py-3.5 px-4 text-xs font-bold text-slate-800 uppercase normal-case">Código & Repuesto</th>
                  <th className="py-3.5 px-4">Categoría</th>
                  <th className="py-3.5 px-4">Metodo / Destino</th>
                  <th className="py-3.5 px-4 text-center">Unidades</th>
                  <th className="py-3.5 px-4 text-right">Precios (Unit)</th>
                  <th className="py-3.5 px-4 text-right">Contable Total</th>
                  <th className="py-3.5 px-4 text-right">Margen Neto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 text-xs text-slate-650">
                {filteredMovimientos.map((mov) => {
                  const isDirect = mov.tipo === 'venta_directa';
                  return (
                    <tr key={mov.id} className="hover:bg-slate-50/75 transition border-b border-slate-100">
                      {/* DATE */}
                      <td className="py-3.5 px-4 font-semibold font-mono whitespace-nowrap text-slate-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{mov.fecha}</span>
                        </div>
                      </td>

                      {/* CODE & SPARE PART */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-[9px] font-extrabold bg-slate-100 text-slate-700 px-1 py-0.5 rounded border border-slate-200 mr-2">
                          {mov.codigo}
                        </span>
                        <strong className="text-slate-900 group-hover:text-blue-600 transition truncate max-w-xs inline-block align-middle font-sans font-extrabold">
                          {mov.nombre}
                        </strong>
                      </td>

                      {/* CATEGORY */}
                      <td className="py-3.5 px-4">
                        <span className="text-[10px] font-bold text-slate-500 font-sans">
                          {mov.categoria}
                        </span>
                      </td>

                      {/* METHOD / CHANNEL */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-0.5">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold self-start border ${
                            isDirect 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}>
                            {isDirect ? <ShoppingBag className="w-2.5 h-2.5" /> : <FileText className="w-2.5 h-2.5" />}
                            <span>{isDirect ? 'Venta Directa' : 'Orden de Trabajo'}</span>
                          </span>
                          <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1 mt-0.5">
                            <User className="w-2.5 h-2.5 text-slate-400" />
                            <span className="truncate max-w-[140px]" title={mov.clienteNombre}>
                              {mov.clienteNombre}
                            </span>
                          </span>
                        </div>
                      </td>

                      {/* QUANTITY */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="font-mono">
                          <strong className="text-slate-900 font-black text-sm">{mov.cantidadEfectiva}</strong>
                          <span className="text-[9.5px] text-slate-400 ml-1">uds</span>
                        </div>
                        {mov.cantidadDevuelta > 0 && (
                          <div className="text-[8px] bg-amber-50 text-amber-700 border border-amber-200 px-1 py-0.2 rounded font-black max-w-fit mx-auto mt-0.5">
                            {mov.cantidadDevuelta} devueltos
                          </div>
                        )}
                      </td>

                      {/* PRICES */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="font-mono">
                          <span className="text-slate-800 font-bold block">${mov.precioUnitario.toFixed(2)} <span className="text-[10px] text-slate-400 font-normal">PVP</span></span>
                          <span className="text-slate-450 text-[10px] block leading-none">Coste: ${mov.costoUnitario.toFixed(2)}</span>
                        </div>
                      </td>

                      {/* TOTAL PRICE / REVENUE AND COST */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="font-mono">
                          <span className="text-slate-900 font-black block">${mov.totalPrecio.toFixed(2)}</span>
                          <span className="text-slate-450 text-[10px] block leading-none">Coste: ${mov.totalCosto.toFixed(2)}</span>
                        </div>
                      </td>

                      {/* MARGIN NET */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="font-mono">
                          <span className={`font-black block text-sm ${mov.totalUtilidad >= 0 ? 'text-blue-700' : 'text-rose-700'}`}>
                            ${mov.totalUtilidad.toFixed(2)}
                          </span>
                          {mov.totalCosto > 0 && mov.totalUtilidad >= 0 ? (
                            <span className="text-[9.5px] text-emerald-600 font-bold block leading-none mt-0.5">
                              +{((mov.totalUtilidad / mov.totalPrecio) * 100).toFixed(0)}% m.
                            </span>
                          ) : (
                            <span className="text-slate-400 font-bold block text-[9.5px] leading-none mt-0.5">---</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
