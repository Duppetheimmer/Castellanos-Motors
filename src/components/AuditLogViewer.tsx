import React from 'react';
import { History, ShieldAlert, AlertTriangle, ArrowUpRight, ArrowDownLeft, Trash2, ShieldCheck, User } from 'lucide-react';
import { LogBorrados } from '../types';

interface AuditLogViewerProps {
  logBorrados: LogBorrados[];
}

export const AuditLogViewer: React.FC<AuditLogViewerProps> = ({ logBorrados }) => {
  
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
        <h3 className="text-xs uppercase tracking-widest font-black text-slate-400 mb-6">
          Registro de Auditoría de Eliminaciones ({logBorrados.length} Registros)
        </h3>

        {logBorrados.length === 0 ? (
          <div className="p-16 border border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-xs italic space-y-2">
            <ShieldAlert className="w-8 h-8 text-slate-350 mx-auto" />
            <p>La bitácora está limpia. No se registran eliminaciones ni devoluciones contables aún.</p>
          </div>
        ) : (
          <div className="relative border-l border-slate-200 pl-4 ml-3 space-y-6">
            {logBorrados.map((log) => {
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
