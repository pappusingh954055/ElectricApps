import { ChangeDetectorRef, Component, inject, OnInit, ViewChild } from '@angular/core';
import { MaterialModule } from '../../../shared/material/material/material-module';
import { CommonModule } from '@angular/common';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { InventoryService } from '../service/inventory.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog-component/confirm-dialog-component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-so-list',
  standalone: true,
  imports: [MaterialModule, CommonModule],
  templateUrl: './so-list.html',
  styleUrl: './so-list.scss',
})
export class SoList implements OnInit {
  // Added 'customerName' and 'grandTotal' to the columns
  displayedColumns: string[] = ['soNumber', 'soDate', 'customerName', 'grandTotal', 'status', 'actions'];
  dataSource = new MatTableDataSource<any>([]);
  isAdmin: boolean = false;
  isLoading: boolean = false; // Loading indicator ke liye

  private cdr=inject(ChangeDetectorRef);  

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private router = inject(Router);

  constructor(
    private inventoryService: InventoryService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit() {
    this.checkUserRole();
    this.loadOrders();
  }

  checkUserRole() {
    const role = localStorage.getItem('userRole');
    this.isAdmin = role === 'Admin' || role === 'Manager';
  }

  loadOrders() {
    this.isLoading = true;
    this.inventoryService.getSaleOrders().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.isLoading = false;
        this.cdr.detectChanges(); 
      },
      error: (err) => {
        this.isLoading = false;
        this.snackBar.open("Failed to load orders", "Close", { duration: 3000 });
        this.cdr.detectChanges(); 
      }
    });
  }

  confirmOrder(order: any) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: "Confirm Stock Reduction",
        message: `Order #${order.soNumber} confirm karne par inventory se stock kam ho jayega. Kya aap sure hain?`
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Status Draft se Confirmed hone par backend inventory adjust karega
        this.inventoryService.updateSaleOrderStatus(order.id, 'Confirmed').subscribe({
          next: () => {
            this.snackBar.open("Order Confirmed! Inventory Updated.", "OK", { duration: 3000 });
            this.loadOrders(); // List refresh
          },
          error: (err) => {
            this.snackBar.open("Error: " + (err.error?.message || "Action failed"), "Close");
          }
        });
      }
    });
  }

  viewOrder(order: any) {
    // Detail view navigate karne ke liye logic
    this.router.navigate(['/app/inventory/solist/view', order.id]);
  }

  createNewOrder() {
    this.router.navigate(['/app/inventory/solist/add']);
  }
}