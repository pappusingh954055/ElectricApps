import { Component, ViewChild, AfterViewInit, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { FinanceService } from '../service/finance.service';
import { MaterialModule } from '../../../shared/material/material/material-module';
import { customerService } from '../../master/customer-component/customer.service';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { StatusDialogComponent } from '../../../shared/components/status-dialog-component/status-dialog-component';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
    selector: 'app-customer-ledger',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, MaterialModule],
    templateUrl: './customer-ledger.component.html',
    styleUrl: './customer-ledger.component.scss'
})
export class CustomerLedgerComponent implements OnInit, AfterViewInit {
    customerControl = new FormControl('');
    filteredCustomers!: Observable<any[]>;
    customers: any[] = [];

    customerId: number | null = null;
    ledgerData: any = null;
    displayedColumns: string[] = ['transactionDate', 'transactionType', 'referenceId', 'description', 'debit', 'credit', 'balance'];
    dataSource = new MatTableDataSource<any>([]);
    currentBalance: number = 0;
    isLoading: boolean = false;

    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;

    constructor(
        private financeService: FinanceService,
        private customerService: customerService,
        private dialog: MatDialog,
        private route: ActivatedRoute,
        private router: Router
    ) { }

    ngOnInit() {
        this.loadCustomers();
        this.filteredCustomers = this.customerControl.valueChanges.pipe(
            startWith(''),
            map(value => {
                const name = typeof value === 'string' ? value : (value as any)?.name;
                return name ? this._filter(name as string) : this.customers.slice();
            }),
        );
    }

    ngAfterViewInit() {
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
    }

    private _filter(name: string): any[] {
        const filterValue = name.toLowerCase();
        return this.customers.filter(customer =>
            (customer.name as string).toLowerCase().includes(filterValue) ||
            customer.id.toString().includes(filterValue)
        );
    }

    displayFn(customer: any): string {
        return customer && customer.name ? `${customer.name} (#${customer.id})` : '';
    }

    loadCustomers() {
        this.customerService.getCustomersLookup().subscribe((data: any) => {
            this.customers = Array.isArray(data) ? data : [];

            // Param check after load
            this.route.queryParams.subscribe(params => {
                if (params['customerId']) {
                    const id = Number(params['customerId']);
                    const customer = this.customers.find(c => c.id === id);
                    if (customer) {
                        this.customerControl.setValue(customer);
                        this.customerId = id;
                        this.loadLedger();
                    }
                }
            });
        });
    }

    handleEnterKey() {
        if (this.customerId) {
            this.loadLedger();
        }
    }

    onCustomerSelected(event: any) {
        const customer = event.option.value;
        this.customerId = customer.id;
        this.loadLedger();
    }

    loadLedger() {
        if (this.customerId && this.customerId > 0) {
            this.isLoading = true;
            this.financeService.getCustomerLedger(this.customerId).subscribe({
                next: (data) => {
                    this.isLoading = false;
                    this.ledgerData = data;
                    if (data && data.ledger) {
                        this.dataSource.data = data.ledger;
                        if (data.ledger.length > 0) {
                            this.currentBalance = data.ledger[0].balance;
                        } else {
                            this.currentBalance = 0;
                        }
                    } else {
                        this.dataSource.data = [];
                        this.currentBalance = 0;
                    }
                },
                error: (err) => {
                    this.isLoading = false;
                    console.error('Error fetching ledger:', err);
                    this.dialog.open(StatusDialogComponent, {
                        data: {
                            isSuccess: false,
                            message: 'Failed to fetch ledger. Please check Connection or Customer ID.',
                            status: 'error'
                        }
                    });
                    this.ledgerData = null;
                    this.dataSource.data = [];
                }
            });
        }
    }
    goToReceipt() {
        if (!this.customerId) return;
        this.router.navigate(['/app/finance/customers/receipt'], {
            queryParams: {
                customerId: this.customerId,
                amount: this.currentBalance
            }
        });
    }
}
