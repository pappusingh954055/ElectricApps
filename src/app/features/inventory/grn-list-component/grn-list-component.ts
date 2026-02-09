import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, AfterViewInit, ChangeDetectorRef } from '@angular/core';
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
import { animate, state, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-grn-list-component',
  standalone: true,
  imports: [CommonModule, MaterialModule, ReactiveFormsModule],
  templateUrl: './grn-list-component.html',
  styleUrl: './grn-list-component.scss',

  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0', display: 'none' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class GrnListComponent implements OnInit, AfterViewInit {
  // Columns matching Backend DTO
  displayedColumns: string[] = ['grnNo', 'refPO', 'supplierName', 'receivedDate', 'status', 'actions'];
  dataSource = new MatTableDataSource<any>([]);

  // Expansion variable jo HTML ko chahiye
  expandedElement: any | null;

  // Search and Pagination states
  resultsLength = 0;
  isLoadingResults = true;
  searchControl = new FormControl('');

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef,
    private inventoryService: InventoryService,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.searchControl.disable({ emitEvent: false });

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
    // Fix NG0100: Wrap in setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() => {
      this.loadGRNData();
    });
  }

  loadGRNData() {
    merge(this.sort.sortChange, this.paginator.page)
      .pipe(
        startWith({}),
        switchMap(() => {
          // Loader ON: API call start [cite: 2026-01-22]
          this.isLoadingResults = true;
          this.searchControl.disable({ emitEvent: false });
          this.cdr.detectChanges();
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
              this.searchControl.enable({ emitEvent: false });
              return of(null);
            })
          );
        }),
        map(data => {
          // Loader OFF: Success response aane par
          this.isLoadingResults = false;
          this.searchControl.enable({ emitEvent: false });
          this.cdr.detectChanges();
          if (data === null) return [];

          this.resultsLength = data.totalCount;

          // Har row ke liye totalRejected calculate kar rahe hain taaki status badge sahi dikhe
          return data.items.map((item: any) => ({
            ...item,
            totalRejected: item.items?.reduce((acc: number, curr: any) => acc + (curr.rejectedQty || 0), 0) || 0
          }));
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
    console.log("Printing GRN:", grn.grnNo);
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