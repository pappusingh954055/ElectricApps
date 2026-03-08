import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../shared/material/material/material-module';
import { InventoryService } from '../service/inventory.service';
import { NotificationService } from '../../shared/notification.service';
import { Router } from '@angular/router';
import { Observable, debounceTime, distinctUntilChanged, map, startWith } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { ProductSelectionDialogComponent } from '../../../shared/components/product-selection-dialog/product-selection-dialog';
import { PermissionService } from '../../../core/services/permission.service';
import { UnitService } from '../../master/units/services/units.service';
import { LocationService } from '../../master/locations/services/locations.service';

@Component({
    selector: 'app-quick-sale',
    standalone: true,
    imports: [CommonModule, MaterialModule, ReactiveFormsModule, FormsModule],
    templateUrl: './quick-sale.component.html',
    styleUrls: ['./quick-sale.component.scss']
})
export class QuickSaleComponent implements OnInit {
    private fb = inject(FormBuilder);
    public inventoryService = inject(InventoryService);
    private notification = inject(NotificationService);
    public router = inject(Router);
    private authService = inject(AuthService);
    private dialog = inject(MatDialog);
    private permissionService = inject(PermissionService);
    private unitService = inject(UnitService);
    private locationService = inject(LocationService);

    saleForm!: FormGroup;
    isSaving = false;
    customers: any[] = [];
    units: any[] = [];
    warehouses: any[] = [];
    racksByItem: any[][] = [];
    filteredUnits: Observable<any[]>[] = [];

    constructor() {
        this.initForm();
    }

    ngOnInit() {
        this.loadCustomers();
        this.loadUnits();
        this.loadWarehouses();
    }

    loadWarehouses() {
        this.locationService.getWarehouses().subscribe((res: any) => {
            this.warehouses = res;
        });
    }

    onWarehouseChange(index: number) {
        const warehouseId = this.items.at(index).get('warehouseId')?.value;
        if (warehouseId) {
            this.locationService.getRacksByWarehouse(warehouseId).subscribe((res: any) => {
                this.racksByItem[index] = res;
            });
        } else {
            this.racksByItem[index] = [];
        }
    }

    loadUnits() {
        this.unitService.getAll().subscribe(res => {
            this.units = res;
        });
    }

    private initForm() {
        this.saleForm = this.fb.group({
            customerId: [0], // Default 0 for Cash Customer
            customerName: ['Cash Customer', Validators.required],
            remarks: [''],
            date: [new Date()],
            items: this.fb.array([], Validators.required)
        });

        this.addItem();
        this.items.removeAt(0); // Start empty
    }

    openProductDialog() {
        const dialogRef = this.dialog.open(ProductSelectionDialogComponent, {
            width: '1100px',
            maxWidth: '96vw'
        });

        dialogRef.afterClosed().subscribe((selectedProducts: any[]) => {
            if (selectedProducts && selectedProducts.length > 0) {
                selectedProducts.forEach(product => {
                    const isDuplicate = this.items.controls.some(control => control.get('productId')?.value === product.id);
                    if (!isDuplicate) {
                        const mappedProduct = {
                            ...product,
                            rackName: product.defaultRackName || product.rackName || 'NA'
                        };
                        this.addProductToForm(mappedProduct);
                        // Auto-populate rack list for this item's default warehouse
                        const idx = this.items.length - 1;
                        if (mappedProduct.defaultWarehouseId) {
                            this.locationService.getRacksByWarehouse(mappedProduct.defaultWarehouseId).subscribe((racks: any[]) => {
                                this.racksByItem[idx] = racks;
                                // Auto-select the default rack if available
                                if (mappedProduct.defaultRackId) {
                                    this.items.at(idx).get('rackId')?.setValue(mappedProduct.defaultRackId, { emitEvent: false });
                                }
                            });
                        }
                    }
                });
            }
        });
    }

    addProductToForm(product: any) {
        const itemForm = this.fb.group({
            productId: [product.id, Validators.required],
            productName: [product.productName || product.name, Validators.required],
            availableStock: [product.currentStock || 0],
            rackName: [product.rackName || 'NA'],
            warehouseId: [product.defaultWarehouseId || null],
            rackId: [product.defaultRackId || null],
            qty: [1, [Validators.required, Validators.min(0.01)]],
            unit: [{ value: product.unit || 'PCS', disabled: true }],
            rate: [product.saleRate || product.saleRate || product.rate || product.Rate || product.salePrice || product.price || product.mrp || 0, [Validators.required, Validators.min(0)]],
            discountPercent: [0],
            gstPercent: [product.gstPercent || 18],
            total: [{ value: 0, disabled: true }]
        });

        const index = this.items.length;
        this.items.push(itemForm);
        this.setupItemCalculations(index);
        this.calculateItemTotal(index);
        this.setupUnitFilter(index);
    }

