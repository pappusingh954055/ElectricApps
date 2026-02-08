import { ChangeDetectorRef, Component, inject, NgZone, OnInit } from '@angular/core';
import { Validators, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../../shared/material/material/material-module';
import { CategoryService } from '../services/category.service';
import { MatDialog } from '@angular/material/dialog';
import { ApiResultDialog } from '../../../shared/api-result-dialog/api-result-dialog';

import { Category } from '../models/category.model';

import { FormFooter } from '../../../shared/form-footer/form-footer';
import { ActivatedRoute, Router } from '@angular/router';
import { StatusDialogComponent } from '../../../../shared/components/status-dialog-component/status-dialog-component';


@Component({
  selector: 'app-category-form',
  imports: [CommonModule, ReactiveFormsModule, MaterialModule, FormFooter],
  templateUrl: './category-form.html',
  styleUrl: './category-form.scss',
})
export class CategoryForm implements OnInit {
  categoryForm!: FormGroup;
  loading = false;
  categoryId: string | null = null;



  constructor(private fb: FormBuilder, private dialog: MatDialog,
    private cdr: ChangeDetectorRef, private zone: NgZone,
    private route: ActivatedRoute, private router: Router) { }

  readonly categorySvc = inject(CategoryService)

  ngOnInit(): void {
    this.createForm();
    this.categoryId = this.route.snapshot.paramMap.get('id');
    if (this.categoryId) {
      this.loadCategory();
    }
  }

  createForm() {
    this.categoryForm = this.fb.group({
      categoryName: ['', Validators.required],
      categoryCode: [''],
      defaultGst: [0, [Validators.min(0), Validators.max(100)]],
      description: [''],
      isActive: [true]
    });
    this.cdr.detectChanges();
  }

  loadCategory() {
    if (!this.categoryId) return;
    this.loading = true;
    this.categorySvc.getById(this.categoryId).subscribe({
      next: (res) => {
        this.categoryForm.patchValue(res);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  selectedFile: File | null = null;
  selectedFileName: string = '';

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      const validExtensions = ['.xlsx', '.xls'];
      const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

      if (!validExtensions.includes(fileExtension)) {
        this.dialog.open(StatusDialogComponent, {
          data: {
            isSuccess: false,
            message: 'Invalid file format. Please upload an Excel file (.xlsx, .xls).'
          }
        });
        event.target.value = ''; // Reset input
        this.selectedFileName = '';
        this.selectedFile = null;
        return;
      }

      this.selectedFile = file;
      this.selectedFileName = file.name;
    }
  }

  downloadTemplate() {
    const link = document.createElement('a');
    link.href = '/assets/templates/category_template.xlsx';
    link.download = 'category_template.xlsx';
    link.click();
  }

  uploadExcel(): void {
    if (!this.selectedFile) return;

    this.loading = true;

    this.categorySvc.uploadExcel(this.selectedFile).subscribe({
      next: (res) => {
        this.loading = false;
        this.dialog.open(StatusDialogComponent, {
          data: {
            isSuccess: true,
            // message: res.message || 'File uploaded successfully'
            message: 'File uploaded successfully'
          }
        }).afterClosed().subscribe(() => {
          this.router.navigate(['/app/master/categories']);
        });
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.dialog.open(StatusDialogComponent, {
          data: {
            isSuccess: false,
            message: err.error?.message ?? 'Upload failed'
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

  onSave(): void {
    if (this.categoryForm.invalid) return;

    this.loading = true;

    const payload: Category = {
      ...this.categoryForm.value,
      id: this.categoryId
    };

    const request = this.categoryId
      ? this.categorySvc.update(this.categoryId, payload)
      : this.categorySvc.create(payload);

    request.subscribe({
      next: (res) => {
        this.loading = false;
        this.dialog.open(StatusDialogComponent, {
          data: {
            isSuccess: true,
            message: res.message
          }
        }).afterClosed().subscribe(() => {
          this.cdr.detectChanges();
          this.router.navigate(['/app/master/categories']);
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
    this.router.navigate(['/app/master/categories']);
  }

}

