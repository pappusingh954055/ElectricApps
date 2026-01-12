export interface Product {
  id?: number;
  categoryid?: number;
  subcategoryid?: number;
  productname?: string;
  sku?: string;
  unit?: 'KG' | 'PCS' | 'BOX';
  hsncode?: string;
  defaultgst?: number;
  minstock?: number;
  trackinventory?: boolean;  
  description?: string;
}
