import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FinanceService } from '../service/finance.service';
import { MaterialModule } from '../../../shared/material/material/material-module';
import { SupplierService, Supplier } from '../../inventory/service/supplier.service';
import { Observable, Subscription } from 'rxjs';
import { map, startWith, finalize } from 'rxjs/operators';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { StatusDialogComponent } from '../../../shared/components/status-dialog-component/status-dialog-component';
import { LoadingService } from '../../../core/services/loading.service';

@Component({
  selector: 'app-payment-entry',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './payment-entry.component.html',
  styleUrl: './payment-entry.component.scss'
})
export class PaymentEntryComponent implements OnInit, OnDestroy {
  payment: any = {
    supplierId: null,
    amount: null,
    paymentMode: 'Cash',
    referenceNumber: '',
    paymentDate: new Date(),
    remarks: '',
    createdBy: 'Admin'
  };

  suppliers: Supplier[] = [];
  filteredSuppliers!: Observable<Supplier[]>;
  supplierControl = new FormControl<string | Supplier>('');
  currentBalance: number | null = null;
  balanceType: string = '';
  recentTransactions: any[] = [];
  loadingCount: number = 0;
  isDashboardLoading: boolean = true;
  private isFirstLoad: boolean = true;
  private routeSub!: Subscription;

  constructor(
    private financeService: FinanceService,
    private supplierService: SupplierService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private route: ActivatedRoute,
    private router: Router,
    private loadingService: LoadingService,
    private cdr: ChangeDetectorRef
  ) { }

  private updateLoading(delta: number) {
    this.loadingCount = Math.max(0, this.loadingCount + delta);
    this.loadingService.setLoading(this.loadingCount > 0);
  }

  ngOnInit() {
    this.isDashboardLoading = true;
    this.isFirstLoad = true;
    this.loadingService.setLoading(true);

    this.loadSuppliers();

    // Store subscription to clean up
    this.routeSub = this.route.queryParams.subscribe(params => {
      const supplierId = params['supplierId'];
      const amount = params['amount'];
      const grnNumber = params['grnNumber'];

      if (supplierId) {
        // If suppliers are already loaded, select immediately. 
        // Otherwise loadSuppliers will handle it when it finishes.
        if (this.suppliers && this.suppliers.length > 0) {
          this.handleQueryParams(supplierId, amount, grnNumber);
        }
      } else {
        // If no supplier in route, stop loader early
        if (this.isFirstLoad) {
          this.isFirstLoad = false;
          this.isDashboardLoading = false;
          this.loadingService.setLoading(false);
          this.cdr.detectChanges();
        }
      }
    });

    // Safety timeout
    setTimeout(() => {
      if (this.isDashboardLoading) {
        this.isDashboardLoading = false;
        this.isFirstLoad = false;
        this.loadingService.setLoading(false);
        this.cdr.detectChanges();
      }
    }, 10000);

    this.filteredSuppliers = this.supplierControl.valueChanges.pipe(
      startWith(''),
      map(value => {
        const name = typeof value === 'string' ? value : (value as any)?.name;
        if (typeof value === 'string') {
          // User is typing, reset selection
          this.payment.supplierId = null;
          this.currentBalance = null;
          this.recentTransactions = [];
        }
        return name ? this._filter(name as string) : this.suppliers.slice();
      })
    );
  }

  ngOnDestroy() {
    if (this.routeSub) this.routeSub.unsubscribe();
  }

