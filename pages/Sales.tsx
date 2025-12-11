import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { Product, Transaction, TransactionType, PaymentMethod, TransactionItem } from '../types';
import { Plus, ShoppingCart, Trash2, Printer } from 'lucide-react';

const Sales: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<TransactionItem[]>([]);
  const [customer, setCustomer] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [loading, setLoading] = useState(false);
  const [salesHistory, setSalesHistory] = useState<Transaction[]>([]);

  const refreshData = () => {
    setProducts(StorageService.getProducts());
    const allTx = StorageService.getTransactions();
    setSalesHistory(allTx.filter(t => t.type === TransactionType.SALE));
  };

  useEffect(() => {
    refreshData();
  }, []);

  const addToCart = (product: Product) => {
    if (product.stock <= 0) return;

    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev; // Limit to stock
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
        priceAtMoment: product.price,
        total: product.price
      }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.productId !== id));
  };

  const calculateTotal = () => cart.reduce((sum, item) => sum + item.total, 0);

  const handleCheckout = async () => {
    if (cart.length === 0 || !customer) return;
    setLoading(true);

    try {
      const newTx: Transaction = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        type: TransactionType.SALE,
        items: cart,
        totalAmount: calculateTotal(),
        paymentMethod,
        counterparty: customer,
        status: 'COMPLETED',
        referenceNumber: `INV-${Date.now().toString().slice(-6)}`
      };

      await StorageService.createTransaction(newTx);
      
      // Reset form
      setCart([]);
      setCustomer('');
      setPaymentMethod(PaymentMethod.CASH);
      refreshData();
      alert('Penjualan Berhasil Disimpan!');
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-100px)]">
      {/* Product Catalog */}
      <div className="lg:col-span-2 space-y-4 flex flex-col h-full">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Katalog Produk</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 overflow-y-auto max-h-[500px] p-1">
            {products.map(product => (
              <div 
                key={product.id} 
                onClick={() => addToCart(product)}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  product.stock === 0 
                  ? 'bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed' 
                  : 'bg-white border-gray-200 hover:border-blue-400 hover:shadow-md'
                }`}
              >
                <div className="flex justify-between items-start">
                  <h3 className="font-medium text-gray-900">{product.name}</h3>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">{product.sku}</span>
                </div>
                <div className="mt-3 flex justify-between items-end">
                  <div>
                    <p className="text-sm text-gray-500">Stok: {product.stock} {product.unit}</p>
                    <p className="text-lg font-bold text-blue-600">Rp {product.price.toLocaleString()}</p>
                  </div>
                  <button 
                    disabled={product.stock === 0}
                    className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 disabled:bg-gray-100"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Sales History */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex-1 overflow-hidden flex flex-col">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Riwayat Penjualan Terakhir</h2>
          <div className="overflow-y-auto flex-1">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-gray-500">No. Inv</th>
                  <th className="px-4 py-2 text-left text-gray-500">Tanggal</th>
                  <th className="px-4 py-2 text-left text-gray-500">Pelanggan</th>
                  <th className="px-4 py-2 text-right text-gray-500">Total</th>
                  <th className="px-4 py-2 text-center text-gray-500">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {salesHistory.slice(0, 10).map(tx => (
                  <tr key={tx.id}>
                    <td className="px-4 py-3 font-medium text-blue-600">{tx.referenceNumber}</td>
                    <td className="px-4 py-3">{new Date(tx.date).toLocaleDateString()}</td>
                    <td className="px-4 py-3">{tx.counterparty}</td>
                    <td className="px-4 py-3 text-right">Rp {tx.totalAmount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-center">
                      <button className="text-gray-400 hover:text-gray-600">
                        <Printer size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* POS Cart Sidebar */}
      <div className="lg:col-span-1 bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col h-full">
        <div className="p-4 border-b border-gray-100 bg-blue-600 text-white rounded-t-xl">
          <h2 className="flex items-center gap-2 font-semibold">
            <ShoppingCart size={20} />
            Keranjang Pesanan
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <ShoppingCart size={48} className="mb-2 opacity-50" />
              <p>Keranjang kosong</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.productId} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">{item.productName}</p>
                  <p className="text-sm text-gray-500">{item.quantity} x Rp {item.priceAtMoment.toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-700">Rp {item.total.toLocaleString()}</span>
                  <button 
                    onClick={() => removeFromCart(item.productId)}
                    className="text-red-400 hover:text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Pelanggan</label>
            <input 
              type="text" 
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              placeholder="Contoh: Budi Santoso"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Metode Pembayaran</label>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => setPaymentMethod(PaymentMethod.CASH)}
                className={`py-2 px-3 rounded text-sm font-medium border ${paymentMethod === PaymentMethod.CASH ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-gray-300 text-gray-600'}`}
              >
                Tunai (Cash)
              </button>
              <button 
                onClick={() => setPaymentMethod(PaymentMethod.CREDIT)}
                className={`py-2 px-3 rounded text-sm font-medium border ${paymentMethod === PaymentMethod.CREDIT ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-gray-300 text-gray-600'}`}
              >
                Kredit (Piutang)
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-600 font-medium">Total Tagihan</span>
              <span className="text-2xl font-bold text-gray-900">Rp {calculateTotal().toLocaleString()}</span>
            </div>
            <button 
              onClick={handleCheckout}
              disabled={loading || cart.length === 0 || !customer}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Memproses...' : 'Proses Penjualan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sales;