import { Cliente, Vehiculo, Repuesto, Orden, Trabajador, Solicitud, TransaccionExtra, Servicio } from './types';

export const INITIAL_CLIENTES: Cliente[] = [
  {
    id: 'CLI-A1B2',
    nombre: 'Carlos Eduardo Mendoza',
    telefono: '0414-123-4567',
    email: 'carlos.mendoza@email.com',
    cedula: 'V-15.342.198',
    nacimiento: '1982-04-12',
    direccion: 'Av. Libertador, Edif. Altamira, Apto 4B, Caracas',
    observaciones: 'Cliente frecuente. Prefiere comunicarse por WhatsApp.',
    fecha_reg: '2025-01-10'
  },
  {
    id: 'CLI-C3D4',
    nombre: 'María Gabriela Rodríguez',
    telefono: '0424-987-6543',
    email: 'maria.gaby@email.com',
    cedula: 'V-18.765.432',
    nacimiento: '1989-08-22',
    direccion: 'La Tahona, Calle Los Pinos, Qta. Bella Vista',
    observaciones: 'Consultar siempre presupuesto antes de iniciar labor.',
    fecha_reg: '2025-02-14'
  },
  {
    id: 'CLI-E5F6',
    nombre: 'Juan Bautista Pérez',
    telefono: '0412-555-0199',
    email: 'juan.perez@email.com',
    cedula: 'V-12.980.345',
    nacimiento: '1975-11-30',
    direccion: 'Los Dos Caminos, Av. Sucre, Sec. Los Chorros',
    observaciones: 'Usa su camión para reparto comercial diario.',
    fecha_reg: '2025-03-01'
  }
];

export const INITIAL_VEHICULOS: Vehiculo[] = [
  {
    id: 'VEH-AA11',
    cliente_id: 'CLI-A1B2',
    marca: 'Toyota',
    modelo: 'Corolla Delta XLI',
    anio: 2018,
    placa: 'AB123CD',
    color: '#6b7280',
    vin: '93HDD92810JS83749',
    km: 112500,
    observaciones: 'Mantener control estricto de consumo de refrigerante.',
    fecha_reg: '2025-01-10'
  },
  {
    id: 'VEH-BB22',
    cliente_id: 'CLI-C3D4',
    marca: 'Ford',
    modelo: 'Explorer Limited 4WD',
    anio: 2016,
    placa: 'XY987ZZ',
    color: '#000000',
    vin: '1FM5K8D84GGD29103',
    km: 145210,
    observaciones: 'Detalle menor en amortiguador delantero izquierdo.',
    fecha_reg: '2025-02-14'
  },
  {
    id: 'VEH-CC33',
    cliente_id: 'CLI-E5F6',
    marca: 'Chevrolet',
    modelo: 'Silverado LTZ Doble Cabina',
    anio: 2015,
    placa: 'MK456AA',
    color: '#ffffff',
    vin: '1GC1KVE26FZA98471',
    km: 210850,
    observaciones: 'Vehículo de carga pesada. Requiere revisión de frenos periódica.',
    fecha_reg: '2025-03-01'
  }
];

export const INITIAL_REPUESTOS: Repuesto[] = [
  {
    id: 'REP-0001',
    codigo: 'REP-0001',
    nombre: 'Filtro de Aceite Toyota Orland',
    referencia: '90915-YZZN1',
    categoria: 'Filtros',
    proveedor: 'Distribuidora Automotriz Caracas',
    cantidad: 15,
    stock_min: 5,
    precio: 12.50, // Venta taller
    costo: 6.20,   // Costo taller (Generará $6.30 ganancia al venderse)
    ubicacion: 'Estante A-4',
    fecha_ingreso: '2025-01-05'
  },
  {
    id: 'REP-0002',
    codigo: 'REP-0002',
    nombre: 'Aceite Motor Sintético 15W-40 Galón',
    referencia: 'Mobil-1 15W40',
    categoria: 'Lubricantes',
    proveedor: 'Lubricentro El Motor',
    cantidad: 24,
    stock_min: 8,
    precio: 45.00,
    costo: 25.50, // Generará $19.50 ganancia
    ubicacion: 'Pasillo Lubricantes Sec 1',
    fecha_ingreso: '2025-01-10'
  },
  {
    id: 'REP-0003',
    codigo: 'REP-0003',
    nombre: 'Pastillas de Freno Delanteras Explorer',
    referencia: 'SP-1243-FR',
    categoria: 'Frenos',
    proveedor: 'Frenos Caracas C.A.',
    cantidad: 10,
    stock_min: 4,
    precio: 38.00,
    costo: 18.00, // Generará $20.00 ganancia
    ubicacion: 'Pasillo Frenos Estante B',
    fecha_ingreso: '2025-02-14'
  },
  {
    id: 'REP-0004',
    codigo: 'REP-0004',
    nombre: 'Batería Automotriz Duncan 800 Amp',
    referencia: 'DUN-800D',
    categoria: 'Eléctrico',
    proveedor: 'Duncan Express Automotriz',
    cantidad: 6,
    stock_min: 2,
    precio: 85.00,
    costo: 48.00, // Generará $37.00 ganancia
    ubicacion: 'Estante Eléctrico Nivel 1',
    fecha_ingreso: '2025-02-28'
  }
];

