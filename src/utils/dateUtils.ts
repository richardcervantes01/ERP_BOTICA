import { ExpirationStatus } from '../types/pharmacy';

export function getDaysUntilExpiration(dateStr: string): number {
  if (!dateStr) return 999;
  const target = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getExpirationStatus(dateStr: string): ExpirationStatus {
  const days = getDaysUntilExpiration(dateStr);
  if (days <= 0) return 'vencido';
  if (days <= 30) return 'critico';
  if (days <= 90) return 'proximo';
  return 'vigente';
}

export function getExpirationLabel(status: ExpirationStatus, days: number): { label: string; bg: string; text: string; border: string } {
  switch (status) {
    case 'vencido':
      return {
        label: days === 0 ? 'Vence hoy' : `Vencido (${Math.abs(days)}d)`,
        bg: 'bg-rose-50',
        text: 'text-rose-700 font-semibold',
        border: 'border-rose-200'
      };
    case 'critico':
      return {
        label: `Por vencer (${days}d)`,
        bg: 'bg-amber-50',
        text: 'text-amber-800 font-semibold',
        border: 'border-amber-200'
      };
    case 'proximo':
      return {
        label: `Por vencer (${days}d)`,
        bg: 'bg-yellow-50',
        text: 'text-yellow-800 font-medium',
        border: 'border-yellow-200'
      };
    case 'vigente':
    default:
      return {
        label: `Vigente (${days}d)`,
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200'
      };
  }
}

export function formatCurrency(amount: number): string {
  return `S/ ${Number(amount || 0).toFixed(2)}`;
}

export function formatDateSpanish(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T12:00:00');
    return d.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

export function formatDateTimeSpanish(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return d.toLocaleString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return dateStr;
  }
}
