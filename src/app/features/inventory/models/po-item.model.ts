export interface PoItem {

  productId: number;
  productName: string;

  quantity: number;

  unit: string;                // PCS, KG, BOX (from Product)

  unitPrice: number;           // from PriceListItem (READ ONLY)

  gstPercent: number;          // from Product

  lineTotal: number;           // qty × unitPrice
}
