import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { MaterialModule } from '../../../shared/material/material/material-module';
import { CommonModule, DecimalPipe } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { DashboardService } from '../services/dashboard.service';
import { Router } from '@angular/router';
import { ProductService } from '../../master/product/service/product.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-dashboard-component',
  standalone: true,
  imports: [MaterialModule, CommonModule, BaseChartDirective],
  providers: [DecimalPipe],
  templateUrl: './dashboard-component.html',
  styleUrl: './dashboard-component.scss',
})
export class DashboardComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  private decimalPipe = inject(DecimalPipe);
  private router = inject(Router);

  isExcelLoading = false;
  isPdfLoading = false;
  isDashboardLoading = true;
  private productService = inject(ProductService);

  displayedColumns: string[] = ['product', 'type', 'quantity', 'date', 'status'];

  // Stats array with 'hasAlert' property for type safety in HTML
  stats: any[] = [
    { title: 'Total Sales', value: '₹0', icon: 'trending_up', color: '#4caf50' },
    { title: 'Purchase Orders', value: '0 Pending', icon: 'shopping_cart', color: '#2196f3' },
    { title: 'Stock Value', value: '₹0', icon: 'inventory_2', color: '#ff9800', subLabel: '0 Units' },
    { title: 'Low Stock', value: 'Loading...', icon: 'report_problem', color: '#f44336', hasAlert: false }
  ];

  recentActivities: any[] = [];

  public lineChartData: ChartConfiguration['data'] = {
    datasets: [
      { data: [], label: 'Sales', borderColor: '#4caf50', backgroundColor: 'rgba(76,175,80,0.1)', fill: true, tension: 0.4 },
      { data: [], label: 'Purchase', borderColor: '#2196f3', backgroundColor: 'rgba(33,150,243,0.1)', fill: true, tension: 0.4 }
    ],
    labels: []
  };

  public donutChartData: ChartConfiguration['data'] = {
    datasets: [{
      data: [0, 0, 0],
      backgroundColor: ['#4caf50', '#2196f3', '#ff9800'],
      hoverOffset: 15,
      borderWidth: 0
    }],
    labels: ['Finished', 'Raw Material', 'Damaged']
  };

  public chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { padding: 20, usePointStyle: true } }
    }
  };

  constructor(private dashboardService: DashboardService) { }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData() {
    this.isDashboardLoading = true; // Loader ON
    this.cdr.detectChanges();

    // Teeno APIs ko ek saath call kar rahe hain
    forkJoin({
      summary: this.dashboardService.getSummary(),
      charts: this.dashboardService.getChartData(),
      activities: this.dashboardService.getRecentActivities()
    }).subscribe({
      next: (res) => {
        // 1. Summary Stats Update
        this.stats[0].value = '₹' + (this.decimalPipe.transform(res.summary.totalSales, '1.0-0') || '0');
        this.stats[1].value = (res.summary.pendingPurchaseOrders || 0) + ' Pending';
        this.stats[2].value = '₹' + (this.decimalPipe.transform(res.summary.totalStockValue, '1.0-0') || '0');
        this.stats[2].subLabel = (this.decimalPipe.transform(res.summary.totalStockItems) || '0') + ' Units In Stock';

        const lowStockCount = res.summary.lowStockAlertCount || 0;
        this.stats[3].value = lowStockCount + (lowStockCount === 1 ? ' Item' : ' Items');
        this.stats[3].hasAlert = lowStockCount > 0;
        this.stats = [...this.stats];

        // 2. Charts Update
        this.lineChartData.labels = res.charts.labels;
        this.lineChartData.datasets[0].data = res.charts.salesData;
        this.lineChartData.datasets[1].data = res.charts.purchaseData;
        this.donutChartData.datasets[0].data = [
          res.charts.finishedGoods || 0,
          res.charts.rawMaterials || 0,
          res.charts.damagedItems || 0
        ];
        this.lineChartData = { ...this.lineChartData };
        this.donutChartData = { ...this.donutChartData };

        // 3. Recent Activities
        this.recentActivities = res.activities;

        // Sab kuch load hone ke baad Loader OFF
        this.isDashboardLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Dashboard load error:', err);
        this.isDashboardLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  get hasDonutData(): boolean {
    const data = this.donutChartData.datasets[0].data;
    return data ? data.some(val => (val as number) > 0) : false;
  }

  navigateToLowStockReport() {
    console.log('Low Stock Card Clicked. Stats Data:', this.stats[3]);

    // Testing ke liye condition hata di taaki har baar redirect ho
    console.log('Force Redirecting to Product List...');
    this.router.navigate(['/app/master/products'], {
      queryParams: { filter: 'lowstock' }
    });
  }
  exportToExcel() {
    this.isExcelLoading = true; // Spinner start karein

    this.productService.downloadLowStockExcel().subscribe({
      next: (blob: Blob) => {
        this.cdr.detectChanges();
        // 1. Blob se URL create karein
        const url = window.URL.createObjectURL(blob);

        // 2. Ek hidden anchor element banayein
        const a = document.createElement('a');
        a.href = url;

        // 3. File ka naam set karein
        a.download = `LowStockReport_${new Date().getTime()}.xlsx`;

        // 4. Click trigger karke download start karein
        a.click();

        // 5. Cleanup: URL aur element ko remove karein
        window.URL.revokeObjectURL(url);
        a.remove();

        this.isExcelLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Excel export failed:', err);
        this.isExcelLoading = false;
        // Yahan aap toast message ya notification dikha sakte hain
      }
    });
  }
  exportToPdf() {
    this.isPdfLoading = true; // Dashboard par spinner dikhane ke liye
    this.cdr.detectChanges();
    this.productService.downloadLowStockPdf().subscribe({
      next: (blob: Blob) => {
        // 1. Browser memory mein temporary URL banayein
        const url = window.URL.createObjectURL(blob);

        // 2. Hidden link element create karein
        const a = document.createElement('a');
        a.href = url;

        // 3. File name set karein
        a.download = `LowStock_Report_${new Date().toLocaleDateString()}.pdf`;

        // 4. Download trigger karein
        a.click();

        // 5. Cleanup
        window.URL.revokeObjectURL(url);
        a.remove();

        this.isPdfLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('PDF export failed:', err);
        this.isPdfLoading = false;
        this.cdr.detectChanges();
      }
    });
  }
}