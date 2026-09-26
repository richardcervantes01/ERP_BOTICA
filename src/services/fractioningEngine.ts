import { Product, UnidadDispensacion } from '../types/pharmacy';

export interface FractioningCalculation {
  unidadesMinimas: number;
  precioUnitario: number;
  subtotal: number;
  desgloseTexto: string;
}

/**
 * Calcula la cantidad de unidades mínimas correspondientes a una cantidad en la unidad seleccionada.
 * Garantiza aritmética entera exacta a nivel de mínima unidad de despacho.
 */
export function calculateMinimalUnits(
  product: Product,
  cantidad: number,
  unidad: UnidadDispensacion
): number {
  const factorTotal = product.factorConversionTotal || 1;
  const blistersPorCaja = product.blistersPorCaja || 1;
  const unidadesPorBlister = product.unidadesPorBlister || Math.max(1, Math.floor(factorTotal / blistersPorCaja));

  switch (unidad) {
    case 'caja':
      return Math.round(cantidad * factorTotal);
    case 'blister':
      return Math.round(cantidad * unidadesPorBlister);
    case 'fraccion':
    default:
      return Math.round(cantidad);
  }
}

/**
 * Obtiene el precio de venta unitario aplicable para la unidad de dispensación elegida.
 */
export function getPriceForUnit(
  product: Product,
  unidad: UnidadDispensacion
): number {
  switch (unidad) {
    case 'caja':
      return product.precio1Empaque || product.precioVenta;
    case 'blister':
      if (product.precioSubEmpaque && product.precioSubEmpaque > 0) {
        return product.precioSubEmpaque;
      }
      // Derivación proporcional si no estuviera explícito
      const factorTotal = product.factorConversionTotal || 1;
      const blistersPorCaja = product.blistersPorCaja || 10;
      const unidadesPorBlister = product.unidadesPorBlister || (factorTotal / blistersPorCaja);
      return Number(((product.precio2Fraccion || (product.precioVenta / factorTotal)) * unidadesPorBlister).toFixed(2));
    case 'fraccion':
    default:
      return product.precio2Fraccion || Number(((product.precio1Empaque || product.precioVenta) / (product.factorConversionTotal || 1)).toFixed(2));
  }
}

/**
 * Formatea el stock total de un producto expresado en su desglose jerárquico legible:
 * Ej: 45 cajas, 3 blísteres, 4 pastillas (Total: 4,534 pastillas)
 */
export function formatFractionedStock(product: Product): {
  cajas: number;
  blisteres: number;
  fracciones: number;
  totalMinimas: number;
  formattedText: string;
} {
  const totalMinimas = product.stockMinimasUnidades || (product.stock * (product.factorConversionTotal || 1));
  const factorTotal = product.factorConversionTotal || 1;
  const blistersPorCaja = product.blistersPorCaja || 1;
  const unidadesPorBlister = product.unidadesPorBlister || Math.max(1, Math.floor(factorTotal / blistersPorCaja));

  const cajas = Math.floor(totalMinimas / factorTotal);
  const residuoCajas = totalMinimas % factorTotal;
  const blisteres = unidadesPorBlister > 1 ? Math.floor(residuoCajas / unidadesPorBlister) : 0;
  const fracciones = unidadesPorBlister > 1 ? (residuoCajas % unidadesPorBlister) : residuoCajas;

  const partes: string[] = [];
  if (cajas > 0) partes.push(`${cajas} ${product.unidadEmpaque || 'Caja'}${cajas > 1 ? 's' : ''}`);
  if (blisteres > 0 && product.unidadSubEmpaque) partes.push(`${blisteres} ${product.unidadSubEmpaque}${blisteres > 1 ? 'es' : ''}`);
  if (fracciones > 0 || partes.length === 0) partes.push(`${fracciones} ${product.unidadMinima || 'Unid.'}${fracciones > 1 ? 's' : ''}`);

  return {
    cajas,
    blisteres,
    fracciones,
    totalMinimas,
    formattedText: partes.join(', ')
  };
}

/**
 * Valida si hay stock suficiente en mínimas unidades para cubrir la cantidad en la unidad seleccionada.
 */
export function validateFractionedStockAvailable(
  product: Product,
  cantidad: number,
  unidad: UnidadDispensacion
): { hasStock: boolean; availableMinimas: number; requiredMinimas: number; deficit: number } {
  const requiredMinimas = calculateMinimalUnits(product, cantidad, unidad);
  const availableMinimas = product.stockMinimasUnidades ?? (product.stock * (product.factorConversionTotal || 1));

  return {
    hasStock: availableMinimas >= requiredMinimas,
    availableMinimas,
    requiredMinimas,
    deficit: Math.max(0, requiredMinimas - availableMinimas)
  };
}
