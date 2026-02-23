import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../material/material/material-module';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
    selector: 'app-developer-info',
    standalone: true,
    imports: [CommonModule, MaterialModule],
    template: `
    <div class="dev-card-container">
      <div class="glass-header">
        <button mat-icon-button class="close-btn" (click)="dialogRef.close()">
          <mat-icon>close</mat-icon>
        </button>
      </div>
      
      <div class="profile-section">
        <div class="avatar-wrapper">
          <div class="avatar-gradient"></div>
          <img src="assets/images/MyPhoto.jpeg" alt="Pappu Singh" class="avatar-img">
        </div>
        <h1 class="dev-name">Pappu Singh</h1>
        <p class="dev-title">Full Stack Developer & Software Architect</p>
      </div>

      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-value">15+</span>
          <span class="stat-label">Years Exp</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">50+</span>
          <span class="stat-label">Projects</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">15+</span>
          <span class="stat-label">Global Clients</span>
        </div>
      </div>

      <div class="bio-section">
        <p>Expert in building high-performance scalable web applications using Angular, .NET Core, and Microservices architecture. Passionate about clean code and premium user experiences.</p>
      </div>

      <div class="tech-stack">
        <span class="tech-tag">Angular</span>
        <span class="tech-tag">.NET Core</span>
        <span class="tech-tag">SqlServer</span>
        <span class="tech-tag">Microservices</span>
        <span class="tech-tag">Azure</span>
        <span class="tech-tag">Node.js</span>
      </div>

      <div class="social-links">
        <button mat-fab extended color="primary" class="contact-btn" (click)="makeCall()">
          <mat-icon>call</mat-icon>
          +91 9540553975
        </button>
        <div class="icon-links">
          <button mat-icon-button class="social-icon" title="Email"><mat-icon>email</mat-icon></button>
          <button mat-icon-button class="social-icon" title="WhatsApp" (click)="openWhatsApp()"><mat-icon>chat</mat-icon></button>
          <button mat-icon-button class="social-icon" title="Website"><mat-icon>language</mat-icon></button>
          <button mat-icon-button class="social-icon" title="Code"><mat-icon>code</mat-icon></button>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .dev-card-container {
      background: linear-gradient(135deg, #ffffff 0%, #f3f4f6 100%);
      padding: 0;
      border-radius: 24px;
      overflow: hidden;
      width: 400px;
      font-family: 'Inter', sans-serif;
      box-shadow: 0 20px 40px rgba(0,0,0,0.1);
      position: relative;
    }

    .glass-header {
      height: 50px;
      display: flex;
      justify-content: flex-end;
      align-items: center;
      padding: 0 15px;
      background: transparent;
      position: absolute;
      top: 0;
      right: 0;
      width: 100%;
      z-index: 10;
    }

    .close-btn {
      background: white !important;
      color: #64748b !important;
      width: 32px !important;
      height: 32px !important;
      padding: 0 !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      border-radius: 50% !important;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
      transition: all 0.3s ease !important;
      border: 1px solid #e2e8f0 !important;

      &:hover {
        background: #fef2f2 !important;
        color: #d32f2f !important;
        transform: rotate(90deg);
        box-shadow: 0 4px 12px rgba(211, 47, 47, 0.15) !important;
      }

      ::ng-deep .mat-mdc-button-touch-target {
        display: none !important;
      }

      mat-icon {
        font-size: 18px !important;
        width: 18px !important;
        height: 18px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        margin: 0 !important;
        line-height: normal !important;
      }
    }

    .profile-section {
      padding: 60px 30px 20px;
      text-align: center;
      background: linear-gradient(to bottom, #e0f2f1 0%, #ffffff 100%);
    }

    .avatar-wrapper {
      position: relative;
      width: 120px;
      height: 120px;
      margin: 0 auto 20px;
    }

    .avatar-gradient {
      position: absolute;
      inset: -5px;
      background: linear-gradient(45deg, #00796b, #00bfa5, #00796b);
      border-radius: 50%;
      animation: rotate 4s linear infinite;
    }

    @keyframes rotate {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .avatar-img {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      position: relative;
      border: 4px solid white;
      background: #f8fafc;
      object-fit: cover;
    }

    .dev-name {
      margin: 0;
      font-size: 28px;
      font-weight: 800;
      color: #1a202c;
      letter-spacing: -0.5px;
    }

    .dev-title {
      color: #00796b;
      font-weight: 600;
      margin-top: 5px;
      font-size: 14px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      padding: 20px;
      gap: 10px;
      background: #fff;
    }

    .stat-item {
      text-align: center;
      display: flex;
      flex-direction: column;
      padding: 10px;
      border-radius: 12px;
      background: #f8fafc;
      transition: all 0.3s;
      &:hover { transform: translateY(-5px); background: #e0f2f1; }
    }

    .stat-value {
      font-weight: 800;
      font-size: 18px;
      color: #00796b;
    }

    .stat-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #64748b;
      margin-top: 4px;
    }

    .bio-section {
      padding: 0 30px;
      text-align: center;
      color: #4a5568;
      font-size: 14px;
      line-height: 1.6;
    }

    .tech-stack {
      padding: 20px 30px;
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 8px;
    }

    .tech-tag {
      background: #f1f5f9;
      color: #475569;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      border: 1px solid #e2e8f0;
    }

    .social-links {
      padding: 20px 30px 30px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
    }

    .contact-btn {
      width: 100%;
      height: 48px !important;
      background: #00796b !important;
      font-weight: 700 !important;
      letter-spacing: 0.5px !important;
      box-shadow: 0 10px 20px rgba(0,121,107,0.2) !important;
      transition: all 0.3s !important;
      &:hover { transform: translateY(-2px); box-shadow: 0 15px 30px rgba(0,121,107,0.3) !important; }
    }

    .icon-links {
      display: flex;
      gap: 15px;
    }

    .social-icon {
      color: #64748b;
      &:hover { color: #00796b; background: #e0f2f1; }
    }
  `]
})
export class DeveloperInfoComponent {
    constructor(public dialogRef: MatDialogRef<DeveloperInfoComponent>) { }

    makeCall() {
        window.location.href = 'tel:9540553975';
    }

    openWhatsApp() {
        window.open('https://wa.me/919540553975', '_blank');
    }
}
