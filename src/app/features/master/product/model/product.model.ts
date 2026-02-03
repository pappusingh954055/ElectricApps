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

  description?: string;

  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
}