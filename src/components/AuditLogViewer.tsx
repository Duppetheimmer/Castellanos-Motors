import React, { useState } from 'react';
import { History, ShieldAlert, AlertTriangle, ArrowUpRight, ArrowDownLeft, Trash2, ShieldCheck, User, Calendar, Search } from 'lucide-react';
import { LogBorrados } from '../types';

interface AuditLogViewerProps {
  logBorrados: LogBorrados[];
}

export const AuditLogViewer: React.FC<AuditLogViewerProps> = ({ logBorrados }) => {
  const [auditSearch, setAuditSearch] = useState('');
  const [auditStartDate, setAuditStartDate] = useState('');
  const [auditEndDate, setAuditEndDate] = useState('');

  const filteredLogs = logBorrados.filter((log) => {
    // Search text matching description or user or entity type
    const matchesSearch = !auditSearch ||
      log.descripcion_auditoria.toLowerCase().includes(auditSearch.toLowerCase()) ||
      (log.usuario && log.usuario.toLowerCase().includes(auditSearch.toLowerCase())) ||
      log.tipo_entidad.toLowerCase().includes(auditSearch.toLowerCase());
      
    // Date filter on fecha_suceso
    let matchesDate = true;
    const logDate = log.fecha_suceso.split('T')[0];
    if (auditStartDate) {
      matchesDate = matchesDate && (logDate >= auditStartDate);
    }
    if (auditEndDate) {
      matchesDate = matchesDate && (logDate <= auditEndDate);
    }
    
    return matchesSearch && matchesDate;
  });
  
  const getBadgeStyles = (tipo: 'venta' | 'orden' | 'transaccion' | 'devolucion_repuesto') => {
    switch (tipo) {
      case 'venta':
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          label: 'Venta Directa'
        };
      case 'orden':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          label: 'Orden Trabajo'
        };
      case 'transaccion':
        return {
          bg: 'bg-orange-50 text-orange-700 border-orange-200',
          label: 'Transacción'
        };
      case 'devolucion_repuesto':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          label: 'Devolución Stock'
        };
      default:
        return {
          bg: 'bg-slate-50 text-slate-705 border-slate-200',
          label: 'Auditoría'
        };
    }
  };

  const formatTimestamp = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString('es-VE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div id="audit-log-view" className="space-y-6">
      
      {/* HEADER BILLBOARD */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-850 shadow-md">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-base font-black tracking-tight text-white flex items-center gap-2">
              <History className="w-5 h-5 text-blue-500" />
              <span>Bitácora de Auditoría Contable</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1 leading-normal font-medium">
              Historial de anulaciones, rectificaciones y eliminaciones en la base de datos sincronizada en la nube.
            </p>
          </div>
          
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/40 text-emerald-450 text-[10.5px] font-black rounded-lg border border-emerald-900/40 shadow-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Respaldado de forma inmutable en Supabase</span>
          </div>
        </div>
      </div>

      {/* RECENT ENTRIES LIST */}
      <div className="bg-white border border-slate-250 rounded-2xl p-6 shadow-xs">
        <h3 className="text-xs uppercase tracking-widest font-black text-slate-400 mb-4">
          Registro de Auditoría de Eliminaciones ({filteredLogs.length} de {logBorrados.length} Registros)
        </h3>

        {logBorrados.length > 0 && (
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200/60 mb-6 text-xs text-slate-800">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por descripción, usuario, tipo..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
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
                  value={auditStartDate}
                  onChange={(e) => setAuditStartDate(e.target.value)}
                  className="bg-transparent border-0 focus:outline-none focus:ring-0 text-slate-700 text-[11px] py-0 px-1 font-semibold w-24"
                />
                <span className="font-semibold text-[10px] text-slate-500">Hasta:</span>
                <input
                  type="date"
                  value={auditEndDate}
                  onChange={(e) => setAuditEndDate(e.target.value)}
                  className="bg-transparent border-0 focus:outline-none focus:ring-0 text-slate-700 text-[11px] py-0 px-1 font-semibold w-24"
                />
                {(auditStartDate || auditEndDate || auditSearch) && (
                  <button
                    type="button"
                    onClick={() => {
                      setAuditStartDate('');
                      setAuditEndDate('');
                      setAuditSearch('');
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

        {logBorrados.length === 0 ? (
          <div className="p-16 border border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-xs italic space-y-2">
            <ShieldAlert className="w-8 h-8 text-slate-350 mx-auto" />
            <p>La bitácora está limpia. No se registran eliminaciones ni devoluciones contables aún.</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-16 border border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-xs italic">
            No se encontraron registros de auditoría para los filtros seleccionados.
          </div>
        ) : (
          <div className="relative border-l border-slate-200 pl-4 ml-3 space-y-6">
            {filteredLogs.map((log) => {
              const badge = getBadgeStyles(log.tipo_entidad);

              return (
                <div key={log.id} id={`audit-card-${log.id}`} className="relative group">
                  {/* Timeline pointer bullet */}
                  <div className="absolute -left-[24.5px] top-1.5 w-4.5 h-4.5 bg-white border-2 border-rose-500 rounded-full flex items-center justify-center shadow-xs transition group-hover:bg-rose-500">
                    <Trash2 className="w-2.5 h-2.5 text-rose-500 transition group-hover:text-white" />
                  </div>

                  <div className="bg-slate-50 border border-slate-150 rounded-xl p-4.5 group-hover:border-slate-300 group-hover:bg-slate-50 transition">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      
                      {/* Entity and ID Badge */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center px-2 py-0.5 text-[9.5px] font-black rounded-md border uppercase ${badge.bg}`}>
                          {badge.label}
                        </span>
                        
                        <span className="text-[10px] bg-slate-900 text-white font-mono font-bold px-1.5 py-0.3 rounded-sm leading-none mt-0.5">
                          {log.id}
                        </span>

                        <span className="text-[10.5px] text-slate-400 font-mono font-medium">Ref timestamp: {log.fecha_suceso.split('T')[0]}</span>
                      </div>

                      {/* Created date/time */}
                      <div className="text-[10.5px] text-slate-500 font-semibold font-mono">
                        {formatTimestamp(log.fecha_suceso)}
                      </div>
                    </div>

                    {/* Detailed Content of Deletion */}
                    <p className="text-xs font-semibold text-slate-800 leading-relaxed mt-2.5 bg-white border border-slate-200/50 p-3 rounded-lg font-sans">
                      {log.descripcion_auditoria}
                    </p>

                    {/* Footer values and actor */}
                    <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-slate-200/60 text-[10.5px]">
                      <div className="flex items-center gap-1.5 text-slate-500 font-bold">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>Operador: <strong className="text-slate-700">{log.usuario || "Administrador del Sistema"}</strong></span>
                      </div>

                      {log.monto !== undefined && log.monto !== null && (
                        <div className="font-mono text-slate-500 font-medium text-right">
                          Monto Cancelado / Ajustado: <strong className="text-rose-600 font-black">${Number(log.monto).toFixed(2)} USD</strong>
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