export const INITIAL_TRABAJADORES: Trabajador[] = [
  {
    id: 'TRA-001',
    nombre: 'Wilmer Castellanos',
    especialidad: 'Mecánica General',
    telefono: '0412-987-6543',
    fecha_ingreso: '2025-01-01',
    comision_porcentaje: 45 // 45% de Mano de Obra
  },
  {
    id: 'TRA-002',
    nombre: 'Marcos Gutiérrez',
    especialidad: 'Sistemas Eléctricos',
    telefono: '0416-555-4433',
    fecha_ingreso: '2025-02-15',
    comision_porcentaje: 40 // 40% de Mano de Obra
  },
  {
    id: 'TRA-003',
    nombre: 'Jesús Mendoza',
    especialidad: 'Alineación y Tren Delantero',
    telefono: '0414-111-2233',
    fecha_ingreso: '2025-03-01',
    comision_porcentaje: 40 // 40% de Mano de Obra
  }
];

export const INITIAL_ORDENES: Orden[] = [
  {
    id: 'ORD-S83A1',
    cliente_id: 'CLI-A1B2',
    auto_id: 'VEH-AA11',
    fecha: '2025-05-10',
    descripcion: 'Revisión técnica periódica de 110.000 KM y afinamiento mecánico integral. Reemplazo preventivo de fluidos e inspección general de sensores.',
    repuestos: [
      { id: 'REP-0001', qty: 1, precio: 12.50, costo: 6.20 },
      { id: 'REP-0002', qty: 1, precio: 45.00, costo: 25.50 }
    ],
    observaciones: 'El vehículo funciona estacionalmente bien. Se recomienda cambio de correas opcional en próximos 5.000 KM.',
    labor_cost: 65.00,
    km_ingreso: 112500,
    estado: 'terminada',
    creado_en: '2025-05-10T10:30:00Z',
    trabajador_id: 'TRA-001',
    diagnostico: 'Afinamiento completado con éxito. Holgura de válvulas y presiones nominales.'
  },
  {
    id: 'ORD-P49B8',
    cliente_id: 'CLI-C3D4',
    auto_id: 'VEH-BB22',
    fecha: '2025-05-18',
    descripcion: 'Mantenimiento preventivo del sistema de frenado delantero con rectificación de discos. Cambio de pastillas delanteras por desgaste severo.',
    repuestos: [
      { id: 'REP-0003', qty: 1, precio: 38.00, costo: 18.00 }
    ],
    observaciones: 'Los pistones del cáliper requieren lubricación adicional preventiva.',
    labor_cost: 50.00,
    km_ingreso: 145210,
    estado: 'en_proceso',
    creado_en: '2025-05-18T14:15:00Z',
    trabajador_id: 'TRA-003',
    diagnostico: 'Discos torneados a 21.4mm (mínimo 20mm). Reemplazadas juntas tóricas.'
  },
  {
    id: 'ORD-L12N3',
    cliente_id: 'CLI-E5F6',
    auto_id: 'VEH-CC33',
    fecha: '2025-05-20',
    descripcion: 'Diagnóstico eléctrico por falla en arranque a bajas temperaturas exteriores. Reemplazo de batería principal agotada por vida útil completada.',
    repuestos: [
      { id: 'REP-0004', qty: 1, precio: 85.00, costo: 48.00 }
    ],
    observaciones: 'Se verificó alternador y carga balanceada del circuito eléctrico con parámetros nominales estables.',
    labor_cost: 30.00,
    km_ingreso: 210850,
    estado: 'abierta',
    creado_en: '2025-05-20T08:00:00Z',
    trabajador_id: 'TRA-002',
    diagnostico: 'Batería anterior marcaba 10.4V bajo descarga de arranque. Alternador cargando estable a 14.2V.'
  }
];

