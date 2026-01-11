import { ChangeDetectorRef, Component, inject, NgZone, OnInit } from '@angular/core';
import { Validators, FormBuilder, ReactiveFormsModule, FormGroup } from '@angular/forms';


import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../../shared/material/material/material-module';

import { SubCategory } from '../modesls/subcategory.model';
import { MatDialog } from '@angular/material/dialog';
import { ApiResultDialog } from '../../../shared/api-result-dialog/api-result-dialog';

import { CategoryService } from '../../category/services/category.service';
import { Router } from '@angular/router';
import { SubCategoryService } from '../services/subcategory.service';
import { FormFooter } from '../../../shared/form-footer/form-footer';
import { Category, CategoryDropdown } from '../../category/models/category.model';



@Component({
  selector: 'app-subcategory-form',
  imports: [CommonModule, ReactiveFormsModule, MaterialModule, FormFooter],
  templateUrl: './subcategory-form.html',
  styleUrl: './subcategory-form.scss',
})
export class SubcategoryForm implements OnInit {

  subcategoryForm!: FormGroup;
  isSaving = false;

  mapToSubCategory!: SubCategory;

  constructor(private fb: FormBuilder, private dialog: MatDialog,
    private cdr: ChangeDetectorRef, private zone: NgZone) { }

  readonly subcategorySvc = inject(SubCategoryService)

  readonly categoryService = inject(CategoryService)

  readonly router = inject(Router);



  categories: any;
  isLoadingCategories = false;

  ngOnInit(): void {
    this.loadSubCategories();
    this.subcategoryForm = this.fb.group({
      categoryid: ['', Validators.required],
      subcategoryname: ['', Validators.required],
      subcategorycode: [''],
      defaultgst: [null],
      description: [''],
      isactive: ['']
    });
  }



  onSave(): void {
    if (this.subcategoryForm.invalid) return;

    this.isSaving = true;

    this.subcategorySvc.create(this.mapToSubCategories(this.subcategoryForm.value))
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


  onCancel() {
    this.router.navigate(['/app/master/subcategories']);
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
  private mapToSubCategories(formValue: any): SubCategory {
    return {
      categoryid: formValue.categoryid,
      subcategoryname: formValue.subcategoryname,
      subcategorycode: formValue.subcategorycode,
      defaultgst: Number(formValue.defaultgst),
      description: formValue.description?.trim(),
      isactive: Boolean(formValue.isactive)
    };
  }

  cancel() { }

  loadSubCategories(): void {

    this.isLoadingCategories = true;

    this.categoryService.getAll().subscribe({
      next: (data) => {
        this.categories = data;
      },
      error: () => {
        this.isLoadingCategories = false;
        this.openErrorDialog('Failed to load categories');
      }
    });
  }

  // openSuccessDialog(message: string): void {
  //   const dialogRef = this.dialog.open(ApiResultDialog, {
  //     data: {
  //       title: 'Subcategory Saved',
  //       message,
  //       type: 'success'
  //     }
  //   });

  //   dialogRef.afterClosed().subscribe(() => {
  //     this.isSaving = false;   // ✅ loader hidden
  //     this.cdr.detectChanges();
  //   });
  // }

  openErrorDialog(message: string): void {
    const dialogRef = this.dialog.open(ApiResultDialog, {
      data: {
        title: 'Error',
        message,
        type: 'error'
      }
    });

    dialogRef.afterClosed().subscribe(() => {
      this.isSaving = false;   // ✅ save button visible again
      this.cdr.detectChanges();
    });
  }
}

