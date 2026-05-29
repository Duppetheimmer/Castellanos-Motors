import React, { useState } from 'react';
import { TrendingUp, ArrowUpRight, ArrowDownRight, Users, Wrench, Package, BarChart2 } from 'lucide-react';

interface ChartSlice {
  name: string;
  value: number;
  color: string;
  extraInfo?: string;
}

interface DonutChartProps {
  title: string;
  data: ChartSlice[];
  subTitle?: string;
  unit?: string;
}

export function DonutChart({ title, data, subTitle = 'Total', unit = '$' }: DonutChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  
  let accumulatedPercent = 0;

  return (
    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs transition-all flex flex-col justify-between h-full hover:shadow-md">
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 text-center">{title}</h3>
      
      <div className="flex flex-col items-center gap-4">
        {/* SVG Circle Rendering */}
        <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
          {total === 0 ? (
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="transparent"
                stroke="#f1f5f9"
                strokeWidth="10"
              />
            </svg>
          ) : (
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
              {data.map((slice, i) => {
                const percent = (slice.value / total) * 100;
                
                // If there are multiple segments, we can add a very small gap to create a beautiful, modern division
                const gap = data.length > 1 ? 0.6 : 0;
                const activePercent = Math.max(0.2, percent - gap);
                
                const dashArray = `${(activePercent / 100) * circumference} ${circumference}`;
                // Correct negative offset for precise clockwise drawing order
                const dashOffset = -((accumulatedPercent / 100) * circumference);
                accumulatedPercent += percent;

                const isHovered = hoveredIndex === i;

                return (
                  <circle
                    key={slice.name}
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="transparent"
                    stroke={slice.color}
                    strokeWidth={isHovered ? '13' : '9'}
                    strokeDasharray={dashArray}
                    strokeDashoffset={dashOffset}
                    className="transition-all duration-300 cursor-pointer origin-center"
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                );
              })}
            </svg>
          )}

          {/* Central Label */}
          <div className="absolute text-center p-1 flex flex-col items-center justify-center max-w-[90px]">
            {hoveredIndex !== null && data[hoveredIndex] ? (
              <>
                <span className="text-[9.5px] font-bold text-slate-400 block truncate w-full mb-0.5 uppercase tracking-wide">
                  {data[hoveredIndex].name}
                </span>
                <span className="text-xs font-black text-slate-800 leading-none">
                  {unit}
                  {Number(data[hoveredIndex].value ?? 0).toLocaleString('es-VE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
                <span className="text-[10px] text-slate-500 font-bold mt-0.5">
                  {Number(((data[hoveredIndex].value || 0) / (total || 1)) * 100).toFixed(0)}%
                </span>
              </>
            ) : (
              <>
                <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-bold mb-0.5">{subTitle}</span>
                <span className="text-sm font-black text-slate-800 leading-none">
                  {unit}
                  {total.toLocaleString('es-VE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Legend - redrawn as clean vertical rows taking the full width of the card */}
        <div className="w-full space-y-1.5 pt-3 border-t border-slate-100 max-h-[160px] overflow-y-auto pr-1">
          {data.length === 0 ? (
            <p className="text-[11px] text-slate-400 italic text-center py-2">No hay registros este mes</p>
          ) : (
            data.map((slice, i) => {
              const isHovered = hoveredIndex === i;
              const percent = total > 0 ? (slice.value / total) * 100 : 0;
              return (
                <div
                  key={slice.name}
                  className={`flex items-center justify-between p-1.5 rounded-lg transition-colors cursor-pointer select-none ${
                    isHovered ? 'bg-slate-50 font-medium' : 'hover:bg-slate-50/50'
                  }`}
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: slice.color }}
                    />
                    <div className="min-w-0">
                      <div className="text-[11px] font-semibold text-slate-700 truncate leading-tight">{slice.name}</div>
                      {slice.extraInfo && <div className="text-[9px] text-slate-400 leading-tight truncate">{slice.extraInfo}</div>}
                    </div>
                  </div>
                  <div className="text-right shrink-0 font-mono text-[10.5px] pl-2 flex items-center gap-1">
                    <span className="font-bold text-slate-850">
                      {unit}{Number(slice.value ?? 0).toLocaleString('es-VE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>
                    <span className="text-[9px] text-slate-450 font-sans">({Number(percent ?? 0).toFixed(0)}%)</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// Full Dashboard visual block with summaries
interface FinancialStats {
  ingresosTotales: number;
  costoRepuestos: number;
  remuneracionTrabajadores: number;
  gastosFijos: number;
  gananciaNeta: number;
  margenOperativo: number;
  ventaRepuestos: number;
  gananciaRepuestos: number;
}

interface DashboardChartsProps {
  stats: FinancialStats;
  repuestosConsumidos: ChartSlice[];
  gananciaSuelos: ChartSlice[];
  onSelectPeriod: (month: string) => void;
  selectedPeriod: string;
  disponiblesPeriodos: string[];
}

export function DashboardCharts({
  stats,
  repuestosConsumidos,
  gananciaSuelos,
  onSelectPeriod,
  selectedPeriod,
  disponiblesPeriodos
}: DashboardChartsProps) {
  // Let's create the financial distribution slices
  const distribucionFinanciera: ChartSlice[] = [
    {
      name: 'Ganancia Neta Taller',
      value: Math.max(0, stats.gananciaNeta),
      color: '#10b981', // emerald-500
      extraInfo: 'Utilidad neta líquida'
    },
    {
      name: 'Costo Repuestos',
      value: stats.costoRepuestos,
      color: '#ef4444', // red-500
      extraInfo: 'Costo de adquisición'
    },
    {
      name: 'Pago Trabajadores',
      value: stats.remuneracionTrabajadores,
      color: '#3b82f6', // blue-500
      extraInfo: 'Comisiones acumuladas'
    },
    {
      name: 'Gastos de Local / Extras',
      value: stats.gastosFijos,
      color: '#fbbf24', // yellow/amber-400
      extraInfo: 'Servicios, alquiler, etc.'
    }
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-4">
      {/* Numerical Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* Total Income */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ingresos Totales</span>
            <span className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <div>
            <h4 className="text-lg font-black text-slate-900 leading-tight font-mono">
              ${stats.ingresosTotales.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
            </h4>
            <div className="flex items-center gap-1.5 mt-1 text-slate-450 text-[10px]">
              <TrendingUp className="w-3 h-3 text-emerald-500 hover:rotate-12 transition-transform" />
              <span>Suma total cobrada en taller</span>
            </div>
          </div>
        </div>

        {/* Spare Parts Profit Markup */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ganancia Repuestos</span>
            <span className="p-1.5 bg-teal-50 rounded-lg text-teal-600">
              <TrendingUp className="w-3.5 h-3.5" />
            </span>
          </div>
          <div>
            <h4 className="text-lg font-black text-slate-900 leading-tight font-mono">
              ${stats.gananciaRepuestos.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
            </h4>
            <div className="flex items-center gap-1.5 mt-1 text-slate-450 text-[10px] truncate">
              <Package className="w-3 h-3 text-teal-400 shrink-0" />
              <span>Vta ${Number(stats.ventaRepuestos).toFixed(0)} - Coste ${Number(stats.costoRepuestos).toFixed(0)}</span>
            </div>
          </div>
        </div>

        {/* Cost of Goods Sold / Parts Cost */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Inversión Repuestos</span>
            <span className="p-1.5 bg-rose-50 rounded-lg text-rose-600">
              <ArrowDownRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <div>
            <h4 className="text-lg font-black text-slate-900 leading-tight font-mono">
              ${stats.costoRepuestos.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
            </h4>
            <div className="flex items-center gap-1.5 mt-1 text-slate-450 text-[10px]">
              <Package className="w-3 h-3 text-red-400 animate-pulse" />
              <span>Costo de repuestos usados</span>
            </div>
          </div>
        </div>

        {/* Workers Remuneration */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pago Trabajadores</span>
            <span className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
              <Users className="w-3.5 h-3.5" />
            </span>
          </div>
          <div>
            <h4 className="text-lg font-black text-slate-900 leading-tight font-mono">
              ${stats.remuneracionTrabajadores.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
            </h4>
            <div className="flex items-center gap-1.5 mt-1 text-slate-450 text-[10px]">
              <Wrench className="w-3 h-3 text-blue-400" />
              <span>Comisiones por mano de obra</span>
            </div>
          </div>
        </div>

        {/* Net Profit */}
        <div className={`rounded-xl p-4 border shadow-xs flex flex-col justify-between hover:shadow-md transition-all ${
          stats.gananciaNeta >= 0 
            ? 'bg-emerald-50/50 border-emerald-150/80 text-emerald-950' 
            : 'bg-rose-50 border-rose-150 text-rose-950'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Utilidad Neta Taller</span>
            <span className={`p-1 px-1.5 rounded text-[9px] font-black ${
              stats.gananciaNeta >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-150 text-rose-700'
            }`}>
              {Number(stats.margenOperativo ?? 0).toFixed(0)}% Margen
            </span>
          </div>
          <div>
            <h4 className="text-lg font-black font-mono leading-tight">
              ${stats.gananciaNeta.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
            </h4>
            <div className="flex items-center gap-1.5 mt-1 text-slate-500 text-[10px]">
              <BarChart2 className="w-3 h-3" />
              <span>Utilidad líquida libre</span>
            </div>
          </div>
        </div>
      </div>

      {/* Graphical Donuts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Donut 1: Income vs Costs breakdown */}
        <DonutChart
          title="Flujo de Caja y Distribución"
          data={distribucionFinanciera}
          subTitle="Flujo Total"
          unit="$"
        />

        {/* Donut 2: Workers Share of labor earnings */}
        <DonutChart
          title="Ganancias p/ Trabajador"
          data={gananciaSuelos}
          subTitle="Comisiones"
          unit="$"
        />

        {/* Donut 3: Spare Parts consumed breakdown */}
        <DonutChart
          title="Categorías de Repuestos"
          data={repuestosConsumidos}
          subTitle="Consumo"
          unit="$"
        />
      </div>
    </div>
  );
}
