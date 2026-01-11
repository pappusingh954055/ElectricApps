import { ChangeDetectorRef, Component, inject, NgZone, OnInit } from '@angular/core';
import { Validators, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../../shared/material/material/material-module';
import { CategoryService } from '../services/category.service';
import { MatDialog } from '@angular/material/dialog';
import { ApiResultDialog } from '../../../shared/api-result-dialog/api-result-dialog';

import { Category } from '../models/category.model';

import { FormFooter } from '../../../shared/form-footer/form-footer';
import { Router } from '@angular/router';


@Component({
  selector: 'app-category-form',
  imports: [CommonModule, ReactiveFormsModule, MaterialModule, FormFooter],
  templateUrl: './category-form.html',
  styleUrl: './category-form.scss',
})
export class CategoryForm implements OnInit {
  categoryForm!: FormGroup;
  isSaving = false;

  mapToCategory!: Category;

  constructor(private fb: FormBuilder, private dialog: MatDialog,
    private cdr: ChangeDetectorRef, private zone: NgZone) { }

  readonly categorySvc = inject(CategoryService)

  readonly router = inject(Router);

  ngOnInit(): void {
    this.categoryForm = this.fb.group({
      CategoryName: ['', Validators.required],
      CategoryCode: [''],
      DefaultGst: [null],
      Description: [''],
      IsActive: [true]
    });
  }



  onSave(): void {
    if (this.categoryForm.invalid) return;

    this.isSaving = true;

    this.categorySvc.create(this.mapToCategories(this.categoryForm.value))
      .subscribe({
        next: (res) => {
          this.openDialog('success', 'Category Saved', res.message);
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


  onCancel() {
    this.router.navigate(['/app/master/categories']);
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




  // 🔹 SINGLE RESPONSIBILITY: MAPPING
  private mapToCategories(formValue: any): Category {
    return {
      CategoryName: formValue.CategoryName,
      CategoryCode: formValue.CategoryCode,
      DefaultGst: Number(formValue.DefaultGst),
      Description: formValue.Description?.trim(),
      IsActive: Boolean(formValue.IsActive)
    };
  }

  cancel() { }
}

