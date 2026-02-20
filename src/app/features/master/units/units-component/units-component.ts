import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MaterialModule } from '../../../../shared/material/material/material-module';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { UnitService } from '../services/units.service';
import { SummaryStat, SummaryStatsComponent } from '../../../../shared/components/summary-stats-component/summary-stats-component';
import { MatDialog } from '@angular/material/dialog';
import { LoadingService } from '../../../../core/services/loading.service';

@Component({
  selector: 'app-units',
  imports: [CommonModule, ReactiveFormsModule, MaterialModule, SummaryStatsComponent],
  templateUrl: './units-component.html',
  styleUrl: './units-component.scss',
})
export class UnitsComponent implements OnInit {
  unitForm: FormGroup;
  isSaving = false;
  summaryStats: SummaryStat[] = [];
  isLoading = false;
  private dbUnits: any[] = [];

  constructor(
    private fb: FormBuilder,
    private unitService: UnitService,
    private router: Router,
    private snackBar: MatSnackBar,
    private loadingService: LoadingService
  ) {
    this.unitForm = this.fb.group({
      units: this.fb.array([])
    });
  }

  ngOnInit() {
    this.addUnitRow();
    this.loadStats();
  }

  loadStats() {
    this.isLoading = true;
    this.loadingService.setLoading(true);
    this.unitService.getAll().subscribe({
      next: (data) => {
        this.dbUnits = data || [];
        this.updateStats();
        this.isLoading = false;
        this.loadingService.setLoading(false);
      },
      error: () => {
        this.isLoading = false;
        this.loadingService.setLoading(false);
      }
    });
  }

  private updateStats(): void {
    const rowCount = this.units?.length || 0;
    const active = this.dbUnits.filter(u => u.isActive).length;
    const inactive = this.dbUnits.length - active;

    this.summaryStats = [
      { label: 'Total Count', value: rowCount, icon: 'add_task', type: 'info' },
      { label: 'Active (Master)', value: active, icon: 'check_circle', type: 'success' },
      { label: 'Inactive (Master)', value: inactive, icon: 'block', type: 'warning' }
    ];
  }

  goBack() {
    this.router.navigate(['/app/master/units']);
  }

  get units() { return this.unitForm.get('units') as FormArray; }

  addUnitRow() {
    const row = this.fb.group({
      name: ['', Validators.required],
      description: ['']
    });
    this.units.push(row);
    this.updateStats();
  }

  removeUnitRow(index: number) {
    this.units.removeAt(index);
    this.updateStats();
  }

  saveUnits() {
    if (this.unitForm.invalid) return;

    this.isSaving = true;
    this.loadingService.setLoading(true);
    const unitsData = this.unitForm.value.units;

    this.unitService.saveBulkUnits(unitsData).subscribe({
      next: (res) => {
        this.loadingService.setLoading(false);
        this.snackBar.open('All units saved successfully!', 'Close', { duration: 3000 });
        this.router.navigate(['/app/master/units']);
      },
      error: (err) => {
        this.isSaving = false;
        this.loadingService.setLoading(false);
        this.snackBar.open('Error saving units. Please try again.', 'Error');
      }
    });
  }
}