import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../shared/material/material/material-module';
import { GatePassService } from '../services/gate-pass.service';
import { LoadingService } from '../../../../core/services/loading.service';
import { StatusDialogComponent } from '../../../../shared/components/status-dialog-component/status-dialog-component';
import { MatDialog } from '@angular/material/dialog';
import { Router, ActivatedRoute } from '@angular/router';
import { GatePass, GatePassReferenceType, GatePassStatus } from '../models/gate-pass.model';
import { AuthService } from '../../../../core/services/auth.service';
import { SaleOrderService } from '../../service/saleorder.service';
import { PurchaseReturnService } from '../../purchase-return/services/purchase-return.service';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog-component/confirm-dialog-component';

@Component({
    selector: 'app-outward-gate-pass',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, MaterialModule],
    templateUrl: './outward-gate-pass.component.html',
    styleUrls: ['./outward-gate-pass.component.scss']
})
export class OutwardGatePassComponent implements OnInit {
    private fb = inject(FormBuilder);
    private gatePassService = inject(GatePassService);
    private soService = inject(SaleOrderService);
    private prService = inject(PurchaseReturnService);
    private dialog = inject(MatDialog);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private authService = inject(AuthService);
    private loadingService = inject(LoadingService);
    private cdr = inject(ChangeDetectorRef);

    gatePassForm!: FormGroup;
    isSaving = false;
    isEditMode = false;
    isRedirected = false; // Flag to prevent auto-reset
    gatePassId: number | null = null;
    currentPassNo = 'Auto-Generated Pass No: GP-OUT-2026-XXXX';

    referenceTypes = [
        { id: GatePassReferenceType.SaleOrder, name: 'Sale Order' },
        { id: GatePassReferenceType.PurchaseReturn, name: 'Purchase Return' }
    ];

    availableSOs: any[] = [];
    availablePRs: any[] = [];
    vehicleTypes = ['Truck', 'Tempo', 'LCV', 'Bike', 'Other'];

    ngOnInit() {
        this.loadingService.setLoading(false);
        this.initForm();
        this.loadPendingSOs();
        this.loadPendingPRs();

        this.gatePassForm.get('referenceType')?.valueChanges.subscribe(val => {
            // Prevent reset if we are in the middle of a redirection setup
            if (val && !this.isRedirected) {
                this.gatePassForm.patchValue({ referenceId: null, referenceNo: '', partyName: '', totalQty: 0 });
            }
        });

        this.route.queryParams.subscribe(params => {
            if (params['id'] && params['mode'] === 'edit') {
                this.isEditMode = true;
                this.gatePassId = +params['id'];
                this.loadGatePassData(this.gatePassId);
            } else if (params['type'] === 'purchase-return') {
                this.isRedirected = true;
                this.handlePurchaseReturnRedirection(params);
            } else if (params['type'] === 'sale-order') {
                this.isRedirected = true;
                this.handleSORedirection(params);
            }
        });
    }

    private handleSORedirection(params: any) {
        this.gatePassForm.get('referenceType')?.setValue(GatePassReferenceType.SaleOrder, { emitEvent: false });
        this.gatePassForm.get('referenceType')?.disable({ emitEvent: false });

        const refNo = params['refNo'] || '';
        const partyName = params['partyName'] || '';
        const qty = params['qty'] || 0;
        const refId = params['refId'] || '';

        this.gatePassForm.patchValue({
            referenceId: refId || '',
            referenceNo: refNo,
            partyName: partyName,
            totalQty: qty
        });
        this.cdr.detectChanges();
    }

    private handlePurchaseReturnRedirection(params: any) {
        // 1. Set Type explicitly
        this.gatePassForm.get('referenceType')?.setValue(GatePassReferenceType.PurchaseReturn, { emitEvent: false });
        this.gatePassForm.get('referenceType')?.disable({ emitEvent: false });

        // 2. Extract Values safely
        const refNo = params['refNo'] || '';
        const partyName = params['partyName'] || '';
        const qty = params['qty'] || 0;
        const refId = params['refId'] || '';

        // 3. Patch Values
        this.gatePassForm.patchValue({
            referenceId: refId || '',
            referenceNo: refNo,
            partyName: partyName,
            totalQty: qty
        });

        this.cdr.detectChanges();
    }

