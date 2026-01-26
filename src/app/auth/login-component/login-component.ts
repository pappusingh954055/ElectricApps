import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MaterialModule } from '../../shared/material/material/material-module';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LoginDto } from '../../core/models/user.model';

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

  LoginDto!: LoginDto;

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

    this.LoginDto = {
      Email: this.loginForm.value.Email,
      Password: this.loginForm.value.Password
    };

    this.auth.login(this.LoginDto).subscribe({

      next: (res) => {
        console.log('Login successful', res);
        localStorage.setItem('userId', res.userId);
        if (res.userName) localStorage.setItem('userName', res.userName);
        localStorage.setItem('accessToken', res.accessToken);
        localStorage.setItem('refreshToken', res.refreshToken);
        localStorage.setItem('roles', JSON.stringify(res.roles));
        this.loading = false;
        this.router.navigate(['/app/dashboard']); // ✅ IMPORTANT
      },
      error: err => {
        console.error(err);
        this.errorMessage = err?.error?.message || 'Login failed';
        this.loading = false;
      }
    });
  }
}