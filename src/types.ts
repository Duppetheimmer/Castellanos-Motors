export interface Cliente {
  id: string;
  nombre: string;
  telefono: string;
  email: string;
  cedula: string;
  nacimiento: string;
  direccion: string;
  observaciones: string;
  fecha_reg: string;
}

export interface Vehiculo {
  id: string;
  cliente_id: string | null;
  marca: string;
  modelo: string;
  anio: number;
  placa: string;
  color: string;
  vin: string;
  km: number;
  observaciones: string;
  fecha_reg: string;
}

export interface Repuesto {
  id: string;
  codigo: string;
  nombre: string;
  referencia: string;
  categoria: string;
  proveedor: string;
  cantidad: number;
  stock_min: number;
  precio: number; // Precio de Venta al cliente
  costo: number;  // Precio de Costo para el taller (new requested column)
  ubicacion: string;
  fecha_ingreso: string;
}

export interface OrdenRepuestoItem {
  id: string;      // ID del repuesto
  qty: number;     // Cantidad usada
  precio: number;  // Precio de venta guardado/facturado
  costo: number;   // Costo de compra guardado/facturado (for historical margin analysis)
}

export type EstadoOrden = 'abierta' | 'en_proceso' | 'terminada';

export interface Orden {
  id: string;
  cliente_id: string | null;
  auto_id: string | null;
  fecha: string;
  descripcion: string;
  repuestos: OrdenRepuestoItem[]; // En BD se guarda como JSONB arreglado
  observaciones: string;
  labor_cost: number;
  km_ingreso: number;
  estado: EstadoOrden;
  creado_en: string;
  trabajador_id: string | null;
  diagnostico: string | null;
  comision_porcentaje?: number; // Porcentaje de comisión histórico grabado en la orden
  comision_pagada?: boolean;     // Indica si la comisión del técnico por este trabajo ya fue pagada
}

export interface Trabajador {
  id: string;
  nombre: string;
  especialidad: string;
  telefono: string;
  fecha_ingreso: string;
  comision_porcentaje: number; // Porcentaje de mano de obra (e.g. 40 para 40%)
  usuario?: string;
  contrasena?: string;
}

export interface Solicitud {
  id: string;
  orden_id: string;
  orden_codigo: string;
  auto_placa: string;
  mecanico_nombre: string;
  repuesto_nombre: string;
  repuesto_id: string;
  cantidad: number;
  estado: 'pendiente' | 'entregado';
  creado_en: string;
}

export interface TransaccionExtra {
  id: string;
  tipo: 'entrada' | 'salida';
  categoria: string;
  descripcion: string;
  monto: number;
  fecha: string;
  creado_en: string;
}

export interface HistorialPago {
  id: string;
  orden_id: string;
  monto: number;
  metodo_pago: 'efectivo' | 'transferencia' | 'tarjeta' | 'otro';
  fecha_pago: string; // YYYY-MM-DD
  observaciones: string;
  creado_en: string;
}

export interface VentaIndividualItem {
  id: string;
  nombre: string;
  qty: number;
  precio: number; // custom or standard direct sale price (with discounts)
  costo: number;  // unit cost of the spare part
  qty_devuelta?: number; // quantity returned by customer
}

export interface VentaIndividual {
  id: string;
  fecha: string;
  cliente_nombre: string;
  cliente_cedula?: string;
  items: VentaIndividualItem[];
  tasa_usdt: number;
  total_usd: number;
  creado_en: string;
}

export interface LogBorrados {
  id: string;
  fecha_suceso: string;
  tipo_entidad: 'venta' | 'orden' | 'transaccion' | 'devolucion_repuesto';
  descripcion_auditoria: string;
  monto?: number;
  usuario?: string;
}

export interface Servicio {
  id: string;
  nombre: string;
  precio_estandar: number;
  descripcion?: string;
  creado_en?: string;
}


