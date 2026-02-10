import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { Validators, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../shared/material/material/material-module';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';

import { CompanyService } from '../services/company.service';
import { CompanyProfileDto, UpsertCompanyRequest } from '../model/company.model';
import { FormFooter } from '../../shared/form-footer/form-footer';
import { StatusDialogComponent } from '../../../shared/components/status-dialog-component/status-dialog-component';

@Component({
    selector: 'app-company-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, MaterialModule, FormFooter],
    templateUrl: './company-form.html',
    styleUrl: './company-form.scss',
})
export class CompanyForm implements OnInit {
    private fb = inject(FormBuilder);
    private dialog = inject(MatDialog);
    private cdr = inject(ChangeDetectorRef);
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private companyService = inject(CompanyService);

    companyForm!: FormGroup;
    loading = false;
    companyId: string | null = null;
    serverUrl = 'https://localhost:7065';

    getImgUrl(path: string | null): string {
        if (!path) return '';
        if (path.startsWith('data:image') || path.startsWith('http')) return path;
        return `${this.serverUrl}${path.startsWith('/') ? '' : '/'}${path}`;
    }


    ngOnInit(): void {
        this.createForm();
        this.companyId = this.route.snapshot.paramMap.get('id');
        if (this.companyId) {
            this.loadCompany();
        }
    }

    createForm() {
        this.companyForm = this.fb.group({
            name: ['', Validators.required],
            tagline: [''],
            registrationNumber: ['', Validators.required],
            gstin: ['', [Validators.required, Validators.pattern('^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$')]],
            logoUrl: [''],
            primaryEmail: ['', [Validators.required, Validators.email]],
            primaryPhone: ['', [Validators.required]],
            website: [''],
            isActive: [true],

            // Address Nested Group
            address: this.fb.group({
                addressLine1: ['', Validators.required],
                addressLine2: [''],
                city: ['', Validators.required],
                state: ['', Validators.required],
                stateCode: [''], // Hidden in UI, making optional
                pinCode: ['', [Validators.required, Validators.pattern('^[0-9]{6}$')]],
                country: ['India', Validators.required]
            }),

            // Bank Info Nested Group
            bankInfo: this.fb.group({
                bankName: ['', Validators.required],
                branchName: [''], // Hidden in UI, making optional
                accountNumber: ['', Validators.required],
                ifscCode: ['', [Validators.required, Validators.pattern('^[A-Z]{4}0[A-Z0-9]{6}$')]],
                accountType: ['Current', Validators.required]
            }),

            authorizedSignatories: this.fb.array([])
        });
        this.cdr.detectChanges();
    }


    get signatories() {
        return this.companyForm.get('authorizedSignatories') as any;
    }

    private createSignatoryGroup(data?: any): FormGroup {
        return this.fb.group({
            id: [data?.id || 0],
            personName: [data?.personName || '', Validators.required],
            designation: [data?.designation || ''],
            signatureImageUrl: [data?.signatureImageUrl || ''],
            isDefault: [data?.isDefault ?? true]
        });
    }

    addSignatory() {
        this.signatories.push(this.createSignatoryGroup());
    }

    removeSignatory(index: number) {
        this.signatories.removeAt(index);
    }

    loadCompany() {
        if (!this.companyId) return;
        this.loading = true;
        this.companyService.getById(+this.companyId).subscribe({
            next: (res) => {
                // Clear and rebuild Signatories Array
                this.signatories.clear();
                if (res.authorizedSignatories) {
                    res.authorizedSignatories.forEach((s: any) => {
                        this.signatories.push(this.createSignatoryGroup(s));
                    });
                }

                this.companyForm.patchValue(res);
                this.loading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error(err);
                this.loading = false;
                this.cdr.detectChanges();
            }
        });
    }


    onSave(): void {
        if (this.companyForm.invalid) {
            console.warn('Form is invalid. Invalid fields:', this.findInvalidControls());
            this.companyForm.markAllAsTouched();
            return;
        }

        this.loading = true;
        const payload: UpsertCompanyRequest = this.companyForm.value;

        const request = this.companyId
            ? this.companyService.updateCompany(+this.companyId, payload)
            : this.companyService.insertCompany(payload);


        request.subscribe({
            next: (res: any) => {
                this.loading = false;
                this.dialog.open(StatusDialogComponent, {
                    data: {
                        isSuccess: true,
                        message: res.message || 'Company saved successfully'
                    }
                }).afterClosed().subscribe(() => {
                    if (this.selectedLogo) {
                        this.uploadLogo(res || +this.companyId!);
                    }
                    this.router.navigate(['/app/company']);
                });

            },
            error: (err) => {
                this.loading = false;
                this.dialog.open(StatusDialogComponent, {
                    data: {
                        isSuccess: false,
                        message: err.error?.message ?? 'Something went wrong'
                    }
                });
                this.cdr.detectChanges();
            }
        });
    }

    onCancel() {
        this.router.navigate(['/app/company']);
    }

    // --- Logo Upload Logic ---
    selectedLogo: File | null = null;
    logoPreview: string | null = null;

    onLogoSelected(event: any): void {
        const file = event.target.files[0];
        if (file) {
            this.selectedLogo = file;
            const reader = new FileReader();
            reader.onload = (e) => (this.logoPreview = e.target?.result as string);
            reader.readAsDataURL(file);
        }
    }

    onSignatureSelected(event: any, index: number): void {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const base64 = e.target?.result as string;
                this.signatories.at(index).patchValue({
                    signatureImageUrl: base64
                });
                this.cdr.detectChanges();
            };
            reader.readAsDataURL(file);
        }
    }

    uploadLogo(id: number): void {

        if (!this.selectedLogo) return;

        this.companyService.uploadLogo(id, this.selectedLogo).subscribe({
            next: (res) => {
                console.log('Logo uploaded successfully', res);
            },
            error: (err) => {
                console.error('Logo upload failed', err);
            }
        });
    }

    // Helper method to find invalid controls
    private findInvalidControls(): string[] {
        const invalid = [];
        const controls = this.companyForm.controls;
        for (const name in controls) {
            if (controls[name].invalid) {
                invalid.push(name);
            }
        }

        // Recursive check for nested groups
        const addressControls = (this.companyForm.get('address') as FormGroup).controls;
        for (const name in addressControls) {
            if (addressControls[name].invalid) invalid.push(`address.${name}`);
        }

        const bankControls = (this.companyForm.get('bankInfo') as FormGroup).controls;
        for (const name in bankControls) {
            if (bankControls[name].invalid) invalid.push(`bankInfo.${name}`);
        }

        return invalid;
    }
}


