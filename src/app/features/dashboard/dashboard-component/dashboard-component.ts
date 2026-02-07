import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { MaterialModule } from '../../../shared/material/material/material-module';
import { CommonModule, DecimalPipe } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { DashboardService } from '../services/dashboard.service';
import { Router } from '@angular/router';

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
    // 1. Summary Widgets Update
    this.dashboardService.getSummary().subscribe({
      next: (res) => {
        // Sales aur Purchase update
        this.stats[0].value = '₹' + (this.decimalPipe.transform(res.totalSales, '1.0-0') || '0');
        this.stats[1].value = (res.pendingPurchaseOrders || 0) + ' Pending';

        // Stock Value aur Units
        this.stats[2].value = '₹' + (this.decimalPipe.transform(res.totalStockValue, '1.0-0') || '0');
        this.stats[2].subLabel = (this.decimalPipe.transform(res.totalStockItems) || '0') + ' Units In Stock';

        // FIX: Dynamic Low Stock Alert
        const lowStockCount = res.lowStockAlertCount || 0;
        this.stats[3].value = lowStockCount + (lowStockCount === 1 ? ' Item' : ' Items');
        this.stats[3].hasAlert = lowStockCount > 0;

        // Spread operator use kar rahe hain taaki Angular change detection ko refresh kar sake
        this.stats = [...this.stats]; 
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching summary:', err);
        this.stats[3].value = 'Error';
      }
    });

    // 2. Charts Update
    this.dashboardService.getChartData().subscribe({
      next: (res) => {
        this.lineChartData.labels = res.labels;
        this.lineChartData.datasets[0].data = res.salesData;
        this.lineChartData.datasets[1].data = res.purchaseData;

        this.donutChartData.datasets[0].data = [
          res.finishedGoods || 0,
          res.rawMaterials || 0,
          res.damagedItems || 0
        ];

        this.lineChartData = { ...this.lineChartData };
        this.donutChartData = { ...this.donutChartData };
        this.cdr.detectChanges();
      }
    });

    // 3. Recent Activities Update
    this.dashboardService.getRecentActivities().subscribe({
      next: (res) => {
        this.recentActivities = res;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading recent activities:', err)
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
  exportExcel() { console.log('Exporting Excel...'); }
  exportPDF() { console.log('Downloading PDF...'); }
}