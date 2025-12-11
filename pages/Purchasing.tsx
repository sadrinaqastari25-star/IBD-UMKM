import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { Product, Transaction, TransactionType, PaymentMethod, TransactionItem } from '../types';
import { Truck, Plus, Trash2, AlertTriangle, CheckCircle, FileText, ClipboardList } from 'lucide-react';

const Purchasing: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<TransactionItem[]>([]);
  const [supplier, setSupplier] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setProducts(StorageService.getProducts());
  }, []);

  const addToPO = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item => item.productId === product.id ? {
          ...item,
          quantity: item.quantity + 1,
          total: (item.quantity + 1) * item.priceAtMoment
        } : item);
      }
      return [...prev, {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        priceAtMoment: product.cost,
        total: product.cost
      }];
    });
  };

  const updateQuantity = (id: string, qty: number) => {
    if (qty < 1) return;
    setCart(prev => prev.map(item => item.productId === id ? {
      ...item,
      quantity: qty,
      total: qty * item.priceAtMoment
    } : item));
  };

  const handleCreatePO = async () => {
    if (cart.length === 0 || !supplier) return;
    setLoading(true);

    try {
      const poNumber = `PO-${Date.now().toString().slice(-6)}`;
      const newTx: Transaction = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        type: TransactionType.PURCHASE,
        items: cart,
        totalAmount: cart.reduce((acc, i) => acc + i.total, 0),
        paymentMethod: PaymentMethod.CREDIT,
        counterparty: supplier,
        status: 'COMPLETED',
        referenceNumber: poNumber
      };

      await StorageService.createTransaction(newTx);
      
      setCart([]);
      setSupplier('');
      setProducts(StorageService.getProducts());
      alert(`Permintaan Pembelian disetujui! Purchase Order (PO) #${poNumber} berhasil dibuat dan dikirim ke pemasok. Stok telah diperbarui.`);
    } catch (error) {
      console.error(error);
      alert('Gagal membuat pesanan pembelian.');
    } finally {
      setLoading(false);
    }
  };

  // Automated Reordering Suggestion logic
  const reorderSuggestions = products.filter(p => p.stock <= p.minStockLevel);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Truck className="text-blue-600" />
          Siklus Pengeluaran (Expenditure Cycle)
        </h2>
        <p className="text-gray-600 mb-6">Integrasi Manajemen Inventaris, Permintaan Pembelian (PR), dan Pesanan Pembelian (PO).</p>
        
        {reorderSuggestions.length > 0 && (
          <div className="mb-6 bg-orange-50 border border-orange-200 p-4 rounded-lg">
            <h3 className="font-semibold text-orange-800 flex items-center gap-2 mb-2">
              <AlertTriangle size={18} />
              Alert Inventaris (Re-order Point)
            </h3>
            <p className="text-sm text-orange-600 mb-3">Item berikut berada di bawah level stok minimum. Sistem menyarankan pembuatan Permintaan Pembelian.</p>
            <div className="flex flex-wrap gap-2">
              {reorderSuggestions.map(p => (
                <div key={p.id} className="bg-white px-3 py-1 rounded border border-orange-200 text-sm flex items-center gap-2 shadow-sm">
                  <span>{p.name} (Sisa: {p.stock})</span>
                  <button 
                    onClick={() => addToPO(p)}
                    className="text-blue-600 font-bold hover:underline"
                  >
                    + Buat PR
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Form */}
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 h-full">
                <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                    <ClipboardList size={18} />
                    Input Permintaan Pembelian
                </h4>
                <div className="space-y-4">
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Produk</label>
                    <select 
                        className="w-full border-gray-300 rounded-md shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500"
                        onChange={(e) => {
                        const p = products.find(prod => prod.id === e.target.value);
                        if (p) addToPO(p);
                        e.target.value = '';
                        }}
                    >
                        <option value="">-- Pilih Barang --</option>
                        {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} (HPP: Rp {p.cost.toLocaleString()})</option>
                        ))}
                    </select>
                    </div>

                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Vendor / Pemasok</label>
                    <input 
                        type="text" 
                        value={supplier}
                        onChange={(e) => setSupplier(e.target.value)}
                        placeholder="Contoh: PT. Sumber Makmur"
                        className="w-full border-gray-300 rounded-md shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500"
                    />
                    </div>
                </div>
            </div>
          </div>

          {/* Cart Review */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 flex flex-col h-full">
            <h3 className="font-semibold text-gray-700 mb-3 border-b border-gray-200 pb-2 flex items-center gap-2">
                <FileText size={18} />
                Draft Permintaan Pembelian (Purchase Requisition)
            </h3>
            {cart.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-gray-400 text-sm italic py-8">
                  Daftar permintaan kosong.
              </div>
            ) : (
              <div className="space-y-3 flex-1">
                {cart.map(item => (
                  <div key={item.productId} className="flex justify-between items-center bg-white p-2 rounded shadow-sm">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.productName}</p>
                      <p className="text-xs text-gray-500">Estimasi: Rp {item.priceAtMoment.toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <input 
                        type="number" 
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value))}
                        className="w-16 p-1 border rounded text-center text-sm"
                        min="1"
                      />
                      <button onClick={() => setCart(c => c.filter(x => x.productId !== item.productId))} className="text-red-500 hover:text-red-700">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                
                <div className="pt-3 border-t border-gray-200 mt-4">
                    <div className="flex justify-between items-center font-bold text-gray-800 mb-4">
                        <span>Total Estimasi</span>
                        <span>Rp {cart.reduce((a, b) => a + b.total, 0).toLocaleString()}</span>
                    </div>

                    <button 
                    onClick={handleCreatePO}
                    disabled={loading || !supplier}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition-colors flex justify-center items-center gap-2 font-medium"
                    >
                    {loading ? 'Memvalidasi...' : <><CheckCircle size={18} /> Validasi & Buat PO</>}
                    </button>
                    <p className="text-xs text-center text-gray-500 mt-2">
                        *Klik tombol ini untuk menyetujui Permintaan dan menerbitkan Purchase Order.
                    </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Purchasing;