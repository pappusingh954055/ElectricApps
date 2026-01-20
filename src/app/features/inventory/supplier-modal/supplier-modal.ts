import { Component, inject, OnInit } from '@angular/core';
import { MaterialModule } from '../../../shared/material/material/material-module';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { SupplierComponent } from '../../master/supplier-component/supplier-component';
import { Supplier, SupplierService } from '../service/supplier.service';

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

  supplierForm!: FormGroup;

  ngOnInit(): void {
    this.supplierForm = this.fb.group({
      Name: ['', Validators.required],
      Phone: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      GstIn: [''],
      Address: ['']
    });
  }

  // supplier-modal.component.ts
  // onSave() {
  //   if (this.supplierForm.valid) {
  //     const idFromStorage = localStorage.getItem('userId');

  //     // Agar null hai toh check karein (Safety check)
  //     if (!idFromStorage) {
  //       console.error("User session not found. Please re-login.");
  //       return;
  //     }

  //     const supplierData: Supplier = {
  //       ...this.supplierForm.value,
  //       CreatedBy: idFromStorage 
  //     }

  //     this.supplierService.addSupplier(supplierData).subscribe({
  //       next: (res) => this.dialogRef.close(res),
  //       error: (err) => console.error("Error saving supplier", err)
  //     });
  //   }
  // }


  onSave() {
    if (this.supplierForm.valid) {
      const currentUserId = localStorage.getItem('userId') || '';
      const supplierData = { ...this.supplierForm.value, createdBy: currentUserId };

      this.supplierService.addSupplier(supplierData).subscribe({
        next: (newId) => {
          // Modal band karte waqt naya object pass karein
          const newlyCreatedSupplier = {
            id: newId,
            name: this.supplierForm.value.Name,
            phone: this.supplierForm.value.Phone
          };
          this.dialogRef.close(newlyCreatedSupplier);
        },
        error: (err) => console.error(err)
      });
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}