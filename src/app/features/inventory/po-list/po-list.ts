import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MaterialModule } from '../../../shared/material/material/material-module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { EnterpriseHierarchicalGridComponent } from '../../../shared/components/enterprise-hierarchical-grid-component/enterprise-hierarchical-grid-component';
import { MatTableDataSource } from '@angular/material/table';
import { GridColumn } from '../../../shared/models/grid-column.model';
import { InventoryService } from '../service/inventory.service';

@Component({
  selector: 'app-po-list',
  standalone: true,
  imports: [
    MaterialModule,
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    EnterpriseHierarchicalGridComponent,
  ],
  providers: [CurrencyPipe, DatePipe],
  templateUrl: './po-list.html',
  styleUrl: './po-list.scss',
})
export class PoList implements OnInit {
  public dataSource = new MatTableDataSource<any>([]);
  public totalRecords: number = 0;
  public pageSize: number = 10;
  public isLoading: boolean = false;

  public poColumns: GridColumn[] = [];
  public itemColumns: GridColumn[] = [];

  private currentGridState: any = {};

  constructor(
    private poService: InventoryService,
    private cdr: ChangeDetectorRef,
    private datePipe: DatePipe,
    private currencyPipe: CurrencyPipe
  ) { }

  ngOnInit() {
    this.initColumns();
    // initialLoad ki zaroorat nahi hai, Grid ka ngOnInit khud triggerDataLoad call karega
  }

  private initColumns() {
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
      { field: 'supplierName', header: 'Supplier Name', sortable: true, isResizable: true, width: 200, isFilterable: true },
      {
        field: 'grandTotal',
        header: 'Grand Total',
        sortable: true,
        isResizable: true,
        width: 130,
        align: 'left',
        cell: (row: any) => this.currencyPipe.transform(row.grandTotal, 'INR', 'symbol', '1.2-2')
      },
      { field: 'status', header: 'Status', sortable: true, isResizable: true, width: 100, isFilterable: true }
    ];

    this.itemColumns = [
      { field: 'productName', header: 'Product Name', width: 200, sortable: true, isFilterable: true, isResizable: true },
      { field: 'qty', header: 'Qty', width: 80, align: 'left' },
      { field: 'unit', header: 'Unit', width: 80, align: 'left' },
      {
        field: 'rate', header: 'Rate', width: 100, align: 'left',
        cell: (row: any) => this.currencyPipe.transform(row.rate, 'INR', 'symbol', '1.2-2')
      },
      {
        field: 'discountPercent', header: 'Dis(%)', width: 100, align: 'left',
        cell: (row: any) => this.currencyPipe.transform(row.discount, 'INR', 'symbol', '1.2-2')
      },
      {
        field: 'gstPercent', header: 'GST(%)', width: 100, align: 'left',
        cell: (row: any) => this.currencyPipe.transform(row.gstPercent, 'INR', 'symbol', '1.2-2')
      },
      {
        field: 'taxAmount', header: 'Tax Amount', width: 120, align: 'left',
        cell: (row: any) => this.currencyPipe.transform(row.taxAmount, 'INR', 'symbol', '1.2-2')
      },
      {
        field: 'total', header: 'Total', width: 120, align: 'left',
        cell: (row: any) => this.currencyPipe.transform(row.total, 'INR', 'symbol', '1.2-2')
      }
    ];
  }

  // Central control function: Grid se jo bhi change hoga, yahan se API call jayegi
  public onGridStateChange(state: any) {
    this.currentGridState = state;
    this.loadData(state);
  }

  public loadData(state: any) {
    this.isLoading = true;
    this.cdr.detectChanges();

    // Mapping column filters if any
    const columnFilters = state && state.filters ? state.filters : [];

    const requestPayload = {
      pageIndex: state.pageIndex ?? 0,
      pageSize: state.pageSize ?? 10,
      sortField: state.sortField ?? 'PoDate',
      sortOrder: state.sortOrder ?? 'desc',
      filter: state.globalSearch || '', // Grid ke Search input se aa raha hai
      fromDate: state.fromDate ? this.datePipe.transform(state.fromDate, 'yyyy-MM-dd') : null,
      toDate: state.toDate ? this.datePipe.transform(state.toDate, 'yyyy-MM-dd') : null,
      filters: columnFilters
    };

    this.poService.getPagedOrders(requestPayload).subscribe({
      next: (res) => {
        this.dataSource.data = res.data || [];
        this.totalRecords = res.totalRecords || 0;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('API Error:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }
}