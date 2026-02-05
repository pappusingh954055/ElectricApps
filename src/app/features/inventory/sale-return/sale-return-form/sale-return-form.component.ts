import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { Router, ActivatedRoute } from '@angular/router';
import { MaterialModule } from '../../../../shared/material/material/material-module';
import { SaleReturnService } from '../services/sale-return.service';

@Component({
    selector: 'app-sale-return-form',
    standalone: true,
    imports: [CommonModule, MaterialModule, ReactiveFormsModule],
    templateUrl: './sale-return-form.component.html',
    styleUrl: './sale-return-form.component.scss',
})
export class SaleReturnFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private srService = inject(SaleReturnService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private cdr = inject(ChangeDetectorRef);

    returnForm: FormGroup;
    isEditMode = false;
    returnId: number | null = null;
    isLoading = false;

    customers: any[] = [];
    saleOrders: any[] = [];

    itemsDataSource = new MatTableDataSource<any>();
    displayedColumns: string[] = ['productName', 'quantity', 'rate', 'returnQty', 'tax', 'total'];

    constructor() {
        this.returnForm = this.fb.group({
            returnDate: [new Date(), Validators.required],
            customerId: ['', Validators.required],
            saleOrderId: ['', Validators.required],
            remarks: [''],
            items: this.fb.array([])
        });
    }

    ngOnInit(): void {
        this.loadCustomers();

        this.route.params.subscribe(params => {
            if (params['id']) {
                this.isEditMode = true;
                this.returnId = +params['id'];
                this.loadReturnDetails(this.returnId);
            }
        });
    }

    loadCustomers() {
        this.srService.getCustomers().subscribe(res => {
            this.customers = res;
        });
    }

    onCustomerChange(customerId: number) {
        this.saleOrders = [];
        this.returnForm.get('saleOrderId')?.reset();
        this.clearItems(); // Clear items if customer changes

        if (customerId) {
            this.srService.getSaleOrders(customerId).subscribe(res => {
                this.saleOrders = res;
            });
        }
    }

    onSOChange(soId: number) {
        this.clearItems();
        if (soId) {
            this.isLoading = true;
            this.srService.getSaleOrderItems(soId).subscribe({
                next: (items) => {
                    this.populateItems(items);
                    this.isLoading = false;
                },
                error: () => this.isLoading = false
            });
        }
    }

    get itemsFormArray(): FormArray {
        return this.returnForm.get('items') as FormArray;
    }

    clearItems() {
        while (this.itemsFormArray.length !== 0) {
            this.itemsFormArray.removeAt(0);
        }
        this.itemsDataSource.data = [];
    }

    populateItems(items: any[]) {
        items.forEach(item => {
            const itemGroup = this.fb.group({
                productId: [item.productId],
                productName: [item.productName],
                quantity: [item.quantity], // Sold Qty
                rate: [item.rate],
                returnQty: [0, [Validators.required, Validators.min(0), Validators.max(item.quantity)]],
                taxRate: [item.taxRate],
                amount: [0] // Calculated
            });

            // Listen to value changes for calculation
            itemGroup.get('returnQty')?.valueChanges.subscribe(() => {
                this.calculateRowTotal(itemGroup);
            });

            this.itemsFormArray.push(itemGroup);
        });

        this.itemsDataSource.data = this.itemsFormArray.controls;
    }

    calculateRowTotal(group: FormGroup) {
        const qty = group.get('returnQty')?.value || 0;
        const rate = group.get('rate')?.value || 0;
        const taxRate = group.get('taxRate')?.value || 0;

        // Simple calculation: Amount = Qty * Rate + Tax
        // Adjust logic based on actual business rules (Tax inclusive/exclusive)
        const baseAmount = qty * rate;
        const taxAmount = baseAmount * (taxRate / 100);
        const total = baseAmount + taxAmount;

        group.patchValue({ amount: total }, { emitEvent: false });
    }

    loadReturnDetails(id: number) {
        this.isLoading = true;
        this.srService.getSaleReturnById(id).subscribe(res => {
            this.returnForm.patchValue({
                returnDate: res.returnDate,
                customerId: res.customerId,
                saleOrderId: res.saleOrderId,
                remarks: res.remarks
            });

            // Populate items with returned quantities
            // This logic might need adjustment based on how the API returns "items"
            // For now, assuming standard population but we need to fetch SO items first likely?
            // Or if 'res.items' contains everything we need:
            if (res.items) {
                this.clearItems();
                res.items.forEach((item: any) => {
                    // similar population logic
                    const itemGroup = this.fb.group({
                        productId: [item.productId],
                        productName: [item.productName],
                        quantity: [item.originalQuantity], // Sold Qty
                        rate: [item.rate],
                        returnQty: [item.returnQuantity, [Validators.required, Validators.min(0)]],
                        taxRate: [item.taxRate],
                        amount: [item.amount]
                    });
                    itemGroup.get('returnQty')?.valueChanges.subscribe(() => this.calculateRowTotal(itemGroup));
                    this.itemsFormArray.push(itemGroup);
                });
                this.itemsDataSource.data = this.itemsFormArray.controls;
            }

            this.isLoading = false;
        });
    }

    get totalReturnAmount(): number {
        return this.itemsFormArray.controls
            .reduce((sum, control) => sum + (control.get('amount')?.value || 0), 0);
    }

    onSubmit() {
        if (this.returnForm.invalid) {
            this.returnForm.markAllAsTouched();
            return;
        }

        const formValue = this.returnForm.value;
        // Filter out items with 0 return qty if business rule says so, 
        // or just send all and let backend handle.
        // Usually valid to return 0.

        this.isLoading = true;
        this.srService.saveSaleReturn(formValue).subscribe({
            next: () => {
                this.isLoading = false;
                // Navigate or show success
                this.router.navigate(['/app/inventory/sale-return']);
            },
            error: (err) => {
                console.error(err);
                this.isLoading = false;
            }
        });
    }

    goBack() {
        this.router.navigate(['/app/inventory/sale-return']);
    }
}
