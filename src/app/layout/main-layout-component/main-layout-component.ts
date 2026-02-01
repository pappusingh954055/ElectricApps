import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { MaterialModule } from '../../shared/material/material/material-module';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';
import { ToolbarComponent } from './toolbar-component/toolbar-component';
import { SidenavComponent } from './sidenav-component/sidenav-component';
import { BreadcrumbComponent } from './breadcrumb-component/breadcrumb-component';
import { FooterComponent } from './footer-component/footer-component';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatSidenav } from '@angular/material/sidenav';
import { MenuItem } from '../../core/models/menu-item.model';
import { MenuService } from '../../core/services/menu.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-main-layout-component',
  imports: [CommonModule, RouterOutlet, RouterModule, BreadcrumbComponent,
    MaterialModule],
  templateUrl: './main-layout-component.html',
  styleUrl: './main-layout-component.scss',
})
export class MainLayoutComponent implements OnInit {

  @ViewChild(MatSidenav) sidenav!: MatSidenav;

  private breakpointObserver = inject(BreakpointObserver);
  private menuService = inject(MenuService);
  private authService = inject(AuthService);

  isMobile = false;
  menuItems: MenuItem[] = [];
  userEmail: string | null = null;

  ngOnInit(): void {
    this.userEmail = localStorage.getItem('email');
    this.menuItems = this.menuService.getMenu();

    this.breakpointObserver
      .observe([Breakpoints.Handset])
      .subscribe(result => {
        this.isMobile = result.matches;
      });
  }

  toggleSidenav(): void {
    this.sidenav.toggle();
  }
  logout(): void {
    this.authService.logout();
  }

  openProfile() { } openSettings() { }
}
