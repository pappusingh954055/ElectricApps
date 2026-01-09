export interface Product {
  id: number;

  categoryId: number;
  categoryName?: string;

  subcategoryId: number;
  subcategoryName?: string;

  name: string;
  sku?: string;
  unit: 'KG' | 'PCS' | 'BOX';

  hsnCode?: string;
  gstPercent: number;

  trackInventory: boolean;
  minStock?: number;

  isActive: boolean;
}
