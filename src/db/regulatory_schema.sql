-- ============================================================================
-- FARMA CONTROL ERP - ESQUEMA DE BASE DE DATOS REGULATORIA PERUANA
-- Cumplimiento Técnico: DIGEMID (MINSA) / SUNAT (UBL 2.1)
-- Normativas: D.S. N° 014-2011-SA, D.S. N° 023-2001-SA, Directiva OPPF DIGEMID
-- ============================================================================

-- Extensión para UUIDs y funciones criptográficas
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. TABLA: TENANTS / ESTABLECIMIENTOS FARMACÉUTICOS (BOTICAS Y FARMACIAS)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS establecimientos_farmaceuticos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_comercial VARCHAR(255) NOT NULL,
    razon_social VARCHAR(255) NOT NULL,
    ruc VARCHAR(11) NOT NULL UNIQUE,
    codigo_digemid_establecimiento VARCHAR(8) NOT NULL CHECK (char_length(codigo_digemid_establecimiento) BETWEEN 6 AND 8),
    direccion TEXT NOT NULL,
    ubigeo VARCHAR(6),
    telefono VARCHAR(50),
    email VARCHAR(100),
    regente_qf VARCHAR(200) NOT NULL,
    colegiatura_cqfp VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 2. TABLA: PRODUCTOS FARMACÉUTICOS Y FRACCIONAMIENTO MULTINIVEL
-- Control a mínima unidad de despacho sin descuadres por redondeo
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS productos_farmaceuticos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    establecimiento_id UUID NOT NULL REFERENCES establecimientos_farmaceuticos(id) ON DELETE CASCADE,
    codigo_barra VARCHAR(50) NOT NULL,
    nombre_comercial VARCHAR(255) NOT NULL,
    principio_activo VARCHAR(255) NOT NULL,
    concentracion VARCHAR(100),
    forma_farmaceutica VARCHAR(100),
    registro_sanitario VARCHAR(50),
    laboratorio VARCHAR(150),
    
    -- REGLA 1: OBSERVATORIO DE PRECIOS DIGEMID (OPPF)
    codigo_digemid_producto VARCHAR(20) NOT NULL, -- CodProd asignado por DIGEMID
    precio1_empaque NUMERIC(12, 2) NOT NULL CHECK (precio1_empaque > 0), -- Precio por caja entera
    precio2_fraccion NUMERIC(12, 2) NOT NULL CHECK (precio2_fraccion > 0), -- Precio por unidad/fracción
    tipo_operacion_digemid CHAR(1) NOT NULL DEFAULT 'M' CHECK (tipo_operacion_digemid IN ('A', 'B', 'M')),
    reportar_digemid BOOLEAN NOT NULL DEFAULT TRUE,

    -- REGLA 3: FRACCIONAMIENTO MULTINIVEL
    unidad_empaque VARCHAR(50) NOT NULL DEFAULT 'Caja',       -- Nivel 1: Caja
    unidad_subempaque VARCHAR(50) DEFAULT 'Blíster',          -- Nivel 2: Blíster
    unidad_minima VARCHAR(50) NOT NULL DEFAULT 'Tableta',     -- Nivel 3: Pastilla / Fracción
    blisters_por_caja INT DEFAULT 10 CHECK (blisters_por_caja >= 1),
    unidades_por_blister INT DEFAULT 10 CHECK (unidades_por_blister >= 1),
    factor_conversion_total INT NOT NULL DEFAULT 100 CHECK (factor_conversion_total >= 1),
    precio_subempaque NUMERIC(12, 2),
    
    -- Control estricto del inventario en ENTEROS a la mínima unidad (ZERO decimal drift)
    stock_minimas_unidades BIGINT NOT NULL DEFAULT 0 CHECK (stock_minimas_unidades >= 0),
    stock_minimo_unidades BIGINT NOT NULL DEFAULT 100,

    -- REGLA 4: ESTUPEFACIENTES Y PSICOTRÓPICOS FISCALIZADOS
    requiere_receta BOOLEAN NOT NULL DEFAULT FALSE,
    es_fiscalizado BOOLEAN NOT NULL DEFAULT FALSE,
    lista_fiscalizacion VARCHAR(50) DEFAULT 'Ninguna', -- Lista II, III, IV, V

    estado_disposicion VARCHAR(30) NOT NULL DEFAULT 'disponible' CHECK (estado_disposicion IN ('disponible', 'cuarentena', 'merma', 'baja')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_prod_estab_cod UNIQUE (establecimiento_id, codigo_barra)
);

-- ----------------------------------------------------------------------------
-- 3. TABLA: LOTES DE MEDICAMENTOS Y TRAZABILIDAD FEFO
-- Salida por fecha de vencimiento más próxima y bloqueo estricto de vencidos
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lotes_farmaceuticos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producto_id UUID NOT NULL REFERENCES productos_farmaceuticos(id) ON DELETE CASCADE,
    numero_lote VARCHAR(50) NOT NULL,
    registro_sanitario_lote VARCHAR(50),
    fecha_fabricacion DATE,
    fecha_vencimiento DATE NOT NULL,
    stock_unidades BIGINT NOT NULL DEFAULT 0 CHECK (stock_unidades >= 0),
    estado_lote VARCHAR(30) NOT NULL DEFAULT 'vigente' CHECK (estado_lote IN ('vigente', 'proximo', 'critico', 'vencido', 'cuarentena')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_producto_lote UNIQUE (producto_id, numero_lote)
);

