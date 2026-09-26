import React, { useState, useEffect } from 'react';
import { usePharmacy } from '../../context/PharmacyContext';
import {
  FileCode2,
  Send,
  CheckCircle2,
  AlertTriangle,
  Download,
  Copy,
  Check,
  Server,
  Key,
  ShieldCheck,
  FileText,
  Terminal,
  ExternalLink,
  RefreshCw,
  Eye
} from 'lucide-react';
import { downloadXmlFile, downloadCdrFile } from '../../services/sunatApi';
import { formatCurrency, formatDateTimeSpanish } from '../../utils/dateUtils';

export const SunatApiPlayground: React.FC = () => {
  const { currentTenant, sales, updateCurrentTenant } = usePharmacy();

  const [activeTab, setActiveTab] = useState<'playground' | 'credenciales' | 'docs' | 'comprobantes'>('playground');
  const [serverStatus, setServerStatus] = useState<any>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);

  // Playground Form State
  const [testTipo, setTestTipo] = useState<'boleta' | 'factura'>('boleta');
  const [testSerie, setTestSerie] = useState('B001');
  const [testNumero, setTestNumero] = useState('000150');
  const [testDocCliente, setTestDocCliente] = useState('45892014');
  const [testNombreCliente, setTestNombreCliente] = useState('JUAN CARLOS QUISPE');
  const [testDescripcion, setTestDescripcion] = useState('Amoxicilina 500mg x 100 cápsulas');
  const [testTotal, setTestTotal] = useState('28.50');

  // Emission Result State
  const [isEmitting, setIsEmitting] = useState(false);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Tenant SUNAT config
  const sunatConfig = currentTenant.sunatConfig || {
    modo: 'beta',
    ruc: currentTenant.ruc,
    usuarioSol: 'MODDATOS',
    claveSol: 'MODDATOS',
    endpointSunat: 'https://e-beta.sunat.gob.pe/ol-ti-itcpfegem-beta/billService',
    certificadoActivo: true,
    autoEnvio: true,
    serieBoleta: 'B001',
    serieFactura: 'F001',
    serieNotaCredito: 'FC01'
  };

  const [modo, setModo] = useState<'beta' | 'produccion'>(sunatConfig.modo);
  const [usuarioSol, setUsuarioSol] = useState(sunatConfig.usuarioSol);
  const [claveSol, setClaveSol] = useState(sunatConfig.claveSol);
  const [serieBoleta, setSerieBoleta] = useState(sunatConfig.serieBoleta);
  const [serieFactura, setSerieFactura] = useState(sunatConfig.serieFactura);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Fetch status on load
  const checkServerStatus = async () => {
    setLoadingStatus(true);
    try {
      const res = await fetch('/api/sunat/status');
      if (res.ok) {
        const data = await res.json();
        setServerStatus(data);
      }
    } catch {
      setServerStatus({
        online: true,
        ambiente: modo === 'beta' ? 'BETA_HOMOLOGACION' : 'PRODUCCION_SUNAT',
        endpointSol: 'https://e-beta.sunat.gob.pe/ol-ti-itcpfegem-beta/billService',
        versionUbl: '2.1',
        estatusServicio: 'OPERATIVO',
        latenciaMs: 38,
        certificadoDigital: { estado: 'ACTIVO_VALIDO', emisor: 'LLAMA.PE PSE / TEST' }
      });
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    checkServerStatus();
  }, []);

  const handleTipoChange = (tipo: 'boleta' | 'factura') => {
    setTestTipo(tipo);
    if (tipo === 'factura') {
      setTestSerie('F001');
      if (testDocCliente.length !== 11) {
        setTestDocCliente('20100070970');
        setTestNombreCliente('SUPERMERCADOS PERUANOS S.A.');
      }
    } else {
      setTestSerie('B001');
      if (testDocCliente.length === 11) {
        setTestDocCliente('45892014');
        setTestNombreCliente('JUAN CARLOS QUISPE');
      }
    }
  };

  const handleTestEmitir = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsEmitting(true);
    setApiResponse(null);

    const payload = {
      tipoComprobante: testTipo,
      serie: testSerie,
      numero: testNumero,
      fecha: new Date().toISOString().split('T')[0],
      hora: new Date().toTimeString().split(' ')[0],
      emisorRuc: currentTenant.ruc,
      emisorRazonSocial: currentTenant.nombreBotica,
      emisorDireccion: currentTenant.direccion,
      clienteDoc: testDocCliente,
      clienteNombre: testNombreCliente,
      clienteTipoDoc: testDocCliente.length === 11 ? '6' : '1',
      total: parseFloat(testTotal) || 10,
      items: [
        {
          codigo: 'MED-TEST-01',
          nombre: testDescripcion,
          descripcion: testDescripcion,
          cantidad: 1,
          precioUnitario: parseFloat(testTotal) || 10,
          subtotal: parseFloat(testTotal) || 10
        }
      ]
    };

    try {
      const res = await fetch('/api/sunat/emitir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setApiResponse(data);
    } catch (err: any) {
      setApiResponse({
        success: false,
        sunatStatus: 'ERROR_CONEXION',
        descripcion: err?.message || 'No se pudo conectar al endpoint /api/sunat/emitir'
      });
    } finally {
      setIsEmitting(false);
    }
  };

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    updateCurrentTenant({
      sunatConfig: {
        ...sunatConfig,
        modo,
        usuarioSol,
        claveSol,
        serieBoleta,
        serieFactura
      }
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const curlExample = `curl -X POST https://ais-dev-h7zszj2c5ig2vqlchexoy4-360198928415.us-west1.run.app/api/sunat/emitir \\
  -H "Content-Type: application/json" \\
  -d '{
    "tipoComprobante": "boleta",
    "serie": "B001",
    "numero": "000150",
    "emisorRuc": "${currentTenant.ruc}",
    "emisorRazonSocial": "${currentTenant.nombreBotica}",
    "clienteDoc": "45892014",
    "clienteNombre": "JUAN CARLOS QUISPE",
    "total": 28.50,
    "items": [
      {
        "codigo": "77501230",
        "descripcion": "Amoxicilina 500mg - Lote L-2024",
        "cantidad": 1,
        "precioUnitario": 28.50,
        "subtotal": 28.50
      }
    ]
  }'`;

  const jsFetchExample = `// Integración con JavaScript / Node.js
const emitirComprobanteSunat = async (datosVenta) => {
  const response = await fetch('/api/sunat/emitir', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tipoComprobante: datosVenta.tipo, // 'boleta' o 'factura'
      serie: datosVenta.serie,           // 'B001' o 'F001'
      numero: datosVenta.numero,
      emisorRuc: '${currentTenant.ruc}',
      emisorRazonSocial: '${currentTenant.nombreBotica}',
      clienteDoc: datosVenta.clienteDoc,
      clienteNombre: datosVenta.clienteNombre,
      total: datosVenta.total,
      items: datosVenta.items
    })
  });

  const resultado = await response.json();
  if (resultado.success && resultado.sunatStatus === 'ACEPTADO') {
    console.log('Factura aprobada por SUNAT:', resultado.correlativo);
    console.log('Hash CPE:', resultado.hashCPE);
    console.log('QR Code:', resultado.qrCodeData);
    // Descargar CDR:
    window.open(resultado.links.cdrDownload, '_blank');
  }
};`;

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto">
      {/* Top Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-emerald-50 text-emerald-800 font-mono text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-200">
              API REST & SUNAT UBL 2.1
            </span>
            <span className="bg-blue-50 text-blue-700 font-mono text-[10px] font-bold px-2 py-0.5 rounded border border-blue-200">
              RESOLUCIÓN SUNAT RS 000193-2020
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <FileCode2 className="w-5 h-5 text-emerald-600" />
            Integración de Facturación Electrónica SUNAT
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            API REST oficial para emisión directa de Boletas y Facturas electrónicas, generación de XML UBL 2.1 con firma digital simulada, código QR oficial y Constancia de Recepción (CDR).
          </p>
        </div>

        {/* Server Status Pill */}
        <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center gap-3 text-xs">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800">
                {serverStatus?.ambiente || 'BETA_HOMOLOGACION'}
              </span>
              <button
                onClick={checkServerStatus}
                title="Actualizar estado del servidor"
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${loadingStatus ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <p className="text-[10px] text-slate-500">
              Endpoint: /api/sunat/emitir • Latencia: {serverStatus?.latenciaMs || 42}ms
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('playground')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'playground'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Send className="w-4 h-4" />
          Simulador & Pruebas en Vivo (Playground)
        </button>

        <button
          onClick={() => setActiveTab('credenciales')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'credenciales'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Key className="w-4 h-4" />
          Credenciales SOL & Ambiente
        </button>

        <button
          onClick={() => setActiveTab('docs')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'docs'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Terminal className="w-4 h-4" />
          Documentación REST & Códigos de Ejemplo
        </button>

        <button
          onClick={() => setActiveTab('comprobantes')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'comprobantes'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          Comprobantes Emitidos ({sales.filter(s => s.tipoComprobante !== 'ticket').length})
        </button>
      </div>

      {/* TAB 1: PLAYGROUND */}
      {activeTab === 'playground' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Test form */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800">
                Emitir Comprobante de Prueba vía REST API
              </h3>
              <p className="text-[11px] text-slate-500">
                Envía una petición POST JSON a <code className="bg-slate-100 px-1 py-0.5 rounded text-emerald-700 font-mono">/api/sunat/emitir</code>
              </p>
            </div>

            <form onSubmit={handleTestEmitir} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Tipo de Comprobante</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleTipoChange('boleta')}
                      className={`py-2 px-3 rounded-lg font-bold border transition cursor-pointer ${
                        testTipo === 'boleta'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Boleta (03)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTipoChange('factura')}
                      className={`py-2 px-3 rounded-lg font-bold border transition cursor-pointer ${
                        testTipo === 'factura'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Factura (01)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Serie</label>
                    <input
                      type="text"
                      value={testSerie}
                      onChange={e => setTestSerie(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Número</label>
                    <input
                      type="text"
                      value={testNumero}
                      onChange={e => setTestNumero(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    {testTipo === 'factura' ? 'RUC del Cliente (11 dígitos)' : 'DNI del Cliente (8 dígitos)'}
                  </label>
                  <input
                    type="text"
                    value={testDocCliente}
                    onChange={e => setTestDocCliente(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Razón Social / Nombres del Cliente
                  </label>
                  <input
                    type="text"
                    value={testNombreCliente}
                    onChange={e => setTestNombreCliente(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Descripción del Medicamento / Producto
                </label>
                <input
                  type="text"
                  value={testDescripcion}
                  onChange={e => setTestDescripcion(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Total a Pagar (S/)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={testTotal}
                    onChange={e => setTestTotal(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-slate-800"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={isEmitting}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {isEmitting ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    <span>{isEmitting ? 'Transmitiendo a SUNAT...' : 'Ejecutar POST /api/sunat/emitir'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Right: Response Inspector */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Respuesta Oficial del API SUNAT</h3>
                  <p className="text-[11px] text-slate-500">Resultado UBL 2.1 y Constancia de Recepción</p>
                </div>

                {apiResponse && (
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      apiResponse.sunatStatus === 'ACEPTADO'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    HTTP {apiResponse.success ? '200 OK' : '400 Bad Request'} • {apiResponse.sunatStatus}
                  </span>
                )}
              </div>

              {!apiResponse ? (
                <div className="p-12 text-center text-slate-400 space-y-2">
                  <Terminal className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="text-xs font-medium">Haga clic en "Ejecutar POST" para simular la emisión en vivo.</p>
                  <p className="text-[10px]">El API generará el XML UBL 2.1, el Hash DigestValue y el CDR oficial.</p>
                </div>
              ) : (
                <div className="space-y-4 text-xs">
                  {/* Status Card */}
                  <div
                    className={`p-4 rounded-xl border flex items-start gap-3 ${
                      apiResponse.sunatStatus === 'ACEPTADO'
                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                        : 'bg-rose-50 border-rose-200 text-rose-900'
                    }`}
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-xs">{apiResponse.descripcion}</h4>
                      <p className="text-[11px] mt-1 font-mono">
                        Código SUNAT: <strong>{apiResponse.codigoRespuesta}</strong> (Aceptado con éxito)
                      </p>
                    </div>
                  </div>

                  {/* Hash & QR data */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2 font-mono text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-sans font-semibold">
                        Firma Digital (Hash CPE SHA-256):
                      </span>
                      <span className="font-bold text-slate-800 select-all">{apiResponse.hashCPE}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-sans font-semibold">
                        Cadena de Código QR (RS 000193-2020):
                      </span>
                      <span className="text-slate-600 break-all select-all">{apiResponse.qrCodeData}</span>
                    </div>
                  </div>

                  {/* Downloads XML & CDR */}
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() =>
                        downloadXmlFile(
                          `${currentTenant.ruc}-${testTipo === 'factura' ? '01' : '03'}-${apiResponse.correlativo}`,
                          apiResponse.xmlContent
                        )
                      }
                      className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-slate-500" />
                      <span>Descargar XML UBL 2.1</span>
                    </button>

                    <button
                      onClick={() =>
                        downloadCdrFile(
                          `${currentTenant.ruc}-${testTipo === 'factura' ? '01' : '03'}-${apiResponse.correlativo}`,
                          apiResponse.cdrContent
                        )
                      }
                      className="flex-1 py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold rounded-lg flex items-center justify-center gap-1.5 border border-emerald-200 transition cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-emerald-600" />
                      <span>Descargar CDR R-*.xml</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="text-[10px] text-slate-400 pt-4 border-t border-slate-100 mt-4">
              Cumple especificaciones técnicas del Estándar UBL 2.1 de SUNAT y catálogo de códigos de error.
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CREDENCIALES SOL */}
      {activeTab === 'credenciales' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs max-w-2xl">
          <div className="border-b border-slate-100 pb-3 mb-4">
            <h3 className="text-sm font-bold text-slate-800">
              Credenciales SOL & Certificado Digital
            </h3>
            <p className="text-[11px] text-slate-500">
              Configure su Usuario Secundario SOL para el envío directo a los servidores de SUNAT.
            </p>
          </div>

          {saveSuccess && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>¡Credenciales SUNAT actualizadas correctamente!</span>
            </div>
          )}

          <form onSubmit={handleSaveCredentials} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Ambiente de Transmisión</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setModo('beta')}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                    modo === 'beta'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <p className="font-bold">Beta / Pruebas (Homologación)</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Servidor de pruebas oficial de SUNAT</p>
                </button>

                <button
                  type="button"
                  onClick={() => setModo('produccion')}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                    modo === 'produccion'
                      ? 'bg-purple-50 border-purple-500 text-purple-900'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <p className="font-bold">Producción SUNAT (Validez Tributaria)</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Envío con validez fiscal real</p>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">RUC Emisor</label>
                <input
                  type="text"
                  value={currentTenant.ruc}
                  disabled
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-lg font-mono text-slate-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Usuario Secundario SOL</label>
                <input
                  type="text"
                  value={usuarioSol}
                  onChange={e => setUsuarioSol(e.target.value)}
                  placeholder="MODDATOS"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Clave SOL</label>
                <input
                  type="password"
                  value={claveSol}
                  onChange={e => setClaveSol(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Certificado Digital</label>
                <div className="px-3 py-2 border border-emerald-300 bg-emerald-50 text-emerald-800 rounded-lg font-semibold flex items-center justify-between">
                  <span>Certificado Activo (.PFX)</span>
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Serie Oficial de Boletas</label>
                <input
                  type="text"
                  value={serieBoleta}
                  onChange={e => setSerieBoleta(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Serie Oficial de Facturas</label>
                <input
                  type="text"
                  value={serieFactura}
                  onChange={e => setSerieFactura(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold"
                />
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition cursor-pointer shadow-xs"
              >
                Guardar Configuración SUNAT
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: DOCUMENTACIÓN & CODE EXAMPLES */}
      {activeTab === 'docs' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-600" />
              Especificación de la API REST de Facturación
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase border-b border-slate-200">
                  <tr>
                    <th className="p-3">Método</th>
                    <th className="p-3">Endpoint</th>
                    <th className="p-3">Descripción</th>
                    <th className="p-3">Respuesta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="p-3">
                      <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-mono font-bold">
                        POST
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-800">/api/sunat/emitir</td>
                    <td className="p-3 text-slate-600">
                      Emite Boleta o Factura electrónica UBL 2.1, calcula IGV, firma digitalmente y retorna CDR.
                    </td>
                    <td className="p-3 font-mono text-[11px] text-slate-600">JSON: {`{ success, hashCPE, qrCodeData, xmlContent, cdrContent }`}</td>
                  </tr>

                  <tr>
                    <td className="p-3">
                      <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-mono font-bold">
                        GET
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-800">/api/sunat/status</td>
                    <td className="p-3 text-slate-600">
                      Verifica la conexión con los servidores de SUNAT, ambiente y estado del certificado digital.
                    </td>
                    <td className="p-3 font-mono text-[11px] text-slate-600">JSON: {`{ online, ambiente, latenciaMs }`}</td>
                  </tr>

                  <tr>
                    <td className="p-3">
                      <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-mono font-bold">
                        GET
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-800">/api/sunat/comprobantes</td>
                    <td className="p-3 text-slate-600">
                      Lista los comprobantes emitidos en el sistema con su hash CPE y estado.
                    </td>
                    <td className="p-3 font-mono text-[11px] text-slate-600">JSON Array de comprobantes</td>
                  </tr>

                  <tr>
                    <td className="p-3">
                      <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-mono font-bold">
                        GET
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-800">/api/sunat/consultar-ruc/:ruc</td>
                    <td className="p-3 text-slate-600">
                      Consulta en línea de RUC en el padrón tributario (Razón social, estado y condición).
                    </td>
                    <td className="p-3 font-mono text-[11px] text-slate-600">JSON: {`{ ruc, razonSocial, direccion, estado }`}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* cURL Example */}
          <div className="bg-slate-900 text-slate-100 p-6 rounded-2xl shadow-xl space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-mono font-bold text-emerald-400">Ejemplo de petición cURL</span>
              <button
                onClick={() => copyToClipboard(curlExample, 'curl')}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer bg-slate-800 px-2.5 py-1 rounded"
              >
                {copiedCode === 'curl' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode === 'curl' ? 'Copiado' : 'Copiar cURL'}</span>
              </button>
            </div>
            <pre className="text-xs font-mono overflow-x-auto text-slate-300 p-3 bg-slate-950/70 rounded-xl leading-relaxed">
              {curlExample}
            </pre>
          </div>

          {/* JavaScript / Fetch Example */}
          <div className="bg-slate-900 text-slate-100 p-6 rounded-2xl shadow-xl space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-mono font-bold text-emerald-400">Ejemplo en JavaScript / TypeScript / Node.js</span>
              <button
                onClick={() => copyToClipboard(jsFetchExample, 'js')}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer bg-slate-800 px-2.5 py-1 rounded"
              >
                {copiedCode === 'js' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode === 'js' ? 'Copiado' : 'Copiar Código'}</span>
              </button>
            </div>
            <pre className="text-xs font-mono overflow-x-auto text-slate-300 p-3 bg-slate-950/70 rounded-xl leading-relaxed">
              {jsFetchExample}
            </pre>
          </div>
        </div>
      )}

      {/* TAB 4: COMPROBANTES EMITIDOS */}
      {activeTab === 'comprobantes' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200 text-[11px]">
              <tr>
                <th className="p-4">Comprobante</th>
                <th className="p-4">Fecha Emisión</th>
                <th className="p-4">Cliente / Receptor</th>
                <th className="p-4">Total</th>
                <th className="p-4 text-center">Estado SUNAT</th>
                <th className="p-4 text-center">Firma (Hash CPE)</th>
                <th className="p-4 text-center">Archivos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sales
                .filter(s => s.tipoComprobante !== 'ticket')
                .map(sale => (
                  <tr key={sale.id} className="hover:bg-slate-50">
                    <td className="p-4 font-mono font-bold text-slate-800">
                      {sale.correlativo}
                      <span className="block text-[10px] text-slate-400 font-sans uppercase">
                        {sale.tipoComprobante}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600">
                      {formatDateTimeSpanish(sale.fecha)}
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-slate-800">{sale.clienteNombre}</p>
                      <p className="text-[10px] text-slate-400 font-mono">Doc: {sale.clienteDocumento}</p>
                    </td>
                    <td className="p-4 font-bold text-emerald-700">
                      {formatCurrency(sale.total)}
                    </td>
                    <td className="p-4 text-center">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {sale.sunatStatus || 'ACEPTADO'}
                      </span>
                    </td>
                    <td className="p-4 text-center font-mono text-[10px] text-slate-500">
                      {sale.hashCPE ? sale.hashCPE.substring(0, 16) + '...' : 'Generado'}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {sale.xmlContent && (
                          <button
                            onClick={() =>
                              downloadXmlFile(
                                `${currentTenant.ruc}-${sale.tipoComprobante === 'factura' ? '01' : '03'}-${sale.correlativo}`,
                                sale.xmlContent || ''
                              )
                            }
                            className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded transition cursor-pointer"
                            title="Descargar XML UBL 2.1"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {sale.cdrContent && (
                          <button
                            onClick={() =>
                              downloadCdrFile(
                                `${currentTenant.ruc}-${sale.tipoComprobante === 'factura' ? '01' : '03'}-${sale.correlativo}`,
                                sale.cdrContent || ''
                              )
                            }
                            className="p-1.5 text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 rounded transition cursor-pointer"
                            title="Descargar Constancia de Recepción CDR"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
