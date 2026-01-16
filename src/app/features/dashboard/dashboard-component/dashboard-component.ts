import { Component } from '@angular/core';
import { MaterialModule } from '../../../shared/material/material/material-module';
import { CommonModule } from '@angular/common';
import { BaseChartDirective  } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';

@Component({
  selector: 'app-dashboard-component',
  imports: [MaterialModule, CommonModule, BaseChartDirective],
  templateUrl: './dashboard-component.html',
  styleUrl: './dashboard-component.scss',
})
export class DashboardComponent {
displayedColumns: string[] = ['product', 'type', 'quantity', 'date', 'status'];
  
  stats = [
    { title: 'Total Sales', value: '₹4,50,000', icon: 'trending_up', color: '#4caf50' },
    { title: 'Purchase Orders', value: '24 Pending', icon: 'shopping_cart', color: '#2196f3' },
    { title: 'Stock Items', value: '1,240 Units', icon: 'inventory_2', color: '#ff9800' },
    { title: 'Low Stock', value: '5 Items', icon: 'report_problem', color: '#f44336' }
  ];

  recentActivities = [
    { product: 'Wireless Mouse', type: 'Sale', qty: '12', date: '2024-03-20', status: 'Completed' },
    { product: 'Dell Monitor', type: 'Purchase', qty: '05', date: '2024-03-19', status: 'Pending' },
    { product: 'USB-C Hub', type: 'Purchase', qty: '20', date: '2024-03-18', status: 'Shipped' },
  ];

  // 📈 Line Chart Config
  public lineChartData: ChartConfiguration['data'] = {
    datasets: [
      { data: [65, 59, 80, 81, 56, 55, 40], label: 'Sales', borderColor: '#4caf50', backgroundColor: 'rgba(76,175,80,0.1)', fill: true, tension: 0.4 },
      { data: [28, 48, 40, 19, 86, 27, 90], label: 'Purchase', borderColor: '#2196f3', backgroundColor: 'rgba(33,150,243,0.1)', fill: true, tension: 0.4 }
    ],
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul']
  };

  // 🍩 Donut Chart Config (Fixes Overflow)
  public donutChartData: ChartConfiguration['data'] = {
    datasets: [{ 
      data: [300, 500, 100], 
      backgroundColor: ['#4caf50', '#2196f3', '#ff9800'],
      hoverOffset: 15,
      borderWidth: 0
    }],
    labels: ['Finished', 'Raw Material', 'Damaged']
  };

  public chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false, // Container ke hisaab se resize hoga
    plugins: { 
      legend: { position: 'bottom', labels: { padding: 20, usePointStyle: true } } 
    }
  };

  exportExcel() { console.log('Exporting Excel...'); }
  exportPDF() { console.log('Downloading PDF...'); }
}
