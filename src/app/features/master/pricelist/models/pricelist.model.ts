export type PriceListType = 'PURCHASE' | 'SALES';

export interface PriceList {
  id: number;
  name: string;
  type: PriceListType;
  effectiveFrom: Date;
  description?: string;
  isActive: boolean;
}

export interface PriceListItem {
  id?: number;
  priceListId: any;
  productId: any;
  productName: any;
  price: any;
  minQty: any;
  maxQty: any;
  isActive?: boolean;
}
