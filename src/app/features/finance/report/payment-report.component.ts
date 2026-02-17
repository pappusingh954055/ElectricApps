import { Component, OnInit, ViewChild, AfterViewInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { FinanceService } from '../service/finance.service';
import { MaterialModule } from '../../../shared/material/material/material-module';
import { finalize } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';
import { LoadingService } from '../../../core/services/loading.service';
import { SupplierService, Supplier } from '../../inventory/service/supplier.service';
import { Observable, map, startWith } from 'rxjs';

@Component({
  selector: 'app-payment-report',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './payment-report.component.html',
  styleUrl: './payment-report.component.scss'
})
export class PaymentReportComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['paymentDate', 'supplierName', 'paymentMode', 'referenceNumber', 'amount', 'actions'];
  dataSource = new MatTableDataSource<any>([]);
  isLoading = false;
  isDashboardLoading: boolean = true;
  private isFirstLoad: boolean = true;

  // Search & Autocomplete
  searchControl = new FormControl<string | any>('');
  suppliers: Supplier[] = [];
  filteredSuppliers!: Observable<Supplier[]>;

  private loadingService = inject(LoadingService);
  private supplierService = inject(SupplierService);
  private cdr = inject(ChangeDetectorRef);

  filters = {
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: new Date()
  };

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private financeService: FinanceService,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.isDashboardLoading = true;
    this.isFirstLoad = true;
    this.loadingService.setLoading(true);

    this.loadSuppliers();
    this.loadReport();

    // Autocomplete filtering
    this.filteredSuppliers = this.searchControl.valueChanges.pipe(
      startWith(''),
      map(value => {
        const name = typeof value === 'string' ? value : value?.name;
        return name ? this._filter(name) : this.suppliers.slice();
      })
    );

    // Custom filter predicate for the grid
    this.dataSource.filterPredicate = (data, filter) => {
      const searchStr = filter.toLowerCase();
      return (data.supplierName || '').toLowerCase().includes(searchStr) ||
        (data.referenceNumber || '').toLowerCase().includes(searchStr);
    };

    // Safety timeout
    setTimeout(() => {
      if (this.isDashboardLoading) {
        this.isDashboardLoading = false;
        this.isFirstLoad = false;
        this.loadingService.setLoading(false);
        this.cdr.detectChanges();
      }
    }, 10000);
  }

  private _filter(value: string): Supplier[] {
    const filterValue = value.toLowerCase();
    return this.suppliers.filter(s =>
      (s.name || '').toLowerCase().includes(filterValue) ||
      s.id?.toString().includes(filterValue)
    );
  }

  loadSuppliers() {
    this.supplierService.getSuppliers().subscribe(data => {
      this.suppliers = data || [];

      // Check for query parameters after suppliers are loaded
      const supplierId = this.route.snapshot.queryParams['supplierId'];
      if (supplierId) {
        const supplier = this.suppliers.find(s => s.id === Number(supplierId));
        if (supplier) {
          this.searchControl.setValue(supplier);
          this.applyFilterValue(supplier.name || '');
        }
      }
    });
  }

  onSupplierSelected(event: any) {
    const supplier = event.option.value;
    const searchName = supplier.name || '';
    this.applyFilterValue(searchName);
  }

  applyFilterValue(value: string) {
    this.dataSource.filter = value.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  clearSearch() {
    this.searchControl.setValue('');
    this.applyFilterValue('');
  }

  displayFn(supplier: any): string {
    return supplier && supplier.name ? supplier.name : '';
  }

  get searchDisplayText(): string {
    const value = this.searchControl.value as any;
    if (!value) return '';
    return typeof value === 'string' ? value : (value?.name || '');
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadReport() {
    this.isLoading = true;
    const payload = {
      startDate: this.filters.startDate.toISOString(),
      endDate: this.filters.endDate.toISOString()
    };

    this.financeService.getPaymentsReport(payload).pipe(
      finalize(() => {
        this.isLoading = false;
        if (this.isFirstLoad) {
          this.isFirstLoad = false;
          this.isDashboardLoading = false;
          this.loadingService.setLoading(false);
        }
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (data) => {
        this.dataSource.data = data || [];
      },
      error: (err) => {
        console.error('Error loading payments report', err);
      }
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.applyFilterValue(filterValue);
  }

  printVoucher(payment: any) {
    // We'll implement a simple print window for now
    const printContent = `
      <div style="font-family: sans-serif; padding: 40px; border: 2px solid #333; max-width: 800px; margin: auto;">
        <div style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px;">
          <h1 style="margin: 0; color: #2e7d32;">PAYMENT VOUCHER</h1>
          <p style="margin: 5px 0;">Official Receipt of Payment</p>
        </div>
        
        <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
          <div>
            <strong>Voucher No:</strong> PV-${payment.id}<br>
            <strong>Date:</strong> ${new Date(payment.paymentDate).toLocaleDateString()}
          </div>
          <div style="text-align: right;">
            <strong>Reference:</strong> ${payment.referenceNumber || 'N/A'}<br>
            <strong>Mode:</strong> ${payment.paymentMode}
          </div>
        </div>

        <div style="margin-bottom: 40px; padding: 20px; background: #f9f9f9; border-radius: 8px;">
          <p style="font-size: 1.1rem; margin-bottom: 10px;">Paid To:</p>
          <h2 style="margin: 0;">${payment.supplierName}</h2>
          <p style="color: #666; margin-top: 5px;">Supplier ID: #${payment.supplierId}</p>
        </div>

        <div style="border: 1px solid #ddd; border-radius: 8px; overflow: hidden; margin-bottom: 40px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="background: #eee;">
              <th style="padding: 12px; text-align: left; border-bottom: 1px solid #ddd;">Description</th>
              <th style="padding: 12px; text-align: right; border-bottom: 1px solid #ddd;">Amount</th>
            </tr>
            <tr>
              <td style="padding: 15px; border-bottom: 1px solid #eee;">
                ${payment.remarks || 'Payment towards outstanding dues.'}
              </td>
              <td style="padding: 15px; text-align: right; font-weight: bold; border-bottom: 1px solid #eee;">
                ₹${payment.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </td>
            </tr>
            <tr style="background: #fcfcfc;">
              <td style="padding: 15px; text-align: right;"><strong>TOTAL PAID</strong></td>
              <td style="padding: 15px; text-align: right; font-size: 1.25rem; font-weight: bold; color: #2e7d32;">
                ₹${payment.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </td>
            </tr>
          </table>
        </div>

        <div style="margin-top: 60px; display: flex; justify-content: space-between;">
          <div style="border-top: 1px solid #333; width: 200px; text-align: center; padding-top: 10px;">
            Receiver's Signature
          </div>
          <div style="border-top: 1px solid #333; width: 200px; text-align: center; padding-top: 10px;">
            Authorized Signatory
          </div>
        </div>
      </div>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Payment Voucher - PV-${payment.id}</title>
            <style>@media print { .no-print { display: none; } }</style>
          </head>
          <body onload="window.print();window.close()">
            ${printContent}
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  }
}
