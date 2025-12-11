import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, Product, AuditLog } from "../types";

// Safety check for process.env to prevent "ReferenceError: process is not defined" in browser
const getApiKey = () => {
  try {
    if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
      return process.env.API_KEY;
    }
  } catch (e) {
    // Ignore error if process is not defined
  }
  return '';
};

const apiKey = getApiKey();
const ai = new GoogleGenAI({ apiKey });

export const GeminiService = {
  analyzeBusinessHealth: async (
    transactions: Transaction[], 
    products: Product[]
  ): Promise<AuditLog[]> => {
    if (!apiKey) {
      console.warn("API Key missing for Gemini");
      return [{
        id: 'error-key',
        timestamp: new Date().toISOString(),
        severity: 'LOW',
        message: 'API Key belum dikonfigurasi.',
        recommendation: 'Aplikasi berjalan dalam mode demo offline. Konfigurasi API Key Google GenAI untuk mengaktifkan audit otomatis.'
      }];
    }

    const recentTransactions = transactions.slice(0, 30);
    
    // Prepare concise context
    const dataContext = JSON.stringify({
      recent_transactions: recentTransactions.map(t => ({
        date: t.date,
        type: t.type,
        total: t.totalAmount,
        method: t.paymentMethod,
        ref: t.referenceNumber,
        items: t.items.map(i => ({ name: i.productName, qty: i.quantity, price: i.priceAtMoment }))
      })),
      inventory_status: products.map(p => ({ 
        name: p.name, 
        current_stock: p.stock, 
        min_level: p.minStockLevel,
        cost: p.cost
      }))
    });

    // System Instruction tailored for IBD-UMKM Requirements
    const prompt = `
      Peran: Anda adalah "Auditor Internal Digital & Analis Bisnis" untuk aplikasi IBD-UMKM.
      Tujuan: Menganalisis data transaksi untuk "Kualitas Informasi" (Manajerial) dan "Kepatuhan" (Pengendalian Internal).

      Tugas Deteksi Anomali & Efisiensi:
      1. SIKLUS PENGELUARAN (Purchasing): 
         - Deteksi pembelian berlebih (Overstocking): Apakah ada pembelian barang yang stoknya masih jauh di atas minimum? (Inefisiensi Modal).
         - Deteksi harga tidak wajar: Apakah ada pembelian dengan harga yang mencurigakan dibanding HPP biasa?
         
      2. SIKLUS PENDAPATAN (Sales):
         - Deteksi Risiko Kredit: Penjualan kredit besar kepada satu pihak tanpa riwayat pelunasan (Risiko Piutang Tak Tertagih).
         - Pola Tidak Wajar: Transaksi berulang dalam waktu singkat (Split Transaction) untuk menghindari otorisasi.

      3. PENGENDALIAN INTERNAL (Fraud Detection):
         - Apakah ada indikasi manipulasi stok?
         - Apakah arus kas (Cash Flow) seimbang dengan aktivitas penjualan?

      Data Input (JSON):
      ${dataContext}
      
      Output Wajib (JSON Schema):
      Kembalikan array objek berisi temuan audit.
      Severity levels: 
      - 'HIGH' (Indikasi Fraud/Risiko Keuangan Besar), 
      - 'MEDIUM' (Inefisiensi Operasional), 
      - 'LOW' (Saran Peningkatan).
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                severity: { type: Type.STRING, enum: ['LOW', 'MEDIUM', 'HIGH'] },
                message: { type: Type.STRING, description: "Ringkasan temuan untuk manajemen" },
                recommendation: { type: Type.STRING, description: "Tindakan perbaikan spesifik" }
              },
              required: ['severity', 'message', 'recommendation']
            }
          }
        }
      });

      const rawText = response.text;
      if (!rawText) return [];

      const result = JSON.parse(rawText);
      
      return result.map((item: any, index: number) => ({
        id: `audit-${Date.now()}-${index}`,
        timestamp: new Date().toISOString(),
        severity: item.severity,
        message: item.message,
        recommendation: item.recommendation
      }));

    } catch (error) {
      console.error("Gemini Analysis Error:", error);
      return [{
        id: 'err-gen',
        timestamp: new Date().toISOString(),
        severity: 'MEDIUM',
        message: 'Gagal menganalisis pola transaksi saat ini.',
        recommendation: 'Pastikan koneksi internet stabil dan API Key valid.'
      }];
    }
  }
};