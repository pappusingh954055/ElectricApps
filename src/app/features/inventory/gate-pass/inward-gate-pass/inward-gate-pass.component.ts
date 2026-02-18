import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MaterialModule } from '../../../../shared/material/material/material-module';
import { GatePassService } from '../services/gate-pass.service';
import { LoadingService } from '../../../../core/services/loading.service';
import { StatusDialogComponent } from '../../../../shared/components/status-dialog-component/status-dialog-component';
import { MatDialog } from '@angular/material/dialog';
import { GatePass, GatePassReferenceType, GatePassStatus } from '../models/gate-pass.model';
import { AuthService } from '../../../../core/services/auth.service';
import { POService } from '../../service/po.service';

@Component({
    selector: 'app-inward-gate-pass',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, MaterialModule],
    templateUrl: './inward-gate-pass.component.html',
    styleUrls: ['./inward-gate-pass.component.scss']
})
export class InwardGatePassComponent implements OnInit {
    fb = inject(FormBuilder);
    gatePassService = inject(GatePassService);
    dialog = inject(MatDialog);
    router = inject(Router);
    route = inject(ActivatedRoute);
    authService = inject(AuthService);
    poService = inject(POService);
    loadingService = inject(LoadingService);
    cdr = inject(ChangeDetectorRef);

    gatePassForm!: FormGroup;
    isSaving = false;
    currentDate = new Date();
    referenceLabel = 'Link With PO No';
    isExternalRef = false;
    isEditMode = false;
    gatePassId: number | null = null;
    currentPassNo = 'Auto-Generated Pass No: GP-IN-2026-XXXX';

    // Reference Selection
    referenceTypes = [
        { id: GatePassReferenceType.PurchaseOrder, name: 'Purchase Order' },
        { id: GatePassReferenceType.SaleReturn, name: 'Sale Return' }
    ];

    // Dynamic POs from API
    availablePOs: any[] = [];

    vehicleTypes = ['Truck', 'Tempo', 'LCV', 'Other'];

    ngOnInit() {
        this.loadingService.setLoading(false);
        this.initForm();
        this.loadPendingPOs();

        this.route.queryParams.subscribe(params => {
            // Mode & ID handling
            if (params['id'] && params['mode'] === 'edit') {
                this.isEditMode = true;
                this.gatePassId = Number(params['id']);
                this.loadGatePassData(this.gatePassId);
            }
            // Sale Return Redirection Flow
            else if (params['refNo'] && params['type'] === 'sale-return') {
                this.handleSaleReturnRedirection(params);
            }
        });
    }

    private loadGatePassData(id: number) {
        this.loadingService.setLoading(true);
        this.gatePassService.getGatePass(id).subscribe({
            next: (data) => {
                this.loadingService.setLoading(false);
                if (data) {
                    this.isExternalRef = true; // Use readonly input for edit mode
                    this.currentPassNo = `Pass No: ${data.passNo}`;

                    // Logic to show correct label
                    this.referenceLabel = data.referenceType === 1 ? 'Link With PO No' : 'Sale Return No';

                    this.gatePassForm.patchValue({
                        referenceId: data.referenceId,
                        referenceNo: data.referenceNo,
                        partyName: data.partyName,
                        vehicleNo: data.vehicleNo,
                        driverName: data.driverName,
                        driverPhone: data.driverPhone,
                        vehicleType: data.vehicleType,
                        expectedQty: data.totalQty,
                        invoiceNo: data.invoiceNo,
                        totalWeight: data.totalWeight,
                        securityGuard: data.securityGuard,
                        remarks: data.remarks
                    });

                    this.cdr.detectChanges();
                }
            },
            error: (err) => {
                this.loadingService.setLoading(false);
                console.error('Error loading gate pass:', err);
                this.notificationShow(false, 'Failed to load Gate Pass data');
            }
        });
    }

    private handleSaleReturnRedirection(params: any) {
        setTimeout(() => {
            this.isExternalRef = true;
            this.referenceLabel = 'Sale Return No';
            const refNo = params['refNo'];

            const refIdControl = this.gatePassForm.get('referenceId');
            if (refIdControl) {
                refIdControl.clearValidators();
                refIdControl.setErrors(null);
            }

            this.gatePassForm.patchValue({
                referenceId: params['refId'] ? Number(params['refId']) : 0,
                referenceNo: refNo,
                partyName: params['partyName'] || '',
                expectedQty: params['qty'] || 0,
                invoiceNo: `CH-${refNo}`
            });

            this.gatePassForm.updateValueAndValidity();
            this.cdr.detectChanges();
        });
    }

