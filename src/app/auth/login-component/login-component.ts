import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MaterialModule } from '../../shared/material/material/material-module';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './login-component.html',
  styleUrl: './login-component.scss',
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);

  loginForm = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  });

  login(): void {
    if (this.loginForm.invalid) return;

    const { username, password } = this.loginForm.value;

    if (username === 'admin' && password === 'admin123') {
      this.authService.login();
      this.router.navigate(['/app/dashboard']);
    } else {
      alert('Invalid username or password');
    }
  }
}
