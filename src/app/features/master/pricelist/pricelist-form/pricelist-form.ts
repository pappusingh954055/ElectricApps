import { ChangeDetectorRef, Component, inject, NgZone, OnInit } from '@angular/core';
import { Validators, FormBuilder, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { PriceListService } from '../service/pricelist.service';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../../shared/material/material/material-module';
import { FormFooter } from '../../../shared/form-footer/form-footer';

import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { PriceListModel } from '../models/pricelist.model';
import { ApiResultDialog } from '../../../shared/api-result-dialog/api-result-dialog';

@Component({
  selector: 'app-pricelist-form',
  imports: [CommonModule, ReactiveFormsModule, MaterialModule, FormFooter],
  templateUrl: './pricelist-form.html',
  styleUrl: './pricelist-form.scss',
})
export class PricelistForm implements OnInit {

  constructor(private dialog: MatDialog,
    private cdr: ChangeDetectorRef, private zone: NgZone) { }

  readonly router = inject(Router);

  private fb = inject(FormBuilder);

  readonly pricelistService = inject(PriceListService);

  pricelistsForm!: FormGroup;

  isSaving = false;

  mapToPriceList!: PriceListModel;

  pricelists: any;

  createControls() {
    this.pricelistsForm = this.fb.group({
      name: ['', Validators.required],
      code: [''],
      pricetype: ['', Validators.required],
      validfrom: [new Date(), Validators.required],
      validto: [new Date(), Validators.required],
      description: [''],
      isactive: ['']
    });

  }

  ngOnInit(): void {
    this.createControls();
  }



  onCancel() {
    this.router.navigate(['/app/master/pricelists']);
  }
  onSave(): void {
    if (this.pricelistsForm.invalid) return;

    this.isSaving = true;

    this.pricelistService.create(this.mapToPricelists(this.pricelistsForm.value))
      .subscribe({
        next: (res) => {
          this.openDialog('success', 'Sub Category Saved', res.message);
          this.isSaving = false;
        },
        error: (err) => {
          this.openDialog(
            'error',
            'Save Failed',
            err?.error?.message || 'Something went wrong'
          );
        }
      });
  }

  private openDialog(
    type: 'success' | 'error',
    title: string,
    message: string
  ): void {

    const dialogRef = this.dialog.open(ApiResultDialog, {
      disableClose: true,
      data: { type, title, message }
    });

    dialogRef.afterClosed().subscribe(() => {
      // 🔥 THIS IS THE FIX
      this.isSaving = false;
      this.cdr.detectChanges();
    });
  }


  private toDateOnly(date: Date | string): string {
    const d = (date instanceof Date) ? date : new Date(date);

    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    return `${y}-${m}-${day}`;
  }

  // 🔹 SINGLE RESPONSIBILITY: MAPPING
  private mapToPricelists(formValue: any): PriceListModel {
    return {
      name: formValue.name,
      code: formValue.code,
      pricetype: formValue.pricetype,
      validfrom: new Date(this.toDateOnly(formValue.validfrom)),
      validto: new Date(this.toDateOnly(formValue.validto)),
      description: formValue.description?.trim(),
      isactive: Boolean(formValue.isactive)
    };
  }
}