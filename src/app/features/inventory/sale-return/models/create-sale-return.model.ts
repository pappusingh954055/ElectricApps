export interface SaleReturnItem {
    productId: string; // Guid
    returnQty: number;
    unitPrice: number;
    taxPercentage: number;
    reason: string;
    itemCondition: string;
}

export interface CreateSaleReturnDto {
    returnDate: Date;
    saleOrderId: number; //
    customerId: number;
    remarks: string;
    items: SaleReturnItem[];
}