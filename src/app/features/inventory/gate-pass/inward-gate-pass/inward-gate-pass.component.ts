import { Component, OnInit, inject } from '@angular/core';
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
    loadingService = inject(LoadingService);

    gatePassForm!: FormGroup;
    isSaving = false;
    currentDate = new Date();

    // Reference for PO Selection
    referenceTypes = [
        { id: GatePassReferenceType.PurchaseOrder, name: 'Purchase Order' },
    ];

    // Mock POs for autocomplete/select
    availablePOs = [
        { id: 101, poNo: 'PO/26-27/0004', supplier: 'ABC Enterprises', expectedQty: 20 },
        { id: 102, poNo: 'PO/26-27/0008', supplier: 'XYZ Logisitics', expectedQty: 50 },
        { id: 103, poNo: 'PO/26-27/0012', supplier: 'Global Trade Co.', expectedQty: 100 }
    ];

    vehicleTypes = ['Truck', 'Tempo', 'LCV', 'Other'];

    ngOnInit() {
        this.initForm();
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
            vehicleNo: ['', [Validators.required, Validators.pattern(/^[A-Z]{2}[ -][0-9]{1,2}(?: [A-Z])?(?: [A-Z]*)? [0-9]{4}$/)]],
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

    onPOSelected(poId: number) {
        const selectedPO = this.availablePOs.find(p => p.id === poId);
        if (selectedPO) {
            this.gatePassForm.patchValue({
                referenceNo: selectedPO.poNo,
                partyName: selectedPO.supplier,
                expectedQty: selectedPO.expectedQty
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
        const gatePassData: GatePass = {
            passType: 'Inward',
            referenceType: GatePassReferenceType.PurchaseOrder,
            referenceId: formValue.referenceId,
            referenceNo: formValue.referenceNo,
            invoiceNo: formValue.invoiceNo,
            partyName: formValue.partyName,
            vehicleNo: formValue.vehicleNo,
            vehicleType: formValue.vehicleType,
            driverName: formValue.driverName,
            driverPhone: formValue.driverPhone,
            transporterName: '', // Optional/Not in new mockup
            totalQty: formValue.expectedQty || 0,
            totalWeight: formValue.totalWeight || 0,
            gateEntryTime: new Date(), // Capture submission time as entry time
            securityGuard: formValue.securityGuard,
            status: GatePassStatus.Entered,
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
                        message: `Inward Gate Pass Generated! Pass No: ${res.passNo || 'GP-IN-2026-XXXX'}`,
                        status: 'success',
                        isSuccess: true
                    }
                }).afterClosed().subscribe(() => {
                    this.resetForm();
                    // Show loader and navigate to Outward Gate Pass
                    this.loadingService.setLoading(true);
                    setTimeout(() => {
                        this.router.navigate(['../outward'], { relativeTo: this.route });
                    }, 500);
                });
            },
            error: (err) => {
                this.isSaving = false;
                console.error(err);
                this.dialog.open(StatusDialogComponent, {
                    data: {
                        title: 'Error',
                        message: 'Failed to generate Inward Pass.',
                        status: 'error',
                        isSuccess: false
                    }
                });
            }
        });
    }
}
