import React, { useState, useEffect } from 'react';
import { Product } from '../../types/pharmacy';
import { usePharmacy } from '../../context/PharmacyContext';
import { X, Pill, Save, Plus } from 'lucide-react';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  productToEdit
}) => {
  const { addProduct, updateProduct } = usePharmacy();

  const [nombre, setNombre] = useState('');
  const [principioActivo, setPrincipioActivo] = useState('');
  const [presentacion, setPresentacion] = useState('');
  const [categoria, setCategoria] = useState('Analgésicos y Antipiréticos');
  const [laboratorio, setLaboratorio] = useState('');
  const [lote, setLote] = useState('');
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [precioCosto, setPrecioCosto] = useState<number>(0);
  const [precioVenta, setPrecioVenta] = useState<number>(0);
  const [stock, setStock] = useState<number>(10);
  const [stockMinimo, setStockMinimo] = useState<number>(5);
  const [requiereReceta, setRequiereReceta] = useState(false);
  const [ubicacion, setUbicacion] = useState('Anaquel A-1');

  useEffect(() => {
    if (productToEdit) {
      setNombre(productToEdit.nombre);
      setPrincipioActivo(productToEdit.principioActivo);
      setPresentacion(productToEdit.presentacion);
      setCategoria(productToEdit.categoria);
      setLaboratorio(productToEdit.laboratorio);
      setLote(productToEdit.lote);
      setFechaVencimiento(productToEdit.fechaVencimiento);
      setPrecioCosto(productToEdit.precioCosto);
      setPrecioVenta(productToEdit.precioVenta);
      setStock(productToEdit.stock);
      setStockMinimo(productToEdit.stockMinimo);
      setRequiereReceta(productToEdit.requiereReceta);
      setUbicacion(productToEdit.ubicacion);
    } else {
      // Default new product
      setNombre('');
      setPrincipioActivo('');
      setPresentacion('');
      setCategoria('Analgésicos y Antipiréticos');
      setLaboratorio('');
      setLote(`LT-${new Date().getFullYear()}${Math.floor(100 + Math.random() * 900)}`);
      
      const defaultExp = new Date();
      defaultExp.setFullYear(defaultExp.getFullYear() + 2);
      setFechaVencimiento(defaultExp.toISOString().split('T')[0]);

      setPrecioCosto(5.00);
      setPrecioVenta(9.50);
      setStock(20);
      setStockMinimo(5);
      setRequiereReceta(false);
      setUbicacion('Anaquel A-1');
    }
  }, [productToEdit, isOpen]);

  if (!isOpen) return null;

  const marginPercent =
    precioVenta > 0 && precioCosto > 0
      ? (((precioVenta - precioCosto) / precioVenta) * 100).toFixed(1)
      : '0';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombre.trim() || !lote.trim() || !fechaVencimiento) {
      alert('Por favor complete los campos obligatorios.');
      return;
    }

    if (productToEdit) {
      updateProduct(productToEdit.id, {
        nombre,
        principioActivo,
        presentacion,
        categoria,
        laboratorio,
        lote,
        fechaVencimiento,
        precioCosto: Number(precioCosto),
        precioVenta: Number(precioVenta),
        stock: Number(stock),
        stockMinimo: Number(stockMinimo),
        requiereReceta,
        ubicacion
      });
    } else {
      addProduct({
        codigo: '775' + Math.floor(1000000 + Math.random() * 9000000),
        nombre,
        principioActivo,
        presentacion,
        categoria,
        laboratorio: laboratorio || 'Genérico / Multimarcas',
        lote,
        fechaVencimiento,
        precioCosto: Number(precioCosto),
        precioVenta: Number(precioVenta),
        stock: Number(stock),
        stockMinimo: Number(stockMinimo),
        requiereReceta,
        ubicacion,
        estadoDisposicion: 'disponible'
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-emerald-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Pill className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm">
              {productToEdit ? 'Modificar Medicamento' : 'Nuevo Medicamento en Inventario'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-300 hover:text-white p-1 rounded-lg hover:bg-emerald-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-semibold mb-1">
                Nombre Comercial y Concentración *
              </label>
              <input
                type="text"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                placeholder="Ej: Paracetamol 500mg (Caja x 100)"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Principio Activo
              </label>
              <input
                type="text"
                value={principioActivo}
                onChange={e => setPrincipioActivo(e.target.value)}
                placeholder="Ej: Paracetamol / Acetaminofén"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Presentación / Empaque
              </label>
              <input
                type="text"
                value={presentacion}
                onChange={e => setPresentacion(e.target.value)}
                placeholder="Ej: Blíster x 10 tabletas"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Categoría Farmacéutica
              </label>
              <select
                value={categoria}
                onChange={e => setCategoria(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden cursor-pointer"
              >
                <option value="Analgésicos y Antipiréticos">Analgésicos y Antipiréticos</option>
                <option value="Antibióticos">Antibióticos</option>
                <option value="Antiinflamatorios">Antiinflamatorios</option>
                <option value="Antihistamínicos">Antihistamínicos</option>
                <option value="Gastroenterología">Gastroenterología</option>
                <option value="Antisépticos y Curación">Antisépticos y Curación</option>
                <option value="Vitaminas y Suplementos">Vitaminas y Suplementos</option>
                <option value="Neumología">Neumología</option>
                <option value="Corticoide y Antiinflamatorio">Corticoide y Antiinflamatorio</option>
                <option value="Cuidado Personal">Cuidado Personal</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Laboratorio / Marca
              </label>
              <input
                type="text"
                value={laboratorio}
                onChange={e => setLaboratorio(e.target.value)}
                placeholder="Ej: Farmindustria, Bago, Genfar, Portugal"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
            </div>

            {/* Lote y Vencimiento */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Número de Lote (Batch) *
                </label>
                <input
                  type="text"
                  value={lote}
                  onChange={e => setLote(e.target.value)}
                  placeholder="LT-8832A"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Fecha de Vencimiento *
                </label>
                <input
                  type="date"
                  value={fechaVencimiento}
                  onChange={e => setFechaVencimiento(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden font-medium"
                />
              </div>
            </div>

            {/* Precios y Margen */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Precio de Costo (S/)
              </label>
              <input
                type="number"
                step="0.05"
                min="0"
                value={precioCosto}
                onChange={e => setPrecioCosto(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Precio de Venta (S/)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  value={precioVenta}
                  onChange={e => setPrecioVenta(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden font-bold text-slate-800"
                />
                <span className="absolute right-2.5 top-2 text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                  Margen: {marginPercent}%
                </span>
              </div>
            </div>

            {/* Stock */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Stock Físico Actual
              </label>
              <input
                type="number"
                min="0"
                value={stock}
                onChange={e => setStock(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Stock Mínimo de Alerta
              </label>
              <input
                type="number"
                min="1"
                value={stockMinimo}
                onChange={e => setStockMinimo(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Ubicación en Botica
              </label>
              <input
                type="text"
                value={ubicacion}
                onChange={e => setUbicacion(e.target.value)}
                placeholder="Anaquel A-3, Gaveta 2, Refrigerador"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2 pt-5">
              <input
                type="checkbox"
                id="receta"
                checked={requiereReceta}
                onChange={e => setRequiereReceta(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
              />
              <label htmlFor="receta" className="text-xs text-slate-700 font-medium cursor-pointer">
                Exige Receta Médica Retenida / Simple (Rx)
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{productToEdit ? 'Guardar Cambios' : 'Registrar Fármaco'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
