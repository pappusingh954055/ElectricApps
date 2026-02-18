import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MaterialModule } from '../../../shared/material/material/material-module';
import { FinanceService } from '../service/finance.service';
import { forkJoin, finalize } from 'rxjs';
import { LoadingService } from '../../../core/services/loading.service';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';

@Component({
    selector: 'app-pl-dashboard',
    standalone: true,
    imports: [CommonModule, RouterModule, MaterialModule, BaseChartDirective],
    templateUrl: './pl-dashboard.component.html',
    styleUrl: './pl-dashboard.component.scss'
})
export class PLDashboardComponent implements OnInit {
    private cdr = inject(ChangeDetectorRef);
    private loadingService = inject(LoadingService);

    totalIncome: number = 0;
    totalExpenses: number = 0;
    totalReceivables: number = 0;
    totalPayables: number = 0;
    isDashboardLoading: boolean = true;

    // Chart Data
    public pieChartData: ChartConfiguration['data'] = {
        datasets: [{
            data: [],
            backgroundColor: ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3'],
            hoverOffset: 15,
            borderWidth: 0
        }],
        labels: []
    };

    public barChartData: ChartConfiguration['data'] = {
        datasets: [
            { data: [], label: 'Income', backgroundColor: 'rgba(75, 192, 192, 0.7)', order: 2 },
            { data: [], label: 'Expenses', backgroundColor: 'rgba(255, 99, 132, 0.7)', order: 2 },
            {
                data: [],
                label: 'Net Profit',
                type: 'line',
                borderColor: '#3f51b5',
                backgroundColor: 'rgba(63, 81, 181, 0.2)',
                fill: false,
                tension: 0.4,
                order: 1
            }
        ],
        labels: []
    };

    public topCustomersData: ChartConfiguration['data'] = {
        datasets: [{
            data: [],
            backgroundColor: 'rgba(63, 81, 181, 0.7)',
            borderColor: '#3f51b5',
            borderWidth: 1,
            label: 'Outstanding Amount',
            barThickness: 20
        }],
        labels: []
    };

