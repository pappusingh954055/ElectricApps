import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { Router, ActivatedRoute } from '@angular/router';
import { MaterialModule } from '../../../../shared/material/material/material-module';
import { SaleReturnService } from '../services/sale-return.service';
import { customerService } from '../../../master/customer-component/customer.service';
import { SaleOrderService } from '../../service/saleorder.service';
import { CreateSaleReturnDto, SaleReturnItem } from '../models/create-sale-return.model';

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
    private customerService = inject(customerService);
    private saleOrderService = inject(SaleOrderService);

    customers: any[] = [];
    saleOrders: any[] = [];
    returnForm: FormGroup;
    isEditMode = false;
    returnId: number | null = null;
    isLoading = false;

    itemsDataSource = new MatTableDataSource<AbstractControl>();
    displayedColumns: string[] = ['productName', 'quantity', 'rate', 'itemCondition', 'reason', 'returnQty', 'tax', 'total'];

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
        this.loadCustomersLookup();
        this.route.params.subscribe(params => {
            if (params['id']) {
                this.isEditMode = true;
                this.returnId = +params['id'];
                this.loadReturnDetails(this.returnId);
            }
        });
    }

    loadCustomersLookup() {

        this.customerService.getCustomersLookup().subscribe({
            next: (data) => {
                this.customers = data;
                this.cdr.detectChanges();
            },
            error: (err) => console.error("Customer load fail:", err)

        });
    }

    onCustomerChange(customerId: number) {
        this.saleOrders = [];
        this.returnForm.get('saleOrderId')?.setValue(null);
        this.clearItems();

        if (customerId) {
            this.saleOrderService.getOrdersByCustomer(customerId).subscribe({
                next: (data) => {
                    this.saleOrders = data;
                    this.cdr.detectChanges();
                },
                error: (err) => console.error("Orders load error:", err)
            });
        }
    }

    onSOChange(soId: number) {
        this.clearItems();
        if (soId) {
            this.isLoading = true;
            this.saleOrderService.getSaleOrderItems(soId).subscribe({
                next: (items) => {
                    items.forEach(item => {
                        const itemGroup = this.fb.group({
                            productId: [item.productId],
                            productName: [item.productName],
                            quantity: [item.soldQty || item.quantity],
                            rate: [item.rate || item.unitPrice || 0],
                            itemCondition: ['Good', Validators.required],
                            reason: [''],
                            returnQty: [0, [Validators.required, Validators.min(0), Validators.max(item.soldQty || item.quantity)]],
                            taxRate: [item.taxPercentage || item.taxRate || 0],
                            amount: [0]
                        });

                        this.calculateRowTotal(itemGroup);

                        itemGroup.get('returnQty')?.valueChanges.subscribe(() => {
                            this.calculateRowTotal(itemGroup);
                            this.cdr.detectChanges();
                        });

                        this.itemsFormArray.push(itemGroup);
                    });
                    this.itemsDataSource.data = this.itemsFormArray.controls;
                    this.isLoading = false;
                    this.cdr.detectChanges();
                },
                error: () => {
                    this.isLoading = false;
                    this.cdr.detectChanges();
                }
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
                quantity: [item.quantity],
                rate: [item.unitPrice || item.rate],
                itemCondition: ['Good', Validators.required],
                reason: [''],
                returnQty: [0, [Validators.required, Validators.min(0), Validators.max(item.quantity)]],
                taxRate: [item.taxPercentage || item.taxRate || 0],
                amount: [0]
            });

            itemGroup.get('returnQty')?.valueChanges.subscribe(() => {
                this.calculateRowTotal(itemGroup);
                this.cdr.detectChanges();
            });

            this.itemsFormArray.push(itemGroup);
        });

        this.itemsDataSource.data = [...this.itemsFormArray.controls];
        this.cdr.detectChanges();
    }

    calculateRowTotal(group: FormGroup) {
        const qty = +group.get('returnQty')?.value || 0;
        const rate = +group.get('rate')?.value || 0;
        const taxRate = +group.get('taxRate')?.value || 0;

        const baseAmount = qty * rate;
        const taxAmount = baseAmount * (taxRate / 100);
        const total = baseAmount + taxAmount;

        group.patchValue({ amount: total }, { emitEvent: false });
    }

    get totalReturnAmount(): number {
        return this.itemsFormArray.controls
            .reduce((sum, control) => sum + (control.get('amount')?.value || 0), 0);
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
            this.isLoading = false;
            this.cdr.detectChanges();
        });
    }

    // ==========================================
    // SAVE LOGIC (Updated as requested)
    // ==========================================
    onSubmit() {
        if (this.returnForm.invalid) {
            this.returnForm.markAllAsTouched();
            return;
        }

        const userId = localStorage.getItem('email') || 'admin@admin.com';
        const rawValue = this.returnForm.value;

        // Backend ko wahi naam chahiye jo SaleReturnItem interface mein hain
        const mappedItems: SaleReturnItem[] = rawValue.items
            .filter((i: any) => i.returnQty > 0)
            .map((i: any) => ({
                productId: i.productId,
                returnQty: i.returnQty,
                unitPrice: i.rate,           // UI 'rate' -> Backend 'unitPrice'
                taxPercentage: i.taxRate,    // UI 'taxRate' -> Backend 'taxPercentage'
                totalAmount: i.amount,       // UI 'amount' -> Backend 'totalAmount'
                reason: i.reason || 'No Reason',
                itemCondition: i.itemCondition || 'Good'
            }));

        if (mappedItems.length === 0) {
            alert("Please enter return quantity for at least one item.");
            return;
        }

        const payload: CreateSaleReturnDto = {
            returnDate: rawValue.returnDate,
            saleOrderId: Number(rawValue.saleOrderId),
            customerId: Number(rawValue.customerId),
            remarks: rawValue.remarks,
            createdBy: userId, // Audit fields ke liye email pass ho raha hai
            items: mappedItems
        };

        this.isLoading = true;
        console.log('Final Payload to Backend:', payload);

        this.srService.saveSaleReturn(payload).subscribe({
            next: () => {
                this.isLoading = false;
                this.cdr.detectChanges();
                this.router.navigate(['/app/inventory/sale-return']);
            },
            error: (err) => {
                console.error("Save Return Error:", err);
                this.isLoading = false;

                // --- VALIDATION ERROR HANDLING ---
                // Backend se aane wala message 'err.error.message' ya seedha 'err.error' mein ho sakta hai
                // Isse Dashboard par jo -4 ki wajah se error aayega wo user ko dikhega
                const errorMessage = err.error?.message || err.error || "Something went wrong while saving the return.";

                // Yahan alert ki jagah aap apna 'statusshow' component/toast bhi use kar sakte hain
                alert(errorMessage);

                this.cdr.detectChanges();
            }
        });
    }
    goBack() {
        this.router.navigate(['/app/inventory/sale-return']);
    }
}