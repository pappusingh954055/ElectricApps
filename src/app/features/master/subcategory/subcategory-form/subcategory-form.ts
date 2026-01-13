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

  loading = false;

  mapToSubCategory!: SubCategory;

  constructor(private fb: FormBuilder, private dialog: MatDialog,
    private cdr: ChangeDetectorRef, private zone: NgZone) { }

  readonly subcategorySvc = inject(SubCategoryService)

  readonly categoryService = inject(CategoryService)

  readonly router = inject(Router);

  categories:any=[];



  ngOnInit(): void {
    this.loadCategories();
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

    this.loading = true;

    this.subcategorySvc.create(this.mapToSubCategories(this.subcategoryForm.value))
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
            this.router.navigate(['/app/master/subcategories']);
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
    this.router.navigate(['/app/master/subcategories']);
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

  loadCategories(): void {

    this.loading = true;

    this.categoryService.getAll().subscribe({
      next: (data) => {
        this.categories=data;
        console.log(this.categories);
        this.loading = false;
        this.cdr.detectChanges();
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
}

