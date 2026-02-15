import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core'; // CDR add kiya
import { FormGroup, FormBuilder, Validators, FormArray, FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MaterialModule } from '../../../../shared/material/material/material-module';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { PurchaseReturnService } from '../services/purchase-return.service';
import { StatusDialogComponent } from '../../../../shared/components/status-dialog-component/status-dialog-component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-purchase-return-form',
  standalone: true,
  imports: [CommonModule, MaterialModule, ReactiveFormsModule, FormsModule],
  templateUrl: './purchase-return-form.html',
  styleUrl: './purchase-return-form.scss',
})
export class PurchaseReturnForm implements OnInit {
  returnForm!: FormGroup;
  suppliers: any[] = [];
  displayedColumns: string[] = ['product', 'rejectedQty', 'returnQty', 'rate', 'total', 'actions'];
  tableDataSource: any[] = []; // Explicit data source for MatTable binding

  // CDR inject kiya taaki table bind ho sake [cite: 2026-02-03]
  private cdr = inject(ChangeDetectorRef);

  constructor(
    private fb: FormBuilder,
    private prService: PurchaseReturnService,
    private snackBar: MatSnackBar,
    public router: Router,
    private dialog: MatDialog,
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.GetSuppliersForPurchaseReturnAsync();
  }

  initForm() {
    this.returnForm = this.fb.group({
      supplierId: ['', Validators.required],
      returnDate: [new Date(), Validators.required],
      remarks: ['', Validators.required],
      items: this.fb.array([])
    });
  }

  get items() {
    return this.returnForm.get('items') as FormArray;
  }

