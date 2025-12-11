import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { Product, Transaction, TransactionType, PaymentMethod, TransactionItem } from '../types';
import { Truck, Plus, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';

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
          total: (item.quantity + 1) * item.priceAtMoment // Note: In real app, purchase cost might differ
        } : item);
      }
      return [...prev, {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        priceAtMoment: product.cost, // Use Cost for PO
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
      const newTx: Transaction = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        type: TransactionType.PURCHASE,
        items: cart,
        totalAmount: cart.reduce((acc, i) => acc + i.total, 0),
        paymentMethod: PaymentMethod.CREDIT, // Usually POs are credit first
        counterparty: supplier,
        status: 'COMPLETED', // Simplified: auto-receive
        referenceNumber: `PO-${Date.now().toString().slice(-6)}`
      };

      await StorageService.createTransaction(newTx);
      
      setCart([]);
      setSupplier('');
      setProducts(StorageService.getProducts()); // Refresh stock display
      alert('Purchase Order berhasil dibuat dan stok diperbarui!');
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
          Siklus Pengeluaran (Pembelian)
        </h2>
        <p className="text-gray-600 mb-6">Buat pesanan pembelian ke pemasok untuk mengisi ulang stok.</p>
        
        {reorderSuggestions.length > 0 && (
          <div className="mb-6 bg-orange-50 border border-orange-200 p-4 rounded-lg">
            <h3 className="font-semibold text-orange-800 flex items-center gap-2 mb-2">
              <AlertTriangle size={18} />
              Saran Pembelian Otomatis (Stok Rendah)
            </h3>
            <div className="flex flex-wrap gap-2">
              {reorderSuggestions.map(p => (
                <div key={p.id} className="bg-white px-3 py-1 rounded border border-orange-200 text-sm flex items-center gap-2">
                  <span>{p.name} (Sisa: {p.stock})</span>
                  <button 
                    onClick={() => addToPO(p)}
                    className="text-blue-600 font-bold hover:underline"
                  >
                    + Tambah ke PO
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Produk</label>
              <select 
                className="w-full border-gray-300 rounded-md shadow-sm p-2 border"
                onChange={(e) => {
                  const p = products.find(prod => prod.id === e.target.value);
                  if (p) addToPO(p);
                  e.target.value = '';
                }}
              >
                <option value="">-- Pilih Produk untuk Ditambah --</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} (Biaya: Rp {p.cost.toLocaleString()})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Pemasok (Supplier)</label>
              <input 
                type="text" 
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder="PT. Sumber Makmur"
                className="w-full border-gray-300 rounded-md shadow-sm p-2 border"
              />
            </div>
          </div>

          {/* Cart Review */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-700 mb-3 border-b pb-2">Draft Purchase Order</h3>
            {cart.length === 0 ? (
              <p className="text-gray-400 text-sm italic">Belum ada item dalam PO.</p>
            ) : (
              <div className="space-y-3">
                {cart.map(item => (
                  <div key={item.productId} className="flex justify-between items-center bg-white p-2 rounded shadow-sm">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.productName}</p>
                      <p className="text-xs text-gray-500">@ Rp {item.priceAtMoment.toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <input 
                        type="number" 
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value))}
                        className="w-16 p-1 border rounded text-center text-sm"
                        min="1"
                      />
                      <button onClick={() => setCart(c => c.filter(x => x.productId !== item.productId))} className="text-red-500">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                
                <div className="pt-3 border-t flex justify-between items-center font-bold text-gray-800">
                  <span>Total Estimasi</span>
                  <span>Rp {cart.reduce((a, b) => a + b.total, 0).toLocaleString()}</span>
                </div>

                <button 
                  onClick={handleCreatePO}
                  disabled={loading || !supplier}
                  className="w-full mt-2 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition-colors flex justify-center items-center gap-2"
                >
                  {loading ? 'Memproses...' : <><CheckCircle size={16} /> Konfirmasi PO</>}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Purchasing;