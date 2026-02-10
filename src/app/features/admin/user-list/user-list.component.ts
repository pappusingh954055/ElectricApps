import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../../shared/material/material/material-module';
import { MatDialog } from '@angular/material/dialog';
import { UserService } from '../../../core/services/user.service';
import { User, RegisterUserDto } from '../../../core/models/user.model';
import { UserFormComponent } from './user-form.component';
import { RoleService } from '../../../core/services/role.service';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, MaterialModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="list-container">
      <div class="header-actions">
        <h1>User Management</h1>
        <button mat-flat-button class="main-add-btn" (click)="createUser()">
           <mat-icon>add</mat-icon> Create User
        </button>
      </div>
      
      <div class="grid-wrapper">
        <table mat-table [dataSource]="dataSource">
          <!-- Username Column -->
          <ng-container matColumnDef="userName">
            <th mat-header-cell *matHeaderCellDef> Username </th>
            <td mat-cell *matCellDef="let element" class="username-cell"> {{element.userName}} </td>
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
              <div class="role-chips">
                 <span *ngFor="let role of element.roles" class="role-badge">{{role}}</span>
              </div>
            </td>
          </ng-container>

          <!-- Status Column -->
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef> Status </th>
            <td mat-cell *matCellDef="let element">
              <div class="status-wrapper">
                <mat-slide-toggle [checked]="element.isActive" (change)="toggleStatus(element, $event.checked)" color="primary">
                  <span class="status-text" [class.active]="element.isActive">{{element.isActive ? 'Active' : 'Inactive'}}</span>
                </mat-slide-toggle>
              </div>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns" sticky></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="user-row"></tr>
        </table>
      </div>
      <mat-paginator [pageSizeOptions]="[10, 20, 50]" 
                     showFirstLastButtons 
                     class="user-paginator">
      </mat-paginator>
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
    }

    .list-container {
      padding: 24px;
      background-color: #f8fafc;
      height: 100%;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .header-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      flex-shrink: 0;

      h1 {
        margin: 0;
        font-size: 24px;
        font-weight: 700;
        color: #1e293b;
        letter-spacing: -0.02em;
      }
    }

    .main-add-btn {
      background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%) !important;
      color: white !important;
      box-shadow: 0 4px 14px 0 rgba(59, 130, 246, 0.39) !important;
      border-radius: 12px !important;
      font-weight: 600 !important;
      letter-spacing: 0.5px !important;
      height: 42px !important;
      padding: 0 20px !important;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      white-space: nowrap !important;
      border: none;
      
      mat-icon {
        margin-right: 8px;
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      &:hover {
        transform: translateY(-2px) scale(1.02);
        box-shadow: 0 6px 20px rgba(59, 130, 246, 0.45) !important;
      }
    }

    .grid-wrapper {
      flex: 1;
      overflow: auto;
      background: white;
      border-radius: 16px 16px 0 0;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      border: 1px solid #e2e8f0;
      border-bottom: none;

      table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;

        th.mat-header-cell {
          background-color: #f8fafc;
          color: #475569;
          font-weight: 600;
          font-size: 11px;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          padding: 16px;
          border-bottom: 2px solid #e2e8f0;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        td.mat-cell {
          padding: 16px;
          font-size: 13px;
          color: #1e293b;
          border-bottom: 1px solid #f1f5f9;
        }

        .user-row {
          transition: background-color 0.2s;
          cursor: pointer;
          &:hover { background-color: #f8fafc; }
        }

        .username-cell {
          font-weight: 600;
          color: #4f46e5;
        }
      }
    }

    .role-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .role-badge {
      background: #f1f5f9;
      color: #475569;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      text-transform: capitalize;
    }

    .status-wrapper {
      display: flex;
      align-items: center;
    }

    .status-text {
      font-size: 12px;
      font-weight: 600;
      color: #64748b;
      margin-left: 8px;
      &.active { color: #10b981; }
    }

    .user-paginator {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 0 0 16px 16px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
  `]
})
export class UserListComponent implements OnInit {
  displayedColumns: string[] = ['userName', 'email', 'roles', 'status'];
  dataSource = new MatTableDataSource<User>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;

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
      setTimeout(() => {
        this.dataSource.paginator = this.paginator;
      });
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
