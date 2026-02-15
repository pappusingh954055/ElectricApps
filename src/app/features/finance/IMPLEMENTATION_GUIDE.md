# Accounting & Finance Module - Implementation Guide

Aapke request ke mutabiq, Finance module ko organized folder structure me divide kiya gaya hai.

## 📁 Folder Structure (Organized Way)

### 1. Backend (Microservices)
- **Suppliers Microservice**: Handles Accounts Payable.
  - `Entities/SupplierPayment.cs`: Payment records.
  - `Entities/SupplierLedger.cs`: Supplier ka poora hisaab (Credit/Debit).
  - `Controllers/FinanceController.cs`: API endpoints for payments and ledger.
- **Customers Microservice**: Handles Accounts Receivable.
  - `Entities/CustomerReceipt.cs`: Receipt records.
  - `Entities/CustomerLedger.cs`: Customer ka hisaab.
  - `Controllers/FinanceController.cs`: API endpoints for receipts and ledger.

### 2. Frontend (Angular)
`src/app/features/finance/`
- `supplier-ledger/`: Supplier ka khaata dekhne ke liye display.
- `payment-entry/`: ABC Enterprises ko ₹5,000 cash/bank transaction entry.
- `customer-ledger/`: Customer wise transactions.
- `receipt-entry/`: Customer se payment received entry.
- `pl-dashboard/`: Profit & Loss visual reports.
- `reports/`: Pending Dues & Outstanding trackers.
- `service/`: Unified finance service for all API calls.

## 🛠️ Step-by-Step Remaining Tasks
1. **Migrations**: 
   - Suppliers aur Customers microservices me `dotnet ef migrations add AddFinanceEntities` run karein.
   - Database update karein: `dotnet ef database update`.
2. **Transaction Sync**:
   - `Inventory` service me jab **GRN (Purchase)** save hota hai, toh `Suppliers.Finance` API ko call karein takki Ledger me entry auto-insert ho.
   - Jab **Sale Invoice** save hota hai, toh `Customers.Finance` API ko call karein.
3. **P&L Logic**:
   - `Inventory` service me ek naya endpoint banaye jo Purchases (Total Credit in SupplierLedger) aur Sales (Total Debit in CustomerLedger) ko compare karke Profit nikale.

Ab aap `/app/finance/suppliers/ledger` or `/app/finance/suppliers/payment` routes check kar sakte hain.
