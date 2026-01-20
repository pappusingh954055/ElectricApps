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
    if (this.loginForm.valid) {
      this.loading = true;
      this.errorMessage = '';

      this.LoginDto = {
        Email: this.loginForm.value.Email,
        Password: this.loginForm.value.Password
      };

      this.auth.login(this.LoginDto).subscribe({
        next: (res) => {
          console.log('Login successful', res);

          // 1. Check karein ki response null to nahi hai
          if (res) {
            // 2. UserId aur Tokens save karein (Screenshot ke mapping ke hisaab se)
            localStorage.setItem('userId', res.userId);

            // Agar response mein userName alag se nahi hai, toh roles ya email use kar sakte hain
            // filhal hum res.userName hi rakhte hain agar backend bhej raha hai
            if (res.userName) localStorage.setItem('userName', res.userName);

            // Token aur Roles save karna professional practice hai
            localStorage.setItem('accessToken', res.accessToken);
            localStorage.setItem('roles', JSON.stringify(res.roles));

            this.router.navigate(['/app/dashboard']);
          }
        },
        error: (err) => {
          console.error('Login error:', err);
          this.errorMessage = 'Invalid email or password';
          this.loading = false;
        },
        complete: () => {
          this.loading = false;
        }
      });
    }
  }
}