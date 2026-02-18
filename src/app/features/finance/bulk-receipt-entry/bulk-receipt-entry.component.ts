import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { FinanceService } from '../service/finance.service';
import { customerService } from '../../master/customer-component/customer.service';
import { MaterialModule } from '../../../shared/material/material/material-module';
import { LoadingService } from '../../../core/services/loading.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterModule } from '@angular/router';
import { Observable, startWith, map } from 'rxjs';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
    selector: 'app-bulk-receipt-entry',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, MaterialModule, RouterModule],
    templateUrl: './bulk-receipt-entry.component.html',
    styleUrls: ['./bulk-receipt-entry.component.scss']
})
export class BulkReceiptEntryComponent implements OnInit {
    fb = inject(FormBuilder);
    financeService = inject(FinanceService);
    customerService = inject(customerService);
    loadingService = inject(LoadingService);
    snackBar = inject(MatSnackBar);
    router = inject(Router);
    dialogRef = inject(MatDialogRef<BulkReceiptEntryComponent>);

    bulkForm!: FormGroup;
    customers: any[] = [];
    filteredCustomers: Observable<any[]>[] = [];
    modes = ['Cash', 'GPay', 'PhonePe', 'Paytm', 'Bank Transfer', 'Check'];
    isLoading = false;

    ngOnInit() {
        this.initForm();
        this.loadCustomers();
    }

    initForm() {
        this.bulkForm = this.fb.group({
            rows: this.fb.array([])
        });
        this.addRow(); // Start with one row
    }

    get rows() {
        return this.bulkForm.get('rows') as FormArray;
    }

    loadCustomers() {
        this.loadingService.setLoading(true);
        this.customerService.getCustomersLookup().subscribe({
            next: (data: any[]) => {
                this.customers = data || [];
                // Re-initialize filters because customers loaded async
                for (let i = 0; i < this.rows.length; i++) {
                    this.setupFilter(i);
                }
                this.loadingService.setLoading(false);
            },
            error: () => this.loadingService.setLoading(false)
        });
    }

    addRow() {
        const row = this.fb.group({
            customer: ['', Validators.required],
            customerId: [null, Validators.required],
            currentBalance: [{ value: 0, disabled: true }],
            amount: [null, [Validators.required, Validators.min(1)]],
            paymentMode: ['Cash', Validators.required],
            referenceBy: [''],
            date: [new Date(), Validators.required],
            remarks: ['']
        });

        this.rows.push(row);
        this.setupFilter(this.rows.length - 1);
    }

    removeRow(index: number) {
        if (this.rows.length > 1) {
            this.rows.removeAt(index);
            this.filteredCustomers.splice(index, 1);
        }
    }

    setupFilter(index: number) {
        const control = this.rows.at(index).get('customer');
        if (control) {
            const filter = control.valueChanges.pipe(
                startWith(typeof control.value === 'string' ? control.value : (control.value?.name || '')),
                map(value => {
                    const name = typeof value === 'string' ? value : value?.name;
                    return name ? this._filter(name) : this.customers.slice();
                })
            );

            if (this.filteredCustomers.length <= index) {
                this.filteredCustomers.push(filter);
            } else {
                this.filteredCustomers[index] = filter;
            }
        }
    }

    private _filter(name: string): any[] {
        const filterValue = name.toLowerCase();
        return this.customers.filter(option =>
            (option.name?.toLowerCase().includes(filterValue)) ||
            (option.id?.toString().includes(filterValue))
        );
    }

    displayFn(customer: any): string {
        return customer && customer.name ? `${customer.name} (#${customer.id})` : '';
    }

    onCustomerSelected(event: any, index: number) {
        const customer = event.option.value;
        const row = this.rows.at(index);
        row.patchValue({
            customerId: customer.id,
            customer: customer
        });

        this.fetchBalance(customer, index);
    }

    fetchBalance(customer: any, index: number) {
        // Use Outstanding Tracker API to get the correct current balance
        // We filter by the customer's name to narrow it down

        const req = {
            searchTerm: customer.name,
            customerNameFilter: customer.name,
            statusFilter: '',
            pageNumber: 1,
            pageSize: 10,
            sortBy: 'CustomerName',
            sortOrder: 'asc'
        };

        this.financeService.getOutstandingTracker(req).subscribe({
            next: (res: any) => {
                // The response structure matches OutstandingPagedResultDto having Items -> Items list
                if (res && res.items && res.items.items) {
                    // Find accurate match by ID
                    const match = res.items.items.find((c: any) => c.customerId === customer.id);
                    if (match) {
                        const balance = match.pendingAmount;
                        const row = this.rows.at(index);

                        row.patchValue({ currentBalance: balance });

                        if (balance > 0) {
                            row.patchValue({ amount: balance });
                        }
                    }
                }
            },
            error: (err) => console.error('Error fetching balance:', err)
        });
    }

    // ... rest of the code ...
    saveAll() {
        if (this.bulkForm.invalid) {
            this.bulkForm.markAllAsTouched();
            this.snackBar.open('Please fill all required fields.', 'Close', { duration: 3000 });
            return;
        }

        const payload = this.rows.controls.map(control => {
            const val = control.getRawValue();

            return {
                customerId: val.customerId,
                amount: val.amount,
                paymentMode: val.paymentMode,
                referenceNumber: val.referenceBy,
                paymentDate: val.date,
                remarks: val.remarks
            };
        });

        this.isLoading = true;
        this.financeService.recordBulkCustomerReceipts(payload).subscribe({
            next: () => {
                this.isLoading = false;
                this.snackBar.open('All receipts saved successfully!', 'Close', { duration: 3000 });
                this.dialogRef.close(true);
            },
            error: (err) => {
                this.isLoading = false;
                console.error(err);
                this.snackBar.open('Failed to save receipts.', 'Close', { duration: 3000 });
            }
        });
    }

    goBack() {
        this.dialogRef.close(false);
    }
}
