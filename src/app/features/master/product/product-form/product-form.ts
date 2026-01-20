import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MaterialModule } from '../../../../shared/material/material/material-module';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../service/product.service';
import { ProductLookUpService } from '../service/product.lookup.sercice';
import { FormFooter } from '../../../shared/form-footer/form-footer';
import { ApiResultDialog } from '../../../shared/api-result-dialog/api-result-dialog';
import { Product } from '../model/product.model';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule, FormFooter],
  templateUrl: './product-form.html',
  styleUrl: './product-form.scss',
})
export class ProductForm implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private dialog = inject(MatDialog);
  private productLukupService = inject(ProductLookUpService);
  private productService = inject(ProductService);

  productsForm!: FormGroup;
  loading = false;
  isEditMode = false;
  productId!: number;

  categories: any[] = [];
  subcategories: any[] = []; // Yeh dynamic filter hogi category ke base par

  ngOnInit() {
    this.createForm();
    this.loadInitialLookups();
  }

  createForm() {
    this.productsForm = this.fb.group({
      categoryId: [null, [Validators.required]],
      subcategoryId: [null, [Validators.required]],
      productName: ['', [Validators.required]],
      sku: [null],
      brand: [null],
      unit: ['', [Validators.required]],
      hsnCode: [null],
      basePurchasePrice: [0, [Validators.required, Validators.min(0)]],
      mrp: [0, [Validators.min(0)]],
      defaultGst: [0, [Validators.required]],
      trackInventory: [true],
      isActive: [true],
      minStock: [0, [Validators.min(0)]],
      description: [null]
    });
  }

  // 🔹 Step 1: Pehle sirf categories load karo
  loadInitialLookups() {
    this.productLukupService.getLookups().subscribe({
      next: (res: any) => {
        this.categories = res.categories;
        console.log('Lookups loaded:', this.categories);
      },
      error: (err) => console.error('Lookup load failed', err)
    });
  }

  // 🔹 Step 2: Category change hone par subcategories load karo
  onCategoryChange(categoryId: number): void {
    // Purana selection aur list clear karo
    this.subcategories = [];
    this.productsForm.get('subcategoryid')?.setValue(null);

    if (!categoryId) return;

    this.loading = true; // Loader dikhao lookup ke waqt
    this.productLukupService
      .getSubcategoriesByCategory(categoryId.toString())
      .subscribe({
        next: (data: any) => {
          this.subcategories = data;
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: err => {
          this.loading = false;
          console.error('Failed to load subcategories', err);
        }
      });
  }

  onSave(): void {
    if (this.productsForm.invalid) {
      this.productsForm.markAllAsTouched();
      return;
    }

    this.loading = true;

    const currentUserId = localStorage.getItem('userId') || '';
    const productsData = { ...this.productsForm.value, createdby: currentUserId };

    //const payload = this.mapToProducts(productsData);

    console.log('Payload to be sent:', productsData);

    this.productService.create(productsData)
      .subscribe({
        next: (res) => {
          this.showDialog(true, res.message || 'Product saved successfully');
        },
        error: (err) => {
          this.showDialog(false, err.error?.message ?? 'Something went wrong');
        }
      });
  }

  private showDialog(isSuccess: boolean, msg: string) {
    this.dialog.open(ApiResultDialog, {
      data: { success: isSuccess, message: msg }
    }).afterClosed().subscribe(() => {
      this.loading = false;
      if (isSuccess) {
        this.router.navigate(['/app/master/products']);
      }
      this.cdr.detectChanges();
    });
  }

  onCancel() {
    this.router.navigate(['/app/master/products']);
  }

  // 🔹 Step 3: Complete Mapping for Backend
  private mapToProducts(formValue: any): Product {

    return {

      categoryId: formValue.categoryid,
      subcategoryId: formValue.subcategoryid,
      productName: formValue.productname?.trim(),
      sku: formValue.sku?.trim(),
      brand: formValue.brand?.trim(),
      unit: formValue.unit,
      hsnCode: formValue.hsncode?.trim(),
      basePurchasePrice: Number(formValue.basepurchaseprice),
      mrp: Number(formValue.mrp),
      defaultGst: Number(formValue.defaultgst),
      minStock: Number(formValue.minstock),
      trackInventory: Boolean(formValue.tracknventory),
      isActive: Boolean(formValue.isActive),
      description: formValue.description?.trim(),
    };
  }
}