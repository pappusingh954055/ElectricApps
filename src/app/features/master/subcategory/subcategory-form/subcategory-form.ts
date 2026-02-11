import { ChangeDetectorRef, Component, inject, OnInit, OnDestroy } from '@angular/core';
import { Validators, FormBuilder, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../../shared/material/material/material-module';
import { SubCategory } from '../modesls/subcategory.model';
import { MatDialog } from '@angular/material/dialog';
import { CategoryService } from '../../category/services/category.service';
import { ActivatedRoute, Router } from '@angular/router';
import { SubCategoryService } from '../services/subcategory.service';
import { FormFooter } from '../../../shared/form-footer/form-footer';
import { StatusDialogComponent } from '../../../../shared/components/status-dialog-component/status-dialog-component';
import { Observable, Subject } from 'rxjs';
import { map, startWith, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-subcategory-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule, FormFooter],
  templateUrl: './subcategory-form.html',
  styleUrl: './subcategory-form.scss',
})
export class SubcategoryForm implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);
  private subcategorySvc = inject(SubCategoryService);
  private categoryService = inject(CategoryService);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  subcategoryForm!: FormGroup;
  loading = false;
  isEditMode = false;
  subCategoryId: string | null = null;
  categories: any[] = [];
  filteredCategories!: Observable<any[]>;
  isSearchingCategories = false;

  ngOnInit(): void {
    this.detectMode();
    this.initForm();
    this.loadCategories();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private detectMode(): void {
    this.subCategoryId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.subCategoryId;
  }

  private initForm(): void {
    this.subcategoryForm = this.fb.group({
      categoryId: [null, Validators.required],
      categorySearch: [''], // For autocomplete input text
      subcategoryName: ['', Validators.required],
      subcategoryCode: [''],
      defaultGst: [0, [Validators.min(0), Validators.max(100)]],
      description: [''],
      isActive: [true]
    });

    if (this.isEditMode && this.subCategoryId) {
      this.loadSubCategory(this.subCategoryId);
    }

    // Autocomplete Filtering with precise loader control
    this.filteredCategories = this.subcategoryForm.get('categorySearch')!.valueChanges.pipe(
      startWith(''),
      map(value => {
        this.isSearchingCategories = true;
        const name = typeof value === 'string' ? value : (value?.categoryName || '');
        const results = name ? this._filterCategories(name) : this.categories.slice();

        // Use a microtask to ensure results are ready before hiding the loader
        Promise.resolve().then(() => {
          this.isSearchingCategories = false;
          this.cdr.detectChanges();
        });

        return results;
      })
    );
  }

  private _filterCategories(value: string): any[] {
    const filterValue = value.toLowerCase();
    return this.categories.filter(c =>
      c.categoryName.toLowerCase().includes(filterValue) ||
      c.categoryCode.toLowerCase().includes(filterValue)
    );
  }

  displayCategoryFn(category: any): string {
    return category ? `[${category.categoryCode}] - ${category.categoryName}` : '';
  }

  onCategorySelected(event: any): void {
    const category = event.option.value;
    this.subcategoryForm.get('categoryId')?.setValue(category.id);
  }

  private loadCategories(): void {
    this.loading = true;
    this.categoryService.getAll().pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        this.categories = data;
        this.syncCategorySelection();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private syncCategorySelection(): void {
    const catId = this.subcategoryForm.get('categoryId')?.value;
    if (catId && this.categories.length > 0) {
      const selected = this.categories.find(c => c.id === catId);
      if (selected) {
        this.subcategoryForm.get('categorySearch')?.setValue(selected, { emitEvent: false });
      }
    }
  }

  private loadSubCategory(id: string): void {
    this.loading = true;
    this.subcategorySvc.getById(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        this.subcategoryForm.patchValue({
          categoryId: data.categoryId,
          subcategoryName: data.subcategoryName,
          subcategoryCode: data.subcategoryCode,
          defaultGst: data.defaultGst,
          description: data.description,
          isActive: data.isActive
        });
        this.syncCategorySelection();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onSave(): void {
    if (this.subcategoryForm.invalid) {
      this.subcategoryForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    const formValue = this.subcategoryForm.value;
    const payload: SubCategory = {
      categoryId: formValue.categoryId,
      subcategoryName: formValue.subcategoryName,
      subcategoryCode: formValue.subcategoryCode,
      defaultGst: Number(formValue.defaultGst),
      description: formValue.description?.trim(),
      isActive: Boolean(formValue.isActive)
    };

    if (this.isEditMode && this.subCategoryId) {
      payload.id = this.subCategoryId;
    }

    const request$ = this.isEditMode && this.subCategoryId
      ? this.subcategorySvc.update(this.subCategoryId, payload)
      : this.subcategorySvc.create(payload);

    request$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.loading = false;
        this.cdr.detectChanges();

        this.dialog.open(StatusDialogComponent, {
          data: { isSuccess: true, message: res.message }
        }).afterClosed().subscribe(() => {
          this.router.navigate(['/app/master/subcategories']);
        });
      },
      error: (err) => {
        this.loading = false;
        this.cdr.detectChanges();
        this.dialog.open(StatusDialogComponent, {
          data: { isSuccess: false, message: err.error?.message ?? 'Something went wrong' }
        });
      }
    });
  }

  onCancel() {
    this.router.navigate(['/app/master/subcategories']);
  }
}
