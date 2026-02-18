import { AfterViewInit, ChangeDetectorRef, Component, EventEmitter, inject, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, PageEvent, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, Sort, MatSortModule } from '@angular/material/sort';
import { CdkDragDrop, moveItemInArray, DragDropModule } from '@angular/cdk/drag-drop';
import { GridColumn } from '../../../shared/models/grid-column.model';
import { MaterialModule } from '../../material/material/material-module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AppSearchInput } from '../app-search-input/app-search-input';
import { Router } from '@angular/router';
import { SelectionModel } from '@angular/cdk/collections';
import { NotificationService } from '../../../features/shared/notification.service';
import { ConfirmDialogComponent } from '../confirm-dialog-component/confirm-dialog-component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-enterprise-hierarchical-grid',
  standalone: true,
  imports: [CommonModule,
    MaterialModule,
    ReactiveFormsModule,
    AppSearchInput,
    MatPaginatorModule,
    FormsModule],
  templateUrl: './enterprise-hierarchical-grid-component.html',
  styleUrl: './enterprise-hierarchical-grid-component.scss'
})
export class EnterpriseHierarchicalGridComponent implements OnInit, AfterViewInit, OnChanges {
  @Input() columns: GridColumn[] = [];
  @Input() dataSource = new MatTableDataSource<any>();
  @Input() childColumns: GridColumn[] = [];
  @Input() childDataField: string = 'items';
  @Input() isLoading: boolean = false;
  @Input() totalRecords: number = 0;
  @Input() pageSize: number = 10;
  @Input() addNewLabel: string = 'New Record';
  @Input() addNewRoute: string = '';

  @Output() editRecord = new EventEmitter<any>();
  @Output() deleteRecord = new EventEmitter<any>();
  @Output() bulkDeleteRecords = new EventEmitter<any[]>();
  @Output() onGridStateChange = new EventEmitter<any>();
  @Output() onSelectionChange = new EventEmitter<any>();
  @Output() editChildRecord = new EventEmitter<any>();
  @Output() bulkDeleteChildItems = new EventEmitter<any>();
  @Output() deletePO = new EventEmitter<any>();

  @Output() selectionChanged = new EventEmitter<any[]>();
  @Output() bulkApproveOrders = new EventEmitter<any[]>();
  @Output() bulkDraftApproved = new EventEmitter<any[]>();
  @Output() bulkPORejected = new EventEmitter<any[]>();
  @Output() bulkCreateGrn = new EventEmitter<any[]>();

  @Output() bulkDeleteParentOrders = new EventEmitter<any[]>();
  @Output() actionClicked = new EventEmitter<{ action: string, row: any }>();

  @Input() userRole: string = ''; // Parent se role lene ke liye



  private notification = inject(NotificationService);
  private dialog = inject(MatDialog);

  @ViewChild(MatSort) sort!: MatSort;
  sortChildDir: boolean = true;
  currentChildSortField: string = '';

  selection = new SelectionModel<any>(true, []);
  childSelection = new SelectionModel<any>(true, []);

  globalSearchQuery: string = '';
  expandedElement: any | null = null;
  currentPage: number = 0;
  sortField: string = 'poDate';
  sortDirection: 'asc' | 'desc' | '' = 'desc';
  fromDate: string = '';
  toDate: string = '';



  constructor(private cdr: ChangeDetectorRef, private router: Router) { }

