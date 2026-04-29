import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { API_URL } from '../lib/api';
import { CheckCircle, XCircle } from 'lucide-react';

const VerifyCertificate = () => {
  const { code } = useParams();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/reports/verify/${code}`)
      .then(res => res.json())
      .then(data => setResult(data))
      .catch(_err => setResult({ message: 'Error de conexión' }))
      .finally(() => setLoading(false));
  }, [code]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-3xl shadow-xl p-8 text-center border border-slate-100 fade-in">
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="w-16 h-16 bg-istpet-blue/10 rounded-2xl flex items-center justify-center text-istpet-blue">
            <CheckCircle size={32} />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Verificación de Certificado</h1>
        <p className="text-slate-500 mb-8 font-mono text-sm">{code}</p>

        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-slate-200 rounded w-3/4 mx-auto"></div>
            <div className="h-4 bg-slate-200 rounded w-1/2 mx-auto"></div>
          </div>
        ) : result?.valid ? (
          <div className="space-y-6">
            <div className="bg-istpet-blue/10 text-istpet-blue p-4 rounded-2xl flex flex-col items-center gap-2">
              <CheckCircle size={48} className="text-istpet-gold" />
              <h2 className="text-xl font-bold">Certificado Válido</h2>
            </div>
            
            <div className="text-left space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-100">
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold">Participante</p>
                <p className="text-slate-800 font-medium">{result.certificate.user.firstName} {result.certificate.user.lastName}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold">Evento</p>
                <p className="text-slate-800 font-medium">{result.certificate.event.title}</p>
              </div>
              <div className="flex justify-between">
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold">Horas</p>
                  <p className="text-slate-800 font-medium">{result.certificate.hoursGranted} hrs</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold">Emisión</p>
                  <p className="text-slate-800 font-medium">{new Date(result.certificate.issuedAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-red-50 text-red-700 p-6 rounded-2xl flex flex-col items-center gap-3">
            <XCircle size={48} className="text-red-500" />
            <div>
              <h2 className="text-xl font-bold">Certificado Inválido</h2>
              <p className="text-sm opacity-80 mt-1">{result?.message || 'El código no existe en nuestra base de datos.'}</p>
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
          <Link to="/" className="text-istpet-blue font-medium hover:underline text-sm">
            Volver al Inicio
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyCertificate;
