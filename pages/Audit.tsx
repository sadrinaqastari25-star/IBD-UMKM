import React, { useState } from 'react';
import { StorageService } from '../services/storage';
import { GeminiService } from '../services/gemini';
import { AuditLog } from '../types';
import { ShieldCheck, Loader2, AlertTriangle, Info, CheckCircle, BrainCircuit } from 'lucide-react';

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
      <div className="bg-gradient-to-r from-indigo-700 to-blue-600 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <BrainCircuit size={32} />
              IBD-UMKM: Auditor Digital
            </h1>
            <p className="mt-2 text-indigo-100 max-w-xl text-lg">
              Analisis Data & Deteksi Anomali
            </p>
            <p className="mt-1 text-sm text-indigo-200">
              Membantu pengambilan keputusan manajerial dengan mendeteksi pola tidak wajar, 
              potensi fraud, dan inefisiensi dalam siklus bisnis.
            </p>
          </div>
          <button
            onClick={runAudit}
            disabled={loading}
            className="bg-white text-indigo-700 px-6 py-3 rounded-lg font-bold hover:bg-indigo-50 transition-colors shadow-lg flex items-center gap-2 disabled:opacity-75"
          >
            {loading ? <Loader2 className="animate-spin" /> : 'Mulai Audit & Analisis'}
          </button>
        </div>
        {lastRun && <p className="mt-4 text-xs text-indigo-300 font-mono">Laporan dihasilkan: {lastRun}</p>}
      </div>

      <div className="space-y-4">
        {logs.length > 0 ? (
          <>
            <h3 className="text-lg font-bold text-gray-800 ml-1">Laporan Temuan & Rekomendasi</h3>
            {logs.map((log) => (
              <div 
                key={log.id} 
                className={`p-6 rounded-xl border-l-4 shadow-sm bg-white animate-fade-in ${
                  log.severity === 'HIGH' ? 'border-red-600 ring-1 ring-red-100' : 
                  log.severity === 'MEDIUM' ? 'border-orange-500 ring-1 ring-orange-100' : 'border-blue-500'
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
                      <h3 className="font-bold text-gray-800 text-lg">{log.message}</h3>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                        log.severity === 'HIGH' ? 'bg-red-100 text-red-700' : 
                        log.severity === 'MEDIUM' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {log.severity === 'HIGH' ? 'CRITICAL ALERT' : log.severity === 'MEDIUM' ? 'WARNING' : 'ADVICE'}
                      </span>
                    </div>
                    <p className="text-gray-600 mt-3 text-sm">
                      <span className="font-semibold text-gray-800 block mb-1">Rekomendasi Tindakan (Pengendalian Internal):</span> 
                      {log.recommendation}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
            {loading ? (
              <div className="flex flex-col items-center">
                <Loader2 size={48} className="animate-spin text-blue-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-800">Sedang Menganalisis Data...</h3>
                <p className="text-gray-500 max-w-sm mx-auto mt-2">
                  AI sedang memeriksa integritas data transaksi, efisiensi stok, dan potensi anomali keuangan.
                </p>
              </div>
            ) : (
              <>
                <ShieldCheck size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-800">Siap Melakukan Pemeriksaan</h3>
                <p className="text-gray-500 mt-2">Klik tombol di atas untuk memulai audit sistem.</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Audit;