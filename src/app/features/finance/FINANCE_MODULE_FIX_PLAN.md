# Finance Module - Complete Fix Plan

## Current Issue (Critical Bug 🚨)
**Problem:** GRN Total = ₹154,875, Payment = ₹100,000
**Expected Balance:** ₹54,875 (Payable)
**Actual Showing:** ₹-100,000 (Wrong!)

**Root Cause:** GRN transaction is not creating a Supplier Ledger entry.

---

## Accounting Flow (How it Should Work)

### Purchase Flow (Accounts Payable):
```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│  Create PO      │ ───▶ │  GRN Accepted    │ ───▶ │ Supplier Ledger │
│                 │      │  Total: 154,875  │      │ Debit: 154,875  │
└─────────────────┘      └──────────────────┘      └─────────────────┘
                                                            │
                                                            ▼
                         ┌──────────────────┐      ┌─────────────────┐
                         │  Make Payment    │ ───▶ │ Supplier Ledger │
                         │  Amount: 100,000 │      │ Credit: 100,000 │
                         └──────────────────┘      └─────────────────┘
                                                            │
                                                            ▼
                                                    Balance = 54,875
```

### Sales Flow (Accounts Receivable):
```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│  Create Sale    │ ───▶ │ Invoice Created  │ ───▶ │ Customer Ledger │
│                 │      │  Total: 50,000   │      │ Debit: 50,000   │
└─────────────────┘      └──────────────────┘      └─────────────────┘
                                                            │
                                                            ▼
                         ┌──────────────────┐      ┌─────────────────┐
                         │  Receive Payment │ ───▶ │ Customer Ledger │
                         │  Amount: 30,000  │      │ Credit: 30,000  │
                         └──────────────────┘      └─────────────────┘
                                                            │
                                                            ▼
                                                    Balance = 20,000
```

---

## Phase 1: Backend Fixes (Critical - Must Do First)

### 1.1 GRN → Supplier Ledger Integration
**File:** `Inventory.API/Services/GrnService.cs` (or wherever GRN is saved)
**Action:** After GRN acceptance, call Suppliers.Finance API to create ledger entry

```csharp
// When GRN is accepted
var ledgerEntry = new {
    SupplierId = grn.SupplierId,
    TransactionDate = grn.ReceivedDate,
    TransactionType = "Purchase",
    ReferenceId = grn.GrnNumber,
    Description = $"GRN {grn.GrnNumber}",
    Debit = grn.GrandTotal,  // We owe them
    Credit = 0,
    Balance = grn.GrandTotal
};

// Call Finance API (via HTTP or MediatR)
await _httpClient.PostAsync("http://suppliers.api/api/finance/ledger-entry", ledgerEntry);
```

### 1.2 Sale Invoice → Customer Ledger Integration  
**File:** `Inventory.API/Services/SaleService.cs`
**Action:** After sale is saved, call Customers.Finance API

```csharp
var ledgerEntry = new {
    CustomerId = sale.CustomerId,
    TransactionDate = sale.SaleDate,
    TransactionType = "Sale",
    ReferenceId = sale.InvoiceNumber,
    Description = $"Invoice {sale.InvoiceNumber}",
    Debit = sale.GrandTotal,  // They owe us
    Credit = 0,
    Balance = sale.GrandTotal
};

await _httpClient.PostAsync("http://customers.api/api/finance/ledger-entry", ledgerEntry);
```

### 1.3 Add Ledger Entry Endpoints
**Files to Create:**
- `Suppliers.API/Controllers/FinanceController.cs` → Add `[HttpPost("ledger-entry")]`
- `Customers.API/Controllers/FinanceController.cs` → Add `[HttpPost("ledger-entry")]`

---

## Phase 2: Frontend Fixes (Angular)

### 2.1 Fix Supplier Ledger Display
**File:** `supplier-ledger.component.ts`
**Issues:**
- API returns `List<SupplierLedger>` directly, not `{ ledger: [...] }`
- Need to handle array response correctly
- Display balance with proper sign (+/-)

### 2.2 Fix Customer Ledger
**File:** `customer-ledger.component.ts`
**Similar fixes as supplier ledger**

### 2.3 Enhance Payment Entry Component
**File:** `payment-entry.component.ts`
**Current:** ✅ Working
**Enhancement:** Show success message with updated balance

### 2.4 Complete Receipt Entry Component
**File:** `receipt-entry.component.ts`
**Enhancement:** Add customer autocomplete, balance display

### 2.5 Pending Dues Report
**File:** `report/pending-dues.component.ts`
**Feature:** Show all suppliers with outstanding > 0

### 2.6 Outstanding Tracker (Customer)
**File:** `report/outstanding-tracker.component.ts`
**Feature:** Show all customers with outstanding > 0

### 2.7 P&L Dashboard
**File:** `pl-dashboard/pl-dashboard.component.ts`
**Feature:** 
- Total Payables (sum of all supplier balances > 0)
- Total Receivables (sum of all customer balances > 0)
- Monthly P&L chart

---

## Phase 3: Testing Checklist

### Purchase Flow Test:
- [ ] Create PO for ₹10,000
- [ ] Create GRN for full qty → Check Supplier Ledger shows Debit ₹10,000
- [ ] Make payment ₹6,000 → Check balance becomes ₹4,000
- [ ] Make another payment ₹4,000 → Check balance becomes ₹0

### Sales Flow Test:
- [ ] Create Sale Invoice ₹5,000
- [ ] Check Customer Ledger shows Debit ₹5,000
- [ ] Record receipt ₹3,000 → Check balance becomes ₹2,000
- [ ] Record receipt ₹2,000 → Check balance becomes ₹0

### Reports Test:
- [ ] Pending Dues shows correct suppliers
- [ ] Outstanding Tracker shows correct customers
- [ ] P&L Dashboard aggregates correctly

---

## Execution Order (What to Fix Next)

**Session 1 (Current):** Frontend - Fix ledger display bugs
**Session 2:** Backend - GRN to Ledger integration
**Session 3:** Backend - Sale to Ledger integration  
**Session 4:** Frontend - Complete all reports
**Session 5:** End-to-end testing

---

## Next Immediate Steps:

1. **Fix Supplier Ledger Component** (5 mins)
2. **Fix Customer Ledger Component** (5 mins)
3. **Test Payment Entry again** (2 mins)
4. **Complete Receipt Entry with autocomplete** (10 mins)
5. **Build Pending Dues Report** (15 mins)
6. **Build Outstanding Tracker** (15 mins)

After frontend is perfect, we'll move to backend integration.
