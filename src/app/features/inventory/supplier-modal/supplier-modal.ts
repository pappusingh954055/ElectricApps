import { Component, inject, OnInit } from '@angular/core';
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
  private dialogRef = inject(MatDialogRef<SupplierComponent>);
  private supplierService = inject(SupplierService);
  private pricelistService = inject(PriceListService);

  supplierForm!: FormGroup;

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
    this.pricelistService.getPriceLists().subscribe({
      next: (res) => {
        this.priceLists = res;
        console.log("Price Lists loaded in modal:", res);
      },
      error: (err) => console.error("Error loading price lists", err)
    });
  }


  onSave() {
    if (this.supplierForm.valid) {
      const currentUserId = localStorage.getItem('userId') || '';

      // 1. Form values ke saath defaultPriceListId aur createdBy merge karein
      const supplierData = {
        ...this.supplierForm.value,
        createdBy: currentUserId
      };

      this.supplierService.addSupplier(supplierData).subscribe({
        next: (newId) => {
          // 2. Modal band karte waqt defaultPriceListId bhi bhejein 
          // taaki PO Form use bina API call kiye auto-select kar sake
          const newlyCreatedSupplier = {
            id: newId,
            name: this.supplierForm.value.name,
            phone: this.supplierForm.value.phone,
            gstIn: this.supplierForm.value.gstIn,
            address: this.supplierForm.value.address,
            defaultpricelistId: this.supplierForm.value.defaultpricelistId ? Number(this.supplierForm.value.defaultpricelistId) : null, // <-- Ye zaroori hai
            isActive: this.supplierForm.value.isActive
          };

          this.dialogRef.close(newlyCreatedSupplier);
        },
        error: (err) => {
          console.error("Supplier save failed:", err);
          // Yahan aap Toastr ya alert dikha sakte hain
        }
      });
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}