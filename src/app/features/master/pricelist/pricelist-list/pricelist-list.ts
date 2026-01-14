import { ChangeDetectorRef, Component, OnChanges, OnInit, ViewChild } from '@angular/core';

import { PriceListService } from '../service/pricelist.service';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { materialize } from 'rxjs';
import { MaterialModule } from '../../../../shared/material/material/material-module';
import { Router, RouterLink } from '@angular/router';
import { PriceListModel } from '../models/pricelist.model';
import { ServerDatagridComponent } from '../../../../shared/components/server-datagrid-component/server-datagrid-component';
import { GridRequest } from '../../../../shared/models/grid-request.model';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog-component/confirm-dialog-component';
import { ApiResultDialog } from '../../../shared/api-result-dialog/api-result-dialog';


@Component({
  selector: 'app-pricelist-list',
  imports: [CommonModule, ReactiveFormsModule, 
    MaterialModule, RouterLink, ServerDatagridComponent],
    providers:[DatePipe],
  templateUrl: './pricelist-list.html',
  styleUrl: './pricelist-list.scss',
})
export class PricelistList implements OnInit {

  columns = [
    { field: 'name', header: 'Price Name', sortable:true },
    { field: 'code', header: 'Code', sortable:true },
    { field: 'pricetype', header: 'Price Type', sortable:true },
    {
      field: 'validfrom',
      header: 'Valid From',sortable:true,
      cell: (row: any) =>
        row.createdOn ?
          this.datePipe.transform(row.validfrom, 'dd-MMM-yyyy') : '-'
    },
    {
      field: 'validto',
      header: 'Valid To', sortable:true,
      cell: (row: any) =>
        row.validto ?
          this.datePipe.transform(row.validto, 'dd-MMM-yyyy') : '-'
    },
    { field: 'description', header: 'Description' },
    {
      field: 'createdon',
      header: 'CreatedOn',
      cell: (row: any) =>
        row.createdon ?
          this.datePipe.transform(row.createdon, 'dd-MMM-yyyy') : '-'
    },
    {
      field: 'isactive',
      header: 'Status',
      cell: (row: any) => row.isactive ? 'Yes' : 'No'
    }
  ];

  loading = false;
  totalCount = 0;

  selectedRows: any[] = [];
  lastRequest!: GridRequest;

  @ViewChild(ServerDatagridComponent)
  grid!: ServerDatagridComponent<any>;

  data: PriceListModel[] = [];

  constructor(
    private service: PriceListService,
    private router: Router, private dialog: MatDialog,
    private datePipe: DatePipe,
    private cdr: ChangeDetectorRef) { }



  ngOnInit(): void {
    // Initial load
    this.loadPriceLists({
      pageNumber: 1,
      pageSize: 10,
      sortDirection: 'desc'
    });
  }

  loadPriceLists(request: GridRequest): void {
    this.lastRequest = request; // ✅ store last state
    this.loading = true;
    this.cdr.detectChanges();

    this.service.getPaged(request).subscribe({
      next: res => {
        this.data = res.items;
        this.totalCount = res.totalCount;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: err => {
        console.error(err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }


  onEdit(row: any): void {
    this.router.navigate(['/app/master/pricelists/edit', row.id]);
  }

  deleteCategory(category: any): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Confirm Delete',
          message: 'Are you sure you want to delete this price list?'
        }
      })
      .afterClosed()
      .subscribe(confirm => {
        if (!confirm) return;

        this.loading = true;

        this.service.delete(category.id).subscribe({
          next: res => {
            this.loading = false;

            this.dialog.open(ApiResultDialog, {
              data: {
                success: true,
                message: res.message
              }
            });

            this.loadPriceLists(this.lastRequest);
          },
          error: err => {
            this.loading = false;

            const message =
              err?.error?.message || 'Unable to delete Price list';

            this.dialog.open(ApiResultDialog, {
              data: {
                success: false,
                message
              }
            });
          }
        });
      });
  }

  reloadGrid(): void {
    this.loadPriceLists(this.lastRequest);
  }

  confirmBulkDelete(): void {
    if (!this.selectedRows.length) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Delete Price List',
        message: `Are you sure you want to delete ${this.selectedRows.length} selected price list?`
      }
    });

    dialogRef.afterClosed().subscribe(confirm => {
      if (!confirm) return;

      const ids = this.selectedRows.map(x => x.id);

      this.loading = true;

      this.service.deleteMany(ids).subscribe({
        next: (res) => {
          // 🔄 Reload grid
          this.loadPriceLists(this.lastRequest);

          // 🧹 Clear selection via grid reference
          this.grid.clearSelection();

          this.loading = false;
          this.dialog.open(ApiResultDialog, {
            data: {
              success: true,
              message: res.message
            }
          });

          this.cdr.detectChanges();
        },
        error: err => {
          console.error(err);
          this.loading = false;
          const message =
            err?.error?.message || 'Unable to delete price list';

          this.dialog.open(ApiResultDialog, {
            data: {
              success: false,
              message
            }
          });
          this.cdr.detectChanges();
        }
      });
    });
  }

  onSelectionChange(rows: any[]) {
    this.selectedRows = rows;
  }
}