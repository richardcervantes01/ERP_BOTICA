import React, { useState } from 'react';
import { RecetaMedicaControlada, CartItem } from '../../types/pharmacy';
import {
  FileText,
  ShieldAlert,
  AlertTriangle,
  User,
  Stethoscope,
  Calendar,
  Hash,
  X,
  CheckCircle2,
  Lock
} from 'lucide-react';

interface PrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (datosReceta: RecetaMedicaControlada) => void;
  cartItems: CartItem[];
  defaultCustomerDoc?: string;
  defaultCustomerName?: string;
}

export const PrescriptionModal: React.FC<PrescriptionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  cartItems,
  defaultCustomerDoc = '',
  defaultCustomerName = ''
}) => {
  const [pacienteNombre, setPacienteNombre] = useState(
    defaultCustomerName && defaultCustomerName !== 'Público General' ? defaultCustomerName : ''
  );
  const [pacienteDocumentoTipo, setPacienteDocumentoTipo] = useState<'DNI' | 'CE' | 'Pasaporte'>('DNI');
  const [pacienteDocumento, setPacienteDocumento] = useState(
    defaultCustomerDoc && defaultCustomerDoc !== '00000000' ? defaultCustomerDoc : ''
  );
  const [pacienteTelefono, setPacienteTelefono] = useState('');
  const [medicoNombre, setMedicoNombre] = useState('');
  const [medicoCMP, setMedicoCMP] = useState('');
  const [medicoEspecialidad, setMedicoEspecialidad] = useState('Medicina General');
  const [recetaSerieFolio, setRecetaSerieFolio] = useState('');
  const [recetaFechaEmision, setRecetaFechaEmision] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [diagnosticoCIE10, setDiagnosticoCIE10] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const fiscalizedItems = cartItems.filter(i => i.product.esFiscalizado);
  const prescriptionItems = cartItems.filter(i => i.product.requiereReceta && !i.product.esFiscalizado);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!pacienteNombre.trim()) {
      setErrorMsg('El nombre completo del paciente es obligatorio.');
      return;
    }
    if (!pacienteDocumento.trim()) {
      setErrorMsg('El documento de identidad del paciente es obligatorio.');
      return;
    }
    if (pacienteDocumentoTipo === 'DNI' && pacienteDocumento.trim().length !== 8) {
      setErrorMsg('El DNI debe tener exactamente 8 dígitos.');
      return;
    }
    if (!medicoNombre.trim()) {
      setErrorMsg('El nombre del médico prescriptor es obligatorio.');
      return;
    }
    if (!medicoCMP.trim() || medicoCMP.trim().length < 4) {
      setErrorMsg('Ingrese un número de Colegiatura Médica (CMP) válido (mínimo 4 dígitos).');
      return;
    }
    if (!recetaSerieFolio.trim()) {
      setErrorMsg('El número de serie o folio físico de la receta médica es obligatorio.');
      return;
    }
    if (!recetaFechaEmision) {
      setErrorMsg('La fecha de emisión de la receta es obligatoria.');
      return;
    }

    // Verificar antigüedad máxima reglamentaria de 30 días para recetas ordinarias/retenidas
    const today = new Date();
    const emissionDate = new Date(recetaFechaEmision);
    const diffDays = Math.ceil((today.getTime() - emissionDate.getTime()) / (1000 * 3600 * 24));
    if (diffDays > 30) {
      setErrorMsg('¡RECETA EXPIRADA! Según el D.S. N° 014-2011-SA, la receta no puede superar los 30 días calendarios de emisión.');
      return;
    }

    onSubmit({
      pacienteNombre: pacienteNombre.trim(),
      pacienteDocumentoTipo,
      pacienteDocumento: pacienteDocumento.trim(),
      pacienteTelefono: pacienteTelefono.trim() || undefined,
      medicoNombre: medicoNombre.trim(),
      medicoCMP: medicoCMP.trim(),
      medicoEspecialidad: medicoEspecialidad.trim() || undefined,
      recetaSerieFolio: recetaSerieFolio.trim(),
      recetaFechaEmision,
      diagnosticoCIE10: diagnosticoCIE10.trim() || undefined
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-6">
        {/* Header con advertencia regulatoria */}
        <div className={`p-5 text-white flex items-start justify-between ${
          fiscalizedItems.length > 0
            ? 'bg-gradient-to-r from-rose-900 via-rose-800 to-amber-900'
            : 'bg-gradient-to-r from-amber-700 to-amber-800'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0 border border-white/20">
              {fiscalizedItems.length > 0 ? (
                <ShieldAlert className="w-6 h-6 text-rose-200" />
              ) : (
                <FileText className="w-6 h-6 text-amber-200" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-black/30 tracking-wider uppercase">
                  Regulación DIGEMID / MINSA
                </span>
                {fiscalizedItems.length > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500 text-white animate-pulse">
                    Psicotrópicos / Estupefacientes
                  </span>
                )}
              </div>
              <h3 className="text-base font-bold mt-0.5">
                {fiscalizedItems.length > 0
                  ? 'Ficha Oficial de Control de Medicamentos Fiscalizados'
                  : 'Validación de Receta Médica Obligatoria'}
              </h3>
              <p className="text-xs text-white/80">
                Conforme al D.S. N° 023-2001-SA y Art. 49 del D.S. N° 014-2011-SA
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Medicamentos involucrados */}
        <div className="p-4 bg-amber-50/70 border-b border-amber-200/80">
          <p className="text-[11px] font-bold text-amber-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
            Medicamentos sujetos a control en el carrito:
          </p>
          <div className="space-y-1.5">
            {cartItems
              .filter(ci => ci.product.requiereReceta || ci.product.esFiscalizado)
              .map(ci => (
                <div
                  key={ci.product.id}
                  className="bg-white px-3 py-1.5 rounded-lg border border-amber-200 text-xs flex items-center justify-between shadow-2xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800">{ci.product.nombre}</span>
                    <span className="text-[10px] text-slate-500">
                      (Lote: {ci.product.lote} - Vence: {ci.product.fechaVencimiento})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {ci.product.esFiscalizado && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 bg-rose-100 text-rose-800 rounded border border-rose-300">
                        {ci.product.listaFiscalizacion || 'Fiscalizado'}
                      </span>
                    )}
                    <span className="text-[11px] font-mono font-bold text-slate-700">
                      Cant: {ci.cantidad} {ci.unidadDispensada}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Formulario de Auditoría y Registro */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Sección Paciente */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
              <User className="w-4 h-4 text-emerald-600" />
              1. Identificación del Paciente
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Nombres y Apellidos Completos *
                </label>
                <input
                  type="text"
                  required
                  value={pacienteNombre}
                  onChange={e => setPacienteNombre(e.target.value)}
                  placeholder="Ej. Juan Pérez Quispe"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Tipo Doc. *
                </label>
                <select
                  value={pacienteDocumentoTipo}
                  onChange={e => setPacienteDocumentoTipo(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white"
                >
                  <option value="DNI">DNI (8 dígitos)</option>
                  <option value="CE">Carné Extranjería (CE)</option>
                  <option value="Pasaporte">Pasaporte</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  N° Documento *
                </label>
                <input
                  type="text"
                  required
                  value={pacienteDocumento}
                  onChange={e => setPacienteDocumento(e.target.value)}
                  placeholder={pacienteDocumentoTipo === 'DNI' ? '8 dígitos' : 'N° Documento'}
                  maxLength={pacienteDocumentoTipo === 'DNI' ? 8 : 15}
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Teléfono / Celular de Contacto
                </label>
                <input
                  type="text"
                  value={pacienteTelefono}
                  onChange={e => setPacienteTelefono(e.target.value)}
                  placeholder="Ej. 984 512 890"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Sección Médico Prescriptor */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
              <Stethoscope className="w-4 h-4 text-emerald-600" />
              2. Médico Prescriptor Colegiado
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Nombres y Apellidos del Médico *
                </label>
                <input
                  type="text"
                  required
                  value={medicoNombre}
                  onChange={e => setMedicoNombre(e.target.value)}
                  placeholder="Ej. Dr. Mario Vargas Llosa"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  N° Colegiatura (CMP) *
                </label>
                <input
                  type="text"
                  required
                  value={medicoCMP}
                  onChange={e => setMedicoCMP(e.target.value)}
                  placeholder="Ej. 48192"
                  maxLength={8}
                  className="w-full px-3 py-2 text-xs font-mono font-bold text-slate-800 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Especialidad Médica
                </label>
                <input
                  type="text"
                  value={medicoEspecialidad}
                  onChange={e => setMedicoEspecialidad(e.target.value)}
                  placeholder="Ej. Neurología, Psiquiatría, Medicina General"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Sección Receta Física */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
              <Calendar className="w-4 h-4 text-emerald-600" />
              3. Datos de la Receta Física Retenida
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Serie / Folio Físico *
                </label>
                <input
                  type="text"
                  required
                  value={recetaSerieFolio}
                  onChange={e => setRecetaSerieFolio(e.target.value)}
                  placeholder="Ej. REC-2026-0814"
                  className="w-full px-3 py-2 text-xs font-mono uppercase font-bold text-slate-800 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Fecha de Emisión *
                </label>
                <input
                  type="date"
                  required
                  value={recetaFechaEmision}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={e => setRecetaFechaEmision(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Diagnóstico / CIE-10 (Opcional)
                </label>
                <input
                  type="text"
                  value={diagnosticoCIE10}
                  onChange={e => setDiagnosticoCIE10(e.target.value)}
                  placeholder="Ej. F41.1 / Ansiedad"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Banner de Declaración de Conformidad Q.F. */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-800">
                Declaración Sanitaria y Retención de Receta:
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Al validar este formulario, el dispensador certifica haber recibido y revisado la receta médica física original, verificando la firma y sello del médico con CMP activo. La información se asentará automáticamente en el Libro Oficial de Control de DIGEMID.
              </p>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              Cancelar Dispensación
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition cursor-pointer flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Convalidar Receta y Proceder al Cobro</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
