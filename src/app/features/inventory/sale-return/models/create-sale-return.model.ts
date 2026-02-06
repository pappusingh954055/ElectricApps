export interface SaleReturnItem {
    productId?: string;
    returnQty?: number;
    unitPrice?: number;    // Backend property name
    taxPercentage?: number; // Backend property name
    totalAmount?: number;   // Backend property name
    reason?: string;
    itemCondition?: string;
}

export interface CreateSaleReturnDto {
    returnDate?: Date;
    saleOrderId?: number;
    customerId?: number;
    remarks?: string;
    modifiedBy?: string;
    createdBy?: string;
    items?: SaleReturnItem[];
}