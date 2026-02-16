import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../shared/material/material/material-module';
import { FinanceService } from '../service/finance.service';

@Component({
    selector: 'app-pl-dashboard',
    standalone: true,
    imports: [CommonModule, MaterialModule],
    templateUrl: './pl-dashboard.component.html',
    styleUrl: './pl-dashboard.component.scss'
})
export class PLDashboardComponent implements OnInit {
    totalIncome: number = 0;
    totalExpenses: number = 0;

    // Add date filter later
    filters = {
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
        endDate: new Date().toISOString()
    };

    constructor(private financeService: FinanceService) { }

    ngOnInit() {
        this.loadStats();
    }

    loadStats() {
        this.financeService.getProfitAndLossReport(this.filters).subscribe({
            next: (data) => {
                // Assuming API returns { totalIncome: 0, totalExpenses: 0 }
                if (data) {
                    this.totalIncome = data.totalIncome || 0;
                    this.totalExpenses = data.totalExpenses || 0;
                }
            },
            error: (err) => {
                console.error('Error fetching P&L stats:', err);
                // Fallback for demo if API fails (since it's a placeholder in service potentially)
                // this.totalIncome = 125000;
                // this.totalExpenses = 45000;
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
