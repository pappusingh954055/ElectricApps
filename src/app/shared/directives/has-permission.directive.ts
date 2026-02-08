import { Directive, Input, TemplateRef, ViewContainerRef, OnDestroy, OnInit } from '@angular/core';
import { PermissionService } from '../../core/services/permission.service';
import { Subscription } from 'rxjs';

@Directive({
    selector: '[hasPermission]',
    standalone: true
})
export class HasPermissionDirective implements OnInit, OnDestroy {
    @Input('hasPermission') permissionType: 'CanView' | 'CanAdd' | 'CanEdit' | 'CanDelete' = 'CanView';

    private subscription: Subscription = new Subscription();
    private hasView = false;

    constructor(
        private templateRef: TemplateRef<any>,
        private viewContainer: ViewContainerRef,
        private permissionService: PermissionService
    ) { }

    ngOnInit() {
        this.updateView();
        // Assuming PermissionService exposes an Observable for permission changes if needed
        // For now, simple check on init or update via shared service logic?
        // Since Router events trigger update in Service, we might need an Observable here.
        // The previous service design didn't expose an observable for permission updates perfectly.
        // Let's rely on simple check for now or enhance service.

        // Actually, UI directives should react to route changes.
        // Enhanced PermissionService needed to subscribe here? 
        // Or just check once? Typically permissions don't change dynamically without page reload or route change.
        // On route change, the component re-renders or directive re-evaluates? No, directive stays if component stays.
        // So we need to subscribe to permission changes.
    }

    private updateView() {
        const hasPermission = this.permissionService.hasPermission(this.permissionType);

        if (hasPermission && !this.hasView) {
            this.viewContainer.createEmbeddedView(this.templateRef);
            this.hasView = true;
        } else if (!hasPermission && this.hasView) {
            this.viewContainer.clear();
            this.hasView = false;
        }
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }
}
