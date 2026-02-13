import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MaterialModule } from '../../../shared/material/material/material-module';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { RegisterUserDto } from '../../../core/models/user.model';
import { RoleService } from '../../../core/services/role.service';
import { UserService } from '../../../core/services/user.service';
import { Role } from '../../../core/models/role.model';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, MaterialModule, FormsModule, ReactiveFormsModule],
  template: `
    <h2 mat-dialog-title>Create New User</h2>
    <mat-dialog-content>
      <form [formGroup]="userForm" class="user-form">
        
        <mat-form-field appearance="outline">
          <mat-label>Username</mat-label>
          <input matInput formControlName="UserName">
          <mat-error *ngIf="userForm.get('UserName')?.hasError('required')">Username is required</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Email</mat-label>
          <input matInput formControlName="Email">
          <mat-error *ngIf="userForm.get('Email')?.hasError('required')">Email is required</mat-error>
          <mat-error *ngIf="userForm.get('Email')?.hasError('email')">Invalid email</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Password</mat-label>
          <input matInput [type]="hidePassword ? 'password' : 'text'" formControlName="Password">
          <button mat-icon-button matSuffix (click)="hidePassword = !hidePassword">
            <mat-icon>{{hidePassword ? 'visibility_off' : 'visibility'}}</mat-icon>
          </button>
          <mat-error *ngIf="userForm.get('Password')?.hasError('required')">Password is required</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Roles (Multi-Select)</mat-label>
          <mat-select formControlName="RoleIds" multiple>
            <mat-option *ngFor="let role of roles" [value]="role.id">{{role.roleName}}</mat-option>
          </mat-select>
          <mat-error *ngIf="userForm.get('RoleIds')?.hasError('required')">At least one role is required</mat-error>
        </mat-form-field>

      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-raised-button mat-dialog-close>Cancel</button>
      <button mat-raised-button class="main-add-btn" [disabled]="userForm.invalid" (click)="save()">Create User</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .user-form { display: flex; flex-direction: column; gap: 16px; padding-top: 10px; }
    mat-form-field { width: 100%; }
  `]
})
export class UserFormComponent implements OnInit {
  userForm: FormGroup;
  roles: Role[] = [];
  hidePassword = true;

  constructor(
    private fb: FormBuilder,
    private roleService: RoleService,
    private userService: UserService,
    public dialogRef: MatDialogRef<UserFormComponent>,
    private snackBar: MatSnackBar
  ) {
    this.userForm = this.fb.group({
      UserName: ['', Validators.required],
      Email: ['', [Validators.required, Validators.email]],
      Password: ['', Validators.required],
      RoleIds: [[], Validators.required]
    });
  }

  ngOnInit() {
    this.roleService.getAllRoles().subscribe(roles => this.roles = roles);
  }

  save() {
    if (this.userForm.valid) {
      const dto: RegisterUserDto = this.userForm.value;
      this.userService.createUser(dto).subscribe({
        next: () => {
          this.snackBar.open('User Created Successfully', 'Close', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: (err) => {
          console.error(err);
          this.snackBar.open('Failed to create user', 'Close', { duration: 3000 });
        }
      });
    }
  }
}
