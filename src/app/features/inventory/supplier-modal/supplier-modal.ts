import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { MaterialModule } from '../../../shared/material/material/material-module';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { SupplierComponent } from '../../master/supplier-component/supplier-component';
import { Supplier, SupplierService } from '../service/supplier.service';
import { PriceListService } from '../../master/pricelist/service/pricelist.service';

@Component({
  selector: 'app-supplier-modal',
  imports: [MaterialModule, CommonModule, ReactiveFormsModule],
  templateUrl: './supplier-modal.html',
  styleUrl: './supplier-modal.scss',
})
export class SupplierModalComponent implements OnInit {

  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<SupplierModalComponent>);
  private supplierService = inject(SupplierService);
  private pricelistService = inject(PriceListService);
  private cdr = inject(ChangeDetectorRef);

  supplierForm!: FormGroup;
  loading = false;

  priceLists: any[] = [];

  createForm() {
    this.supplierForm = this.fb.group({
      name: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      gstIn: [''],
      address: [''],
      defaultpricelistId: [null, Validators.required],
      isActive: [true]
    });
  }


  ngOnInit(): void {
    this.createForm();
    this.loadPriceLists();
  }

  loadPriceLists(): void {
    this.loading = true;
    this.pricelistService.getPriceLists().subscribe({
      next: (res) => {
        this.priceLists = res;
        this.loading = false;
        this.cdr.detectChanges();
        console.log("Price Lists loaded in modal:", res);
      },
      error: (err) => console.error("Error loading price lists", err),
      complete: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }


  onSave() {
    this.loading = true;
    this.cdr.detectChanges();
    if (this.supplierForm.valid) {
      const currentEmail = localStorage.getItem('email') || localStorage.getItem('userId') || '';
      const supplierData = {
        ...this.supplierForm.value,
        createdBy: currentEmail
      };

      this.supplierService.addSupplier(supplierData).subscribe({
        next: (newId) => {

          const newlyCreatedSupplier = {
            id: newId,
            ...this.supplierForm.value
          };

          this.dialogRef.close(newlyCreatedSupplier);
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error("Supplier save failed:", err);
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}