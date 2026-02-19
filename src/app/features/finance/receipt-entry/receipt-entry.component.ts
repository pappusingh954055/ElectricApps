import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MaterialModule } from '../../../shared/material/material/material-module';
import { FinanceService } from '../service/finance.service';
import { customerService } from '../../master/customer-component/customer.service';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { StatusDialogComponent } from '../../../shared/components/status-dialog-component/status-dialog-component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog-component/confirm-dialog-component';
import { LoadingService } from '../../../core/services/loading.service';

@Component({
  selector: 'app-receipt-entry',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './receipt-entry.component.html',
  styleUrl: './receipt-entry.component.scss'
})
export class ReceiptEntryComponent implements OnInit {
  customerControl = new FormControl('');
  filteredCustomers!: Observable<any[]>;
  customers: any[] = [];
  isLoading: boolean = false;
  isDashboardLoading: boolean = true;
  private isFirstLoad: boolean = true;
  currentBalance: number | null = null;
  private loadingService = inject(LoadingService);
  private cdr = inject(ChangeDetectorRef);

  receipt: any = {
    customerId: null,
    amount: null,
    paymentMode: 'Cash',
    referenceNumber: '',
    paymentDate: new Date(),
    remarks: '',
    createdBy: 'Admin'
  };

  constructor(
    private financeService: FinanceService,
    private customerService: customerService,
    private route: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog
  ) { }

  ngOnInit() {
    this.isDashboardLoading = true;
    this.isFirstLoad = true;
    this.loadingService.setLoading(true);

    this.loadCustomers();

    this.filteredCustomers = this.customerControl.valueChanges.pipe(
      startWith(''),
      map(value => {
        const name = typeof value === 'string' ? value : (value as any)?.name;
        return name ? this._filter(name as string) : this.customers.slice();
      }),
    );

    // Check for query params (e.g. from Sales List)
    this.route.queryParams.subscribe(params => {
      if (params['customerId']) {
        this.receipt.customerId = Number(params['customerId']);
        if (params['amount']) this.receipt.amount = Number(params['amount']);
        if (params['invoiceNo']) {
          this.receipt.referenceNumber = params['invoiceNo'];
          this.receipt.remarks = `Receipt for Invoice: ${params['invoiceNo']}`;
        }

        if (this.customers.length > 0) {
          this.preselectCustomer(this.receipt.customerId);
        }
      } else {
        // If no customer in route, stop loader early
        if (this.isFirstLoad) {
          this.isFirstLoad = false;
          this.isDashboardLoading = false;
          this.loadingService.setLoading(false);
          this.cdr.detectChanges();
        }
      }
    });

    // Safety timeout
    setTimeout(() => {
      if (this.isDashboardLoading) {
        this.isDashboardLoading = false;
        this.isFirstLoad = false;
        this.loadingService.setLoading(false);
        this.cdr.detectChanges();
      }
    }, 10000);
  }

  private _filter(name: string): any[] {
    const filterValue = name.toLowerCase();
    return this.customers.filter(customer =>
      ((customer as any).name as string).toLowerCase().includes(filterValue) ||
      customer.id.toString().includes(filterValue)
    );
  }

  displayFn(customer: any): string {
    return customer && customer.name ? `${customer.name} (#${customer.id})` : '';
  }

  loadCustomers() {
    this.customerService.getCustomersLookup().subscribe((data: any) => {
      this.customers = Array.isArray(data) ? data : [];
      if (this.receipt.customerId) {
        this.preselectCustomer(this.receipt.customerId);
      }
      this.cdr.detectChanges();
    });
  }

  onCustomerSelected(event: any) {
    const customer = event.option.value;
    this.receipt.customerId = customer.id;
    this.loadCustomerBalance(customer.id);
  }

  loadCustomerBalance(customerId: number) {
    this.financeService.getCustomerLedger(customerId).subscribe(data => {
      if (data && data.ledger && data.ledger.length > 0) {
        this.currentBalance = data.ledger[0].balance;
      } else {
        this.currentBalance = 0;
      }

      if (this.isFirstLoad) {
        this.isFirstLoad = false;
        this.isDashboardLoading = false;
        this.loadingService.setLoading(false);
      }
      this.cdr.detectChanges();
    });
  }

  preselectCustomer(id: number) {
    const customer = this.customers.find(c => c.id === id);
    if (customer) {
      this.customerControl.setValue(customer);
      this.loadCustomerBalance(id);
    }
  }

