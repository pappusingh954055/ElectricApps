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

