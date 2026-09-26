import { Product, ProductBatch, LoteDespachado } from '../types/pharmacy';

export interface FefoAllocationResult {
  success: boolean;
  allocations: LoteDespachado[];
  totalAllocated: number; // en mínimas unidades
  error?: string;
  loteCriticoExpiraPronto?: ProductBatch;
}

/**
 * Comprueba si una fecha YYYY-MM-DD ya está caducada respecto a la fecha actual (bloqueo duro).
 */
export function isBatchExpired(fechaVencimiento: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [year, month, day] = fechaVencimiento.split('-').map(Number);
  const expDate = new Date(year, month - 1, day || 1);
  expDate.setHours(23, 59, 59, 999);

  return expDate.getTime() <= today.getTime();
}

/**
 * Obtiene los días restantes hasta la expiración.
 */
export function getDaysToExpiry(fechaVencimiento: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [year, month, day] = fechaVencimiento.split('-').map(Number);
  const expDate = new Date(year, month - 1, day || 1);
  expDate.setHours(0, 0, 0, 0);
  const diffTime = expDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Algoritmo Regulatorio FEFO (First Expired, First Out)
 * Ordena los lotes vigentes de un producto por fecha_vencimiento ascendente (el más próximo a vencer se despacha primero).
 * Aplica bloqueo duro e infranqueable si un lote está vencido (fecha_vencimiento <= fecha_actual).
 * 
 * @param product Producto con su colección de lotes
 * @param requiredMinimalUnits Cantidad solicitada en mínima unidad de dispensación
 */
export function allocateFefoStock(
  product: Product,
  requiredMinimalUnits: number
): FefoAllocationResult {
  if (requiredMinimalUnits <= 0) {
    return { success: false, allocations: [], totalAllocated: 0, error: 'Cantidad solicitada inválida.' };
  }

  const lotes = product.lotes || [];
  if (lotes.length === 0) {
    // Si no tiene lotes definidos, verificar la fecha global del producto
    if (isBatchExpired(product.fechaVencimiento)) {
      return {
        success: false,
        allocations: [],
        totalAllocated: 0,
        error: `[BLOQUEO SANITARIO FEFO] El medicamento "${product.nombre}" tiene fecha de expiración caducada (${product.fechaVencimiento}). Su venta y dispensación está terminantemente prohibida según el Art. 57 del D.S. N° 014-2011-SA.`
      };
    }
    return {
      success: true,
      allocations: [
        {
          loteId: 'lote-default',
          numeroLote: product.lote,
          fechaVencimiento: product.fechaVencimiento,
          cantidadMinima: requiredMinimalUnits
        }
      ],
      totalAllocated: requiredMinimalUnits
    };
  }

  // 1. Filtrar y clasificar lotes
  const nonExpiredBatches: ProductBatch[] = [];
  const expiredBatches: ProductBatch[] = [];

  for (const b of lotes) {
    if (isBatchExpired(b.fechaVencimiento)) {
      expiredBatches.push(b);
    } else if (b.estado !== 'cuarentena' && b.stockUnidades > 0) {
      nonExpiredBatches.push(b);
    }
  }

  // Si no hay lotes no vencidos pero hay lotes vencidos con stock
  if (nonExpiredBatches.length === 0 && expiredBatches.some(b => b.stockUnidades > 0)) {
    const primerVencido = expiredBatches[0];
    return {
      success: false,
      allocations: [],
      totalAllocated: 0,
      error: `[BLOQUEO SANITARIO FEFO - DIGEMID] El lote disponible ${primerVencido.numeroLote} expiró el ${primerVencido.fechaVencimiento}. Transacción bloqueada. Debe trasladarse a área de bajas/cuarentena con Acta de Destrucción.`
    };
  }

  // 2. Ordenar lotes vigentes de forma ascendente (FEFO)
  nonExpiredBatches.sort((a, b) => {
    return new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime();
  });

  // 3. Asignar stock lote por lote
  let pendingToAllocate = requiredMinimalUnits;
  const allocations: LoteDespachado[] = [];

  for (const batch of nonExpiredBatches) {
    if (pendingToAllocate <= 0) break;

    const availableInBatch = batch.stockUnidades;
    const canTake = Math.min(pendingToAllocate, availableInBatch);

    if (canTake > 0) {
      allocations.push({
        loteId: batch.id,
        numeroLote: batch.numeroLote,
        fechaVencimiento: batch.fechaVencimiento,
        cantidadMinima: canTake
      });
      pendingToAllocate -= canTake;
    }
  }

  if (pendingToAllocate > 0) {
    const availableTotal = nonExpiredBatches.reduce((acc, b) => acc + b.stockUnidades, 0);
    return {
      success: false,
      allocations: [],
      totalAllocated: 0,
      error: `Stock insuficiente en lotes vigentes aptos para dispensación. Se requieren ${requiredMinimalUnits} unidades mínimas pero solo hay ${availableTotal} disponibles en lotes no caducados.`
    };
  }

  return {
    success: true,
    allocations,
    totalAllocated: requiredMinimalUnits,
    loteCriticoExpiraPronto: nonExpiredBatches[0]
  };
}

/**
 * Obtiene el lote activo preferente que el cajero despachará de acuerdo a la directiva FEFO.
 */
export function getPreferredFefoBatch(product: Product): ProductBatch | null {
  if (!product.lotes || product.lotes.length === 0) return null;

  const validBatches = product.lotes
    .filter(b => !isBatchExpired(b.fechaVencimiento) && b.estado !== 'cuarentena' && b.stockUnidades > 0)
    .sort((a, b) => new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime());

  return validBatches[0] || null;
}
