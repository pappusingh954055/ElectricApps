import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MaterialModule } from '../../../../shared/material/material/material-module';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { UnitService } from '../services/units.service';

@Component({
  selector: 'app-units',
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './units-component.html',
  styleUrl: './units-component.scss',
})
export class UnitsComponent implements OnInit {
  unitForm: FormGroup;
  isSaving = false;

  constructor(
    private fb: FormBuilder,
    private unitService: UnitService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.unitForm = this.fb.group({
      units: this.fb.array([])
    });
  }

  ngOnInit() { this.addUnitRow(); }

  get units() { return this.unitForm.get('units') as FormArray; }

  addUnitRow() {
    const row = this.fb.group({
      name: ['', Validators.required],
      description: ['']
    });
    this.units.push(row);
  }

  removeUnitRow(index: number) { this.units.removeAt(index); }

  saveUnits() {
    if (this.unitForm.invalid) return;

    this.isSaving = true;
    const unitsData = this.unitForm.value.units;

    this.unitService.saveBulkUnits(unitsData).subscribe({
      next: (res) => {
        this.snackBar.open('All units saved successfully!', 'Close', { duration: 3000 });
        this.router.navigate(['/app/master/units']);
      },
      error: (err) => {
        this.isSaving = false;
        this.snackBar.open('Error saving units. Please try again.', 'Error');
      }
    });
  }
}