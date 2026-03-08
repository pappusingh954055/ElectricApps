import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../shared/material/material/material-module';
import { InventoryService } from '../service/inventory.service';
import { NotificationService } from '../../shared/notification.service';
import { Router } from '@angular/router';
import { Observable, debounceTime, distinctUntilChanged, switchMap, of, catchError, map, startWith } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { ProductSelectionDialogComponent } from '../../../shared/components/product-selection-dialog/product-selection-dialog';
import { PermissionService } from '../../../core/services/permission.service';
import { SupplierModalComponent } from '../supplier-modal/supplier-modal';
import { SupplierService } from '../service/supplier.service';
import { UnitService } from '../../master/units/services/units.service';
import { LocationService } from '../../master/locations/services/locations.service';

@Component({
    selector: 'app-quick-purchase',
    standalone: true,
    imports: [CommonModule, MaterialModule, ReactiveFormsModule, FormsModule],
    templateUrl: './quick-purchase.component.html',
    styleUrls: ['./quick-purchase.component.scss']
})
export class QuickPurchaseComponent implements OnInit {
    private fb = inject(FormBuilder);
    public inventoryService = inject(InventoryService);
    private notification = inject(NotificationService);
    public router = inject(Router);
    private authService = inject(AuthService);
    private dialog = inject(MatDialog);
    private permissionService = inject(PermissionService);
    private supplierService = inject(SupplierService);
    private unitService = inject(UnitService);
    private locationService = inject(LocationService);

    purchaseForm!: FormGroup;
    suppliers: any[] = [];
    units: any[] = [];
    warehouses: any[] = [];
    racksByItem: any[][] = []; // Racks list for each item row
    filteredUnits: Observable<any[]>[] = [];
    filteredSuppliers: any[] = [];
    isLoading = false;
    isSaving = false;

    constructor() {
        this.initForm();
    }

    ngOnInit() {
        this.loadSuppliers();
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
        this.purchaseForm = this.fb.group({
            supplierId: [null, Validators.required],
            supplierName: ['', Validators.required],
            remarks: [''],
            date: [new Date()],
            items: this.fb.array([], Validators.required)
        });

        // Add initial item
        // this.addItem();
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
            rate: [product.basePurchasePrice || product.purchasePrice || product.basePrice || product.rate || 0, [Validators.required, Validators.min(0)]],
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
        return this.purchaseForm.get('items') as FormArray;
    }

    addItem() {
        const itemForm = this.fb.group({
            productId: [null, Validators.required],
            productName: ['', Validators.required],
            availableStock: [0],
            rackName: ['NA'],
            warehouseId: [null],
            rackId: [null],
            unit: ['PCS', Validators.required],
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

    loadSuppliers(selectId?: number) {
        this.supplierService.getSuppliers().subscribe({
            next: (res) => {
                console.log('Suppliers loaded:', res);
                this.suppliers = res;
                this.filteredSuppliers = res;
                if (selectId) {
                    this.purchaseForm.get('supplierId')?.setValue(selectId);
                    const supplier = this.suppliers.find(s => s.id === selectId);
                    if (supplier) {
                        this.purchaseForm.patchValue({ supplierName: supplier.name });
                    }
                }
            },
            error: (err) => console.error('Error loading suppliers:', err)
        });
    }

    openSupplierModal() {
        const dialogRef = this.dialog.open(SupplierModalComponent, {
            width: '600px',
            disableClose: true
        });

        dialogRef.afterClosed().subscribe(res => {
            if (res) {
                // If res is the new supplier object or true, reload and select
                const newId = (typeof res === 'object') ? res.id : undefined;
                this.loadSuppliers(newId);
                this.notification.showStatus(true, 'New supplier added successfully!');
            }
        });
    }

    onSupplierSelect(event: any) {
        const supplier = this.suppliers.find(s => s.id === event.value);
        if (supplier) {
            this.purchaseForm.patchValue({ supplierName: supplier.name });
        }
    }

    save() {
        if (!this.permissionService.hasPermission('CanAdd')) {
            this.notification.showStatus(false, 'You do not have permission to perform this action.');
            return;
        }

        if (this.purchaseForm.invalid) {
            this.notification.showStatus(false, 'Please fill all required fields correctly.');
            return;
        }

        this.isSaving = true;
        const payload = {
            ...this.purchaseForm.getRawValue(),
            createdBy: this.authService.getUserEmail(),
            items: this.items.getRawValue().map((i: any) => ({
                ...i,
                warehouseId: i.warehouseId || null,
                rackId: i.rackId || null
            }))
        };

        this.inventoryService.quickPurchase(payload).subscribe({
            next: (res) => {
                this.notification.showStatus(true, `Quick Purchase Successful! PO: ${res.poNumber}, GRN: ${res.grnNumber}`);
                this.router.navigate(['/app/inventory/polist']);
            },
            error: (err) => {
                this.notification.showStatus(false, err.error?.message || 'Failed to save quick purchase.');
                this.isSaving = false;
            }
        });
    }
}