  GetSuppliersForPurchaseReturnAsync() {
    this.prService.GetSuppliersForPurchaseReturnAsync().subscribe({
      next: (data) => {
        this.suppliers = data || [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error("Error loading suppliers", err)
    });
  }

  receivedStockItems: any[] = []; // Raw flat list
  groupedReceivedStock: any[] = []; // Hierarchy: GRN -> Items
  filteredGroupedStock: any[] = []; // For Search results
  stockSearchText: string = '';
  expandedGrns: Set<string> = new Set();
  isLoadingStock: boolean = false;

  onSupplierChange(supplierId: number) {
    if (!supplierId) return;

    this.items.clear();
    this.tableDataSource = [];
    this.receivedStockItems = [];
    this.groupedReceivedStock = [];
    this.filteredGroupedStock = [];
    this.expandedGrns.clear();
    this.isLoadingStock = true;

    // 1. Load Rejected Items (Auto-load)
    this.prService.getRejectedItems(supplierId).subscribe({
      next: (res) => {
        this.cdr.detectChanges();
        if (res && res.length > 0) {
          res.forEach(item => {
            this.addReturnItem(item, 'Rejected');
          });
          this.tableDataSource = [...this.items.controls];
          this.cdr.detectChanges();
        }
      },
      error: () => { }
    });

    // 2. Load Received Stock (For Search/Select)
    this.prService.getReceivedStock(supplierId).subscribe({
      next: (data) => {
        this.receivedStockItems = data || [];
        this.groupStockByGrn();
        this.isLoadingStock = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoadingStock = false;
        this.cdr.detectChanges();
      }
    });
  }

  groupStockByGrn() {
    const groups: { [key: string]: any } = {};

    // Filter out items without a product ID or name to avoid empty UI rows
    const validItems = this.receivedStockItems.filter(item => item && item.productId);

    validItems.forEach(item => {
      // Normalize properties (handle both PascalCase and camelCase from API)
      const ref = item.grnRef || item.GrnRef || 'N/A';
      const pName = item.productName || item.ProductName || '';
      const avail = item.availableQty ?? item.AvailableQty ?? 0;
      const rate = item.rate ?? item.Rate ?? 0;
      const rDate = item.receivedDate || item.ReceivedDate || item.podate || new Date();

      if (!groups[ref]) {
        groups[ref] = {
          grnRef: ref,
          receivedDate: rDate,
          items: []
        };
      }

      // Update item with normalized values for UI binding
      item.grnRef = ref;
      item.productName = pName.trim() === '' ? "Product-" + item.productId.substring(0, 8) : pName;
      item.availableQty = avail;
      item.rate = rate;
      item.receivedDate = rDate;

      item.selected = this.isItemInGrid(item);
      groups[ref].items.push(item);
    });

    // Sorting: Primary sorting by Received Date (DESC), secondary by GRN Ref (DESC)
    this.groupedReceivedStock = Object.values(groups).sort((a: any, b: any) => {
      const dateB = new Date(b.receivedDate).getTime();
      const dateA = new Date(a.receivedDate).getTime();

      if (dateB !== dateA) return dateB - dateA;
      return b.grnRef.localeCompare(a.grnRef);
    });

    this.filteredGroupedStock = [...this.groupedReceivedStock];
    this.cdr.detectChanges();
  }

  isItemInGrid(item: any): boolean {
    return this.items.controls.some(c =>
      c.get('productId')?.value === item.productId &&
      c.get('grnRef')?.value === item.grnRef
    );
  }

  filterStock() {
    const search = this.stockSearchText.toLowerCase().trim();
    if (!search) {
      this.filteredGroupedStock = [...this.groupedReceivedStock];
    } else {
      this.filteredGroupedStock = this.groupedReceivedStock.filter(g =>
        g.grnRef.toLowerCase().includes(search) ||
        g.items.some((i: any) => i.productName.toLowerCase().includes(search))
      );
    }
    this.cdr.detectChanges();
  }

  toggleGrn(grnRef: string) {
    if (this.expandedGrns.has(grnRef)) {
      this.expandedGrns.delete(grnRef);
    } else {
      this.expandedGrns.add(grnRef);
    }
    this.cdr.detectChanges();
  }

  onItemToggle(item: any) {
    if (item.selected) {
      // Add to grid if not exists
      const isDuplicate = this.addReturnItem(item, 'Received');
      if (isDuplicate) {
        this.openDialog(false, `${item.productName} is already added.`);
        item.selected = true; // Stay checked
      }
    } else {
      // Remove from grid
      const index = this.items.controls.findIndex(c =>
        c.get('productId')?.value === item.productId &&
        c.get('grnRef')?.value === item.grnRef
      );
      if (index !== -1) {
        this.items.removeAt(index);
        this.tableDataSource = [...this.items.controls];
      }
    }
    this.cdr.detectChanges();
  }

  addReturnItem(item: any, type: string) {
    const existingIndex = this.items.controls.findIndex(c =>
      c.get('productId')?.value === item.productId &&
      c.get('grnRef')?.value === item.grnRef
    );

    if (existingIndex !== -1) {
      return true; // Is duplicate
    }

    this.items.push(this.fb.group({
      productId: [item.productId],
      productName: [item.productName],
      grnRef: [item.grnRef],
      maxQty: [item.availableQty || item.rejectedQty],
      returnQty: [0, [Validators.required, Validators.min(0), Validators.max(item.availableQty || item.rejectedQty)]],
      rate: [item.rate],
      total: [0],
      itemType: [type] // Useful for UI differentiation
    }));

    this.tableDataSource = [...this.items.controls];
    this.cdr.detectChanges();
    return false; // Not a duplicate
  }

  calculateTotal(index: number) {
    const item = this.items.at(index);
    const qty = item.get('returnQty')?.value || 0;
    const rate = item.get('rate')?.value || 0;
    item.get('total')?.setValue(qty * rate);
  }

  onSubmit() {
    if (this.returnForm.invalid) return;

    const rawData = this.returnForm.getRawValue();
    const itemsToReturn = rawData.items.filter((item: any) => item.returnQty > 0);

    if (itemsToReturn.length === 0) {
      this.openDialog(false, 'At least one item must be returned.');
      return;
    }

    const payload = {
      supplierId: rawData.supplierId,
      returnDate: rawData.returnDate,
      remarks: rawData.remarks,
      items: itemsToReturn
    };

    this.prService.savePurchaseReturn(payload).subscribe({
      next: (res) => {
        this.cdr.detectChanges();
        const dialogRef = this.dialog.open(StatusDialogComponent, {
          width: '400px',
          data: {
            isSuccess: true,
            message: `Purchase Return ${res.returnNumber} successfully created.`
          }
        });

        dialogRef.afterClosed().subscribe(() => {
          this.router.navigate(['/app/inventory/purchase-return']);
        });
      },
      error: (err) => {
        this.cdr.detectChanges();
        this.openDialog(false, err.error?.message || 'An error occurred while saving the data.');
      }
    });
  }

  openDialog(isSuccess: boolean, message: string) {
    this.dialog.open(StatusDialogComponent, {
      width: '400px',
      data: { isSuccess, message }
    });
  }

  removeItem(index: number) {
    const itemToRemove = this.items.at(index).value;
    this.items.removeAt(index);
    this.tableDataSource = [...this.items.controls];

    // Update selection state in the raw list for synchronization
    const stockItem = this.receivedStockItems.find(i =>
      i.productId === itemToRemove.productId && i.grnRef === itemToRemove.grnRef
    );
    if (stockItem) {
      stockItem.selected = false;
    }

    this.cdr.detectChanges();
  }
}