-- Índice optimizado para dispensación FEFO instantánea
CREATE INDEX IF NOT EXISTS idx_fefo_dispensacion 
ON lotes_farmaceuticos (producto_id, fecha_vencimiento ASC) 
WHERE stock_unidades > 0;

-- ----------------------------------------------------------------------------
-- 4. TABLA: VENTAS Y EMISIÓN ELECTRÓNICA SUNAT
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS comprobantes_pago (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    establecimiento_id UUID NOT NULL REFERENCES establecimientos_farmaceuticos(id),
    tipo_comprobante CHAR(2) NOT NULL CHECK (tipo_comprobante IN ('01', '03', '07', '00')), -- 01: Factura, 03: Boleta
    serie VARCHAR(4) NOT NULL,
    numero BIGINT NOT NULL,
    correlativo VARCHAR(20) NOT NULL UNIQUE,
    fecha_emision TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Datos del Adquirente
    cliente_tipo_documento VARCHAR(10) NOT NULL, -- DNI, RUC, CE
    cliente_numero_documento VARCHAR(20) NOT NULL,
    cliente_denominacion VARCHAR(255) NOT NULL,
    
    -- Importes
    subtotal NUMERIC(12, 2) NOT NULL,
    igv NUMERIC(12, 2) NOT NULL,
    total NUMERIC(12, 2) NOT NULL,
    metodo_pago VARCHAR(50) NOT NULL,
    
    -- Auditoría SUNAT
    sunat_estado VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE_ENVIO',
    sunat_hash_cpe VARCHAR(100),
    sunat_codigo_respuesta VARCHAR(10),
    xml_ubl_url TEXT,
    cdr_xml_url TEXT,
    
    -- REGLA 4: Bandera de venta fiscalizada
    es_venta_controlada BOOLEAN NOT NULL DEFAULT FALSE,
    usuario_cajero_id VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 5. TABLA: DETALLE DE DISPENSACIÓN CON TRAZABILIDAD POR LOTES FEFO
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS detalle_comprobante_dispensacion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comprobante_id UUID NOT NULL REFERENCES comprobantes_pago(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL REFERENCES productos_farmaceuticos(id),
    lote_id UUID NOT NULL REFERENCES lotes_farmaceuticos(id),
    unidad_dispensada VARCHAR(30) NOT NULL, -- 'caja', 'blister', 'fraccion'
    cantidad_unidades_minimas INT NOT NULL CHECK (cantidad_unidades_minimas > 0),
    precio_unitario NUMERIC(12, 2) NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL
);

-- ----------------------------------------------------------------------------
-- 6. TABLA: REGISTRO OFICIAL DE RECETAS MÉDICAS Y MEDICAMENTOS FISCALIZADOS
-- (Libro Oficial de Estupefacientes y Psicotrópicos - DIGEMID D.S. 023-2001-SA)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS registro_recetas_fiscalizadas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    establecimiento_id UUID NOT NULL REFERENCES establecimientos_farmaceuticos(id),
    comprobante_id UUID NOT NULL REFERENCES comprobantes_pago(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL REFERENCES productos_farmaceuticos(id),
    lote_id UUID NOT NULL REFERENCES lotes_farmaceuticos(id),
    
    -- Datos del Paciente
    paciente_nombre VARCHAR(255) NOT NULL,
    paciente_tipo_documento VARCHAR(10) NOT NULL CHECK (paciente_tipo_documento IN ('DNI', 'CE', 'Pasaporte')),
    paciente_numero_documento VARCHAR(20) NOT NULL,
    paciente_telefono VARCHAR(50),
    
    -- Datos del Médico Prescriptor
    medico_nombre VARCHAR(255) NOT NULL,
    medico_cmp VARCHAR(20) NOT NULL, -- Código de Colegiatura Médica
    medico_especialidad VARCHAR(150),
    
    -- Datos de la Receta Física
    receta_serie_folio VARCHAR(50) NOT NULL,
    receta_fecha_emision DATE NOT NULL,
    diagnostico_cie10 VARCHAR(50),
    
    -- Cantidad dispensada en mínimas unidades
    cantidad_minima_dispensada INT NOT NULL CHECK (cantidad_minima_dispensada > 0),
    quimico_farmaceutico_dispensador VARCHAR(200) NOT NULL,
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- TRIGGER: BLOQUEO DURO DE LOTES CADUCADOS (Art. 57 D.S. 014-2011-SA)
-- Impide cualquier inserción o dispensación si fecha_vencimiento <= CURRENT_DATE
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_check_fefo_no_vencido()
RETURNS TRIGGER AS $$
DECLARE
    v_fecha_vencimiento DATE;
    v_nombre_producto VARCHAR(255);
BEGIN
    SELECT l.fecha_vencimiento, p.nombre_comercial
    INTO v_fecha_vencimiento, v_nombre_producto
    FROM lotes_farmaceuticos l
    JOIN productos_farmaceuticos p ON p.id = l.producto_id
    WHERE l.id = NEW.lote_id;

    IF v_fecha_vencimiento <= CURRENT_DATE THEN
        RAISE EXCEPTION '[BLOQUEO SANITARIO FEFO] El lote del medicamento "%" expiró el %. Su dispensación está prohibida por la DIGEMID (D.S. 014-2011-SA).',
            v_nombre_producto, v_fecha_vencimiento;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bloqueo_duro_fefo ON detalle_comprobante_dispensacion;
CREATE TRIGGER trg_bloqueo_duro_fefo
BEFORE INSERT ON detalle_comprobante_dispensacion
FOR EACH ROW EXECUTE FUNCTION fn_check_fefo_no_vencido();
