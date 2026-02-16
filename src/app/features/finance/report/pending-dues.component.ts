import { Component, ViewChild, AfterViewInit, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { FinanceService } from '../service/finance.service';
import { MaterialModule } from '../../../shared/material/material/material-module';

export interface DuesData {
    supplierId: number;
    supplierName: string;
    pendingAmount: number;
    status: string;
    dueDate: string | Date;
}

@Component({
    selector: 'app-pending-dues',
    standalone: true,
    imports: [CommonModule, MaterialModule],
    templateUrl: './pending-dues.component.html',
    styleUrl: './pending-dues.component.scss'
})
export class PendingDuesComponent implements AfterViewInit, OnInit {
    displayedColumns: string[] = ['supplierId', 'supplierName', 'pendingAmount', 'dueDate', 'status', 'actions'];
    dataSource = new MatTableDataSource<DuesData>([]);
    isLoading = false;
    errorMessage = '';

    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;

    constructor(
        private financeService: FinanceService,
        private router: Router
    ) { }

    ngOnInit() {
        this.loadPendingDues();
    }

    ngAfterViewInit() {
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
    }

    loadPendingDues() {
        this.isLoading = true;
        this.errorMessage = '';

        this.financeService.getPendingDues().subscribe({
            next: (data) => {
                console.log('Pending Dues Response:', data);
                this.dataSource.data = data || [];
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error fetching pending dues:', err);
                this.errorMessage = 'Failed to load pending dues. Please try again.';
                this.dataSource.data = [];
                this.isLoading = false;
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

    makePayment(supplierId: number) {
        // Navigate to payment entry with supplier ID as query param
        this.router.navigate(['/app/finance/suppliers/payment'], {
            queryParams: { supplierId }
        });
    }
}
