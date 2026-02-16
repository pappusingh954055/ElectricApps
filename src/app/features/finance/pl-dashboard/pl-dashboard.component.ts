import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MaterialModule } from '../../../shared/material/material/material-module';
import { FinanceService } from '../service/finance.service';
import { forkJoin, finalize } from 'rxjs';

@Component({
    selector: 'app-pl-dashboard',
    standalone: true,
    imports: [CommonModule, RouterModule, MaterialModule],
    templateUrl: './pl-dashboard.component.html',
    styleUrl: './pl-dashboard.component.scss'
})
export class PLDashboardComponent implements OnInit {
    totalIncome: number = 0;
    totalExpenses: number = 0;
    totalReceivables: number = 0;
    totalPayables: number = 0;
    isLoading: boolean = false;

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
            if (this.isLoading) {
                console.warn('Force stopping loader after 10s timeout');
                this.isLoading = false;
            }
        }, 10000);
    }

    loadStats() {
        this.isLoading = true;

        forkJoin({
            pl: this.financeService.getProfitAndLossReport(this.filters),
            receivables: this.financeService.getTotalReceivables(),
            payables: this.financeService.getTotalPayables()
        }).pipe(
            finalize(() => {
                console.log('Finalize called - stopping loader');
                this.isLoading = false;
            })
        ).subscribe({
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
            },
            error: (err) => {
                console.error('Error loading dashboard stats:', err);
                console.error('Error details:', JSON.stringify(err, null, 2));
                this.isLoading = false;
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