    get items(): FormArray {
        return this.saleForm.get('items') as FormArray;
    }

    addItem() {
        const itemForm = this.fb.group({
            productId: [null, Validators.required],
            productName: ['', Validators.required],
            availableStock: [0],
            rackName: ['NA'],
            warehouseId: [null],
            rackId: [null],
            qty: [1, [Validators.required, Validators.min(0.01)]],
            unit: ['PCS'],
            rate: [0, [Validators.required, Validators.min(0)]],
            discountPercent: [0],
            gstPercent: [18],
            total: [{ value: 0, disabled: true }]
        });

        const index = this.items.length;
        this.items.push(itemForm);
        this.setupItemCalculations(index);
        this.setupUnitFilter(index);
    }

    private setupUnitFilter(index: number) {
        const unitCtrl = this.items.at(index).get('unit');
        if (unitCtrl) {
            this.filteredUnits[index] = unitCtrl.valueChanges.pipe(
                startWith(''),
                map(value => this._filterUnits(value || ''))
            );
        }
    }

    private _filterUnits(value: string): any[] {
        const filterValue = value.toLowerCase();
        return this.units.filter(unit =>
            (unit.unitName || unit.name || '').toLowerCase().includes(filterValue)
        );
    }

    removeItem(index: number) {
        this.items.removeAt(index);
        this.racksByItem.splice(index, 1);
        this.filteredUnits.splice(index, 1);
    }

    getWarehouseName(warehouseId: any): string {
        if (!warehouseId) return 'No WH';
        const wh = this.warehouses.find(w => w.id === warehouseId);
        return wh ? wh.name : 'No WH';
    }

    getRackName(index: number, rackId: any): string {
        const item = this.items.at(index);
        const staticName = item.get('rackName')?.value;
        if (staticName && staticName !== 'NA') return staticName;

        if (!rackId) return 'No Rack';
        const racks = this.racksByItem[index] || [];
        const rack = racks.find((r: any) => r.id === rackId);
        return rack ? rack.name : 'No Rack';
    }

    private setupItemCalculations(index: number) {
        const item = this.items.at(index);
        item.valueChanges.pipe(debounceTime(100)).subscribe(() => {
            this.calculateItemTotal(index);
        });
    }

    private calculateItemTotal(index: number) {
        const item = this.items.at(index);
        const qty = item.get('qty')?.value || 0;
        const rate = item.get('rate')?.value || 0;
        const disc = item.get('discountPercent')?.value || 0;
        const gst = item.get('gstPercent')?.value || 0;
        const avail = item.get('availableStock')?.value || 0;

        // Optional: Warn if qty > availableStock
        if (qty > avail) {
            // Just visual feedback for now, backend will also validate
        }

        const netRate = rate * (1 - disc / 100);
        const tax = netRate * (gst / 100);
        const total = qty * (netRate + tax);

        item.get('total')?.patchValue(total.toFixed(2), { emitEvent: false });
    }

    get grandTotal(): number {
        return this.items.controls.reduce((sum, ctrl) => {
            const val = parseFloat(ctrl.get('total')?.value) || 0;
            return sum + val;
        }, 0);
    }

    loadCustomers() {
        this.inventoryService.getCustomers().subscribe(res => {
            this.customers = res;
            // Pre-select if needed, for now use default 0
        });
    }

    onCustomerSelect(event: any) {
        if (event.value === 0) {
            this.saleForm.patchValue({ customerName: 'Cash Customer' });
        } else {
            const cust = this.customers.find(c => c.id === event.value);
            if (cust) {
                this.saleForm.patchValue({ customerName: cust.name });
            }
        }
    }

    save() {
        if (!this.permissionService.hasPermission('CanAdd')) {
            this.notification.showStatus(false, 'You do not have permission to sell items.');
            return;
        }

        if (this.saleForm.invalid) {
            this.notification.showStatus(false, 'Please correct the highlighted errors.');
            return;
        }

        // Secondary validation for stock
        const stockErrors = this.items.controls.filter(c => c.get('qty')?.value > c.get('availableStock')?.value);
        if (stockErrors.length > 0) {
            this.notification.showStatus(false, 'One or more items have insufficient stock!');
            return;
        }

        this.isSaving = true;
        const payload = {
            ...this.saleForm.getRawValue(),
            createdBy: this.authService.getUserEmail(),
            items: this.items.getRawValue().map((i: any) => ({
                ...i,
                warehouseId: i.warehouseId || null,
                rackId: i.rackId || null
            }))
        };

        this.inventoryService.quickSale(payload).subscribe({
            next: (res) => {
                this.notification.showStatus(true, `Quick Sale Successful! Order: ${res.soNumber}`);
                this.router.navigate(['/app/inventory/salelist']);
            },
            error: (err) => {
                this.notification.showStatus(false, err.error?.message || 'Failed to complete quick sale.');
                this.isSaving = false;
            }
        });
    }
}
