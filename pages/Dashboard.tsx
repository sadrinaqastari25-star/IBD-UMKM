import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { StorageService } from '../services/storage';
import { Transaction, TransactionType } from '../types';
import { TrendingUp, TrendingDown, DollarSign, AlertCircle } from 'lucide-react';

const Dashboard: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState({ revenue: 0, expenses: 0, receivables: 0, payables: 0 });

  useEffect(() => {
    const data = StorageService.getTransactions();
    const fin = StorageService.getFinancialSummary();
    setTransactions(data);
    setSummary(fin);
  }, []);

  // Prepare data for chart (Last 7 transactions simplified)
  const chartData = transactions.slice(0, 10).reverse().map(t => ({
    name: t.date.split('T')[0], // Simplified date
    amount: t.totalAmount,
    type: t.type === TransactionType.SALE ? 'Pendapatan' : 'Pengeluaran'
  }));

  const profit = summary.revenue - summary.expenses;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Pendapatan</p>
              <h3 className="text-2xl font-bold text-gray-800 mt-2">Rp {summary.revenue.toLocaleString()}</h3>
            </div>
            <div className="p-2 bg-green-50 rounded-lg text-green-600">
              <TrendingUp size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Pengeluaran</p>
              <h3 className="text-2xl font-bold text-gray-800 mt-2">Rp {summary.expenses.toLocaleString()}</h3>
            </div>
            <div className="p-2 bg-red-50 rounded-lg text-red-600">
              <TrendingDown size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Laba Bersih</p>
              <h3 className={`text-2xl font-bold mt-2 ${profit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                Rp {profit.toLocaleString()}
              </h3>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <DollarSign size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Piutang (Receivables)</p>
              <h3 className="text-2xl font-bold text-gray-800 mt-2">Rp {summary.receivables.toLocaleString()}</h3>
            </div>
            <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
              <AlertCircle size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-80">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Tren Transaksi Terakhir</h4>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" hide />
              <YAxis />
              <Tooltip formatter={(value) => `Rp ${Number(value).toLocaleString()}`} />
              <Bar dataKey="amount" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
           <h4 className="text-lg font-semibold text-gray-800 mb-4">Aktivitas Terkini</h4>
           <div className="space-y-4 overflow-y-auto h-60">
             {transactions.length === 0 ? (
               <p className="text-gray-400 text-center py-4">Belum ada transaksi.</p>
             ) : (
               transactions.slice(0, 5).map((t) => (
                 <div key={t.id} className="flex items-center justify-between border-b border-gray-50 pb-3 last:border-0">
                   <div>
                     <p className="font-medium text-gray-800">
                       {t.type === TransactionType.SALE ? 'Penjualan' : 'Pembelian'} #{t.referenceNumber}
                     </p>
                     <p className="text-xs text-gray-500">{t.date.split('T')[0]} • {t.counterparty}</p>
                   </div>
                   <span className={`text-sm font-semibold ${t.type === TransactionType.SALE ? 'text-green-600' : 'text-red-600'}`}>
                     {t.type === TransactionType.SALE ? '+' : '-'} Rp {t.totalAmount.toLocaleString()}
                   </span>
                 </div>
               ))
             )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;