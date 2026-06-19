import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from './lib/supabaseClient';
import {
  loadState,
  saveState,
  INITIAL_CLIENTES,
  INITIAL_VEHICULOS,
  INITIAL_REPUESTOS,
  INITIAL_TRABAJADORES,
  INITIAL_ORDENES,
  INITIAL_SOLICITUDES,
  INITIAL_TRANSACCIONES
} from './data';
import { Cliente, Vehiculo, Repuesto, Orden, Trabajador, TransaccionExtra, VentaIndividual, LogBorrados } from './types';
import { DashboardCharts } from './components/DashboardCharts';
import { InventoryManager } from './components/InventoryManager';
import { OrdersManager } from './components/OrdersManager';
import { WorkersManager } from './components/WorkersManager';
import { ExtraTransactions } from './components/ExtraTransactions';
import { ClientsVehicles } from './components/ClientsVehicles';
import { LoginScreen } from './components/LoginScreen';
import { VentasIndividualesManager } from './components/VentasIndividualesManager';
import { AuditLogViewer } from './components/AuditLogViewer';
import { RepuestosMovimientos } from './components/RepuestosMovimientos';
import {
  Wrench,
  BarChart3,
  Package,
  FileText,
  Users,
  Briefcase,
  Share2,
  Lock,
  Coins,
  ShieldCheck,
  TrendingUp,
  X,
  LogOut,
  Key,
  ShoppingBag,
  History
} from 'lucide-react';

// Calendar Period helpers for weekly/monthly categorization
const getWeekId = (dateStr: string) => {
  if (!dateStr || dateStr.length < 10) return '';
  const date = new Date(dateStr + 'T12:00:00');
  const day = date.getDay();
  // Monday of that week
  const diffToMonday = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date);
  monday.setDate(diffToMonday);
  
  const pad = (n: number) => n.toString().padStart(2, '0');
  const y = monday.getFullYear();
  const m = pad(monday.getMonth() + 1);
  const d = pad(monday.getDate());
  
  return `W-${y}-${m}-${d}`;
};

const formatWeekId = (weekId: string) => {
  if (!weekId.startsWith('W-')) return weekId;
  const parts = weekId.split('-');
  if (parts.length < 4) return weekId;
  const y = parts[1];
  const m = parts[2];
  const d = parts[3];
  
  const monday = new Date(`${y}-${m}-${d}T12:00:00`);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `Semana del ${d}/${m}/${y} al ${pad(sunday.getDate())}/${pad(sunday.getMonth() + 1)}/${sunday.getFullYear()}`;
};

const formatMonthId = (monthId: string) => {
  const parts = monthId.split('-');
  if (parts.length < 2) return monthId;
  const year = parts[0];
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const mIdx = parseInt(parts[1], 10) - 1;
  const monthName = monthNames[mIdx] || parts[1];
  return `${monthName} ${year}`;
};