export const INITIAL_SOLICITUDES: Solicitud[] = [
  {
    id: 'SOL-0001',
    orden_id: 'ORD-P49B8',
    orden_codigo: 'ORD-P49B8',
    auto_placa: 'XY987ZZ',
    mecanico_nombre: 'Jesús Mendoza',
    repuesto_nombre: 'Pastillas de Freno Delanteras Explorer',
    repuesto_id: 'REP-0003',
    cantidad: 1,
    estado: 'entregado',
    creado_en: '2025-05-18T14:20:00Z'
  },
  {
    id: 'SOL-0002',
    orden_id: 'ORD-L12N3',
    orden_codigo: 'ORD-L12N3',
    auto_placa: 'MK456AA',
    mecanico_nombre: 'Marcos Gutiérrez',
    repuesto_nombre: 'Batería Automotriz Duncan 800 Amp',
    repuesto_id: 'REP-0004',
    cantidad: 1,
    estado: 'pendiente',
    creado_en: '2025-05-20T08:15:00Z'
  }
];

export const INITIAL_TRANSACCIONES: TransaccionExtra[] = [
  {
    id: 'TX-001',
    tipo: 'salida',
    categoria: 'Alquiler',
    descripcion: 'Alquiler del local principal Castellanos Motors',
    monto: 350.00,
    fecha: '2025-05-01',
    creado_en: '2025-05-01T08:00:00Z'
  },
  {
    id: 'TX-002',
    tipo: 'salida',
    categoria: 'Servicios',
    descripcion: 'Pago de Electricidad y Agua comercial',
    monto: 75.00,
    fecha: '2025-05-05',
    creado_en: '2025-05-05T12:00:00Z'
  },
  {
    id: 'TX-003',
    tipo: 'entrada',
    categoria: 'Servicios Extras',
    descripcion: 'Pintura y retoque menor de guardafango (Trabajo externo)',
    monto: 120.00,
    fecha: '2025-05-15',
    creado_en: '2025-05-15T16:00:00Z'
  }
];

export const INITIAL_SERVICIOS: Servicio[] = [
  {
    id: 'SRV-0001',
    nombre: 'Cambio de Aceite y Filtro',
    precio_estandar: 15.00,
    descripcion: 'Incluye cambio de aceite, filtro de motor y revisión de fluidos.'
  },
  {
    id: 'SRV-0002',
    nombre: 'Entonación Mayor',
    precio_estandar: 80.00,
    descripcion: 'Cambio de bujías, limpieza de inyectores, filtro de aire y de gasolina.'
  },
  {
    id: 'SRV-0003',
    nombre: 'Revisión de Frenos',
    precio_estandar: 20.00,
    descripcion: 'Inspección de pastillas, discos y purgado de liga de frenos.'
  },
  {
    id: 'SRV-0004',
    nombre: 'Limpieza de Inyectores (Ultrasonido)',
    precio_estandar: 35.00,
    descripcion: 'Limpieza y calibración de inyectores por ultrasonido.'
  }
];

// LocalStorage helpers to simulate Supabase offline cache
export function loadState<T>(key: string, initialData: T): T {
  try {
    const saved = localStorage.getItem(`econograph_${key}`);
    return saved ? JSON.parse(saved) : initialData;
  } catch (e) {
    console.error('Error loading state from localStorage:', e);
    return initialData;
  }
}

export function saveState<T>(key: string, value: T): void {
  try {
    localStorage.setItem(`econograph_${key}`, JSON.stringify(value));
  } catch (e) {
    console.error('Error saving state to localStorage:', e);
  }
}
