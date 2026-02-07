export interface Product {
  id?: number;
  categoryId: number;
  subcategoryId: number;
  productName: string;
  sku?: string;
  brand?: string;
  unit: 'KG' | 'PCS' | 'BOX' | 'NOS';

  // 💰 Pricing Logic Fields
  basePurchasePrice: number;
  mrp?: number;
  rate: number;
  currentStock: number

  // 📈 Inventory & Tax
  defaultGst: number;
  hsnCode?: string;
  minStock: number;
  trackInventory: boolean;
  isActive: boolean;
  productType: string;
  damagedStock: number;
  description?: string;

  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
}

export interface LowStockProductDto {
  // Guid ke liye string use hota hai
  id: string; 

  // UI Table ke columns
  categoryName: string;
  subCategoryName: string;
  productName: string;
  sku: string;
  unit: string;

  // Stock logic
  currentStock: number;
  minStock: number;
  
  // Extra fields for PO
  basePurchasePrice: number;
}