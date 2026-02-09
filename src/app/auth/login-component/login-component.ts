import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { finalize } from 'rxjs';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MaterialModule } from '../../shared/material/material/material-module';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LoginDto } from '../../core/models/user.model';
import { MatDialog } from '@angular/material/dialog';
import { StatusDialogComponent } from '../../shared/components/status-dialog-component/status-dialog-component';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './login-component.html',
  styleUrl: './login-component.scss',
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = false;
  errorMessage = '';


  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);


  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.loginForm = this.fb.group({
      Email: ['', [Validators.required, Validators.email]],
      Password: ['', [Validators.required]],
      rememberMe: [false]
    });
  }

  Login() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const loginData: LoginDto = {
      Email: this.loginForm.value.Email,
      Password: this.loginForm.value.Password
    };

    this.auth.login(loginData).pipe(
      finalize(() => {
        // Use timeout to ensure any state changes happen outside the current check cycle
        // and after the observable has finished emitting.
        setTimeout(() => {
          this.loading = false;
          this.cdr.markForCheck();
        });
      })
    ).subscribe({
      next: (res) => {
        console.log('Login successful:', res);
        this.router.navigate(['/app/dashboard']);
      },
      error: err => {
        console.error('Login error:', err);
        const msg = err?.error?.message || 'Invalid credentials or server error. Please try again.';

        // Small delay for the dialog to ensure the button loading state animation can finish
        setTimeout(() => {
          this.showErrorDialog(msg);
        }, 150);
      }
    });
  }

  private showErrorDialog(message: string) {
    this.dialog.open(StatusDialogComponent, {
      data: { isSuccess: false, message: message },
      disableClose: true
    });
  }
}
