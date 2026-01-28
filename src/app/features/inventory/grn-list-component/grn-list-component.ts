import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { MaterialModule } from '../../../shared/material/material/material-module';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Router, RouterLink } from '@angular/router';
import { InventoryService } from '../service/inventory.service';
import { merge, of } from 'rxjs';
import { startWith, switchMap, map, catchError, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { PoSelectionDialog } from '../po-selection-dialog/po-selection-dialog';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-grn-list-component',
  standalone: true,
  imports: [CommonModule, MaterialModule, ReactiveFormsModule],
  templateUrl: './grn-list-component.html',
  styleUrl: './grn-list-component.scss',
})
export class GrnListComponent implements OnInit, AfterViewInit {
  // Columns matching Backend DTO
  displayedColumns: string[] = ['grnNo', 'refPO', 'supplierName', 'receivedDate', 'status', 'actions'];
  dataSource = new MatTableDataSource<any>([]);

  // Search and Pagination states
  resultsLength = 0;
  isLoadingResults = true;
  searchControl = new FormControl('');



  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private router: Router,
    private inventoryService: InventoryService, private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    // Search input par debounce lagaya hai taaki har word par API call na ho [cite: 2026-01-22]
    this.searchControl.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(() => {
      this.paginator.pageIndex = 0;
      this.loadGRNData();
    });
  }

  ngAfterViewInit() {
    // Sorting change hone par page index reset karein [cite: 2026-01-22]
    this.sort.sortChange.subscribe(() => (this.paginator.pageIndex = 0));

    // Merge Sort, Page aur Search events into one stream [cite: 2026-01-22]
    this.loadGRNData();
  }

  loadGRNData() {
    merge(this.sort.sortChange, this.paginator.page)
      .pipe(
        startWith({}),
        switchMap(() => {
          // Loader ON: API call start [cite: 2026-01-22]
          this.isLoadingResults = true;

          return this.inventoryService.getGRNPagedList(
            this.sort.active,
            this.sort.direction,
            this.paginator.pageIndex,
            this.paginator.pageSize,
            this.searchControl.value || ''
          ).pipe(
            catchError(() => {
              // Loader OFF: Agar API fail ho jaye
              this.isLoadingResults = false;
              return of(null);
            })
          );
        }),
        map(data => {
          // Loader OFF: Success response aane par
          this.isLoadingResults = false;

          if (data === null) return [];

          this.resultsLength = data.totalCount; //
          return data.items;
        })
      ).subscribe(data => {
        this.dataSource.data = data;
        console.log('GRN Data Loaded:', data);
      });
  }
  // Navigation Logic
  viewGRN(id: number) {

    this.router.navigate(['/app/inventory/grn-list/view', id]);
  }


  printGRN(grn: any) {
    console.log("Printing GRN:", grn.grnNumber);
  }
  applyFilter(event: any) { }

  openPOSearchDialog() {
    const dialogRef = this.dialog.open(PoSelectionDialog, {
      width: '600px',
      disableClose: true,
      panelClass: 'custom-dialog-container'
    });

    dialogRef.afterClosed().subscribe(selectedPO => {
      if (selectedPO) {
        // Selected PO milne par GRN form par navigate karein
        this.router.navigate(['/app/inventory/grn-list/add'], {
          queryParams: { poId: selectedPO.id, poNo: selectedPO.poNumber }
        });
      }
    });
  }

}