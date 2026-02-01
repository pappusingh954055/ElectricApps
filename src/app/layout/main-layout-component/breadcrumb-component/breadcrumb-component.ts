import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './breadcrumb-component.html',
  styleUrls: ['./breadcrumb-component.scss'],
})
export class BreadcrumbComponent {

  breadcrumbs: string[] = [];

  private router = inject(Router);
  private route = inject(ActivatedRoute);

  constructor() {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.breadcrumbs = this.buildBreadcrumb(this.route.root);
      });
  }

  private buildBreadcrumb(
    route: ActivatedRoute,
    crumbs: string[] = []
  ): string[] {

    const children = route.children;
    if (!children.length) return crumbs;

    const child = children[0];
    const label = child.snapshot.data['breadcrumb'];

    // 🛡️ Prevent duplicate labels (common in nested routes without own breadcrumbs)
    if (label && crumbs[crumbs.length - 1] !== label) {
      crumbs.push(label);
    }

    return this.buildBreadcrumb(child, crumbs);
  }
}