  ngOnInit() {

    this.columns.forEach(col => {
      if (col.visible === undefined) col.visible = true;
    });

    this.dataSource.sort = null;
    setTimeout(() => { this.triggerDataLoad(); }, 0);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['userRole']) {
      console.log('Child Grid mein Role aaya:', changes['userRole'].currentValue);
    }
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.cdr.detectChanges();
  }
  onColumnToggle() {
    this.cdr.detectChanges(); // UI refresh karne ke liye
    // Agar aap grid state save karna chahte hain toh yahan emit bhi kar sakte hain
  }
  get displayedColumns(): string[] {
    const dynamicCols = this.columns.filter(c => c.visible !== false).map(c => c.field);
    // Added 'actions' to ensure the column is rendered by the grid
    return ['select', ...dynamicCols, 'actions'];
  }

  // --- Checkbox Helpers ---
  // isAllSelected(): boolean {
  //   const numSelected = this.selection.selected.length;
  //   const numRows = this.dataSource.data.length;
  //   return numSelected === numRows && numRows > 0;
  // }

  // masterToggle(): void {
  //   this.isAllSelected() ? this.selection.clear() : this.dataSource.data.forEach((row: any) => this.selection.select(row));
  //   this.emitSelection();
  // }

  isRowSelectable(row: any): boolean {
    const data = this.dataSource.data || [];

    if (this.userRole === 'Manager') {
      const submittedCount = data.filter(r => r.status === 'Submitted').length;
      return row.status === 'Submitted' && submittedCount > 1;
    }

    if (this.userRole === 'Warehouse') {
      const approvedCount = data.filter(r => r.status === 'Approved').length;
      return row.status === 'Approved' && approvedCount > 1;
    }

    // Default to User behavior: Only selectable if Draft AND there are multiple Drafts
    const draftCount = data.filter(r => r.status === 'Draft').length;
    return row.status === 'Draft' && draftCount > 1;
  }

  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;

    // Filter rows based on role logic
    const selectableRows = this.dataSource.data.filter(row => this.isRowSelectable(row)).length;

    return numSelected === selectableRows && selectableRows > 0;
  }

  masterToggle() {
    if (this.isAllSelected()) {
      this.selection.clear();
    } else {
      // 1. Pehle pura selection clear karein safety ke liye
      this.selection.clear();
      this.childSelection.clear();

      // 2. Choose rows based on role
      this.dataSource.data.forEach(row => {
        if (this.isRowSelectable(row)) {
          this.selection.select(row);
        }
      });
    }
    this.emitSelection();
  }

  // masterToggle() {
  //   if (this.isAllSelected()) {
  //     this.selection.clear();
  //   } else {
  //     // Jab Parent Header select ho:
  //     this.childSelection.clear(); // 1. Saare child selections saaf
  //     this.dataSource.data.forEach(row => this.selection.select(row)); // 2. Saare parents select
  //   }
  //   this.emitSelection();
  // }

  isAllChildSelected(element: any): boolean {
    const items = element[this.childDataField] || [];
    return items.length > 0 && items.every((item: any) => this.childSelection.isSelected(item));
  }

  toggleAllColumns(state: boolean) {
    this.columns.forEach(col => col.visible = state);
    this.onColumnToggle();
  }

  childMasterToggle(parentRow: any) {
    if (this.isAllChildSelected(parentRow)) {
      this.childSelection.clear();
    } else {
      // Jab Child Header select ho:
      this.selection.clear(); // 1. Saare parent selections saaf (Header included)

      // 2. Sirf is specific parent ke items ko select karein
      if (parentRow[this.childDataField]) {
        parentRow[this.childDataField].forEach((item: any) => this.childSelection.select(item));
      }
    }
    this.emitSelection();
  }
  emitSelection(): void {
    const selectionData = {
      parents: this.selection.selected,
      children: this.childSelection.selected
    };
    this.onSelectionChange.emit(selectionData);
    this.selectionChanged.emit(this.selection.selected); // Emit array for parent
  }

  // --- Drag & Drop ---
  drop(event: CdkDragDrop<string[]>): void {
    if (event.previousIndex > 0 && event.currentIndex > 0) {
      moveItemInArray(this.columns, event.previousIndex - 1, event.currentIndex - 1);
    }
  }

  dropChild(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.childColumns, event.previousIndex, event.currentIndex);
    this.cdr.detectChanges();
  }

  // --- Search & Filters ---
  onGlobalSearch(value: any) { this.globalSearchQuery = typeof value === 'string' ? value : value?.target?.value || ''; this.currentPage = 0; this.triggerDataLoad(); }
  applyDateFilter() { this.currentPage = 0; this.triggerDataLoad(); }
  onSortChange(sort: Sort) { this.sortField = sort.active; this.sortDirection = sort.direction as any; this.currentPage = 0; this.triggerDataLoad(); }
  onPageChange(event: PageEvent) { this.currentPage = event.pageIndex; this.pageSize = event.pageSize; this.triggerDataLoad(); }
  applyFilter() { this.currentPage = 0; this.triggerDataLoad(); }

  triggerDataLoad() {
    this.selection.clear();
    this.childSelection.clear();
    const state =
    {
      pageIndex: this.currentPage,
      pageSize: this.pageSize,
      sortField: this.sortField || 'poDate',
      sortOrder: this.sortDirection || 'desc',
      fromDate: this.fromDate,
      toDate: this.toDate,
      globalSearch: this.globalSearchQuery,
      filters: this.columns.filter(c => c.filterValue).map(c => ({ field: c.field, value: c.filterValue }))
    };
    this.onGridStateChange.emit(state);
  }

  clearAllFilters() { this.columns.forEach(col => col.filterValue = ''); this.fromDate = ''; this.toDate = ''; this.globalSearchQuery = ''; this.applyFilter(); }
  clearGlobalSearch() { this.globalSearchQuery = ''; this.currentPage = 0; this.triggerDataLoad(); }

  // --- UI Row Helpers ---
  toggleRow(element: any) { this.expandedElement = this.expandedElement === element ? null : element; this.cdr.detectChanges(); }

  onResize(column: GridColumn, event: MouseEvent) {
    if (!column.isResizable) return;
    const startX = event.pageX; const startWidth = column.width || 150;
    const move = (e: MouseEvent) => { column.width = Math.max(80, startWidth + (e.pageX - startX)); this.cdr.detectChanges(); };
    const up = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); };
    document.addEventListener('mousemove', move); document.addEventListener('mouseup', up);
  }

  toggleColumn(column: GridColumn) { column.visible = !column.visible; this.cdr.detectChanges(); }

  applyChildFilter(element: any, column: any) {
    if (!element.originalChildData) element.originalChildData = [...element[this.childDataField]];
    const val = column.filterValue?.toLowerCase().trim();
    element[this.childDataField] = val ? element.originalChildData.filter((r: any) => String(r[column.field]).toLowerCase().includes(val)) : element.originalChildData;
  }

  sortChild(field: string, element: any) {
    this.currentChildSortField = field;
    this.sortChildDir = !this.sortChildDir;
    const data = element[this.childDataField];
    data.sort((a: any, b: any) => {
      const valA = a[field]; const valB = b[field];
      return this.sortChildDir ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
    });
  }

  onResizeChild(col: any, event: MouseEvent) {
    event.preventDefault();
    const startX = event.pageX; const startWidth = col.width || 120;
    const onMouseMove = (e: MouseEvent) => { col.width = Math.max(60, startWidth + (e.pageX - startX)); };
    const onMouseUp = () => { document.removeEventListener('mousemove', onMouseMove); document.removeEventListener('mouseup', onMouseUp); };
    document.addEventListener('mousemove', onMouseMove); document.addEventListener('mouseup', onMouseUp);
  }

  onAddNewClick() { if (this.addNewRoute) this.router.navigate([this.addNewRoute]); }

  // --- Action Methods ---

  onEdit(row: any, event?: MouseEvent) {
    if (event) { event.stopPropagation(); event.preventDefault(); }
    alert('Edit function called for: ' + (row.poNo || 'Selected Row'));
    this.editRecord.emit(row);
  }

  // 1. Single Parent Delete
  // enterprise-hierarchical-grid.ts

  SingleParentDelete(row: any, event?: MouseEvent) {
    if (event) event.stopPropagation();

    // 1. Domain Rule Check (Draft Only)
    if (row.status !== 'Draft') {
      this.notification.showStatus(false, `Dude, the command is '${row.status}'. Only drafts will be deleted!`);
      return;
    }

    // 2. Browser confirm() ki jagah Modal Popup
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Remove Purchase Order',
        message: `Do you want to remove PO: ${row.poNumber}?`,
        confirmText: 'Remove',
        cancelText: 'Keep',
        confirmColor: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.deleteRecord.emit(row);
      }
    });
  }



  onEditChild(child: any, event?: any) {
    if (event && event.stopPropagation) {
      event.stopPropagation();
    }

    const dataToEdit = this.expandedElement ? this.expandedElement : child;

    this.editRecord.emit(dataToEdit);
  }

  // Single Item Delete (Trash icon click par)
  onDeleteChild(parentRow: any, childRow: any) {
    this.bulkDeleteChildItems.emit({
      parent: parentRow,
      child: childRow,
      isBulk: false
    });
  }

  // 2. Bulk Parent Delete 
  // enterprise-hierarchical-grid.ts

  onBulkDeleteClick() {
    const selectedRows = this.selection.selected;

    if (selectedRows.length === 0) return;

    // Validation Check
    const invalidOrders = selectedRows.filter(r => r.status !== 'Draft');
    if (invalidOrders.length > 0) {
      // Yahan aap toastr ya notification dikha sakte hain alert ki jagah
      this.notification.showStatus(false, 'Only draft orders can be bulk deleted!');
      return;
    }

    // Ab confirm() ki jagah Modal trigger karenge
    this.openBulkDeleteDialog(selectedRows);
  }

  openBulkDeleteDialog(selectedRows: any[]) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Remove Purchase Order(s)',
        message: `Do you want to remove ${selectedRows.length} selected orders?`,
        confirmText: 'Remove',
        cancelText: 'Keep',
        confirmColor: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Agar user ne 'Remove' click kiya, tab emit karo
        this.bulkDeleteParentOrders.emit(selectedRows);
        this.selection.clear(); // Selection clear karna mat bhoolna
      }
    });
  }

  // Child Delete Trigger (Bulk)
  onBulkDeleteChildItems(element: any) {
    this.bulkDeleteChildItems.emit({
      parent: element,
      child: this.childSelection.selected,
      isBulk: true
    });
  }

  onBulkApproveClick() {
    if (this.selection.selected.length > 0) {
      this.bulkApproveOrders.emit(this.selection.selected);
      // Selection clear is handled by parent or manual? 
      // Usually parent refreshes data which clears selection, but let's leave it to parent.
    }
  }

  onBulkDraftApprovedClick() {
    if (this.selection.selected.length > 0) {
      this.bulkDraftApproved.emit(this.selection.selected);
    }
  }

  onBulkPORejectedClick() {
    if (this.selection.selected.length > 0) {
      this.bulkPORejected.emit(this.selection.selected);
    }
  }

  onBulkCreateGrnClick() {
    if (this.selection.selected.length > 0) {
      this.bulkCreateGrn.emit(this.selection.selected);
    }
  }
  // enterprise-hierarchical-grid.ts

  // Jab Parent checkbox click ho
  onParentSelectionChange(row: any) {
    this.selection.toggle(row);

    if (this.selection.hasValue()) {
      // Agar Parent select hua, toh Child selection ko khali kar do
      this.childSelection.clear();
    }
  }

  // Jab Child checkbox click ho
  onChildSelectionChange(item: any) {
    this.childSelection.toggle(item);

    if (this.childSelection.hasValue()) {
      // Agar Child select hua, toh Parent selection ko khali kar do
      this.selection.clear();
    }
  }

  // Jab Parent row ka checkbox click ho
  onParentCheck(row: any) {
    // Exclusive logic: Parent select hua toh Child ki saari selections saaf
    this.childSelection.clear();
    this.selection.toggle(row);
  }

  // Jab Child (Item) row ka checkbox click ho
  onChildCheck(item: any) {
    // Exclusive logic: Child select hua toh Parent ki saari selections saaf
    this.selection.clear();
    this.childSelection.toggle(item);
  }

  // enterprise-hierarchical-grid.ts

  calculateSubTotal(element: any): number {
    // Logic: Grand Total mein se Tax hata do toh Sub-Total mil jayega
    const grand = element.grandTotal || 0;
    const tax = element.totalTaxAmount || 0;
    return grand - tax;
  }

  onDeletePO(row: any) {
    // Parent ko signal bhej rahe hain delete karne ke liye [cite: 2026-01-22]
    this.deletePO.emit(row);
  }

  // 3. Ye functions buttons se call honge
  onSubmitPO(row: any) {
    this.actionClicked.emit({ action: 'SUBMIT', row: row });
  }

  onApprovePO(row: any) {
    this.actionClicked.emit({ action: 'APPROVE', row: row });
  }

  onRejectPO(row: any) {
    this.actionClicked.emit({ action: 'REJECT', row: row });
  }

  // Child Grid TS [cite: 2026-01-22]


  onPrintPO(row: any) {
    // Print ke liye hum aksar parent ko batate hain ya alag window open karte hain
    console.log('Printing PO:', row.poNumber);
    // Example: Window open for PDF
    // window.open(`${environment.apiUrl}/reports/po-print/${row.id}`, '_blank');
  }

  handleAction(actionName: string, rowData: any) {
    // Hum action ka naam aur poora row data emit kar rahe hain
    this.actionClicked.emit({
      action: actionName,
      row: rowData
    });
  }
}