  saveReceipt() {
    if (!this.receipt.customerId || !this.receipt.amount) {
      this.dialog.open(StatusDialogComponent, {
        data: { isSuccess: false, message: 'Please select a customer and enter amount.' }
      });
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirm Receipt',
        message: `Are you sure you want to record a receipt of ₹${this.receipt.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}?`,
        confirmText: 'Record Receipt',
        confirmColor: 'primary'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.isLoading = true;
        const payload = {
          ...this.receipt,
          paymentDate: this.receipt.paymentDate instanceof Date ? this.receipt.paymentDate.toISOString() : this.receipt.paymentDate
        };

        this.financeService.recordCustomerReceipt(payload).subscribe({
          next: (res) => {
            this.isLoading = false;
            const successDialog = this.dialog.open(StatusDialogComponent, {
              data: {
                isSuccess: true,
                title: 'Success',
                message: 'Receipt Recorded Successfully!',
                actions: [
                  { label: 'Print Receipt', role: 'print', color: 'primary' },
                  { label: 'OK', role: 'ok' }
                ]
              }
            });

            const customer = this.customers.find(c => c.id === this.receipt.customerId);
            const receiptData = {
              ...this.receipt,
              id: res.id || 'NEW',
              customerName: customer ? customer.name : 'Customer'
            };

            successDialog.afterClosed().subscribe(result => {
              const customerId = this.receipt.customerId;
              if (result === 'print') {
                this.printVoucher(receiptData);
              }
              this.resetForm();
              if (customerId) {
                this.router.navigate(['/app/finance/customers/ledger'], {
                  queryParams: { customerId: customerId }
                });
              } else {
                this.router.navigate(['/app/finance/customers/tracker']);
              }
            });
          },
          error: (err) => {
            this.isLoading = false;
            console.error(err);
            const errorMessage = err.error?.message || err.error || 'Failed to record receipt.';
            this.dialog.open(StatusDialogComponent, {
              data: {
                isSuccess: false,
                title: 'Action Failed',
                message: errorMessage
              }
            });
          }
        });
      }
    });
  }

  printVoucher(receipt: any) {
    const printContent = `
          <div style="font-family: sans-serif; padding: 40px; border: 2px solid #333; max-width: 800px; margin: auto;">
            <div style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px;">
              <h1 style="margin: 0; color: #1976d2;">PAYMENT RECEIPT</h1>
              <p style="margin: 5px 0;">Official Acknowledgement of Payment</p>
            </div>
            
            <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
              <div>
                <strong>Receipt No:</strong> CR-${receipt.id}<br>
                <strong>Date:</strong> ${new Date(receipt.paymentDate).toLocaleDateString()}
              </div>
              <div style="text-align: right;">
                <strong>Reference:</strong> ${receipt.referenceNumber || 'N/A'}<br>
                <strong>Mode:</strong> ${receipt.paymentMode}
              </div>
            </div>
    
            <div style="margin-bottom: 40px; padding: 20px; background: #f0f7ff; border-radius: 8px;">
              <p style="font-size: 1.1rem; margin-bottom: 10px;">Received From:</p>
              <h2 style="margin: 0;">${receipt.customerName}</h2>
              <p style="color: #666; margin-top: 5px;">Customer ID: #${receipt.customerId}</p>
            </div>
    
            <div style="border: 1px solid #ddd; border-radius: 8px; overflow: hidden; margin-bottom: 40px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr style="background: #eee;">
                  <th style="padding: 12px; text-align: left; border-bottom: 1px solid #ddd;">Description</th>
                  <th style="padding: 12px; text-align: right; border-bottom: 1px solid #ddd;">Amount</th>
                </tr>
                <tr>
                  <td style="padding: 15px; border-bottom: 1px solid #eee;">
                    ${receipt.remarks || 'Payment received towards outstanding balance.'}
                  </td>
                  <td style="padding: 15px; text-align: right; font-weight: bold; border-bottom: 1px solid #eee;">
                    ₹${receipt.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
                <tr style="background: #fcfcfc;">
                  <td style="padding: 15px; text-align: right;"><strong>TOTAL RECEIVED</strong></td>
                  <td style="padding: 15px; text-align: right; font-size: 1.25rem; font-weight: bold; color: #1976d2;">
                    ₹${receipt.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </table>
            </div>
    
            <div style="margin-top: 60px; display: flex; justify-content: space-between;">
              <div style="border-top: 1px solid #333; width: 200px; text-align: center; padding-top: 10px;">
                Customer Signature
              </div>
              <div style="border-top: 1px solid #333; width: 200px; text-align: center; padding-top: 10px;">
                Authorized Receiver
              </div>
            </div>
          </div>
        `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
            <html>
              <head>
                <title>Payment Receipt - CR-${receipt.id}</title>
                <style>@media print { .no-print { display: none; } }</style>
              </head>
              <body onload="window.print();window.close()">
                ${printContent}
              </body>
            </html>
          `);
      printWindow.document.close();
    }
  }

  resetForm() {
    this.receipt = {
      customerId: null,
      amount: null,
      paymentMode: 'Cash',
      referenceNumber: '',
      paymentDate: new Date(),
      remarks: '',
      createdBy: 'Admin'
    };
    this.customerControl.setValue('');
    this.currentBalance = null;
  }
}
