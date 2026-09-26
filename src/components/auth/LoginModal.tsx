import React, { useState } from 'react';
import { usePharmacy } from '../../context/PharmacyContext';
import {
  Lock,
  Mail,
  Shield,
  Store,
  UserCheck,
  Cross,
  AlertCircle,
  X
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { login } = usePharmacy();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const res = login(email, password);
    if (!res.success) {
      setErrorMsg(res.message || 'Credenciales incorrectas');
    } else {
      if (onClose) onClose();
    }
  };

  const handleQuickLogin = (quickEmail: string, quickPass: string) => {
    setEmail(quickEmail);
    setPassword(quickPass);
    const res = login(quickEmail, quickPass);
    if (!res.success) {
      setErrorMsg(res.message || 'Error al ingresar');
    } else {
      if (onClose) onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Brand Header */}
        <div className="bg-emerald-950 text-white p-6 text-center relative border-b border-emerald-800">
          {onClose && (
            <button
              onClick={onClose}
              className="absolute right-4 top-4 text-emerald-400 hover:text-white p-1 rounded-lg hover:bg-emerald-900 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center mx-auto mb-3">
            <Cross className="w-6 h-6 text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold tracking-wide">
            Farma<span className="text-emerald-400">Control</span> ERP
          </h2>
          <p className="text-xs text-emerald-300 mt-1">
            Acceso al Sistema de Gestión Farmacéutica
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="usuario@botica.pe"
                  required
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs transition cursor-pointer"
            >
              Iniciar Sesión
            </button>
          </form>

          {/* Demo Quick Access Profiles */}
          <div className="pt-3 border-t border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2 text-center">
              Acceso Rápido de Prueba (Roles)
            </span>

            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@farmacontrol.com', 'admin123')}
                className="w-full p-2.5 rounded-lg border border-slate-200 hover:border-slate-800 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-left transition cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-purple-600" />
                  <div>
                    <p className="font-bold text-slate-800 text-[11px]">Super Administrador (Tú)</p>
                    <p className="text-[10px] text-slate-500">Gestión de licencias, boticas y SaaS</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-purple-700 font-semibold">admin123</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('demo@boticasanjose.pe', 'botica123')}
                className="w-full p-2.5 rounded-lg border border-slate-200 hover:border-emerald-500 bg-emerald-50/50 hover:bg-emerald-50 flex items-center justify-between text-left transition cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-emerald-700" />
                  <div>
                    <p className="font-bold text-slate-800 text-[11px]">Cliente: Dueño de Botica</p>
                    <p className="text-[10px] text-slate-500">Personaliza su botica, POS, stock e inventario</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-emerald-700 font-semibold">botica123</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('cajero@botica.pe', 'caja123')}
                className="w-full p-2.5 rounded-lg border border-slate-200 hover:border-blue-500 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-left transition cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="font-bold text-slate-800 text-[11px]">Cajero / Empleado</p>
                    <p className="text-[10px] text-slate-500">Solo dispensación en mostrador y ventas</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-blue-700 font-semibold">caja123</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
