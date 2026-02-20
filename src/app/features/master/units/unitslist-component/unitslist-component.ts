import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { MaterialModule } from '../../../../shared/material/material/material-module';
import { ReactiveFormsModule } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Router, RouterLink } from '@angular/router';
import { MatSort } from '@angular/material/sort';
import { UnitService } from '../services/units.service';
import { SummaryStat, SummaryStatsComponent } from '../../../../shared/components/summary-stats-component/summary-stats-component';
import { LoadingService } from '../../../../core/services/loading.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-unitslist-component',
  imports: [CommonModule, MaterialModule, ReactiveFormsModule, RouterLink, SummaryStatsComponent],
  templateUrl: './unitslist-component.html',
  styleUrl: './unitslist-component.scss',
})
export class UnitslistComponent implements OnInit {
  // Table columns jo humein dikhane hain
  displayedColumns: string[] = ['index', 'name', 'description', 'status', 'actions'];
  dataSource = new MatTableDataSource<any>();
  isLoading = true;
  summaryStats: SummaryStat[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private unitService: UnitService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private loadingService: LoadingService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.loadUnits();
  }

  loadUnits() {
    this.isLoading = true;
    this.loadingService.setLoading(true);
    this.unitService.getAll().subscribe({
      next: (data) => {
        this.dataSource.data = data || [];
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.updateStats();
        this.isLoading = false;
        this.loadingService.setLoading(false);
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.loadingService.setLoading(false);
        this.cdr.detectChanges();
      }
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.isLoading = true;
      this.loadingService.setLoading(true);
      this.unitService.importUnits(file).subscribe({
        next: (res: any) => {
          this.snackBar.open(res.message || 'Units imported successfully', 'Close', { duration: 3000 });
          this.loadUnits();
        },
        error: (err) => {
          console.error(err);
          const errorMsg = err.error?.message || err.error || 'Failed to import units';
          this.snackBar.open(errorMsg, 'Close', { duration: 5000 });
          this.isLoading = false;
          this.loadingService.setLoading(false);
          this.cdr.detectChanges();
        }
      });
    }
    event.target.value = '';
  }

  downloadTemplate() {
    const data = [
      ['Unit Name', 'Description'],
      ['KG', 'Main weight unit used for items like rice, flour, or wire weight'],
      ['GRAM', 'Used for measuring small weights'],
      ['QUINTAL', 'Equals 100 kilograms, used for bulk stock'],
      ['TON', 'Equals 1000 kilograms, used for heavy stock'],
      ['LITER', 'Used for measuring liquids like oil'],
      ['ML', 'Used for small liquid measurements'],
      ['PIECE', 'Used for countable items like bulbs'],
      ['PACKET', 'Used for packed items like screw packets'],
      ['POUCH', 'Used for small packs'],
      ['BOTTLE', 'Used for bottled items'],
      ['BOX', 'Used for boxed items'],
      ['BAG', 'Used for sack or bag items'],
      ['TIN', 'Used for tin containers'],
      ['DOZEN', 'Set of 12 items'],
      ['METER', 'Used to measure wire or cable length'],
      ['ROLL', 'Used for wire or tape rolls'],
      ['COIL', 'Used for large wire coils'],
      ['FOOT', 'Small length measurement'],
      ['INCH', 'Very small length measurement'],
      ['MM', 'Millimeter measurement for thickness or diameter'],
      ['SQMM', 'Used to measure wire cross-section size'],
      ['WATT', 'Electrical power rating unit'],
      ['VOLT', 'Voltage measurement unit'],
      ['AMPERE', 'Electric current measurement unit'],
      ['SET', 'Items sold as a set'],
      ['PAIR', 'Set of two items'],
      ['BUNDLE', 'Grouped items tied together']
    ];

    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(data);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'UnitsTemplate');
    XLSX.writeFile(wb, 'Units_Bulk_Upload_Template.xlsx');
  }

  private updateStats(): void {
    const total = this.dataSource.data.length;
    const active = this.dataSource.data.filter(u => u.isActive).length;
    const inactive = total - active;

    this.summaryStats = [
      { label: 'Total Units', value: total, icon: 'straighten', type: 'info' },
      { label: 'Active', value: active, icon: 'check_circle', type: 'success' },
      { label: 'Inactive', value: inactive, icon: 'block', type: 'warning' }
    ];
  }

  // Client-side search logic
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }
  editUnit(unit: any) {
    this.router.navigate(['/app/master/units/edit', unit.id]);
  }
}