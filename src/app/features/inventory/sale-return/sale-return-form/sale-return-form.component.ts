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
import { MatDialog } from '@angular/material/dialog';
import { StatusDialogComponent } from '../../../../shared/components/status-dialog-component/status-dialog-component';
import { NotificationService } from '../../../shared/notification.service';
import { FinanceService } from '../../../finance/service/finance.service';
import { LoadingService } from '../../../../core/services/loading.service';

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
    private dialog = inject(MatDialog);
    private notification = inject(NotificationService);
    private loadingService = inject(LoadingService);
    private financeService = inject(FinanceService);

    customers: any[] = [];
    saleOrders: any[] = [];
    returnForm: FormGroup;
    isEditMode = false;
    returnId: number | null = null;
    isLoading = false;
    isLoadingCustomers = false;
    isLoadingSaleOrders = false;

    itemsDataSource = new MatTableDataSource<AbstractControl>();
    displayedColumns: string[] = ['productName', 'quantity', 'rate', 'itemCondition', 'reason', 'returnQty', 'discount', 'tax', 'total'];

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
        this.isLoadingCustomers = true;
        this.customerService.getCustomersLookup().subscribe({
            next: (data) => {
                this.customers = data;
                this.isLoadingCustomers = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error("Customer load fail:", err);
                this.isLoadingCustomers = false;
                this.cdr.detectChanges();
            }
        });
    }

    onCustomerChange(customerId: number) {
        this.saleOrders = [];
        this.returnForm.get('saleOrderId')?.setValue(null);
        this.clearItems();

        if (customerId) {
            this.isLoadingSaleOrders = true;
            this.saleOrderService.getOrdersByCustomer(customerId).subscribe({
                next: (data) => {
                    this.saleOrders = data;
                    this.isLoadingSaleOrders = false;
                    this.cdr.detectChanges();
                },
                error: (err) => {
                    console.error("Orders load error:", err);
                    this.isLoadingSaleOrders = false;
                    this.cdr.detectChanges();
                }
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
                            discountPercent: [item.discountPercent || 0], // Capture Discount
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

    populateItems(items: any[]) { // Used for Edit Mode
        items.forEach(item => {
            const itemGroup = this.fb.group({
                productId: [item.productId],
                productName: [item.productName],
                quantity: [item.quantity],
                rate: [item.unitPrice || item.rate],
                discountPercent: [item.discountPercent || 0], // Capture Discount
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
        const discountPercent = +group.get('discountPercent')?.value || 0;

        // 1. Calculate Discount
        const discountAmountPerUnit = rate * (discountPercent / 100);
        const netRate = rate - discountAmountPerUnit;
        const totalDiscountAmount = qty * discountAmountPerUnit;

        // 2. Calculate Base Amount (Taxable Value) - GST fits on Transaction Value
        const taxableAmount = qty * netRate;

        // 3. Calculate Tax on Taxable Amount
        const taxAmount = taxableAmount * (taxRate / 100);

        // 4. Final Total
        const total = taxableAmount + taxAmount;

        // Debug Log
        // console.log(`Rate: ${rate}, Qty: ${qty}, Disc%: ${discountPercent}, NetRate: ${netRate}, Taxable: ${taxableAmount}, Tax: ${taxAmount}, Total: ${total}`);

        group.patchValue({ amount: total }, { emitEvent: false });
    }

    get totalReturnAmount(): number {
        return this.itemsFormArray.controls
            .reduce((sum, control) => sum + (control.get('amount')?.value || 0), 0);
    }

    get totalReturnQty(): number {
        return this.itemsFormArray.controls
            .reduce((sum, control) => sum + (Number(control.get('returnQty')?.value) || 0), 0);
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
            // Populate Items needs to handle existing return items structure
            // Assuming res.returnItems contains necessary fields
            // this.populateItems(res.returnItems); 
            // Note: Currently populateItems is not called in loadReturnDetails in original code, 
            // but if it were, it needs to be updated. The original code didn't call it.
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
            .map((i: any) => {
                const qty = i.returnQty;
                const rate = i.rate;
                const discountPct = i.discountPercent || 0;
                // Calculate Discount Amount for the returned quantity
                const discountAmount = (rate * qty) * (discountPct / 100);

                return {
                    productId: i.productId,
                    returnQty: qty,
                    unitPrice: rate,
                    discountPercent: discountPct,
                    discountAmount: discountAmount,
                    taxPercentage: i.taxRate,
                    totalAmount: i.amount,
                    reason: i.reason || 'No Reason',
                    itemCondition: i.itemCondition || 'Good'
                };
            });

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
            next: (res: any) => {
                const returnNo = res?.returnNumber || res?.returnNo || `SR-${Date.now()}`;
                const returnId = res?.saleReturnHeaderId || res?.id || 0;

                this.financeService.recordCustomerReceipt({
                    customerId: Number(rawValue.customerId),
                    amount: this.totalReturnAmount,
                    paymentMode: 'Sales Return',
                    referenceNumber: returnNo,
                    paymentDate: new Date().toISOString(),
                    remarks: `Sales Return Adjustment: ${returnNo}`,
                    createdBy: userId
                }).subscribe({
                    next: () => this.handleSuccess(res, returnNo, returnId),
                    error: () => this.handleSuccess(res, returnNo, returnId, true)
                });
            },
            error: (err) => {
                this.isLoading = false;
                this.cdr.detectChanges();
                this.dialog.open(StatusDialogComponent, {
                    width: '400px',
                    data: { isSuccess: false, message: err.error?.message || "Save failed." }
                });
            }
        });
    }

    private handleSuccess(res: any, returnNo: string, returnId: number, isFail: boolean = false) {
        this.isLoading = false;
        this.cdr.detectChanges();
        const dialogRef = this.dialog.open(StatusDialogComponent, {
            width: '400px',
            data: {
                isSuccess: !isFail,
                message: isFail ? 'Return Saved, but Ledger failed. Redirecting...' : 'Sale Return saved and Ledger updated!'
            }
        });
        dialogRef.afterClosed().subscribe(() => {
            this.loadingService.setLoading(true);
            const customerName = this.customers.find(c => c.id === Number(this.returnForm.get('customerId')?.value))?.name || '';
            setTimeout(() => {
                this.router.navigate(['/app/inventory/gate-pass/inward'], {
                    queryParams: { refNo: returnNo, refId: returnId, type: 'sale-return', partyName: customerName, qty: this.totalReturnQty }
                });
            }, 500);
        });
    }

    exportPdf() {
        if (!this.returnId) return;
        this.isLoading = true;
        // Assuming service has a download method, otherwise placeholder
        // this.srService.downloadReturnPdf(this.returnId).subscribe(...)
        console.log('Exporting PDF for Return ID:', this.returnId);

        // Mocking download for now
        setTimeout(() => {
            this.isLoading = false;
            this.cdr.detectChanges();
            this.notification.showStatus(true, 'PDF Exported Successfully (Mock)');
        }, 1000);
    }

    goBack() {
        this.router.navigate(['/app/inventory/sale-return']);
    }
}