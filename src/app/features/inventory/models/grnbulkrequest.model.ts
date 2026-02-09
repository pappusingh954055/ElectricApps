export interface BulkGrnRequest {
    purchaseOrderIds: number[]; // Isse backend ko pata chalega kaunse POs uthane hain
    createdBy: string;          // Isse database mein audit trail save hogi
}