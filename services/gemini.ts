import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, Product, AuditLog } from "../types";

const apiKey = process.env.API_KEY || ''; // Ensure this is set in your environment
const ai = new GoogleGenAI({ apiKey });

export const GeminiService = {
  analyzeBusinessHealth: async (
    transactions: Transaction[], 
    products: Product[]
  ): Promise<AuditLog[]> => {
    if (!apiKey) {
      console.warn("API Key missing for Gemini");
      return [{
        id: 'error',
        timestamp: new Date().toISOString(),
        severity: 'LOW',
        message: 'API Key belum dikonfigurasi. Fitur AI tidak aktif.',
        recommendation: 'Tambahkan API Key di pengaturan environment.'
      }];
    }

    const recentTransactions = transactions.slice(0, 15); // Analyze last 15 for brevity
    
    // Prepare context for the model
    const dataContext = JSON.stringify({
      transactions: recentTransactions,
      inventorySummary: products.map(p => ({ name: p.name, stock: p.stock, min: p.minStockLevel }))
    });

    const prompt = `
      Anda adalah Auditor Internal AI untuk sistem IBD-UMKM (Integrator Bisnis Digital).
      Tugas anda adalah menganalisis data transaksi dan inventaris berikut untuk mendeteksi:
      1. Anomali (misalnya: transaksi penjualan besar dengan kredit, stok minus, pembelian berlebihan).
      2. Pelanggaran kepatuhan (misalnya: pembelian dilakukan saat stok masih jauh di atas minimum).
      3. Risiko penipuan (Fraud).
      
      Data: ${dataContext}
      
      Berikan respon dalam format JSON saja.
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
                message: { type: Type.STRING },
                recommendation: { type: Type.STRING }
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
        severity: 'HIGH',
        message: 'Gagal menganalisis data saat ini.',
        recommendation: 'Cek koneksi internet atau coba lagi nanti.'
      }];
    }
  }
};