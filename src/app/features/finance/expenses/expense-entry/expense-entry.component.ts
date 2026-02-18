import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { StatusDialogComponent } from '../../../../shared/components/status-dialog-component/status-dialog-component';
import { FinanceService } from '../../service/finance.service';

@Component({
    selector: 'app-expense-entry',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatTableModule,
        MatButtonModule,
        MatIconModule,
        MatInputModule,
        MatFormFieldModule,
        MatCardModule,
        MatSelectModule,
        MatDatepickerModule,
        MatNativeDateModule
    ],
    templateUrl: './expense-entry.component.html',
    styleUrls: ['./expense-entry.component.scss']
})
export class ExpenseEntryComponent implements OnInit {
    expenseForm: FormGroup;
    categories: any[] = [];
    expenses: any[] = [];
    paymentModes = ['Cash', 'Bank', 'UPI', 'Credit Card', 'Cheque'];
    displayedColumns: string[] = ['date', 'category', 'amount', 'mode', 'refNo', 'actions'];
    isEditing = false;
    editingId: number | null = null;

    constructor(
        private fb: FormBuilder,
        private financeService: FinanceService,
        private dialog: MatDialog
    ) {
        this.expenseForm = this.fb.group({
            categoryId: [null, Validators.required],
            amount: [null, [Validators.required, Validators.min(0)]],
            expenseDate: [new Date(), Validators.required],
            paymentMode: ['Cash', Validators.required],
            referenceNo: [''],
            remarks: ['']
        });
    }

    ngOnInit(): void {
        this.loadInitialData();
    }

    loadInitialData(): void {
        this.financeService.getExpenseCategories().subscribe(data => this.categories = data);
        this.loadExpenses();
    }

    loadExpenses(): void {
        this.financeService.getExpenseEntries(1, 50).subscribe({
            next: (res) => this.expenses = res.items || [],
            error: () => this.showError('Failed to load expenses')
        });
    }

    onSubmit(): void {
        if (this.expenseForm.invalid) return;

        const entry = this.expenseForm.value;

        if (this.isEditing && this.editingId) {
            this.financeService.updateExpenseEntry(this.editingId, { ...entry, id: this.editingId }).subscribe({
                next: () => {
                    this.showSuccess('Expense updated successfully');
                    this.resetForm();
                    this.loadExpenses();
                },
                error: () => this.showError('Failed to update expense')
            });
        } else {
            this.financeService.createExpenseEntry(entry).subscribe({
                next: () => {
                    this.showSuccess('Expense recorded successfully');
                    this.resetForm();
                    this.loadExpenses();
                },
                error: () => this.showError('Failed to record expense')
            });
        }
    }

    editExpense(expense: any): void {
        this.isEditing = true;
        this.editingId = expense.id;
        this.expenseForm.patchValue({
            categoryId: expense.categoryId,
            amount: expense.amount,
            expenseDate: new Date(expense.expenseDate),
            paymentMode: expense.paymentMode,
            referenceNo: expense.referenceNo,
            remarks: expense.remarks
        });
    }

    deleteExpense(id: number): void {
        const dialogRef = this.dialog.open(StatusDialogComponent, {
            data: {
                isSuccess: false,
                status: 'warning',
                title: 'Confirm Delete',
                message: 'Are you sure you want to delete this record?',
                showCancel: true,
                confirmText: 'Delete'
            }
        });

        dialogRef.afterClosed().subscribe(confirmed => {
            if (confirmed) {
                this.financeService.deleteExpenseEntry(id).subscribe({
                    next: () => {
                        this.showSuccess('Record deleted successfully');
                        this.loadExpenses();
                    },
                    error: () => this.showError('Failed to delete record')
                });
            }
        });
    }

    resetForm(): void {
        this.expenseForm.reset({ expenseDate: new Date(), paymentMode: 'Cash' });
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
