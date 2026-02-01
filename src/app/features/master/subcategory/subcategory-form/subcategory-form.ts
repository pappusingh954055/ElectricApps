import { ChangeDetectorRef, Component, inject, NgZone, OnInit } from '@angular/core';
import { Validators, FormBuilder, ReactiveFormsModule, FormGroup } from '@angular/forms';


import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../../shared/material/material/material-module';

import { SubCategory } from '../modesls/subcategory.model';
import { MatDialog } from '@angular/material/dialog';
import { ApiResultDialog } from '../../../shared/api-result-dialog/api-result-dialog';

import { CategoryService } from '../../category/services/category.service';
import { ActivatedRoute, Router } from '@angular/router';
import { SubCategoryService } from '../services/subcategory.service';
import { FormFooter } from '../../../shared/form-footer/form-footer';
import { Category, CategoryDropdown } from '../../category/models/category.model';
import { StatusDialogComponent } from '../../../../shared/components/status-dialog-component/status-dialog-component';



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

  isEditMode = false;
  subCategoryId: string | null = null;

  constructor(private fb: FormBuilder, private dialog: MatDialog,
    private cdr: ChangeDetectorRef, private zone: NgZone,
    private route: ActivatedRoute) { }

  readonly subcategorySvc = inject(SubCategoryService)

  readonly categoryService = inject(CategoryService)

  readonly router = inject(Router);

  categories: any = [];



  ngOnInit(): void {
    this.detectMode();
    this.loadCategories();
    this.initForm();
  }

  private detectMode(): void {
    this.subCategoryId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.subCategoryId;
  }

  private initForm(): void {
    this.subcategoryForm = this.fb.group({
      categoryId: ['', Validators.required],
      subcategoryName: ['', Validators.required],
      subcategoryCode: [''],
      defaultGst: [0, [Validators.min(0), Validators.max(100)]],
      description: [''],
      isActive: [true]
    });

    if (this.isEditMode && this.subCategoryId) {
      this.loadSubCategory(this.subCategoryId);
    }
  }

  private loadSubCategory(id: string): void {
    this.loading = true;
    this.subcategorySvc.getById(id).subscribe({
      next: (data) => {
        console.log('Subcategory loaded for edit:', data);
        this.subcategoryForm.patchValue({
          categoryId: data.categoryId,
          subcategoryName: data.subcategoryName,
          subcategoryCode: data.subcategoryCode,
          defaultGst: data.defaultGst,
          description: data.description,
          isActive: data.isActive
        });
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading subcategory:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }



  onSave(): void {
    if (this.subcategoryForm.invalid) return;

    this.loading = true;
    const payload = this.mapToSubCategories(this.subcategoryForm.value);
    if (this.isEditMode && this.subCategoryId) {
      payload.id = this.subCategoryId;
    }

    const request = this.isEditMode && this.subCategoryId
      ? this.subcategorySvc.update(this.subCategoryId, payload)
      : this.subcategorySvc.create(payload);

    request.subscribe({
      next: (res) => {
        this.dialog.open(StatusDialogComponent, {
          data: {
            isSuccess: true,
            message: res.message
          }
        }).afterClosed().subscribe(() => {
          this.loading = false;
          this.cdr.detectChanges();
          this.router.navigate(['/app/master/subcategories']);
        });
      },
      error: (err) => {
        this.dialog.open(StatusDialogComponent, {
          data: {
            isSuccess: false,
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
  private mapToSubCategories(formValue: any): any {
    return {
      categoryId: formValue.categoryId,
      name: formValue.subcategoryName, // API expects 'name' for save/update
      code: formValue.subcategoryCode, // API expects 'code' for save/update
      defaultGst: Number(formValue.defaultGst),
      description: formValue.description?.trim(),
      isActive: Boolean(formValue.isActive)
    };
  }

  cancel() { }

  loadCategories(): void {

    this.loading = true;

    this.categoryService.getAll().subscribe({
      next: (data) => {
        this.categories = data;
        console.log('Categories loaded:', this.categories);
        console.log(this.categories);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.dialog.open(StatusDialogComponent, {
          data: {
            isSuccess: false,
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

