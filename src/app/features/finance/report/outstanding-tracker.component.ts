import { Component, ViewChild, AfterViewInit, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MaterialModule } from '../../../shared/material/material/material-module';
import { FinanceService } from '../service/finance.service';

export interface OutstandingData {
    customerId: number;
    customerName: string;
    totalAmount: number;
    pendingAmount: number;
    status: string;
    dueDate: string;
}

@Component({
    selector: 'app-outstanding-tracker',
    standalone: true,
    imports: [CommonModule, MaterialModule],
    templateUrl: './outstanding-tracker.component.html',
    styleUrl: './outstanding-tracker.component.scss'
})
export class OutstandingTrackerComponent implements AfterViewInit, OnInit {
    displayedColumns: string[] = ['customerId', 'customerName', 'totalAmount', 'pendingAmount', 'status', 'dueDate', 'actions'];
    dataSource = new MatTableDataSource<OutstandingData>([]);

    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;

    constructor(private financeService: FinanceService) { }

    ngOnInit() {
        this.loadOutstandingData();
    }

    ngAfterViewInit() {
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
    }

    loadOutstandingData() {
        this.financeService.getOutstandingTracker().subscribe({
            next: (data) => {
                this.dataSource.data = data;
            },
            error: (err) => {
                console.error('Error fetching outstanding tracker:', err);
                // Fallback or empty state
            }
        });
    }

    applyFilter(event: Event) {
        const filterValue = (event.target as HTMLInputElement).value;
        this.dataSource.filter = filterValue.trim().toLowerCase();

        if (this.dataSource.paginator) {
            this.dataSource.paginator.firstPage();
        }
    }
}
