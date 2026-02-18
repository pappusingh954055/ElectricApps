import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../shared/material/material/material-module';
import { GatePassService } from '../services/gate-pass.service';
import { LoadingService } from '../../../../core/services/loading.service';
import { StatusDialogComponent } from '../../../../shared/components/status-dialog-component/status-dialog-component'; // Adjusted import
import { MatDialog } from '@angular/material/dialog';
import { Router, ActivatedRoute } from '@angular/router';
import { GatePass, GatePassReferenceType, GatePassStatus } from '../models/gate-pass.model';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
    selector: 'app-outward-gate-pass',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, MaterialModule],
    templateUrl: './outward-gate-pass.component.html',
    styleUrls: ['./outward-gate-pass.component.scss']
})
export class OutwardGatePassComponent implements OnInit {
    fb = inject(FormBuilder);
    gatePassService = inject(GatePassService);
    dialog = inject(MatDialog);
    router = inject(Router);
    route = inject(ActivatedRoute);
    authService = inject(AuthService);
    loadingService = inject(LoadingService);

    gatePassForm!: FormGroup;
    isSaving = false;
    currentDate = new Date();

    // Outward references
    referenceTypes = [
        { id: GatePassReferenceType.PurchaseReturn, name: 'Purchase Return' },
        { id: GatePassReferenceType.SaleOrder, name: 'Sale Order' }
    ];

    vehicleTypes = ['Tempo', 'Truck', 'Bike', 'LCV', 'Other'];

    isReferenceLoaded = false;

    ngOnInit() {
        this.loadingService.setLoading(false);
        this.initForm();

        // Check if we passed a reference ID via query params
        this.route.queryParams.subscribe(params => {
            if (params['refId'] && params['type']) {
                // Map string type to enum if possible
                const refType = this.mapReferenceType(params['type']);
                if (refType) {
                    this.gatePassForm.patchValue({
                        referenceType: refType,
                        referenceNo: params['refId']
                    });
                    this.fetchReferenceDetails();
                }
            }
        });
    }

    private mapReferenceType(typeStr: string): number | null {
        // Simple mapping logic based on expected params
        if (typeStr.toLowerCase() === 'purchase-return') return GatePassReferenceType.PurchaseReturn;
        if (typeStr.toLowerCase() === 'sale-order') return GatePassReferenceType.SaleOrder;
        return null;
    }

    initForm() {
        this.gatePassForm = this.fb.group({
            // Reference Details
            referenceType: [GatePassReferenceType.PurchaseReturn, Validators.required],
            referenceNo: ['', Validators.required],
            referenceId: [null], // Internal ID
            partyName: [{ value: '', disabled: true }], // Auto-filled

            // Transport Info
            vehicleNo: ['', [Validators.required, Validators.pattern(/^[A-Z]{2}[ -][0-9]{1,2}(?: [A-Z])?(?: [A-Z]*)? [0-9]{4}$/)]],
            vehicleType: [''],
            driverName: ['', Validators.required],
            driverPhone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
            transporterName: [''],

            // Item Summary
            totalQty: [{ value: 0, disabled: true }],
            totalWeight: [''], // Optional
            remarks: [''],

            // Check & Sign
            securityGuard: ['', Validators.required],
            gateEntryTime: [{ value: this.currentDate, disabled: true }],
            securitySign: [false, Validators.requiredTrue] // Must be checked
        });
    }

    // Simulation of fetching reference details
    fetchReferenceDetails() {
        const refNo = this.gatePassForm.get('referenceNo')?.value;
        const type = this.gatePassForm.get('referenceType')?.value;

        if (!refNo || !type) return;

        // Simulate API call
        // In real app: this.gatePassService.getReferenceDetails(type, refNo).subscribe(...)

        // Mock Response
        setTimeout(() => {
            this.gatePassForm.patchValue({
                referenceId: 101, // Mock internal ID
                partyName: 'ABC Enterprises', // from mockup
                totalQty: 20,
                // totalWeight: 5 // Optional
            });
            this.isReferenceLoaded = true;
        }, 500);
    }

    onSubmit() {
        if (this.gatePassForm.invalid) {
            this.gatePassForm.markAllAsTouched();
            return;
        }

        const formValue = this.gatePassForm.getRawValue();

        // Create payload matching updated Table Model
        const gatePassData: GatePass = {
            // passNo is generated by backend or trigger
            passType: 'Outward',
            referenceType: formValue.referenceType,
            referenceId: formValue.referenceId || 0,
            referenceNo: formValue.referenceNo,
            partyName: formValue.partyName,
            vehicleNo: formValue.vehicleNo,
            vehicleType: formValue.vehicleType,
            driverName: formValue.driverName,
            driverPhone: formValue.driverPhone,
            transporterName: formValue.transporterName,
            totalQty: formValue.totalQty,
            totalWeight: formValue.totalWeight || 0,
            gateEntryTime: new Date(), // Capture exact time
            securityGuard: formValue.securityGuard,
            status: GatePassStatus.Dispatched, // Outward = Dispatched? Or Entered then Dispatched? Usually Outward -> Dispatched immediately upon leaving
            remarks: formValue.remarks,
            createdBy: this.authService.getUserName()
        };

        this.isSaving = true;
        this.gatePassService.createGatePass(gatePassData).subscribe({
            next: (res) => {
                this.isSaving = false;
                this.dialog.open(StatusDialogComponent, {
                    data: {
                        title: 'Success',
                        message: `Outward Gate Pass Generated! Pass No: ${res.passNo || 'GP-PENDING'}`,
                        status: 'success',
                        isSuccess: true
                    }
                }).afterClosed().subscribe(() => {
                    // Navigate back or reset
                    // this.router.navigate(['/app/inventory/gate-pass/list']);
                    this.initForm();
                    this.isReferenceLoaded = false;
                });
            },
            error: (err) => {
                this.isSaving = false;
                console.error(err);
                this.dialog.open(StatusDialogComponent, {
                    data: {
                        title: 'Error',
                        message: 'Failed to generate Gate Pass.',
                        status: 'error',
                        isSuccess: false
                    }
                });
            }
        });
    }

    cancel() {
        this.router.navigate(['/app/inventory']);
    }
}
