import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../../shared/material/material/material-module';
import { MatDialog } from '@angular/material/dialog';
import { UserService } from '../../../core/services/user.service';
import { User, RegisterUserDto } from '../../../core/models/user.model';
import { UserFormComponent } from './user-form.component';
import { RoleService } from '../../../core/services/role.service';
import { MatTableDataSource } from '@angular/material/table';

@Component({
    selector: 'app-user-list',
    standalone: true,
    imports: [CommonModule, MaterialModule, FormsModule, ReactiveFormsModule],
    template: `
    <div class="user-list-container">
      <div class="header">
        <h1>User Management</h1>
        <button mat-raised-button color="primary" (click)="createUser()">
           <mat-icon>add</mat-icon> Create User
        </button>
      </div>
      
      <table mat-table [dataSource]="dataSource" class="mat-elevation-z8">

        <!-- Username Column -->
        <ng-container matColumnDef="userName">
          <th mat-header-cell *matHeaderCellDef> Username </th>
          <td mat-cell *matCellDef="let element"> {{element.userName}} </td>
        </ng-container>

        <!-- Email Column -->
        <ng-container matColumnDef="email">
          <th mat-header-cell *matHeaderCellDef> Email </th>
          <td mat-cell *matCellDef="let element"> {{element.email}} </td>
        </ng-container>

        <!-- Roles Column -->
        <ng-container matColumnDef="roles">
          <th mat-header-cell *matHeaderCellDef> Roles </th>
          <td mat-cell *matCellDef="let element"> 
            <mat-chip-listbox>
               <mat-chip *ngFor="let role of element.roles" color="accent" selected>{{role}}</mat-chip>
            </mat-chip-listbox>
          </td>
        </ng-container>

        <!-- Status Column -->
        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef> Status </th>
          <td mat-cell *matCellDef="let element">
            <mat-slide-toggle [checked]="element.isActive" (change)="toggleStatus(element, $event.checked)" color="primary">
              {{element.isActive ? 'Active' : 'Inactive'}}
            </mat-slide-toggle>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
      </table>
    </div>
  `,
    styles: [`
    .user-list-container { padding: 24px; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    table { width: 100%; }
    mat-chip { font-size: 12px; min-height: 24px; }
  `]
})
export class UserListComponent implements OnInit {
    displayedColumns: string[] = ['userName', 'email', 'roles', 'status'];
    dataSource = new MatTableDataSource<User>();

    constructor(
        private userService: UserService,
        private dialog: MatDialog,
        private roleService: RoleService
    ) { }

    ngOnInit() {
        this.loadUsers();
    }

    loadUsers() {
        this.userService.getAllUsers().subscribe(users => {
            this.dataSource.data = users;
        });
    }

    createUser() {
        const dialogRef = this.dialog.open(UserFormComponent, {
            width: '500px'
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.loadUsers();
            }
        });
    }

    toggleStatus(user: User, isChecked: boolean) {
        this.userService.updateStatus(user.id, isChecked).subscribe({
            next: () => {
                user.isActive = isChecked;
            },
            error: () => {
                // Revert on error
                // user.isActive = !newStatus; // If not visually toggled immediately
                // But mat-slide-toggle toggles visually. We should reload or handle error.
                this.loadUsers(); // Reload to be safe
            }
        });
    }
}
