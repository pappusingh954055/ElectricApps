import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { FinanceService } from '../service/finance.service';
import { MaterialModule } from '../../../shared/material/material/material-module';
import { SupplierService, Supplier } from '../../inventory/service/supplier.service';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { StatusDialogComponent } from '../../../shared/components/status-dialog-component/status-dialog-component';

@Component({
  selector: 'app-payment-entry',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './payment-entry.component.html',
  styleUrl: './payment-entry.component.scss'
})
export class PaymentEntryComponent implements OnInit {
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

  constructor(
    private financeService: FinanceService,
    private supplierService: SupplierService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.loadSuppliers();

    // Check for supplierId query param (from Pending Dues "Pay Now" button)
    this.route.queryParams.subscribe(params => {
      const supplierId = params['supplierId'];
      if (supplierId) {
        // Pre-select supplier after suppliers are loaded
        setTimeout(() => {
          this.preselectSupplier(Number(supplierId));
        }, 500);
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

  loadSuppliers() {
    this.supplierService.getSuppliers().subscribe({
      next: (data) => {
        this.suppliers = data;
      },
      error: (err) => console.error('Error loading suppliers', err)
    });
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
    this.financeService.getSupplierLedger(supplierId).subscribe({
      next: (data: any) => {
        // The API returns List<SupplierLedger>.
        // We need the balance from the *first* (descending date) entry.
        if (Array.isArray(data) && data.length > 0) {
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
        // Even on error (e.g. 404 for no ledger), default to 0 so UI shows something
        this.currentBalance = 0;
        this.balanceType = 'Clear';
        this.recentTransactions = [];
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

    const payload = { ...this.payment, paymentDate: this.payment.paymentDate instanceof Date ? this.payment.paymentDate.toISOString() : this.payment.paymentDate };

    this.financeService.recordSupplierPayment(payload).subscribe({
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
