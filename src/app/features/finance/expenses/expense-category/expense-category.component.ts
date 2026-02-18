import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { StatusDialogComponent } from '../../../../shared/components/status-dialog-component/status-dialog-component';
import { FinanceService } from '../../service/finance.service';

@Component({
    selector: 'app-expense-category',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatTableModule,
        MatButtonModule,
        MatIconModule,
        MatInputModule,
        MatFormFieldModule,
        MatCardModule
    ],
    templateUrl: './expense-category.component.html',
    styleUrls: ['./expense-category.component.scss']
})
export class ExpenseCategoryComponent implements OnInit {
    categoryForm: FormGroup;
    categories: any[] = [];
    displayedColumns: string[] = ['name', 'description', 'isActive', 'actions'];
    isEditing = false;
    editingId: number | null = null;

    constructor(
        private fb: FormBuilder,
        private financeService: FinanceService,
        private dialog: MatDialog
    ) {
        this.categoryForm = this.fb.group({
            name: ['', [Validators.required, Validators.maxLength(100)]],
            description: [''],
            isActive: [true]
        });
    }

    ngOnInit(): void {
        this.loadCategories();
    }

    loadCategories(): void {
        this.financeService.getExpenseCategories().subscribe({
            next: (data) => this.categories = data,
            error: (err) => this.showError('Failed to load categories')
        });
    }

    onSubmit(): void {
        if (this.categoryForm.invalid) return;

        const category = this.categoryForm.value;

        if (this.isEditing && this.editingId) {
            this.financeService.updateExpenseCategory(this.editingId, { ...category, id: this.editingId }).subscribe({
                next: () => {
                    this.showSuccess('Category updated successfully');
                    this.resetForm();
                    this.loadCategories();
                },
                error: () => this.showError('Failed to update category')
            });
        } else {
            this.financeService.createExpenseCategory(category).subscribe({
                next: () => {
                    this.showSuccess('Category created successfully');
                    this.resetForm();
                    this.loadCategories();
                },
                error: () => this.showError('Failed to create category')
            });
        }
    }

    editCategory(category: any): void {
        this.isEditing = true;
        this.editingId = category.id;
        this.categoryForm.patchValue({
            name: category.name,
            description: category.description,
            isActive: category.isActive
        });
    }

    deleteCategory(id: number): void {
        const dialogRef = this.dialog.open(StatusDialogComponent, {
            data: {
                isSuccess: false,
                status: 'warning',
                title: 'Confirm Delete',
                message: 'Are you sure you want to delete this category?',
                showCancel: true,
                confirmText: 'Delete'
            }
        });

        dialogRef.afterClosed().subscribe(confirmed => {
            if (confirmed) {
                this.financeService.deleteExpenseCategory(id).subscribe({
                    next: () => {
                        this.showSuccess('Category deleted successfully');
                        this.loadCategories();
                    },
                    error: () => this.showError('Failed to delete category')
                });
            }
        });
    }

    resetForm(): void {
        this.categoryForm.reset({ isActive: true });
        this.isEditing = false;
        this.editingId = null;
    }

    private showSuccess(message: string): void {
        this.dialog.open(StatusDialogComponent, {
            data: {
                isSuccess: true,
                message: message
            }
        });
    }

    private showError(message: string): void {
        this.dialog.open(StatusDialogComponent, {
            data: {
                isSuccess: false,
                message: message
            }
        });
    }
}
