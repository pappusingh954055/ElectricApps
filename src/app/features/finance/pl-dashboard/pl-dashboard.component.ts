import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MaterialModule } from '../../../shared/material/material/material-module';
import { FinanceService } from '../service/finance.service';
import { forkJoin, finalize } from 'rxjs';
import { LoadingService } from '../../../core/services/loading.service';

@Component({
    selector: 'app-pl-dashboard',
    standalone: true,
    imports: [CommonModule, RouterModule, MaterialModule],
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
            payables: this.financeService.getTotalPayables()
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
                    this.totalReceivables = results.receivables.totalOutstanding || results.receivables.TotalOutstanding || 0;
                }

                // Map Payables
                if (results.payables) {
                    this.totalPayables = results.payables.totalPending || results.payables.TotalPending || 0;
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