  loadSuppliers() {
    this.updateLoading(1);
    this.supplierService.getSuppliers().pipe(
      finalize(() => this.updateLoading(-1))
    ).subscribe({
      next: (data) => {
        this.suppliers = data;
        // Check for query params again after suppliers data is ready
        const params = this.route.snapshot.queryParams;
        if (params['supplierId']) {
          this.handleQueryParams(params['supplierId'], params['amount'], params['grnNumber']);
        }

        // Stop initial loader here as data is ready
        if (this.isFirstLoad) {
          this.isFirstLoad = false;
          this.isDashboardLoading = false;
          this.loadingService.setLoading(false);
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading suppliers', err);
        // Stop loader even on error so page is usable
        this.isFirstLoad = false;
        this.isDashboardLoading = false;
        this.loadingService.setLoading(false);
      }
    });
  }

  private handleQueryParams(supplierId: any, amount: any, grnNumber: any) {
    this.preselectSupplier(Number(supplierId));

    if (amount) {
      this.payment.amount = Number(amount);
      console.log('✅ Auto-filled amount:', amount);
    }

    const currentDue = this.route.snapshot.queryParams['currentDue'];
    if (currentDue) {
      this.currentBalance = Number(currentDue);
      console.log('✅ Using passed pending due:', this.currentBalance);

      // Ensure balance type is set correctly too
      if (this.currentBalance > 0) this.balanceType = 'Payable';
      else if (this.currentBalance < 0) this.balanceType = 'Advance';
      else this.balanceType = 'Clear';
    }

    const poNumber = this.route.snapshot.queryParams['poNumber'];

    if (grnNumber) {
      this.payment.referenceNumber = grnNumber;
      this.payment.remarks = `Payment for ${grnNumber}${poNumber ? ' (PO: ' + poNumber + ')' : ''}`;
      console.log('✅ Auto-filled grn details:', { grnNumber, poNumber });
    }

    // Auto-fill remarks if passed explicitly
    const remarks = this.route.snapshot.queryParams['remarks'];
    if (remarks) {
      this.payment.remarks = decodeURIComponent(remarks);
    }
  }

  private _filter(name: string): Supplier[] {
    const filterValue = name.toLowerCase();
    return this.suppliers.filter(option => option.name?.toLowerCase()?.includes(filterValue) ?? false);
  }

  displayFn(supplier: Supplier): string {
    return supplier && supplier.name ? supplier.name : '';
  }

  onSupplierSelected(event: MatAutocompleteSelectedEvent) {
    const supplier = event.option.value as Supplier;
    this.payment.supplierId = supplier.id;
    this.fetchBalance(supplier.id!);
  }

  preselectSupplier(supplierId: number) {
    const supplier = this.suppliers.find(s => s.id === supplierId);
    if (supplier) {
      this.supplierControl.setValue(supplier);
      this.payment.supplierId = supplier.id;

      // Only fetch balance if NOT already provided in URL
      if (!this.route.snapshot.queryParams['currentDue']) {
        this.fetchBalance(supplier.id!);
      }
    }
  }



  fetchBalance(supplierId: number) {
    this.updateLoading(1);
    this.financeService.getSupplierLedger(supplierId).pipe(
      finalize(() => {
        this.updateLoading(-1);
        if (this.isFirstLoad) {
          this.isFirstLoad = false;
          this.isDashboardLoading = false;
          this.loadingService.setLoading(false);
        }
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (result: any) => {
        // The API returns SupplierLedgerResultDto { ledger: SupplierLedger[] }
        const data = Array.isArray(result) ? result : (result?.ledger || []);

        // We need the balance from the *first* (descending date) entry.
        if (data.length > 0) {
          const latestEntry = data[0];
          this.currentBalance = latestEntry.balance;
          this.balanceType = latestEntry.balance > 0 ? 'Payable' : 'Advance';
          this.recentTransactions = data.slice(0, 5); // Store last 5 transactions
        } else {
          // First time payment or no history
          this.currentBalance = 0;
          this.balanceType = 'Clear';
          this.recentTransactions = [];
        }
      },
      error: (err) => {
        console.error('Error fetching balance', err);
        // Reset state on error to avoid stuck indicator
        this.currentBalance = 0;
        this.balanceType = 'Clear';
      }
    });
  }



  payFullDue() {
    if (this.currentBalance && this.currentBalance > 0) {
      this.payment.amount = this.currentBalance;
    }
  }

  printReceipt() {
    window.print();
  }

  savePayment() {
    if (!this.payment.supplierId || !this.payment.amount) {
      this.snackBar.open('Please select a supplier and enter an amount.', 'Close', { duration: 3000 });
      return;
    }

    // Get supplier name for confirmation dialog
    const supplier = this.suppliers.find(s => s.id === this.payment.supplierId);
    const supplierName = supplier ? supplier.name : 'Unknown Supplier';

    // Confirm Dialog Logic
    const currentDue = (this.currentBalance && this.currentBalance > 0) ? this.currentBalance : 0;
    const payAmount = this.payment.amount;

    let dialogTitle = 'Confirm Payment';
    let dialogMessage = '';
    let dialogStatus = 'success';
    let isSuccess = true;
    let confirmBtnText = 'Yes, Pay';

    // 1. Advance Payment Case covers:
    //    a) Paying when no dues (currentDue = 0)
    //    b) Paying MORE than dues (payAmount > currentDue)
    if (payAmount > currentDue) {
      const advanceAmount = payAmount - currentDue;
      const totalAdvance = (currentDue === 0) ? payAmount : advanceAmount;

      dialogTitle = 'Confirm Advance Payment';
      dialogStatus = 'warning';
      isSuccess = false; // To show warning icon/color
      confirmBtnText = 'Yes, Pay Advance';

      if (currentDue === 0) {
        // Case: No pending dues
        dialogMessage = `⚠️ This supplier has NO pending dues.\n\nYou are paying:  ₹${payAmount.toLocaleString('en-IN')}\nCurrent Dues: - ₹0\n-----------------------\nAdvance Balance: ₹${payAmount.toLocaleString('en-IN')}\n\nThis entire amount will be saved as an ADVANCE.`;
      } else {
        // Case: Paying more than pending dues
        dialogMessage = `⚠️ You are paying MORE than the due amount.\n\nYou are paying:  ₹${payAmount.toLocaleString('en-IN')}\nCurrent Dues: - ₹${currentDue.toLocaleString('en-IN')}\n-----------------------\nAdvance Balance: ₹${advanceAmount.toLocaleString('en-IN')}\n\nThis extra ₹${advanceAmount.toLocaleString('en-IN')} will be saved as an ADVANCE.`;
      }

    } else {
      // 2. Standard Payment Case (Green Check)
      dialogTitle = 'Confirm Payment';
      dialogStatus = 'success';
      isSuccess = true; // Shows Green Check
      confirmBtnText = 'Yes, Pay';

      dialogMessage = `Are you sure you want to record this payment?\n\nSupplier: ${supplierName}\nAmount: ₹${payAmount.toLocaleString('en-IN')}\nMode: ${this.payment.paymentMode}`;
    }

    const confirmDialog = this.dialog.open(StatusDialogComponent, {
      width: '450px',
      data: {
        title: dialogTitle,
        message: dialogMessage,
        status: dialogStatus,
        isSuccess: isSuccess,
        showCancel: true,
        confirmText: confirmBtnText
      }
    });

    confirmDialog.afterClosed().subscribe(confirmed => {
      if (!confirmed) return; // User cancelled

      // User confirmed, proceed with payment
      this.performPayment();
    });
  }

  performPayment() {
    this.updateLoading(1);
    const payload = { ...this.payment, paymentDate: this.payment.paymentDate instanceof Date ? this.payment.paymentDate.toISOString() : this.payment.paymentDate };

    this.financeService.recordSupplierPayment(payload).pipe(
      finalize(() => this.updateLoading(-1))
    ).subscribe({
      next: (res) => {
        const successDialog = this.dialog.open(StatusDialogComponent, {
          data: {
            isSuccess: true,
            title: 'Success',
            message: 'Payment Recorded Successfully!',
            actions: [
              { label: 'Print Receipt', role: 'print', color: 'primary' },
              { label: 'OK', role: 'ok' }
            ]
          }
        });

        const supplier = this.suppliers.find(s => s.id === this.payment.supplierId);
        const paymentData = {
          ...this.payment,
          id: res.id || 'NEW',
          supplierName: supplier ? supplier.name : 'Supplier'
        };

        successDialog.afterClosed().subscribe(result => {
          if (result === 'print') {
            this.printVoucher(paymentData);
          }
          this.postPaymentActions();
        });
      },
      error: (err) => {
        console.error(err);
        const errorMessage = err.error?.message || err.error || err.statusText || 'Failed to record payment.';
        this.dialog.open(StatusDialogComponent, {
          data: {
            isSuccess: false,
            message: `Error: ${errorMessage}`
          }
        });
      }
    });
  }

  postPaymentActions() {
    this.resetForm();
    // If we came from GRN List, go back there
    if (this.route.snapshot.queryParams['grnNumber']) {
      this.router.navigate(['/app/inventory/grn-list']);
    }
  }

  printVoucher(payment: any) {
    const printContent = `
      <div style="font-family: sans-serif; padding: 40px; border: 2px solid #333; max-width: 800px; margin: auto;">
        <div style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px;">
          <h1 style="margin: 0; color: #2e7d32;">PAYMENT VOUCHER</h1>
          <p style="margin: 5px 0;">Official Receipt of Payment</p>
        </div>
        
        <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
          <div>
            <strong>Voucher No:</strong> PV-${payment.id}<br>
            <strong>Date:</strong> ${new Date(payment.paymentDate).toLocaleDateString()}
          </div>
          <div style="text-align: right;">
            <strong>Reference:</strong> ${payment.referenceNumber || 'N/A'}<br>
            <strong>Mode:</strong> ${payment.paymentMode}
          </div>
        </div>

        <div style="margin-bottom: 40px; padding: 20px; background: #f9f9f9; border-radius: 8px;">
          <p style="font-size: 1.1rem; margin-bottom: 10px;">Paid To:</p>
          <h2 style="margin: 0;">${payment.supplierName}</h2>
          <p style="color: #666; margin-top: 5px;">Supplier ID: #${payment.supplierId}</p>
        </div>

        <div style="border: 1px solid #ddd; border-radius: 8px; overflow: hidden; margin-bottom: 40px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="background: #eee;">
              <th style="padding: 12px; text-align: left; border-bottom: 1px solid #ddd;">Description</th>
              <th style="padding: 12px; text-align: right; border-bottom: 1px solid #ddd;">Amount</th>
            </tr>
            <tr>
              <td style="padding: 15px; border-bottom: 1px solid #eee;">
                ${payment.remarks || 'Payment towards outstanding dues.'}
              </td>
              <td style="padding: 15px; text-align: right; font-weight: bold; border-bottom: 1px solid #eee;">
                ₹${payment.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </td>
            </tr>
            <tr style="background: #fcfcfc;">
              <td style="padding: 15px; text-align: right;"><strong>TOTAL PAID</strong></td>
              <td style="padding: 15px; text-align: right; font-size: 1.25rem; font-weight: bold; color: #2e7d32;">
                ₹${payment.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </td>
            </tr>
          </table>
        </div>

        <div style="margin-top: 60px; display: flex; justify-content: space-between;">
          <div style="border-top: 1px solid #333; width: 200px; text-align: center; padding-top: 10px;">
            Receiver's Signature
          </div>
          <div style="border-top: 1px solid #333; width: 200px; text-align: center; padding-top: 10px;">
            Authorized Signatory
          </div>
        </div>
      </div>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Payment Voucher - PV-${payment.id}</title>
            <style>@media print { .no-print { display: none; } }</style>
          </head>
          <body onload="window.print();window.close()">
            ${printContent}
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  }

  resetForm() {
    this.payment = {
      supplierId: null,
      amount: null,
      paymentMode: 'Cash',
      referenceNumber: '',
      paymentDate: new Date(),
      remarks: '',
      createdBy: 'Admin'
    };
    this.supplierControl.setValue('');
    this.currentBalance = null;
    this.balanceType = '';
    this.recentTransactions = [];
  }
}
