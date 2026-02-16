import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
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
  private routeSub!: Subscription;

  constructor(
    private financeService: FinanceService,
    private supplierService: SupplierService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private route: ActivatedRoute,
    private loadingService: LoadingService
  ) { }

  private updateLoading(delta: number) {
    this.loadingCount = Math.max(0, this.loadingCount + delta);
    this.loadingService.setLoading(this.loadingCount > 0);
  }

  ngOnInit() {
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
      }
    });

    this.filteredSuppliers = this.supplierControl.valueChanges.pipe(
      startWith(''),
      map(value => {
        const name = typeof value === 'string' ? value : value?.name;
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
      },
      error: (err) => console.error('Error loading suppliers', err)
    });
  }

  private handleQueryParams(supplierId: any, amount: any, grnNumber: any) {
    this.preselectSupplier(Number(supplierId));

    if (amount) {
      this.payment.amount = Number(amount);
      console.log('✅ Auto-filled amount:', amount);
    }

    if (grnNumber) {
      this.payment.remarks = `Payment for ${grnNumber}`;
      console.log('✅ Auto-filled remarks:', this.payment.remarks);
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
      this.fetchBalance(supplier.id!);
    }
  }



  fetchBalance(supplierId: number) {
    this.updateLoading(1);
    this.financeService.getSupplierLedger(supplierId).pipe(
      finalize(() => this.updateLoading(-1))
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

    // Show confirmation dialog first
    const confirmDialog = this.dialog.open(StatusDialogComponent, {
      width: '450px',
      data: {
        title: 'Confirm Payment',
        message: `Are you sure you want to record this payment?\n\nSupplier: ${supplierName}\nAmount: ₹${this.payment.amount.toLocaleString('en-IN')}\nMode: ${this.payment.paymentMode}`,
        status: 'warning',
        isSuccess: false,
        showCancel: true
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
        this.dialog.open(StatusDialogComponent, {
          data: {
            isSuccess: true,
            message: 'Payment Recorded Successfully!'
          }
        });
        this.resetForm();
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
