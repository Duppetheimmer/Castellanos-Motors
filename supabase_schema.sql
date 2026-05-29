-- ==========================================================
-- CASTELLANOS MOTORS - SCHEMA DE BASE DE DATOS SUPABASE
-- ==========================================================
-- Este archivo contiene las definiciones de tabla preparadas para
-- PostgreSQL en Supabase. Se han incluido todas las tablas requeridas
-- por el sistema y agregado soporte para "gastos_alternos".

-- Habilitar extensión UUID si es necesario
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABLA: Clientes
CREATE TABLE IF NOT EXISTS clientes (
    id TEXT PRIMARY KEY DEFAULT ('CLI-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 6))),
    nombre TEXT NOT NULL,
    telefono TEXT NOT NULL,
    email TEXT DEFAULT '',
    cedula TEXT UNIQUE NOT NULL,
    nacimiento TEXT DEFAULT '',
    direccion TEXT DEFAULT '',
    observaciones TEXT DEFAULT '',
    fecha_reg DATE DEFAULT CURRENT_DATE
);

-- 2. TABLA: Vehiculos
CREATE TABLE IF NOT EXISTS vehiculos (
    id TEXT PRIMARY KEY DEFAULT ('VEH-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 6))),
    cliente_id TEXT REFERENCES clientes(id) ON DELETE SET NULL,
    marca TEXT NOT NULL,
    modelo TEXT NOT NULL,
    anio INTEGER NOT NULL,
    placa TEXT UNIQUE NOT NULL,
    color TEXT DEFAULT '#475569',
    vin TEXT DEFAULT '',
    km INTEGER DEFAULT 0,
    observaciones TEXT DEFAULT '',
    fecha_reg DATE DEFAULT CURRENT_DATE
);

-- 3. TABLA: Repuestos (Inventario)
CREATE TABLE IF NOT EXISTS repuestos (
    id TEXT PRIMARY KEY DEFAULT ('REP-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 6))),
    codigo TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    referencia TEXT DEFAULT '',
    categoria TEXT NOT NULL,
    proveedor TEXT DEFAULT '',
    cantidad INTEGER DEFAULT 0,
    stock_min INTEGER DEFAULT 5,
    precio NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    costo NUMERIC(10, 2) NOT NULL DEFAULT 0.00, -- Costo taller para analítica de ganancia
    ubicacion TEXT DEFAULT '',
    fecha_ingreso DATE DEFAULT CURRENT_DATE
);

-- 4. TABLA: Trabajadores (Personal)
CREATE TABLE IF NOT EXISTS trabajadores (
    id TEXT PRIMARY KEY DEFAULT ('TRA-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 6))),
    nombre TEXT NOT NULL,
    especialidad TEXT DEFAULT '',
    telefono TEXT DEFAULT '',
    fecha_ingreso DATE DEFAULT CURRENT_DATE,
    comision_porcentaje INTEGER NOT NULL DEFAULT 40 -- Porcentaje de mano de obra (e.g. 40 para 40%)
);

-- 5. TABLA: Ordenes de Trabajo
CREATE TABLE IF NOT EXISTS ordenes (
    id TEXT PRIMARY KEY DEFAULT ('ORD-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 6))),
    cliente_id TEXT REFERENCES clientes(id) ON DELETE SET NULL,
    auto_id TEXT REFERENCES vehiculos(id) ON DELETE SET NULL,
    fecha DATE DEFAULT CURRENT_DATE,
    descripcion TEXT NOT NULL,
    repuestos JSONB DEFAULT '[]'::jsonb, -- Array de repuestos usados [{id, qty, precio, costo}]
    observaciones TEXT DEFAULT '',
    labor_cost NUMERIC(10, 2) DEFAULT 0.00,
    km_ingreso INTEGER DEFAULT 0,
    estado TEXT CHECK (estado IN ('abierta', 'en_proceso', 'terminada')) DEFAULT 'abierta',
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    trabajador_id TEXT REFERENCES trabajadores(id) ON DELETE SET NULL,
    diagnostico TEXT DEFAULT '',
    comision_porcentaje INTEGER NOT NULL DEFAULT 40 -- Porcentaje de comisión grabado al guardar/cerrar la orden para preservar histórico
);

-- 6. TABLA: Solicitudes de Repuestos (Mecánico a Almacén)
CREATE TABLE IF NOT EXISTS solicitudes (
    id TEXT PRIMARY KEY DEFAULT ('SOL-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 6))),
    orden_id TEXT REFERENCES ordenes(id) ON DELETE CASCADE,
    orden_codigo TEXT NOT NULL,
    auto_placa TEXT NOT NULL,
    mecanico_nombre TEXT NOT NULL,
    repuesto_nombre TEXT NOT NULL,
    repuesto_id TEXT REFERENCES repuestos(id) ON DELETE CASCADE,
    cantidad INTEGER DEFAULT 1,
    estado TEXT CHECK (estado IN ('pendiente', 'entregado')) DEFAULT 'pendiente',
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. TABLA: Transacciones Extra (Movimientos de Caja Menor/Oficina)
CREATE TABLE IF NOT EXISTS transacciones_extra (
    id TEXT PRIMARY KEY DEFAULT ('TX-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 6))),
    tipo TEXT CHECK (tipo IN ('entrada', 'salida')) NOT NULL,
    categoria TEXT NOT NULL, -- 'Alquiler', 'Servicios', 'Herramientas', 'Gastos Alternos', etc.
    descripcion TEXT NOT NULL,
    monto NUMERIC(10, 2) NOT NULL,
    fecha DATE DEFAULT CURRENT_DATE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. TABLA SOLICITADA: Gastos Alternos
-- Se añade como tabla específica o se puede registrar en transacciones_extra.
-- Para máxima compatibilidad e historial estructurado, sugerimos registrar
-- los gastos alternos (servicios, alquiler, comida, transporte, etc.) en esta tabla
-- dedicada o como categoría 'Gastos Alternos' en transacciones_extra.
CREATE TABLE IF NOT EXISTS gastos_alternos (
    id TEXT PRIMARY KEY DEFAULT ('GA-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 6))),
    concepto TEXT NOT NULL, -- 'Alquiler', 'Servicios', 'Alimentos', 'Transporte', 'Varios'
    descripcion TEXT NOT NULL,
    monto NUMERIC(10, 2) NOT NULL,
    fecha DATE DEFAULT CURRENT_DATE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. TABLA: Historial de Pagos de Órdenes
CREATE TABLE IF NOT EXISTS historial_pagos (
    id TEXT PRIMARY KEY DEFAULT ('PAG-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 6))),
    orden_id TEXT REFERENCES ordenes(id) ON DELETE CASCADE,
    monto NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    metodo_pago TEXT CHECK (metodo_pago IN ('efectivo', 'transferencia', 'tarjeta', 'otro')) NOT NULL DEFAULT 'efectivo',
    fecha_pago DATE DEFAULT CURRENT_DATE,
    observaciones TEXT DEFAULT '',
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Triggers opcionales para automatizaciones o RLS se pueden configurar libremente.
-- De forma predeterminada, se recomienda desactivar RLS en estas tablas para acceso anónimo o
-- crear políticas adecuadas de RLS se basen en su anon key.
ALTER TABLE clientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE vehiculos DISABLE ROW LEVEL SECURITY;
ALTER TABLE repuestos DISABLE ROW LEVEL SECURITY;
ALTER TABLE trabajadores DISABLE ROW LEVEL SECURITY;
ALTER TABLE ordenes DISABLE ROW LEVEL SECURITY;
ALTER TABLE solicitudes DISABLE ROW LEVEL SECURITY;
ALTER TABLE transacciones_extra DISABLE ROW LEVEL SECURITY;
ALTER TABLE gastos_alternos DISABLE ROW LEVEL SECURITY;
ALTER TABLE historial_pagos DISABLE ROW LEVEL SECURITY;

-- SEED DATA DE PRUEBA (Opcional):
-- INSERT INTO clientes (id, nombre, telefono, cedula, observaciones) VALUES ('CLI-A1B2', 'Carlos Mendoza', '0414-123-4567', 'V-15.342.198', 'Cliente frecuente');
