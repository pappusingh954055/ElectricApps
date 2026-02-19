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
import { SaleReturnService } from '../../sale-return/services/sale-return.service';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog-component/confirm-dialog-component';

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
    srService = inject(SaleReturnService);
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
    availableSaleReturns: any[] = [];

    vehicleTypes = ['Truck', 'Tempo', 'LCV', 'Other'];

    ngOnInit() {
        this.loadingService.setLoading(false);
        this.initForm();
        this.loadPendingData();

        this.gatePassForm.get('referenceType')?.valueChanges.subscribe(val => {
            if (!this.isExternalRef) {
                this.gatePassForm.patchValue({ referenceId: '', referenceNo: '', partyName: '', expectedQty: 0 });
                this.referenceLabel = val === GatePassReferenceType.PurchaseOrder ? 'Link With PO No' : 'Sale Return No';
            }
        });

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
            // Purchase Order Redirection Flow
            else if (params['refNo'] && params['type'] === 'po') {
                this.handlePORedirection(params);
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

                    this.gatePassForm.get('referenceType')?.disable();
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

    private handlePORedirection(params: any) {
        this.isExternalRef = true;
        this.referenceLabel = 'Link With PO No';
        const refNo = params['refNo'];

        const refIdControl = this.gatePassForm.get('referenceId');
        if (refIdControl) {
            refIdControl.clearValidators();
            refIdControl.setErrors(null);
        }

        this.gatePassForm.patchValue({
            referenceType: GatePassReferenceType.PurchaseOrder,
            referenceId: params['refId'] ? String(params['refId']) : '',
            referenceNo: refNo,
            partyName: params['partyName'] || '',
            expectedQty: params['qty'] || 0,
            invoiceNo: `CH-${refNo.replace(/\//g, '-')}`
        });

        this.gatePassForm.get('referenceType')?.disable();
        this.gatePassForm.get('invoiceNo')?.disable(); // Extra safety to make it readonly
        this.gatePassForm.updateValueAndValidity();
        this.cdr.detectChanges();
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
                referenceId: params['refId'] ? String(params['refId']) : '', // Ensure empty string if missing
                referenceNo: refNo,
                partyName: params['partyName'] || '',
                expectedQty: params['qty'] || 0,
                referenceType: GatePassReferenceType.SaleReturn,
                invoiceNo: `CH-${refNo}`
            });

            this.gatePassForm.get('referenceType')?.disable();
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
            referenceType: [GatePassReferenceType.PurchaseOrder, Validators.required],
            referenceId: ['', Validators.required], // Holds internal ID of PO (String/GUID)
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

    private loadPendingData() {
        this.poService.getPendingPOs().subscribe({
            next: (data) => {
                this.availablePOs = data;
                this.cdr.detectChanges();
            },
            error: (err) => console.error('Error fetching pending POs', err)
        });

        this.srService.getPendingSaleReturns().subscribe({
            next: (data) => {
                this.availableSaleReturns = data;
                this.cdr.detectChanges();
            },
            error: (err) => console.error('Error fetching pending Sale Returns', err)
        });
    }

    onSRSelected(srId: any) {
        const selectedSR = this.availableSaleReturns.find(s => String(s.id) === String(srId));
        if (selectedSR) {
            this.gatePassForm.patchValue({
                referenceNo: selectedSR.returnNumber,
                partyName: selectedSR.customerName,
                expectedQty: selectedSR.totalQty,
                invoiceNo: selectedSR.returnNumber // For Sale Return, Return No is often the reference
            });
        }
    }

    onPOSelected(poId: any) {
        const selectedPO = this.availablePOs.find(p => String(p.id) === String(poId));
        if (selectedPO) {
            this.gatePassForm.patchValue({
                referenceNo: selectedPO.poNumber,
                partyName: selectedPO.supplierName,
                expectedQty: selectedPO.expectedQty,
                invoiceNo: `CH-${selectedPO.poNumber.replace(/\//g, '-')}` // Auto-filling Challan No for PO
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

        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            data: {
                title: this.isEditMode ? 'Update Inward Pass' : 'Generate Inward Pass',
                message: `Are you sure you want to ${this.isEditMode ? 'update' : 'generate'} this inward gate pass?`
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

        // Create Inward Gate Pass Payload
        const gatePassData: any = {
            id: this.gatePassId || 0,
            passType: 'Inward',
            referenceType: formValue.referenceType,
            referenceId: formValue.referenceId && formValue.referenceId !== '0' ? String(formValue.referenceId) : '', // Ensure valid string or empty
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
        this.loadingService.setLoading(true);
        const request = this.gatePassService.createGatePass(gatePassData);

        request.subscribe({
            next: (res: any) => {
                this.isSaving = false;
                this.loadingService.setLoading(false);
                const message = this.isEditMode ? 'Gate Pass updated successfully!' : `Inward Gate Pass Generated! Pass No: ${res.passNo || 'GP-IN-2026-XXXX'}`;

                this.dialog.open(StatusDialogComponent, {
                    data: {
                        title: 'Success',
                        message: message,
                        status: 'success',
                        isSuccess: true
                    }
                }).afterClosed().subscribe(() => {
                    // Purchase Order flow: After Gate Pass, go to GRN
                    if (!this.isEditMode && formValue.referenceType === GatePassReferenceType.PurchaseOrder) {
                        this.router.navigate(['/app/inventory/grn-list/add'], {
                            queryParams: { poId: formValue.referenceId }
                        });
                    } else {
                        this.router.navigate(['/app/inventory/gate-pass']);
                    }
                });
            },
            error: (err) => {
                this.isSaving = false;
                this.loadingService.setLoading(false);
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
