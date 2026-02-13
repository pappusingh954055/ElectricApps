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
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
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
      categorySearch: ['', Validators.required], // For autocomplete input text
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

  selectedFile: File | null = null;
  selectedFileName: string = '';

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      // 1. Extension Check
      const validExtensions = ['.xlsx', '.xls', '.csv'];
      const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      const isExtensionValid = validExtensions.includes(fileExtension);

      if (!isExtensionValid) {
        this.showError('Invalid file extension. Please upload .xlsx, .xls, or .csv file.');
        this.resetFileInput(event);
        return;
      }

      // 2. File Size Check (Max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        this.showError('File size exceeds 5MB limit.');
        this.resetFileInput(event);
        return;
      }

      // 3. MIME Type Check
      const validMimeTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel', // .xls
        'text/csv', 'application/csv', 'text/x-csv', 'application/x-csv', 'text/comma-separated-values', 'text/x-comma-separated-values', // .csv
        'application/vnd.oasis.opendocument.spreadsheet', // .ods
        '' // Sometimes CSV has empty mime type on Windows
      ];

      // If file.type is present, check it. If empty (common for CSV), trust extension if strictly .csv
      if (file.type && !validMimeTypes.includes(file.type)) {
        this.showError('Invalid file format (MIME type mismatch).');
        this.resetFileInput(event);
        return;
      }

      this.selectedFile = file;
      this.selectedFileName = file.name;
    }
  }

  private showError(message: string): void {
    this.dialog.open(StatusDialogComponent, {
      data: { isSuccess: false, message: message }
    });
  }

  private resetFileInput(event: any): void {
    event.target.value = '';
    this.selectedFileName = '';
    this.selectedFile = null;
  }

  downloadTemplate() {
    const link = document.createElement('a');
    link.href = '/assets/templates/subcategory_template.xlsx';
    link.download = 'subcategory_template.xlsx';
    link.click();
  }

  uploadExcel(): void {
    if (!this.selectedFile) return;

    this.loading = true;

    this.subcategorySvc.uploadExcel(this.selectedFile).subscribe({
      next: (res) => {
        this.loading = false;

        let finalMessage = res.message || res.Message || 'File uploaded successfully';
        const errors = res.errors || res.Errors || [];

        if (errors.length > 0) {
          finalMessage += '\n\nRow-wise Status/Errors:\n' + errors.join('\n');
        }

        // Determine success based on whether anything was uploaded
        const successCountString = (res.message || res.Message || '0');
        const successCount = parseInt(successCountString) || 0;
        const hasErrors = errors.length > 0;

        this.dialog.open(StatusDialogComponent, {
          data: {
            isSuccess: !hasErrors, // Show as error if any row failed
            message: finalMessage
          }
        }).afterClosed().subscribe(() => {
          if (!hasErrors || successCount > 0) {
            this.router.navigate(['/app/master/subcategories']);
          }
        });
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.dialog.open(StatusDialogComponent, {
          data: {
            isSuccess: false,
            message: err.error?.message ?? 'Upload failed. Please ensure the Excel/CSV structure is correct.'
          }
        });
        this.cdr.detectChanges();
      }
    });
  }

  resetFile(input?: HTMLInputElement): void {
    this.selectedFile = null;
    this.selectedFileName = '';
    if (input) {
      input.value = '';
    }
  }
}
