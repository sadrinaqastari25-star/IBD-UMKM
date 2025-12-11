import React, { useState } from 'react';
import { StorageService } from '../services/storage';
import { GeminiService } from '../services/gemini';
import { AuditLog } from '../types';
import { ShieldCheck, Loader2, AlertTriangle, Info, CheckCircle } from 'lucide-react';

const Audit: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastRun, setLastRun] = useState<string | null>(null);

  const runAudit = async () => {
    setLoading(true);
    try {
      const transactions = StorageService.getTransactions();
      const products = StorageService.getProducts();
      
      const results = await GeminiService.analyzeBusinessHealth(transactions, products);
      setLogs(results);
      setLastRun(new Date().toLocaleString());
    } catch (error) {
      console.error(error);
      alert('Gagal menjalankan audit AI.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <ShieldCheck size={32} />
              AI Internal Control
            </h1>
            <p className="mt-2 text-indigo-100 max-w-xl">
              Gunakan kecerdasan buatan untuk mendeteksi anomali transaksi, risiko fraud, 
              dan pelanggaran prosedur operasional standar (SOP) secara otomatis.
            </p>
          </div>
          <button
            onClick={runAudit}
            disabled={loading}
            className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-bold hover:bg-indigo-50 transition-colors shadow-lg flex items-center gap-2 disabled:opacity-75"
          >
            {loading ? <Loader2 className="animate-spin" /> : 'Jalankan Audit'}
          </button>
        </div>
        {lastRun && <p className="mt-4 text-xs text-indigo-200">Terakhir diperiksa: {lastRun}</p>}
      </div>

      <div className="space-y-4">
        {logs.length > 0 ? (
          logs.map((log) => (
            <div 
              key={log.id} 
              className={`p-6 rounded-xl border-l-4 shadow-sm bg-white animate-fade-in ${
                log.severity === 'HIGH' ? 'border-red-500' : 
                log.severity === 'MEDIUM' ? 'border-orange-500' : 'border-blue-500'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-full flex-shrink-0 ${
                   log.severity === 'HIGH' ? 'bg-red-100 text-red-600' : 
                   log.severity === 'MEDIUM' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                }`}>
                  {log.severity === 'HIGH' ? <AlertTriangle size={24} /> : <Info size={24} />}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-bold text-gray-800 text-lg">Deteksi: {log.message}</h3>
                    <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${
                      log.severity === 'HIGH' ? 'bg-red-100 text-red-700' : 
                      log.severity === 'MEDIUM' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {log.severity} Risk
                    </span>
                  </div>
                  <p className="text-gray-600 mt-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <span className="font-semibold text-gray-700">Rekomendasi Tindakan:</span> {log.recommendation}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
            {loading ? (
              <div className="flex flex-col items-center">
                <Loader2 size={48} className="animate-spin text-blue-500 mb-4" />
                <p className="text-gray-500">AI sedang menganalisis data transaksi...</p>
              </div>
            ) : (
              <>
                <CheckCircle size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">Klik "Jalankan Audit" untuk memulai pemeriksaan kesehatan bisnis.</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Audit;