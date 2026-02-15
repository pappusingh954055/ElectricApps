import { Routes } from '@angular/router';
import { PermissionGuard } from '../core/gaurds/permission.guard';

export const FINANCE_ROUTES: Routes = [
    {
        path: 'suppliers',
        children: [
            {
                path: 'ledger',
                canActivate: [PermissionGuard],
                loadComponent: () => import('../features/finance/supplier-ledger/supplier-ledger.component').then(m => m.SupplierLedgerComponent)
            },
            {
                path: 'payment',
                canActivate: [PermissionGuard],
                loadComponent: () => import('../features/finance/payment-entry/payment-entry.component').then(m => m.PaymentEntryComponent)
            },
            {
                path: 'dues',
                canActivate: [PermissionGuard],
                loadComponent: () => import('../features/finance/report/pending-dues.component').then(m => m.PendingDuesComponent)
            },
        ]
    },
    {
        path: 'customers',
        children: [
            {
                path: 'ledger',
                canActivate: [PermissionGuard],
                loadComponent: () => import('../features/finance/customer-ledger/customer-ledger.component').then(m => m.CustomerLedgerComponent)
            },
            {
                path: 'receipt',
                canActivate: [PermissionGuard],
                loadComponent: () => import('../features/finance/receipt-entry/receipt-entry.component').then(m => m.ReceiptEntryComponent)
            },
            {
                path: 'outstanding',
                canActivate: [PermissionGuard],
                loadComponent: () => import('../features/finance/report/outstanding-tracker.component').then(m => m.OutstandingTrackerComponent)
            },
        ]
    },
    {
        path: 'p-and-l',
        canActivate: [PermissionGuard],
        loadComponent: () => import('../features/finance/pl-dashboard/pl-dashboard.component').then(m => m.PLDashboardComponent)
    }
];