    public chartOptions: ChartConfiguration['options'] = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'right', labels: { padding: 20, usePointStyle: true } }
        }
    };

    public barChartOptions: ChartConfiguration['options'] = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top' }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(0, 0, 0, 0.1)',
                    display: true,
                }
            },
            x: {
                grid: {
                    display: false
                }
            }
        }
    };

    public horizontalBarOptions: ChartConfiguration['options'] = {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: (context) => `₹${(context.parsed.x || 0).toLocaleString()}`
                }
            }
        },
        scales: {
            x: {
                beginAtZero: true,
                grid: { display: false }
            },
            y: {
                grid: { display: false }
            }
        }
    };

    // Add date filter later
    filters = {
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
        endDate: new Date().toISOString()
    };

    constructor(private financeService: FinanceService) { }

    ngOnInit() {
        this.loadStats();

        // Safety timeout - force stop loader after 10 seconds
        setTimeout(() => {
            if (this.isDashboardLoading) {
                console.warn('Force stopping loader after 10s timeout');
                this.isDashboardLoading = false;
                this.loadingService.setLoading(false);
                this.cdr.detectChanges();
            }
        }, 10000);
    }

    loadStats() {
        this.isDashboardLoading = true;
        this.loadingService.setLoading(true); // Global loading ON
        this.cdr.detectChanges();

        forkJoin({
            pl: this.financeService.getProfitAndLossReport(this.filters),
            receivables: this.financeService.getTotalReceivables(),
            payables: this.financeService.getTotalPayables(),
            expenseChart: this.financeService.getExpenseChartData(this.filters),
            trends: this.financeService.getMonthlyTrends(6),
            topCustomers: this.financeService.getOutstandingTracker({ pageNumber: 1, pageSize: 5, sortBy: 'PendingAmount', sortOrder: 'desc' })
        }).subscribe({
            next: (results) => {
                console.log('All Dashboard Data:', results);

                // Map P&L
                if (results.pl) {
                    this.totalIncome = results.pl.totalIncome || results.pl.TotalReceipts || 0;
                    this.totalExpenses = results.pl.totalExpenses || results.pl.TotalPayments || 0;
                }

                // Map Receivables
                if (results.receivables) {
                    this.totalReceivables = results.receivables.totalOutstanding ?? results.receivables.TotalOutstanding ?? 0;
                }

                // Map Payables
                if (results.payables) {
                    this.totalPayables = results.payables.totalPending ?? results.payables.TotalPending ?? 0;
                }

                // Map Chart Data
                if (results.expenseChart && Array.isArray(results.expenseChart)) {
                    this.pieChartData.labels = results.expenseChart.map(x => x.category || x.Category);
                    this.pieChartData.datasets[0].data = results.expenseChart.map(x => x.amount || x.Amount);
                    this.pieChartData = { ...this.pieChartData };
                }

                // Map Trend Data
                if (results.trends) {
                    const receipts = results.trends.receipts || results.trends.Receipts || [];
                    const payments = results.trends.payments || results.trends.Payments || [];
                    const expenses = results.trends.expenses || results.trends.Expenses || [];

                    // Always show the last 6 months (even if 0 data)
                    const monthsLabels: string[] = [];
                    for (let i = 5; i >= 0; i--) {
                        const d = new Date();
                        d.setMonth(d.getMonth() - i);
                        monthsLabels.push(d.toLocaleString('default', { month: 'short', year: 'numeric' }));
                    }

                    this.barChartData.labels = monthsLabels;

                    // Map Receipts (Income)
                    this.barChartData.datasets[0].data = monthsLabels.map(m => {
                        const row = receipts.find((r: any) => (r.month || r.Month) === m);
                        return row ? (row.amount || row.Amount || 0) : 0;
                    });

                    // Map Payments + Expenses (Expenses)
                    this.barChartData.datasets[1].data = monthsLabels.map(m => {
                        const pRow = payments.find((p: any) => (p.month || p.Month) === m);
                        const eRow = expenses.find((e: any) => (e.month || e.Month) === m);
                        const pAmt = pRow ? (pRow.amount || pRow.Amount || 0) : 0;
                        const eAmt = eRow ? (eRow.amount || eRow.Amount || 0) : 0;
                        return pAmt + eAmt;
                    });

                    // Calculate Net Profit for the line chart
                    this.barChartData.datasets[2].data = monthsLabels.map((m, index) => {
                        const inc = (this.barChartData.datasets[0].data[index] as number) || 0;
                        const exp = (this.barChartData.datasets[1].data[index] as number) || 0;
                        return inc - exp;
                    });

                    this.barChartData = { ...this.barChartData };
                }

                // Map Top Customers
                if (results.topCustomers) {
                    const wrapper = results.topCustomers.items || results.topCustomers.Items;
                    const items = wrapper?.items || wrapper?.Items || [];

                    if (Array.isArray(items) && items.length > 0) {
                        this.topCustomersData.labels = items.map((c: any) => c.customerName || c.CustomerName);
                        this.topCustomersData.datasets[0].data = items.map((c: any) => c.pendingAmount || c.PendingAmount);
                        this.topCustomersData = { ...this.topCustomersData };

                        // Fallback for Total Receivables if card call yielded 0
                        if (this.totalReceivables === 0) {
                            this.totalReceivables = results.topCustomers.totalOutstandingAmount || results.topCustomers.TotalOutstandingAmount || 0;
                        }
                    }
                }

                // Sab kuch load hone ke baad Loader OFF
                this.isDashboardLoading = false;
                this.loadingService.setLoading(false); // Global loading OFF
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Error loading dashboard stats:', err);
                console.error('Error details:', JSON.stringify(err, null, 2));
                this.isDashboardLoading = false;
                this.loadingService.setLoading(false); // Global loading OFF on error
                this.cdr.detectChanges();
            }
        });
    }

    get netProfit(): number {
        return this.totalIncome - this.totalExpenses;
    }

    get profitMargin(): number {
        if (this.totalIncome === 0) return 0;
        return (this.netProfit / this.totalIncome) * 100;
    }
}
