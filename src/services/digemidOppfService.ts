import { Product, TenantSettings, TipoOperacionDigemid } from '../types/pharmacy';

export interface DigemidRecord {
  codEstab: string; // 6-8 chars
  codProd: string;  // Código oficial DIGEMID
  nombreProducto: string;
  precio1: string;  // Empaque entero, 2 decimales
  precio2: string;  // Fracción unitaria, 2 decimales
  tipoOperacion: TipoOperacionDigemid;
  isValid: boolean;
  validationErrors: string[];
}

export interface DigemidValidationReport {
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  codEstabValid: boolean;
  codEstab: string;
  records: DigemidRecord[];
  errorsSummary: string[];
}

/**
 * Valida si el código de establecimiento cumple con la normativa DIGEMID (6 a 8 caracteres alfanuméricos).
 */
export function validateCodEstab(codEstab: string): boolean {
  if (!codEstab) return false;
  const clean = codEstab.trim();
  return clean.length >= 6 && clean.length <= 8 && /^[A-Za-z0-9]+$/.test(clean);
}

/**
 * Genera y audita los registros compatibles con la Directiva del Observatorio Peruano de Productos Farmacéuticos (OPPF - DIGEMID).
 */
export function generateDigemidRecords(
  products: Product[],
  tenant: TenantSettings
): DigemidValidationReport {
  const codEstab = (tenant.codigoEstablecimientoDigemid || '0048201').trim();
  const codEstabValid = validateCodEstab(codEstab);

  const errorsSummary: string[] = [];
  if (!codEstabValid) {
    errorsSummary.push(
      `El Código de Establecimiento (CodEstab: "${codEstab}") debe tener exactamente entre 6 y 8 caracteres alfanuméricos según el registro oficial de DIGEMID.`
    );
  }

  // Filtrar productos seleccionados para reporte DIGEMID (o todos los que tengan codDigemid o bandera activa)
  const candidateProducts = products.filter(
    p => p.reportarDigemid !== false && p.codDigemid && p.codDigemid.trim().length > 0
  );

  const records: DigemidRecord[] = candidateProducts.map(p => {
    const errs: string[] = [];

    const codProd = (p.codDigemid || '').trim();
    if (!codProd) {
      errs.push(`Falta el Código de Medicamento DIGEMID (CodProd).`);
    }

    const precio1Val = Number((p.precio1Empaque || p.precioVenta || 0).toFixed(2));
    const precio2Val = Number((p.precio2Fraccion || (precio1Val / (p.factorConversionTotal || 1))).toFixed(2));

    if (precio1Val <= 0) {
      errs.push(`Precio 1 (Empaque) debe ser mayor a 0.00.`);
    }
    if (precio2Val <= 0) {
      errs.push(`Precio 2 (Fracción) debe ser mayor a 0.00.`);
    }

    const tipoOp: TipoOperacionDigemid = p.tipoOperacionDigemid || 'M';
    if (!['A', 'B', 'M'].includes(tipoOp)) {
      errs.push(`Tipo de Operación debe ser 'A' (Alta), 'B' (Baja) o 'M' (Modificación).`);
    }

    return {
      codEstab,
      codProd,
      nombreProducto: p.nombre,
      precio1: precio1Val.toFixed(2),
      precio2: precio2Val.toFixed(2),
      tipoOperacion: tipoOp,
      isValid: errs.length === 0 && codEstabValid,
      validationErrors: errs
    };
  });

  const validCount = records.filter(r => r.isValid).length;
  const invalidCount = records.length - validCount;

  return {
    totalRecords: records.length,
    validRecords: validCount,
    invalidRecords: invalidCount,
    codEstabValid,
    codEstab,
    records,
    errorsSummary
  };
}

/**
 * Exporta el archivo en el formato estándar oficial DIGEMID OPPF (separado por pipes '|' o tabulación).
 * Formato oficial por línea: CodEstab|CodProd|Precio1|Precio2|TipoOperacion
 */
export function generateDigemidPipeFile(records: DigemidRecord[]): string {
  const lines = records.map(r => {
    return `${r.codEstab}|${r.codProd}|${r.precio1}|${r.precio2}|${r.tipoOperacion}`;
  });
  return lines.join('\r\n');
}

/**
 * Exporta el archivo en formato CSV compatible con Excel para revisión del Químico Farmacéutico Regente.
 */
export function generateDigemidCsvFile(records: DigemidRecord[]): string {
  const header = 'CodEstab,CodProd,NombreMedicamento,Precio1_Empaque,Precio2_Fraccion,TipoOperacion';
  const rows = records.map(r => {
    const escapedName = `"${r.nombreProducto.replace(/"/g, '""')}"`;
    return `${r.codEstab},${r.codProd},${escapedName},${r.precio1},${r.precio2},${r.tipoOperacion}`;
  });
  return [header, ...rows].join('\r\n');
}

/**
 * Descarga en el navegador el archivo generado compatible con el portal del Observatorio DIGEMID.
 */
export function downloadDigemidExportFile(
  content: string,
  fileName: string,
  mimeType: 'text/plain' | 'text/csv' = 'text/plain'
) {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
