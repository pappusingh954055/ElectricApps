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
    private loadingService: LoadingService
  ) { }

  ngOnInit(): void {
    this.loadUnits();
  }

  loadUnits() {
    this.isLoading = true;
    this.loadingService.setLoading(true);
    this.unitService.getAll().subscribe({
      next: (data) => {
        console.log(data);

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
        // Error handling logic
        this.loadingService.setLoading(false);
        this.cdr.detectChanges();
      }
    });
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