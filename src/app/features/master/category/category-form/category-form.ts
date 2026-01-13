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
  loading = false;

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

    this.loading = true;

    this.categorySvc.create(this.mapToCategories(this.categoryForm.value))
      .subscribe({
        next: (res) => {
          this.dialog.open(ApiResultDialog, {
            data: {
              success: true,
              message: res.message
            }
          }).afterClosed().subscribe(() => {
            this.loading = false;
            this.cdr.detectChanges();
            this.router.navigate(['/app/master/categories']);
          });
        },
        error: (err) => {
          this.dialog.open(ApiResultDialog, {
            data: {
              success: false,
              message: err.error?.message ?? 'Something went wrong'
            }
          }).afterClosed().subscribe(() => {
            this.loading = false;
            this.cdr.detectChanges();
          });
        }
      });
  }


  onCancel() {
    this.router.navigate(['/app/master/categories']);
  }

  // 🔹 SINGLE RESPONSIBILITY: MAPPING
  private mapToCategories(formValue: any): Category {
    return {
      categoryname: formValue.CategoryName,
      categorycode: formValue.CategoryCode,
      defaultgst: Number(formValue.DefaultGst),
      description: formValue.Description?.trim(),
      isActive: Boolean(formValue.IsActive)
    };
  }

}

