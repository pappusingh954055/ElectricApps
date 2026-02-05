export interface SaleReturnListDto {
    saleReturnHeaderId: number;
    returnNumber: string;
    returnDate: Date;
    customerId: number;
    customerName: string; // Service layer se map hokar aayega
    soRef: string; // SONumber mapped from SaleOrders
    totalAmount: number;
    status: string;
}

export interface SaleReturnPagedResponse {
    items: SaleReturnListDto[];
    totalCount: number;
}