    initForm() {
        this.gatePassForm = this.fb.group({
            referenceType: [{ value: GatePassReferenceType.SaleOrder, disabled: true }, Validators.required],
            referenceNo: ['', Validators.required],
            referenceId: [null],
            partyName: [{ value: '', disabled: true }, Validators.required],
            vehicleNo: ['', [Validators.required, Validators.pattern(/^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/i)]],
            vehicleType: ['Truck', Validators.required],
            driverName: ['', Validators.required],
            driverPhone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
            transporterName: [''],
            totalQty: [{ value: 0, disabled: true }, [Validators.required, Validators.min(0.01)]],
            totalWeight: [0],
            securityGuard: [this.authService.getUserName() || '', Validators.required],
            gateEntryTime: [{ value: new Date(), disabled: true }],
            remarks: [''],
            securitySign: [false, Validators.requiredTrue]
        });
    }

    private loadPendingSOs() {
        this.soService.getPendingSOs().subscribe({
            next: (data) => {
                this.availableSOs = data;
                this.cdr.detectChanges();
            },
            error: (err) => console.error('Error fetching pending SOs', err)
        });
    }

    private loadPendingPRs() {
        this.prService.getPendingPRs().subscribe({
            next: (data) => {
                this.availablePRs = data;
                this.cdr.detectChanges();
            },
            error: (err) => console.error('Error fetching pending PRs', err)
        });
    }

    private loadGatePassData(id: number) {
        this.gatePassService.getGatePass(id).subscribe({
            next: (data: any) => {
                this.currentPassNo = `Pass No: ${data.passNo}`;
                this.gatePassForm.patchValue({
                    ...data,
                    gateEntryTime: new Date(data.gateEntryTime),
                    securitySign: true // Assume signed if editing
                });
                this.gatePassForm.get('referenceType')?.disable();
                this.cdr.detectChanges();
            },
            error: (err) => console.error('Error loading gate pass', err)
        });
    }

    onSOSelected(soId: number) {
        const selectedSO = this.availableSOs.find(s => s.id === soId);
        if (selectedSO) {
            this.gatePassForm.patchValue({
                referenceNo: selectedSO.soNumber,
                referenceId: selectedSO.id.toString(),
                partyName: selectedSO.customerName,
                totalQty: selectedSO.totalQty
            });
        }
    }

    onPRSelected(prId: string) {
        const selectedPR = this.availablePRs.find(p => p.id === prId);
        if (selectedPR) {
            this.gatePassForm.patchValue({
                referenceNo: selectedPR.returnNumber,
                referenceId: selectedPR.id, // ID is likely GUID
                partyName: selectedPR.supplierName,
                totalQty: selectedPR.totalQty
            });
        }
    }

    onSubmit() {
        if (this.gatePassForm.invalid) {
            this.gatePassForm.markAllAsTouched();
            return;
        }

        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            data: {
                title: this.isEditMode ? 'Update Gate Pass' : 'Generate Gate Pass',
                message: `Are you sure you want to ${this.isEditMode ? 'update' : 'generate'} this outward gate pass?`
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.saveGatePass();
            }
        });
    }

    saveGatePass() {
        const formValue = this.gatePassForm.getRawValue();
        const gatePassData: GatePass = {
            ...formValue,
            referenceId: String(formValue.referenceId || ''), // Ensure String for GUID support
            id: this.gatePassId || 0,
            passType: 'Outward',
            status: GatePassStatus.Entered,
            createdBy: this.authService.getUserName()
        };

        this.isSaving = true;
        this.loadingService.setLoading(true);
        const request = this.gatePassService.createGatePass(gatePassData);

        request.subscribe({
            next: (res: any) => {
                this.isSaving = false;
                this.loadingService.setLoading(false);
                const msg = this.isEditMode ? 'Gate Pass updated!' : `Outward Pass Generated! No: ${res.passNo || 'GP-OUT-XXXX'}`;

                this.dialog.open(StatusDialogComponent, {
                    data: { title: 'Success', message: msg, status: 'success', isSuccess: true }
                }).afterClosed().subscribe(() => {
                    // Always redirect to Gate Pass List after Outward submission for printing
                    this.router.navigate(['/app/inventory/gate-pass']);
                });
            },
            error: (err: any) => {
                this.isSaving = false;
                this.loadingService.setLoading(false);
                this.dialog.open(StatusDialogComponent, {
                    data: { title: 'Error', message: 'Failed to save Gate Pass', status: 'error', isSuccess: false }
                });
            }
        });
    }

    goBack() {
        this.router.navigate(['/app/inventory/gate-pass']);
    }

    resetForm() {
        this.initForm();
        this.isEditMode = false;
        this.gatePassId = null;
        this.currentPassNo = 'Auto-Generated Pass No: GP-OUT-2026-XXXX';
    }
}
