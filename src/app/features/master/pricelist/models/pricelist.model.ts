export type PriceListType = 'PURCHASE' | 'SALES';

export interface PriceListModel {
  id?: number;
  name?: string;
  pricetype?: PriceListType;
  code?: string;
  validfrom?: Date;
  validto?: Date;
  description?: string;
  isactive?: boolean;
}

export interface PriceListItemModel {
  id?: number;
  priceListId: any;
  productId: any;
  productName: any;
  price: any;
  minQty: any;
  maxQty: any;
  isActive?: boolean;
}
