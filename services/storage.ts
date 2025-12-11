import { Product, Transaction, TransactionType, PaymentMethod } from '../types';

// Initial Mock Data
const INITIAL_PRODUCTS: Product[] = [
  { id: '1', name: 'Kopi Arabika Premium', sku: 'COF-001', price: 75000, cost: 45000, stock: 50, minStockLevel: 10, unit: 'kg' },
  { id: '2', name: 'Gula Aren Organik', sku: 'SGR-002', price: 25000, cost: 15000, stock: 100, minStockLevel: 20, unit: 'pack' },
  { id: '3', name: 'Paper Cup 12oz', sku: 'PC-003', price: 1000, cost: 500, stock: 500, minStockLevel: 100, unit: 'pcs' },
  { id: '4', name: 'Susu UHT Full Cream', sku: 'MLK-004', price: 18000, cost: 14000, stock: 5, minStockLevel: 12, unit: 'liter' },
];

const INITIAL_TRANSACTIONS: Transaction[] = [];

const KEYS = {
  PRODUCTS: 'ibd_products',
  TRANSACTIONS: 'ibd_transactions',
};

// Helper to simulate delay for realism
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const StorageService = {
  getProducts: (): Product[] => {
    const stored = localStorage.getItem(KEYS.PRODUCTS);
    if (!stored) {
      localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
      return INITIAL_PRODUCTS;
    }
    return JSON.parse(stored);
  },

  saveProduct: (product: Product) => {
    const products = StorageService.getProducts();
    const index = products.findIndex(p => p.id === product.id);
    if (index >= 0) {
      products[index] = product;
    } else {
      products.push(product);
    }
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
  },

  getTransactions: (): Transaction[] => {
    const stored = localStorage.getItem(KEYS.TRANSACTIONS);
    if (!stored) return INITIAL_TRANSACTIONS;
    return JSON.parse(stored);
  },

  // Core Logic: Integrating Sales/Purchase with Inventory
  createTransaction: async (transaction: Transaction): Promise<boolean> => {
    await delay(300); // Simulate API call
    
    const transactions = StorageService.getTransactions();
    const products = StorageService.getProducts();

    // Validate Stock for Sales
    if (transaction.type === TransactionType.SALE) {
      for (const item of transaction.items) {
        const product = products.find(p => p.id === item.productId);
        if (!product || product.stock < item.quantity) {
          throw new Error(`Stok tidak cukup untuk ${item.productName}`);
        }
      }
    }

    // Update Inventory
    const updatedProducts = products.map(p => {
      const item = transaction.items.find(i => i.productId === p.id);
      if (item) {
        return {
          ...p,
          stock: transaction.type === TransactionType.SALE 
            ? p.stock - item.quantity 
            : p.stock + item.quantity
        };
      }
      return p;
    });

    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(updatedProducts));
    
    // Save Transaction
    transactions.unshift(transaction); // Newest first
    localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(transactions));
    
    return true;
  },

  getFinancialSummary: (): { revenue: number; expenses: number; receivables: number; payables: number } => {
    const transactions = StorageService.getTransactions();
    
    return transactions.reduce((acc, curr) => {
      if (curr.type === TransactionType.SALE) {
        acc.revenue += curr.totalAmount;
        if (curr.paymentMethod === PaymentMethod.CREDIT) {
          acc.receivables += curr.totalAmount;
        }
      } else {
        acc.expenses += curr.totalAmount;
        if (curr.paymentMethod === PaymentMethod.CREDIT) {
          acc.payables += curr.totalAmount;
        }
      }
      return acc;
    }, { revenue: 0, expenses: 0, receivables: 0, payables: 0 });
  }
};