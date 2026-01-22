import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MaterialModule } from '../../../shared/material/material/material-module';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EnterpriseHierarchicalGridComponent } from '../../../shared/components/enterprise-hierarchical-grid-component/enterprise-hierarchical-grid-component';
import { MatTableDataSource } from '@angular/material/table';
import { GridColumn } from '../../../shared/models/grid-column.model';
import { InventoryService } from '../service/inventory.service';

@Component({
  selector: 'app-po-list',
  standalone: true,
  imports: [MaterialModule, ReactiveFormsModule, CommonModule, RouterLink, EnterpriseHierarchicalGridComponent],
  providers: [CurrencyPipe, DatePipe],
  templateUrl: './po-list.html',
  styleUrl: './po-list.scss',
})
export class PoList implements OnInit {

  // Initialization with empty arrays to prevent 'undefined' errors in template
  public dataSource = new MatTableDataSource<any>([]);
  public totalRecords: number = 0;
  public pageSize: number = 10;
  public isLoading: boolean = false;

  public poColumns: GridColumn[] = [];
  public itemColumns: GridColumn[] = [];

  constructor(
    private poService: InventoryService,
    private cdr: ChangeDetectorRef, // Inject karein
    private datePipe: DatePipe // Date formatting ke liye behtar approach
  ) { }

  ngOnInit() {
    this.initColumns();
    // Default load mein parameters ko backend se match karein
    this.loadData({
      pageIndex: 0,
      pageSize: this.pageSize,
      sortField: 'PoDate', // Backend naming convention check karein
      sortOrder: 'desc',
      filter: '' // Default empty string bhejein taaki 400 error na aaye
    });
  }

  private initColumns() {
    // Master Columns (As per dbo.PurchaseOrders screenshot)
    this.poColumns = [
      { field: 'poNumber', header: 'PO No.', sortable: true, isFilterable: true, isResizable: true, width: 150 },
      {
        field: 'poDate',
        header: 'Date',
        sortable: true,
        isResizable: true,
        width: 120,
        cell: (row: any) => this.datePipe.transform(row.poDate, 'MM/dd/yyyy')
      },
      { field: 'supplierId', header: 'Supplier ID', sortable: true, isResizable: true, width: 100, isFilterable: true },
      { field: 'grandTotal', header: 'Grand Total', sortable: true, isResizable: true, align: 'right', width: 130, isFilterable: true },
      { field: 'status', header: 'Status', sortable: true, isResizable: true, width: 100, isFilterable: true }
    ];

    // Child Columns (As per dbo.PurchaseOrderItems screenshot)
    this.itemColumns = [
      { field: 'productId', header: 'Product ID', isResizable: true, width: 250, isFilterable: true },
      { field: 'qty', header: 'Qty', isResizable: true, align: 'left', width: 80, isFilterable: true },
      { field: 'unit', header: 'Unit', isResizable: true, width: 80, isFilterable: true },
      { field: 'rate', header: 'Rate', isResizable: true, align: 'left', width: 100, isFilterable: true },
      { field: 'total', header: 'Line Total', isResizable: true, align: 'left', width: 120, isFilterable: true }, // 'total' camelCase mein hai
      { field: 'taxAmount', header: 'Tax', isResizable: true, align: 'left', width: 100, isFilterable: true }
    ];
  }

  onGridStateChange(state: any) {
    this.loadData(state);
  }

  loadData(state: any) {
    this.isLoading = true;
    this.cdr.detectChanges(); // View check se pehle state update notify karein

    const queryParams = {
      pageIndex: state.pageIndex ?? 0,
      pageSize: state.pageSize ?? 10,
      sortField: state.sortField ?? 'PoDate',
      sortOrder: state.sortOrder ?? 'desc',
      filter: state.filter ?? '' // Empty string bhejein taaki 400 error na aaye
    };

    this.poService.getOrders(queryParams).subscribe({
      next: (res) => {
        console.log('PO Data Loaded:', res);
        this.dataSource.data = res.data || [];
        this.totalRecords = res.totalRecords || 0;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }
}