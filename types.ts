export enum TransactionType {
  SALE = 'SALE',
  PURCHASE = 'PURCHASE'
}

export enum PaymentMethod {
  CASH = 'CASH',
  CREDIT = 'CREDIT' // Accounts Receivable or Payable
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  price: number; // Selling price
  cost: number; // Cost of goods sold
  stock: number;
  minStockLevel: number;
  unit: string;
}

export interface TransactionItem {
  productId: string;
  productName: string;
  quantity: number;
  priceAtMoment: number;
  total: number;
}

export interface Transaction {
  id: string;
  date: string;
  type: TransactionType;
  items: TransactionItem[];
  totalAmount: number;
  paymentMethod: PaymentMethod;
  counterparty: string; // Customer Name or Supplier Name
  status: 'COMPLETED' | 'PENDING';
  referenceNumber: string; // Invoice No or PO No
}

export interface AuditLog {
  id: string;
  timestamp: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  message: string;
  recommendation: string;
}

export interface FinancialSummary {
  revenue: number;
  expenses: number;
  profit: number;
  cashBalance: number;
  receivables: number;
  payables: number;
}