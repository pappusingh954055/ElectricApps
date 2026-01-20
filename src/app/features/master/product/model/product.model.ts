export interface Product {
  id?: number;
  categoryId: number; // Mandatory for Business logic
  subcategoryId: number; // Mandatory for Business logic
  productName: string;
  sku?: string;
  brand?: string; // 🆕 Added for reporting
  unit: 'KG' | 'PCS' | 'BOX' | 'NOS'; // 🆕 NOS added (Industry standard)
  
  // 💰 Pricing Logic Fields
  basePurchasePrice: number; // 🆕 Default PO price fetch karne ke liye
  mrp?: number; // 🆕 Sales/Margin calculation ke liye
  
  // 📈 Inventory & Tax
  defaultGst: number;
  hsnCode?: string;
  minStock: number;
  trackInventory: boolean; 
  isActive: boolean; // 🆕 Status control (Active/Inactive)
  
  description?: string;

  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
}