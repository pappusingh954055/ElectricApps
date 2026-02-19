import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MaterialModule } from '../../../../shared/material/material/material-module';
import { MenuItem } from '../../../../core/models/menu-item.model';
import { MenuService } from '../../../../core/services/menu.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog-component/confirm-dialog-component';

@Component({
    selector: 'app-menu-form-dialog',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, MaterialModule, MatDialogModule],
    templateUrl: './menu-form-dialog.component.html',
    styleUrl: './menu-form-dialog.component.scss'
})
export class MenuFormDialogComponent implements OnInit {
    menuForm: FormGroup;
    loading = false;

    constructor(
        private fb: FormBuilder,
        private menuService: MenuService,
        private dialog: MatDialog,
        private dialogRef: MatDialogRef<MenuFormDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { menu: MenuItem | null, allMenus: MenuItem[] }
    ) {
        this.menuForm = this.fb.group({
            title: [this.data.menu?.title || '', [Validators.required]],
            url: [this.data.menu?.url || ''],
            icon: [this.data.menu?.icon || ''],
            parentId: [this.data.menu?.parentId || null],
            order: [this.data.menu?.order || 0, [Validators.required]]
        });
    }

    ngOnInit(): void { }

    save(): void {
        if (this.menuForm.invalid) return;

        const actionText = this.data.menu?.id ? 'Update' : 'Create';
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            width: '400px',
            data: {
                title: `Confirm ${actionText}`,
                message: `Are you sure you want to ${actionText.toLowerCase()} this menu item: ${this.menuForm.value.title}?`,
                confirmText: `Yes, ${actionText}`
            }
        });

        dialogRef.afterClosed().subscribe(confirm => {
            if (confirm) {
                this.loading = true;
                const menuData: MenuItem = {
                    ...this.data.menu,
                    ...this.menuForm.value
                };

                const action = this.data.menu?.id
                    ? this.menuService.updateMenu(this.data.menu.id, menuData)
                    : this.menuService.createMenu(menuData);

                action.subscribe({
                    next: () => {
                        this.loading = false;
                        this.dialogRef.close(true);
                    },
                    error: (err) => {
                        console.error(err);
                        this.loading = false;
                        // Ideally show error message
                    }
                });
            }
        });
    }
}