export default function App() {
  // Auth and secure access states
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('econograph_session_active') === 'true';
  });
  const [isChangeAuthOpen, setIsChangeAuthOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changeAuthError, setChangeAuthError] = useState<string | null>(null);
  const [changeAuthSuccess, setChangeAuthSuccess] = useState(false);

  // Pure JavaScript SHA-256 fallback for browsers/contexts without crypto.subtle (e.g., non-HTTPS, inside iframes, specific WebViews)
  const sha256Fallback = (ascii: string): string => {
    const rightRotateFn = (v: number, n: number) => (v >>> n) | (v << (32 - n));
    const h = [
      0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
      0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
    ];
    const k = [
      0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
      0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
      0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
      0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
      0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
      0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
      0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
      0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ];

    const asciiLength = ascii.length;
    let bitLength = asciiLength * 8;
    const wordCount = ((bitLength + 64) >> 9) << 4;
    const words: number[] = [];
    for (let idx = 0; idx < wordCount + 16; idx++) {
      words[idx] = 0;
    }
    for (let idx = 0; idx < asciiLength; idx++) {
      words[idx >> 2] |= (ascii.charCodeAt(idx) & 0xff) << (24 - (idx % 4) * 8);
    }
    words[bitLength >> 5] |= 0x80 << (24 - (bitLength % 32));
    words[(((bitLength + 64) >> 9) << 4) + 15] = bitLength;

    for (let idx = 0; idx < words.length; idx += 16) {
      const w: number[] = [];
      for (let j = 0; j < 64; j++) {
        if (j < 16) {
          w[j] = words[idx + j] || 0;
        } else {
          const s0 = rightRotateFn(w[j - 15], 7) ^ rightRotateFn(w[j - 15], 18) ^ (w[j - 15] >>> 3);
          const s1 = rightRotateFn(w[j - 2], 17) ^ rightRotateFn(w[j - 2], 19) ^ (w[j - 2] >>> 10);
          w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
        }
      }

      let a = h[0];
      let b = h[1];
      let c = h[2];
      let d = h[3];
      let e = h[4];
      let f = h[5];
      let g = h[6];
      let h_val = h[7];

      for (let j = 0; j < 64; j++) {
        const s1 = rightRotateFn(e, 6) ^ rightRotateFn(e, 11) ^ rightRotateFn(e, 25);
        const ch = (e & f) ^ (~e & g);
        const temp1 = (h_val + s1 + ch + k[j] + w[j]) | 0;
        const s0 = rightRotateFn(a, 2) ^ rightRotateFn(a, 13) ^ rightRotateFn(a, 22);
        const maj = (a & b) ^ (a & c) ^ (b & c);
        const temp2 = (s0 + maj) | 0;

        h_val = g;
        g = f;
        f = e;
        e = (d + temp1) | 0;
        d = c;
        c = b;
        b = a;
        a = (temp1 + temp2) | 0;
      }

      h[0] = (h[0] + a) | 0;
      h[1] = (h[1] + b) | 0;
      h[2] = (h[2] + c) | 0;
      h[3] = (h[3] + d) | 0;
      h[4] = (h[4] + e) | 0;
      h[5] = (h[5] + f) | 0;
      h[6] = (h[6] + g) | 0;
      h[7] = (h[7] + h_val) | 0;
    }

    let result = '';
    for (let idx = 0; idx < 8; idx++) {
      let hex = (h[idx] >>> 0).toString(16);
      while (hex.length < 8) {
        hex = '0' + hex;
      }
      result += hex;
    }
    return result;
  };

  // SHA-256 secure hashing helper with pure-JS fallback
  const hashString = async (text: string, lowerCase: boolean = false): Promise<string> => {
    const formatted = lowerCase ? text.trim().toLowerCase() : text.trim();
    
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      try {
        const encoder = new TextEncoder();
        const data = encoder.encode(formatted);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      } catch (e) {
        console.warn('Native crypto digest failed, falling back to sha256Fallback:', e);
      }
    }
    return sha256Fallback(formatted);
  };

  const handleUpdateAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangeAuthError(null);
    setChangeAuthSuccess(false);

    if (!newUsername.trim()) {
      setChangeAuthError('El usuario no puede estar vacío.');
      return;
    }
    if (newPassword.length < 4) {
      setChangeAuthError('La contraseña debe tener al menos 4 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setChangeAuthError('Las contraseñas no coinciden.');
      return;
    }

    try {
      const userHash = await hashString(newUsername, true);
      const passHash = await hashString(newPassword, false);

      localStorage.setItem('econograph_user_hash', userHash);
      localStorage.setItem('econograph_pass_hash', passHash);

      setChangeAuthSuccess(true);
      setNewUsername('');
      setNewPassword('');
      setConfirmPassword('');
      
      setTimeout(() => {
        setIsChangeAuthOpen(false);
        setChangeAuthSuccess(false);
      }, 1800);
    } catch (err) {
      console.error('Error saving new auth credentials:', err);
      setChangeAuthError('Error de cifrado. Por favor intente de nuevo.');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('econograph_session_active');
    setIsAuthenticated(false);
  };

  // Load local persisted state (indexed with 'econograph_') or fallback to seeded SQL equivalents
  const [clientes, setClientes] = useState<Cliente[]>(() => loadState('clientes', INITIAL_CLIENTES));
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>(() => loadState('vehiculos', INITIAL_VEHICULOS));
  const [repuestos, setRepuestos] = useState<Repuesto[]>(() => loadState('repuestos', INITIAL_REPUESTOS));
  const [ordenes, setOrdenes] = useState<Orden[]>(() => loadState('ordenes', INITIAL_ORDENES));
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>(() => loadState('trabajadores', INITIAL_TRABAJADORES));
  const [transacciones, setTransacciones] = useState<TransaccionExtra[]>(() => loadState('transacciones', INITIAL_TRANSACCIONES));
  const [ventasIndividuales, setVentasIndividuales] = useState<VentaIndividual[]>(() => loadState('ventas_individuales', []));
  const [logBorrados, setLogBorrados] = useState<LogBorrados[]>(() => loadState('log_borrados', []));

  const [supabaseConnected, setSupabaseConnected] = useState<boolean>(false);
  const [loadingSupabase, setLoadingSupabase] = useState<boolean>(false);

  // Sync on mount with Cloud Supabase Instance
  useEffect(() => {
    async function syncWithSupabase() {
      if (!isSupabaseConfigured()) {
        console.log('Supabase credentials not configured in environment. Defaulting to cached localStorage.');
        return;
      }
      setLoadingSupabase(true);
      try {
        const { data: dbCli } = await supabase.from('clientes').select('*');
        const { data: dbVeh } = await supabase.from('vehiculos').select('*');
        const { data: dbRep } = await supabase.from('repuestos').select('*');
        const { data: dbTrab } = await supabase.from('trabajadores').select('*');
        const { data: dbOrd } = await supabase.from('ordenes').select('*');
        const { data: dbTx } = await supabase.from('transacciones_extra').select('*');

        let dbVentasInd: any[] | null = null;
        let dbLogBorrados: any[] | null = null;

        try {
          const { data } = await supabase.from('ventas_individuales').select('*');
          dbVentasInd = data;
        } catch (e) {
          console.warn('La tabla de ventas_individuales no pudo ser leída o no existe aún:', e);
        }

        try {
          const { data } = await supabase.from('historial_borrados').select('*');
          dbLogBorrados = data;
        } catch (e) {
          console.warn('La tabla de historial_borrados no pudo ser leída o no existe aún:', e);
        }

        const totalRows = (dbCli?.length || 0) + (dbVeh?.length || 0) + (dbRep?.length || 0) + (dbTrab?.length || 0) + (dbOrd?.length || 0) + (dbTx?.length || 0);

        if (totalRows === 0) {
          console.log('Empty Cloud Instance detected. Provisioning demo datasets...');
          if (INITIAL_CLIENTES.length > 0) await supabase.from('clientes').insert(INITIAL_CLIENTES);
          if (INITIAL_VEHICULOS.length > 0) await supabase.from('vehiculos').insert(INITIAL_VEHICULOS);
          if (INITIAL_REPUESTOS.length > 0) await supabase.from('repuestos').insert(INITIAL_REPUESTOS);
          if (INITIAL_TRABAJADORES.length > 0) await supabase.from('trabajadores').insert(INITIAL_TRABAJADORES);
          if (INITIAL_ORDENES.length > 0) await supabase.from('ordenes').insert(INITIAL_ORDENES);
          if (INITIAL_TRANSACCIONES.length > 0) await supabase.from('transacciones_extra').insert(INITIAL_TRANSACCIONES);
          
          setClientes(INITIAL_CLIENTES);
          setVehiculos(INITIAL_VEHICULOS);
          setRepuestos(INITIAL_REPUESTOS);
          setTrabajadores(INITIAL_TRABAJADORES);
          setOrdenes(INITIAL_ORDENES);
          setTransacciones(INITIAL_TRANSACCIONES);
        } else {
          console.log('Synced with Supabase successfully.');
          if (dbCli) setClientes(dbCli);
          if (dbVeh) setVehiculos(dbVeh);
          if (dbRep) setRepuestos(dbRep);
          if (dbTrab) setTrabajadores(dbTrab);
          if (dbOrd) setOrdenes(dbOrd as any);
          if (dbTx) setTransacciones(dbTx as any);
          if (dbVentasInd) {
            setVentasIndividuales(dbVentasInd);
            saveState('ventas_individuales', dbVentasInd);
          }
          if (dbLogBorrados) {
            setLogBorrados(dbLogBorrados);
            saveState('log_borrados', dbLogBorrados);
          }
        }
        setSupabaseConnected(true);
      } catch (err) {
        console.error('Error establishing connection with Supabase. Operating in offline cache mode:', err);
        setSupabaseConnected(false);
      } finally {
        setLoadingSupabase(false);
      }
    }
    syncWithSupabase();
  }, []);

  // Current selected screen
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventario' | 'ordenes' | 'personal' | 'repuestos_movimientos' | 'flujo' | 'ventas_directas' | 'auditoria'>('dashboard');

  // Year-Month level selection for EconoGRAPH (e.g. '2025-05' or 'Todos')
  const [periodType, setPeriodType] = useState<'todos' | 'semanal' | 'mensual' | 'anual'>('todos');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('Todos');
  const [availablePeriods, setAvailablePeriods] = useState<{ id: string; label: string }[]>([]);

  // Calculate unique financial periods registered in completed orders/transactions depending on periodType
  useEffect(() => {
    const dates = new Set<string>();
    ordenes.forEach((o) => {
      if (o.fecha && o.fecha.length >= 10) dates.add(o.fecha);
    });
    transacciones.forEach((t) => {
      if (t.fecha && t.fecha.length >= 10) dates.add(t.fecha);
    });

    const datesArray = Array.from(dates);

    if (periodType === 'semanal') {
      const weeks = new Set<string>();
      datesArray.forEach((d) => {
        const wId = getWeekId(d);
        if (wId) weeks.add(wId);
      });
      const sortedWeeks = Array.from(weeks).sort((a, b) => b.localeCompare(a));
      const formatted = sortedWeeks.map(w => ({ id: w, label: formatWeekId(w) }));
      setAvailablePeriods(formatted);
      if (formatted.length > 0) {
        if (!sortedWeeks.includes(selectedPeriod)) {
          setSelectedPeriod(sortedWeeks[0]);
        }
      } else {
        setSelectedPeriod('Todos');
      }
    } else if (periodType === 'mensual') {
      const months = new Set<string>();
      datesArray.forEach((d) => {
        months.add(d.substring(0, 7)); // 'YYYY-MM'
      });
      const sortedMonths = Array.from(months).sort((a, b) => b.localeCompare(a));
      const formatted = sortedMonths.map(m => ({ id: m, label: formatMonthId(m) }));
      setAvailablePeriods(formatted);
      if (formatted.length > 0) {
        if (!sortedMonths.includes(selectedPeriod)) {
          setSelectedPeriod(sortedMonths[0]);
        }
      } else {
        setSelectedPeriod('Todos');
      }
    } else if (periodType === 'anual') {
      const years = new Set<string>();
      datesArray.forEach((d) => {
        years.add(d.substring(0, 4)); // 'YYYY'
      });
      const sortedYears = Array.from(years).sort((a, b) => b.localeCompare(a));
      const formatted = sortedYears.map(y => ({ id: y, label: `Año ${y}` }));
      setAvailablePeriods(formatted);
      if (formatted.length > 0) {
        if (!sortedYears.includes(selectedPeriod)) {
          setSelectedPeriod(sortedYears[0]);
        }
      } else {
        setSelectedPeriod('Todos');
      }
    } else {
      setAvailablePeriods([]);
      setSelectedPeriod('Todos');
    }
  }, [ordenes, transacciones, periodType]);

  // Master State State-Persistence Watchers
  const handleSaveCliente = async (cli: Cliente) => {
    const updated = clientes.some((x) => x.id === cli.id)
      ? clientes.map((x) => (x.id === cli.id ? cli : x))
      : [cli, ...clientes];
    setClientes(updated);
    saveState('clientes', updated);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('clientes').upsert(cli);
      } catch (e) {
        console.error('Error syncing client to Supabase:', e);
      }
    }
  };

  const handleDeleteCliente = async (id: string) => {
    const updated = clientes.filter((x) => x.id !== id);
    setClientes(updated);
    saveState('clientes', updated);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('clientes').delete().eq('id', id);
      } catch (e) {
        console.error('Error deleting client from Supabase:', e);
      }
    }
  };

  const handleSaveVehiculo = async (veh: Vehiculo) => {
    const updated = vehiculos.some((x) => x.id === veh.id)
      ? vehiculos.map((x) => (x.id === veh.id ? veh : x))
      : [veh, ...vehiculos];
    setVehiculos(updated);
    saveState('vehiculos', updated);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('vehiculos').upsert(veh);
      } catch (e) {
        console.error('Error syncing vehicle to Supabase:', e);
      }
    }
  };

  const handleDeleteVehiculo = async (id: string) => {
    const updated = vehiculos.filter((x) => x.id !== id);
    setVehiculos(updated);
    saveState('vehiculos', updated);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('vehiculos').delete().eq('id', id);
      } catch (e) {
        console.error('Error deleting vehicle from Supabase:', e);
      }
    }
  };

  const handleSaveRepuesto = async (part: Repuesto) => {
    const updated = repuestos.some((x) => x.id === part.id)
      ? repuestos.map((x) => (x.id === part.id ? part : x))
      : [part, ...repuestos];
    setRepuestos(updated);
    saveState('repuestos', updated);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('repuestos').upsert(part);
      } catch (e) {
        console.error('Error syncing spare part to Supabase:', e);
      }
    }
  };

  const handleDeleteRepuesto = async (id: string) => {
    const updated = repuestos.filter((x) => x.id !== id);
    setClientes(clientes.filter((c) => c.id !== id)); // avoid trace items
    setRepuestos(updated);
    saveState('repuestos', updated);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('repuestos').delete().eq('id', id);
      } catch (e) {
        console.error('Error deleting spare part from Supabase:', e);
      }
    }
  };

  const handleSaveOrden = async (ord: Orden) => {
    const updated = ordenes.some((x) => x.id === ord.id)
      ? ordenes.map((x) => (x.id === ord.id ? ord : x))
      : [ord, ...ordenes];
    setOrdenes(updated);
    saveState('ordenes', updated);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('ordenes').upsert({
          ...ord,
          repuestos: ord.repuestos // DB expects JSONB representation
        });
      } catch (e) {
        console.error('Error syncing work order to Supabase:', e);
      }
    }
  };

  const handleDeleteOrden = async (id: string) => {
    const match = ordenes.find((x) => x.id === id);
    if (match) {
      const partsTotal = match.repuestos.reduce((sum, item) => sum + (Number(item.precio || 0) * item.qty), 0);
      const laborTotal = Number(match.labor_cost || 0);
      const grandTotal = partsTotal + laborTotal;
      const detailString = `Orden de Trabajo Eliminada: ID ${match.id}, Coste de Labor: $${laborTotal}, Repuestos devueltos al almacén: ${match.repuestos.map(i => `${i.id} (Can: ${i.qty})`).join(', ')}`;
      logDeletionToAudit('orden', detailString, grandTotal);

      // Return spare parts back to physical stock
      if (match.repuestos && match.repuestos.length > 0) {
        handleAddInventoryStock(match.repuestos.map(item => ({ id: item.id, qty: item.qty })));
      }
    }

    const updated = ordenes.filter((x) => x.id !== id);
    setOrdenes(updated);
    saveState('ordenes', updated);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('ordenes').delete().eq('id', id);
      } catch (e) {
        console.error('Error deleting work order from Supabase:', e);
      }
    }
  };

  const handleSaveTrabajador = async (worker: Trabajador) => {
    const updated = trabajadores.some((x) => x.id === worker.id)
      ? trabajadores.map((x) => (x.id === worker.id ? worker : x))
      : [worker, ...trabajadores];
    setTrabajadores(updated);
    saveState('trabajadores', updated);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('trabajadores').upsert(worker);
      } catch (e) {
        console.error('Error syncing worker to Supabase:', e);
      }
    }
  };

  const handleDeleteTrabajador = async (id: string) => {
    const updated = trabajadores.filter((x) => x.id !== id);
    setTrabajadores(updated);
    saveState('trabajadores', updated);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('trabajadores').delete().eq('id', id);
      } catch (e) {
        console.error('Error deleting worker from Supabase:', e);
      }
    }
  };

  const handleAddTransaccion = async (tx: TransaccionExtra) => {
    const updated = [tx, ...transacciones];
    setTransacciones(updated);
    saveState('transacciones', updated);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('transacciones_extra').upsert(tx);
      } catch (e) {
        console.error('Error syncing transaction to Supabase:', e);
      }
    }
  };

  const handleDeleteTransaccion = async (id: string) => {
    const match = transacciones.find((x) => x.id === id);
    if (match) {
      const detailString = `Transacción Contable Eliminada: ID ${match.id}, Categoría: ${match.categoria}, Descripción: ${match.descripcion}`;
      logDeletionToAudit('transaccion', detailString, match.monto);
    }

    const updated = transacciones.filter((x) => x.id !== id);
    setTransacciones(updated);
    saveState('transacciones', updated);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('transacciones_extra').delete().eq('id', id);
      } catch (e) {
        console.error('Error deleting transaction from Supabase:', e);
      }
    }
  };

  // Triggers stock discount upon order completion
  const handleUpdateInventoryStock = async (sparePartsUsed: { id: string; qty: number }[]) => {
    const updated = repuestos.map((r) => {
      const match = sparePartsUsed.find((pu) => pu.id === r.id);
      if (match) {
        const afterDis = {
          ...r,
          cantidad: Math.max(0, r.cantidad - match.qty)
        };
        // Sync modified spare parts count to Supabase
        if (isSupabaseConfigured()) {
          supabase.from('repuestos').upsert(afterDis).then(({ error }) => {
            if (error) console.error('Error updating spare part stock in cloud sync:', error);
          });
        }
        return afterDis;
      }
      return r;
    });
    setRepuestos(updated);
    saveState('repuestos', updated);
  };

  // Triggers stock increase upon item refund / deletion
  const handleAddInventoryStock = async (sparePartsReturned: { id: string; qty: number }[]) => {
    const updated = repuestos.map((r) => {
      const match = sparePartsReturned.find((pu) => pu.id === r.id);
      if (match) {
        const afterAdd = {
          ...r,
          cantidad: r.cantidad + match.qty
        };
        // Sync modified spare parts count to Supabase
        if (isSupabaseConfigured()) {
          supabase.from('repuestos').upsert(afterAdd).then(({ error }) => {
            if (error) console.error('Error returning spare part stock to cloud sync:', error);
          });
        }
        return afterAdd;
      }
      return r;
    });
    setRepuestos(updated);
    saveState('repuestos', updated);
  };

  // Helper to append cloud-synchronized Audit deletion logs
  const logDeletionToAudit = async (tipo: 'venta' | 'orden' | 'transaccion' | 'devolucion_repuesto', descripcion: string, monto?: number) => {
    const newLog: LogBorrados = {
      id: `AUD-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      fecha_suceso: new Date().toISOString(),
      tipo_entidad: tipo,
      descripcion_auditoria: descripcion,
      monto: monto,
      usuario: 'Castellanos Motors Admin'
    };

    const updated = [newLog, ...logBorrados];
    setLogBorrados(updated);
    saveState('log_borrados', updated);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('historial_borrados').upsert(newLog);
      } catch (err) {
        console.error('Error syncing audit deletion logs to cloud container:', err);
      }
    }
  };

  // Direct raw individual sales save handler
  const handleSaveVentaIndividual = async (venta: VentaIndividual) => {
    const isNew = !ventasIndividuales.some((x) => x.id === venta.id);
    const updated = isNew
      ? [venta, ...ventasIndividuales]
      : ventasIndividuales.map((x) => (x.id === venta.id ? venta : x));
    
    setVentasIndividuales(updated);
    saveState('ventas_individuales', updated);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('ventas_individuales').upsert(venta);
      } catch (e) {
        console.error('Error syncing direct product sales invoice in Supabase:', e);
      }
    }

    // Automatically decrease inventory quantities for newly purchased spare part slots
    if (isNew) {
      handleUpdateInventoryStock((venta.items || []).map(item => ({ id: item.id, qty: item.qty })));
    }
  };

  // Direct raw individual sales delete handler (returns items back to inventory stock and triggers audit log tracking)
  const handleDeleteVentaIndividual = async (id: string) => {
    const match = ventasIndividuales.find((x) => x.id === id);
    if (!match) return;

    const updated = ventasIndividuales.filter((x) => x.id !== id);
    setVentasIndividuales(updated);
    saveState('ventas_individuales', updated);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('ventas_individuales').delete().eq('id', id);
      } catch (e) {
        console.error('Error deleting direct product sales invoice from Supabase:', e);
      }
    }

    // Return the parts back to stock
    handleAddInventoryStock((match.items || []).map(item => ({ id: item.id, qty: item.qty })));

    // Create deletion audit logs in real-time
    const detailString = `Venta Directa Eliminada: ID ${match.id}, Cliente: ${match.cliente_nombre}, Items: ${(match.items || []).map(i => `${i.nombre} (Can: ${i.qty})`).join(', ')}`;
    logDeletionToAudit('venta', detailString, match.total_usd);
  };

  // Dedicated refund/return and stock replenishment handler
  const handleRefundVentaIndividualItem = async (ventaId: string, itemId: string, refundQty: number) => {
    const ventaMatch = ventasIndividuales.find((v) => v.id === ventaId);
    if (!ventaMatch) return;

    const itemMatch = (ventaMatch.items || []).find((i) => i.id === itemId);
    if (!itemMatch) return;

    const currentDevueltos = itemMatch.qty_devuelta || 0;
    if (currentDevueltos + refundQty > itemMatch.qty) {
      alert("No puedes devolver más cantidad de la comprada.");
      return;
    }

    // Calculate refund amount
    const refundAmount = refundQty * itemMatch.precio;

    // Update items list
    const updatedItems = (ventaMatch.items || []).map((item) => {
      if (item.id === itemId) {
        return {
          ...item,
          qty_devuelta: currentDevueltos + refundQty
        };
      }
      return item;
    });

    const updatedVenta: VentaIndividual = {
      ...ventaMatch,
      items: updatedItems,
      total_usd: Math.max(0, ventaMatch.total_usd - refundAmount)
    };

    const updatedVentas = ventasIndividuales.map((v) => (v.id === ventaId ? updatedVenta : v));
    setVentasIndividuales(updatedVentas);
    saveState('ventas_individuales', updatedVentas);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('ventas_individuales').upsert(updatedVenta);
      } catch (err) {
        console.error('Error syncing returned/refunded sale state to Supabase:', err);
      }
    }

    // Replenish stock
    await handleAddInventoryStock([{ id: itemId, qty: refundQty }]);

    // Log the refund event in the audit trail
    const detailString = `Devolución y Reabastecimiento de Repuesto: Venta ID ${ventaId}, Cliente: ${ventaMatch.cliente_nombre}, Repuesto: ${itemMatch.nombre}, Cantidad Develta: ${refundQty} unidades, Reembolso: $${refundAmount.toFixed(2)} USD`;
    logDeletionToAudit('devolucion_repuesto', detailString, refundAmount);
  };

  // Records worker commission payment as a custom Transaction OUTFLOW (Salida)
  const handleRecordPayout = async (workerId: string, amount: number) => {
    const workerName = trabajadores.find((t) => t.id === workerId)?.nombre || 'Personal';
    const newPayoutTx: TransaccionExtra = {
      id: `PAY-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      tipo: 'salida',
      categoria: `Pago Mecánico: ${workerId}`,
      descripcion: `Pago de comisiones acumuladas a mecánico ${workerName}`,
      monto: amount,
      fecha: new Date().toISOString().split('T')[0],
      creado_en: new Date().toISOString()
    };

    const updated = [newPayoutTx, ...transacciones];
    setTransacciones(updated);
    saveState('transacciones', updated);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('transacciones_extra').upsert(newPayoutTx);
      } catch (e) {
        console.error('Error recording live payout transaction:', e);
      }
    }
  };

  // Calculate master period financials (EconoGRAPH Core engine)
  const calculateFinancialMetrics = () => {
    // 1. Filter completed work orders by period scope
    const periodOrders = ordenes.filter((o) => {
      const isCompleted = o.estado === 'terminada';
      if (!isCompleted) return false;
      if (periodType === 'todos' || selectedPeriod === 'Todos') return true;
      if (periodType === 'semanal') return getWeekId(o.fecha) === selectedPeriod;
      if (periodType === 'mensual') return o.fecha && o.fecha.startsWith(selectedPeriod);
      if (periodType === 'anual') return o.fecha && o.fecha.startsWith(selectedPeriod);
      return true;
    });

    // 2. Filter manual cash entries by period scope
    const periodTransactions = transacciones.filter((t) => {
      if (periodType === 'todos' || selectedPeriod === 'Todos') return true;
      if (periodType === 'semanal') return getWeekId(t.fecha) === selectedPeriod;
      if (periodType === 'mensual') return t.fecha && t.fecha.startsWith(selectedPeriod);
      if (periodType === 'anual') return t.fecha && t.fecha.startsWith(selectedPeriod);
      return true;
    });

    // Filter direct raw individual sales by period scope
    const periodVentasIndividuales = ventasIndividuales.filter((v) => {
      if (periodType === 'todos' || selectedPeriod === 'Todos') return true;
      if (periodType === 'semanal') return getWeekId(v.fecha) === selectedPeriod;
      if (periodType === 'mensual') return v.fecha && v.fecha.startsWith(selectedPeriod);
      if (periodType === 'anual') return v.fecha && v.fecha.startsWith(selectedPeriod);
      return true;
    });

    // 3. INFLOWS: Sum of Labor + Spare parts retail sales + Manual external incomes + Direct individual sales
    const orderLaborInflow = periodOrders.reduce((sum, o) => sum + Number(o.labor_cost || 0), 0);
    const orderPartsRetailInflow = periodOrders.reduce((sum, o) => {
      const orderPartsTotal = o.repuestos.reduce((pSum, item) => {
        const masterItem = repuestos.find(r => r.id === item.id);
        const itemPrice = Number(item.precio ?? masterItem?.precio ?? 0);
        return pSum + (itemPrice * Number(item.qty || 0));
      }, 0);
      return sum + orderPartsTotal;
    }, 0);
    
    const manualIncomeInflow = periodTransactions
      .filter((t) => t.tipo === 'entrada')
      .reduce((sum, t) => sum + Number(t.monto || 0), 0);

    const directSalesInflow = periodVentasIndividuales.reduce((sum, v) => sum + Number(v.total_usd || 0), 0);

    const ingresosTotales = orderLaborInflow + orderPartsRetailInflow + manualIncomeInflow + directSalesInflow;

    // 4. INVENTORY OUTFLOW (Costo Repuestos): Buy/cost value of parts eaten up by orders and direct sales
    const orderPartsCost = periodOrders.reduce((sum, o) => {
      const orderPartsCosts = o.repuestos.reduce((cSum, item) => {
        const masterItem = repuestos.find(r => r.id === item.id);
        const itemCost = Number(item.costo || masterItem?.costo || (Number(item.precio || masterItem?.precio || 0) * 0.6));
        return cSum + (itemCost * Number(item.qty || 0));
      }, 0);
      return sum + orderPartsCosts;
    }, 0);

    const directSalesPartsCost = periodVentasIndividuales.reduce((sum, v) => {
      const itemsCost = (v.items || []).reduce((itemSum, item) => {
        const masterItem = repuestos.find(r => r.id === item.id);
        const itemCost = Number(item.costo || masterItem?.costo || (Number(item.precio || masterItem?.precio || 0) * 0.6));
        return itemSum + (itemCost * Number(item.qty || 0));
      }, 0);
      return sum + itemsCost;
    }, 0);

    const costoRepuestos = orderPartsCost + directSalesPartsCost;

    // 5. WORKER INCENTI-COMMISSIONS (Comision pagada por mano de obra adjudicada)
    const remuneracionTrabajadores = periodOrders.reduce((sum, o) => {
      const worker = trabajadores.find((t) => t.id === o.trabajador_id);
      const rate = Number(o.comision_porcentaje ?? worker?.comision_porcentaje ?? 40);
      const orderFee = (Number(o.labor_cost || 0) * rate) / 100;
      return sum + orderFee;
    }, 0);

    // 6. GENERAL GUESTHOUSE OUTFLOWS (Gastos de local y operacion manuales)
    // Avoid double-counting since payouts are separately registered under category `Pago Mecánico: <workerId>`
    const gastosFijos = periodTransactions
      .filter((t) => t.tipo === 'salida' && !t.categoria.startsWith('Pago Mecánico:'))
      .reduce((sum, t) => sum + t.monto, 0);

     // 7. NET LIQUID WORKSHOP REVENUE (Ganancia Neta Taller)
    const gananciaNeta = ingresosTotales - costoRepuestos - remuneracionTrabajadores - gastosFijos;
    const margenOperativo = ingresosTotales > 0 ? (gananciaNeta / ingresosTotales) * 100 : 0;

    const ventaRepuestos = orderPartsRetailInflow + directSalesInflow;
    const gananciaRepuestos = ventaRepuestos - costoRepuestos;

    return {
      ingresosTotales,
      costoRepuestos,
      remuneracionTrabajadores,
      gastosFijos,
      gananciaNeta,
      margenOperativo,
      ventaRepuestos,
      gananciaRepuestos,
      periodOrders,
      periodTransactions,
      periodVentasIndividuales
    };
  };

  const metrics = calculateFinancialMetrics();

  // Prepare Chart Slice 1: Breakdown of items consumed by CATEGORY
  const prepareSparePartsChartSlices = () => {
    const categoryTotals: Record<string, number> = {};
    const chartColors = ['#8b5cf6', '#ec4899', '#f97316', '#14b8a6', '#4f46e5', '#3b82f6', '#10b981'];

    metrics.periodOrders.forEach((o) => {
      o.repuestos.forEach((item) => {
        const itemObj = repuestos.find((r) => r.id === item.id);
        const cat = itemObj?.categoria || 'Insumos Varios';
        const salePrice = Number(item.precio ?? itemObj?.precio ?? 0);
        const saleVolume = salePrice * Number(item.qty || 0);
        categoryTotals[cat] = (categoryTotals[cat] || 0) + saleVolume;
      });
    });

    metrics.periodVentasIndividuales.forEach((v) => {
      (v.items || []).forEach((item) => {
        const itemObj = repuestos.find((r) => r.id === item.id);
        const cat = itemObj?.categoria || 'Insumos Varios';
        const salePrice = Number(item.precio ?? itemObj?.precio ?? 0);
        const saleVolume = salePrice * Number(item.qty || 0);
        categoryTotals[cat] = (categoryTotals[cat] || 0) + saleVolume;
      });
    });

    return Object.entries(categoryTotals).map(([name, value], idx) => ({
      name,
      value,
      color: chartColors[idx % chartColors.length]
    }));
  };

  // Prepare Chart Slice 2: Breakdown of Worker's Commission shares earned
  const prepareWorkersEarningsChartSlices = () => {
    const workerTotals: Record<string, number> = {};
    const chartColors = ['#3b82f6', '#6366f1', '#14b8a6', '#f59e0b', '#ec4899', '#8b5cf6'];

    trabajadores.forEach((t) => {
      // Sum labor commission on all completed jobs of the period
      const completedFiltered = metrics.periodOrders.filter((o) => o.trabajador_id === t.id);
      const totalWorkerEarnings = completedFiltered.reduce((sum, o) => {
        const rate = Number(o.comision_porcentaje ?? t.comision_porcentaje ?? 40);
        const earned = (Number(o.labor_cost || 0) * rate) / 100;
        return sum + earned;
      }, 0);

      if (totalWorkerEarnings > 0) {
        workerTotals[t.nombre] = totalWorkerEarnings;
      }
    });

    return Object.entries(workerTotals).map(([name, value], idx) => ({
      name,
      value,
      color: chartColors[idx % chartColors.length],
      extraInfo: 'Comisiones acumuladas'
    }));
  };

  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden">
      {/* SIDE BAR / QUICK NAV PANEL */}
      <aside className="w-full md:w-60 bg-slate-900 text-white flex flex-col p-4 shrink-0 border-b md:border-b-0 md:border-r border-slate-800">
        <div className="flex items-center justify-between md:flex-col md:items-start md:justify-start gap-4 mb-4 md:mb-8 px-2">
          {/* Brand header */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold text-lg italic text-white select-none shrink-0 shadow-sm">
              E
            </div>
            <span className="text-lg font-black tracking-tight text-blue-450">
              Econo<span className="text-white bg-blue-600/10 px-1 py-0.5 rounded text-xs select-all">GRAPH</span>
            </span>
          </div>

          <div className="md:hidden flex items-center gap-2 bg-slate-950/40 p-1 rounded-xl">
            <button
              onClick={() => setIsChangeAuthOpen(true)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Cambiar acceso"
            >
              <Key className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleLogout}
              className="p-1.5 text-rose-455 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Cerrar sesión"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="hidden md:block">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              SISTEMA ADMINISTRATIVO
            </span>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-none">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 text-xs font-semibold py-2 px-3 rounded-lg cursor-pointer shrink-0 transition-all ${
              activeTab === 'dashboard'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Panel Metas</span>
          </button>

          <button
            onClick={() => setActiveTab('ordenes')}
            className={`flex items-center gap-2 text-xs font-semibold py-2 px-3 rounded-lg cursor-pointer shrink-0 transition-all ${
              activeTab === 'ordenes'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Órdenes de Trabajo</span>
          </button>

          <button
            onClick={() => setActiveTab('repuestos_movimientos')}
            className={`flex items-center gap-2 text-xs font-semibold py-2 px-3 rounded-lg cursor-pointer shrink-0 transition-all ${
              activeTab === 'repuestos_movimientos'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Movimientos Repuestos</span>
          </button>

          <button
            onClick={() => setActiveTab('inventario')}
            className={`flex items-center gap-2 text-xs font-semibold py-2 px-3 rounded-lg cursor-pointer shrink-0 transition-all ${
              activeTab === 'inventario'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Inventario</span>
          </button>

          <button
            onClick={() => setActiveTab('personal')}
            className={`flex items-center gap-2 text-xs font-semibold py-2 px-3 rounded-lg cursor-pointer shrink-0 transition-all ${
              activeTab === 'personal'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Personal y Producción</span>
          </button>

          <button
            onClick={() => setActiveTab('flujo')}
            className={`flex items-center gap-2 text-xs font-semibold py-2 px-3 rounded-lg cursor-pointer shrink-0 transition-all ${
              activeTab === 'flujo'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Flujo Admin.</span>
          </button>

          <button
            onClick={() => setActiveTab('ventas_directas')}
            className={`flex items-center gap-2 text-xs font-semibold py-2 px-3 rounded-lg cursor-pointer shrink-0 transition-all ${
              activeTab === 'ventas_directas'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Ventas Directas</span>
          </button>

          <button
            onClick={() => setActiveTab('auditoria')}
            className={`flex items-center gap-2 text-xs font-semibold py-2 px-3 rounded-lg cursor-pointer shrink-0 transition-all ${
              activeTab === 'auditoria'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Bitácora / Auditoría</span>
          </button>
        </nav>

        {/* Sidebar bottom admin view */}
        <div className="hidden md:flex flex-col mt-auto border-t border-slate-800 pt-4 gap-4">
          <div className="bg-slate-850 p-3 rounded-lg border border-slate-800 text-[10.5px] text-slate-400 leading-relaxed font-medium">
            <span className="font-bold flex items-center gap-1.5 text-blue-400 mb-1">
              <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0" />
              EconoGRAPH Engine
            </span>
            <span>
              La ganancia se liquida tras el costo de repuestos consumidos, el sueldo de mecánicos asignado y gastos de local.
            </span>
          </div>

          <div className="flex items-center gap-2 px-1">
            <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 font-mono text-[10px] flex items-center justify-center text-slate-300">
              CM
            </div>
            <div>
              <span className="text-xs text-slate-305 font-semibold block leading-tight">Administrador</span>
              <span className="text-[10px] text-slate-500 block">Castellanos Motors</span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-1 border-t border-slate-850 pt-3 mt-1 px-1">
            <button
              onClick={() => setIsChangeAuthOpen(true)}
              className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-extrabold text-slate-400 hover:text-white transition-all cursor-pointer bg-slate-800/40 hover:bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-800"
              title="Cambiar acceso"
            >
              <Key className="w-3.5 h-3.5 text-blue-450" />
              <span>Acceso</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-extrabold text-rose-450 hover:text-rose-400 hover:bg-slate-800 transition-all cursor-pointer bg-rose-950/10 hover:bg-rose-950/20 px-2.5 py-1.5 rounded-lg border border-rose-900/10"
              title="Cerrar sesión"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Cerrar</span>
            </button>
          </div>
        </div>
      </aside>

      {/* RIGHT SIDE MAIN DISPLAY SECTION */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* HEADER / HIGH DENSITY STATS AND FILTERS BAR */}
        <header className="bg-white border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between p-4 lg:px-6 gap-4 shrink-0 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-slate-900 leading-tight">Castellanos Motors</h1>
                {loadingSupabase ? (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-amber-50 text-amber-600 border border-amber-200 animate-pulse">
                    Sincronizando... 🚀
                  </span>
                ) : supabaseConnected ? (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-650 border border-emerald-250" title="Sincronizado con Supabase en la nube">
                    Nube Conectada ⚡
                  </span>
                ) : (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-500 border border-slate-250" title="Almacén local de contingencia">
                    Local (Offline) 🖥️
                  </span>
                )}
              </div>
              <p className="text-[10.5px] text-slate-500 font-medium">Panel de control de flujo de caja y rentabilidad</p>
            </div>
            
            {/* In-header dynamic period selector dropdowns */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200 shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">Frecuencia:</span>
                <select
                  value={periodType}
                  onChange={(e) => {
                    const newType = e.target.value as any;
                    setPeriodType(newType);
                  }}
                  className="text-xs font-black text-blue-700 bg-white border border-slate-200 rounded-md py-1 px-2.5 focus:outline-none cursor-pointer focus:ring-1 focus:ring-blue-500"
                >
                  <option value="todos">Todo Histórico</option>
                  <option value="semanal">Semanal 📅</option>
                  <option value="mensual">Mensual 🗓️</option>
                  <option value="anual">Anual 📈</option>
                </select>
              </div>

              {periodType !== 'todos' && availablePeriods.length > 0 && (
                <div className="flex items-center gap-1.5 sm:border-l sm:border-slate-200 sm:pl-2.5 pt-1.5 sm:pt-0">
                  <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Período:</span>
                  <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-md py-1 px-2.5 focus:outline-none cursor-pointer max-w-[240px]"
                  >
                    {availablePeriods.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {periodType !== 'todos' && availablePeriods.length === 0 && (
                <div className="text-[10px] text-slate-400 italic sm:border-l sm:border-slate-200 sm:pl-2.5 pt-1.5 sm:pt-0 pl-1.5">
                  Sin registros cargados
                </div>
              )}
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex flex-wrap gap-4 sm:gap-6 justify-start lg:justify-end text-left sm:text-right">
            <div>
              <div className="text-[9px] text-slate-450 uppercase font-black tracking-wider mb-0.5">Ingresos Totales</div>
              <div className="text-sm font-black text-emerald-600 font-mono">
                ${metrics.ingresosTotales.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="border-l border-slate-200 pl-4 sm:pl-6">
              <div className="text-[9px] text-slate-450 uppercase font-black tracking-wider mb-0.5">Costos Directos</div>
              <div className="text-sm font-black text-rose-600 font-mono">
                ${metrics.costoRepuestos.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="border-l border-slate-200 pl-4 sm:pl-6">
              <div className="text-[9px] text-slate-450 uppercase font-black tracking-wider mb-0.5">Comisión Mecánicos</div>
              <div className="text-sm font-black text-blue-600 font-mono">
                ${metrics.remuneracionTrabajadores.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="border-l border-slate-200 pl-4 sm:pl-6">
              <div className="text-[9px] text-slate-450 uppercase font-black tracking-wider mb-0.5">Utilidad Neta</div>
              <div className={`text-sm font-black font-mono ${metrics.gananciaNeta >= 0 ? 'text-blue-700' : 'text-rose-700'}`}>
                ${metrics.gananciaNeta.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </header>

        {/* CONTAINER VIEWPORTS VIEW */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <DashboardCharts
              stats={{
                ingresosTotales: metrics.ingresosTotales,
                costoRepuestos: metrics.costoRepuestos,
                remuneracionTrabajadores: metrics.remuneracionTrabajadores,
                gastosFijos: metrics.gastosFijos,
                gananciaNeta: metrics.gananciaNeta,
                margenOperativo: metrics.margenOperativo,
                ventaRepuestos: metrics.ventaRepuestos,
                gananciaRepuestos: metrics.gananciaRepuestos
              }}
              repuestosConsumidos={prepareSparePartsChartSlices()}
              gananciaSuelos={prepareWorkersEarningsChartSlices()}
              onSelectPeriod={setSelectedPeriod}
              selectedPeriod={selectedPeriod}
              disponiblesPeriodos={availablePeriods.map(p => p.id)}
            />
          )}

          {activeTab === 'ordenes' && (
            <OrdersManager
              ordenes={ordenes}
              clientes={clientes}
              vehiculos={vehiculos}
              trabajadores={trabajadores}
              repuestos={repuestos}
              onSaveOrden={handleSaveOrden}
              onDeleteOrden={handleDeleteOrden}
              onUpdateInventoryStock={handleUpdateInventoryStock}
            />
          )}

          {activeTab === 'repuestos_movimientos' && (
            <RepuestosMovimientos
              ordenes={ordenes}
              ventasIndividuales={ventasIndividuales}
              repuestos={repuestos}
              clientes={clientes}
            />
          )}

          {activeTab === 'inventario' && (
            <InventoryManager
              repuestos={repuestos}
              onSaveRepuesto={handleSaveRepuesto}
              onDeleteRepuesto={handleDeleteRepuesto}
            />
          )}

          {activeTab === 'personal' && (
            <WorkersManager
              trabajadores={trabajadores}
              ordenes={ordenes}
              transacciones={transacciones}
              repuestos={repuestos}
              onSaveTrabajador={handleSaveTrabajador}
              onDeleteTrabajador={handleDeleteTrabajador}
              onRecordPayout={handleRecordPayout}
              onSaveOrden={handleSaveOrden}
              onDeleteOrden={handleDeleteOrden}
              onUpdateInventoryStock={handleUpdateInventoryStock}
            />
          )}

          {activeTab === 'flujo' && (
            <ExtraTransactions
              transacciones={transacciones}
              onAddTransaccion={handleAddTransaccion}
              onDeleteTransaccion={handleDeleteTransaccion}
            />
          )}

          {activeTab === 'ventas_directas' && (
            <VentasIndividualesManager
              ventasIndividuales={ventasIndividuales}
              repuestos={repuestos}
              onSaveVenta={handleSaveVentaIndividual}
              onDeleteVenta={handleDeleteVentaIndividual}
              onRefundItem={handleRefundVentaIndividualItem}
            />
          )}

          {activeTab === 'auditoria' && (
            <AuditLogViewer
              logBorrados={logBorrados}
            />
          )}
        </main>

        {/* STATUS FOOTER BAR */}
        <footer className="h-8 bg-slate-200 border-t border-slate-300 flex items-center px-4 text-[10px] text-slate-600 shrink-0 justify-between">
          <div className="flex gap-4">
            <span>DB Status: <span className={supabaseConnected ? "text-emerald-600 font-bold" : "text-amber-600 font-bold"}>{supabaseConnected ? "Conectado (Nube)" : "Conectado (Local)"}</span></span>
            <span>Last Sync: Activo</span>
          </div>
          <div>EconoGRAPH v1.0.4 • © 2026 Castellanos Motors</div>
        </footer>

      </div>

      {/* SECURITY ACCESS CHANGE MODAL */}
      {isChangeAuthOpen && (
        <div id="security-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xs">
          <div id="security-modal-card" className="relative w-full max-w-sm bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-850">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-blue-500" />
                <span>Actualizar Credenciales</span>
              </h3>
              <button
                onClick={() => {
                  setIsChangeAuthOpen(false);
                  setChangeAuthError(null);
                  setChangeAuthSuccess(false);
                }}
                className="text-slate-450 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateAuth} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Nuevo Usuario
                </label>
                <input
                  id="new-username-input"
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="ej. nuevo_admin"
                  className="w-full bg-slate-950 text-white text-xs border border-slate-800 rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500 transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Contraseña Nueva
                </label>
                <input
                  id="new-password-input"
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 4 caracteres"
                  className="w-full bg-slate-950 text-white text-xs border border-slate-800 rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500 transition-all font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Confirmar Contraseña
                </label>
                <input
                  id="confirm-password-input"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Escribe la contraseña nuevamente"
                  className="w-full bg-slate-950 text-white text-xs border border-slate-800 rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500 transition-all font-mono"
                />
              </div>

              {changeAuthError && (
                <div id="security-error-alert" className="text-[10.5px] text-rose-500 font-semibold text-center bg-rose-955/20 border border-rose-900/30 p-2.5 rounded-xl">
                  {changeAuthError}
                </div>
              )}

              {changeAuthSuccess && (
                <div id="security-success-alert" className="text-[10.5px] text-emerald-500 font-semibold text-center bg-emerald-955/20 border border-emerald-900/30 p-2.5 rounded-xl">
                  ¡Credenciales actualizadas con éxito! 🔒
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsChangeAuthOpen(false);
                    setChangeAuthError(null);
                    setChangeAuthSuccess(false);
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs py-2.5 px-4 rounded-lg cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  id="security-save-btn"
                  type="submit"
                  disabled={changeAuthSuccess}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs py-2.5 px-4 rounded-lg transition-all cursor-pointer shadow-md"
                >
                  {changeAuthSuccess ? 'Guardado ✓' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