    private notificationShow(success: boolean, message: string) {
        this.dialog.open(StatusDialogComponent, {
            data: {
                title: success ? 'Success' : 'Error',
                message: message,
                status: success ? 'success' : 'error',
                isSuccess: success
            }
        });
    }

    initForm() {
        // Current User as Guard
        const currentUser = this.authService.getUserName() || 'Security Guard';

        this.gatePassForm = this.fb.group({
            // 1. Reference Selection
            referenceId: [null, Validators.required], // Holds internal ID of PO
            referenceNo: ['', Validators.required], // Display No
            partyName: [{ value: '', disabled: true }], // Supplier Name

            // 2. Physical Vehicle Details
            vehicleNo: ['', [Validators.required, Validators.pattern(/^[A-Za-z]{2}[0-9]{1,2}[A-Za-z]{0,3}[0-9]{4}$/)]],
            driverName: [''],
            driverPhone: ['', [Validators.pattern(/^[0-9]{10}$/)]],
            vehicleType: ['Tempo', Validators.required], // Default to Tempo

            // 3. Material Summary
            expectedQty: [{ value: 0, disabled: true }],
            invoiceNo: ['', Validators.required], // Mandatory Challan No
            totalWeight: [''], // Approx Weight

            // 4. Security Controls
            securityGuard: [{ value: currentUser, disabled: true }], // Auto-filled
            inTime: [{ value: this.currentDate, disabled: true }], // Auto-Capture
            remarks: ['']
        });
    }

    private loadPendingPOs() {
        this.poService.getPendingPOs().subscribe({
            next: (data) => {
                this.availablePOs = data;
                this.cdr.detectChanges();
            },
            error: (err) => console.error('Error fetching pending POs', err)
        });
    }

    onPOSelected(poId: number) {
        const selectedPO = this.availablePOs.find(p => p.id === poId);
        if (selectedPO) {
            this.gatePassForm.patchValue({
                referenceNo: selectedPO.poNo,
                partyName: selectedPO.supplier,
                expectedQty: selectedPO.expectedQty,
                invoiceNo: `CH-${selectedPO.poNo.replace(/\//g, '-')}` // Auto-filling Challan No for PO
            });
        }
    }

    resetForm() {
        this.initForm();
    }

    onSubmit() {
        if (this.gatePassForm.invalid) {
            this.gatePassForm.markAllAsTouched();
            return;
        }

        const formValue = this.gatePassForm.getRawValue();

        // Create Inward Gate Pass Payload
        const gatePassData: any = {
            id: this.gatePassId || 0,
            passType: 'Inward',
            referenceType: this.referenceLabel === 'Sale Return No' ? GatePassReferenceType.SaleReturn : GatePassReferenceType.PurchaseOrder,
            referenceId: formValue.referenceId || 0,
            referenceNo: formValue.referenceNo,
            invoiceNo: formValue.invoiceNo,
            partyName: formValue.partyName,
            vehicleNo: formValue.vehicleNo,
            vehicleType: formValue.vehicleType,
            driverName: formValue.driverName,
            driverPhone: formValue.driverPhone,
            transporterName: '',
            totalQty: Number(formValue.expectedQty) || 0,
            totalWeight: Number(formValue.totalWeight) || 0,
            gateEntryTime: this.isEditMode ? undefined : new Date(), // Don't overwrite entry time on edit
            securityGuard: formValue.securityGuard,
            status: GatePassStatus.Entered,
            remarks: formValue.remarks,
            createdBy: this.authService.getUserName()
        };

        this.isSaving = true;
        const request = this.isEditMode
            ? this.gatePassService.createGatePass(gatePassData) // Assuming Save endpoint handles both or there's an update endpoint
            : this.gatePassService.createGatePass(gatePassData);

        request.subscribe({
            next: (res: any) => {
                this.isSaving = false;
                const message = this.isEditMode ? 'Gate Pass updated successfully!' : `Inward Gate Pass Generated! Pass No: ${res.passNo || 'GP-IN-2026-XXXX'}`;

                this.dialog.open(StatusDialogComponent, {
                    data: {
                        title: 'Success',
                        message: message,
                        status: 'success',
                        isSuccess: true
                    }
                }).afterClosed().subscribe(() => {
                    this.router.navigate(['/app/inventory/gate-pass']); // Go to list after editing
                });
            },
            error: (err) => {
                this.isSaving = false;
                console.error(err);
                this.dialog.open(StatusDialogComponent, {
                    data: {
                        title: 'Error',
                        message: `Failed to ${this.isEditMode ? 'update' : 'generate'} Inward Pass.`,
                        status: 'error',
                        isSuccess: false
                    }
                });
            }
        });
    }

    goBack() {
        this.router.navigate(['/app/inventory/gate-pass']);
    }
}
