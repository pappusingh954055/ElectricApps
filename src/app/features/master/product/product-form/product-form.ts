import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MaterialModule } from '../../../../shared/material/material/material-module';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../service/product.service';
import { ProductLookUpService } from '../service/product.lookup.sercice';
import { FormFooter } from '../../../shared/form-footer/form-footer';
import { StatusDialogComponent } from '../../../../shared/components/status-dialog-component/status-dialog-component';
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
  productId: string | null = null;

  categories: any[] = [];
  subcategories: any[] = []; // Yeh dynamic filter hogi category ke base par

  ngOnInit() {
    this.createForm();
    this.loadInitialLookups();

    this.productId = this.route.snapshot.paramMap.get('id');
    if (this.productId) {
      this.isEditMode = true;
      this.loadProduct();
    }
  }

  loadProduct() {
    if (!this.productId) return;
    this.loading = true;
    this.productService.getById(this.productId!).subscribe({
      next: (res: any) => {
        // Load subcategories first, then patch form
        this.productLukupService
          .getSubcategoriesByCategory(res.categoryId.toString())
          .subscribe({
            next: (data: any) => {
              this.subcategories = data;
              this.productsForm.patchValue({
                categoryId: res.categoryId,
                subcategoryId: res.subcategoryId,
                productName: res.name || res.productName,
                sku: res.code || res.sku,
                brand: res.brand,
                unit: res.unit,
                saleRate: res.saleRate,
                hsnCode: res.hsnCode,
                basePurchasePrice: res.basePurchasePrice,
                mrp: res.mrp,
                defaultGst: res.defaultGst,
                trackInventory: res.trackInventory,
                isActive: res.isActive,
                minStock: res.minStock,
                description: res.description
              });
              this.loading = false;
              this.cdr.detectChanges();
            },
            error: err => {
              this.loading = false;
              console.error('Failed to load subcategories for product', err);
            }
          });
      },
      error: (err) => {
        this.loading = false;
        this.cdr.detectChanges();
        console.error('Failed to load product', err);
      }
    });
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
      description: [null],
      saleRate: [0, [Validators.min(0)]],
      productType: [null, [Validators.required]],
      damagedStock: [0],
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
    this.productsForm.get('subcategoryId')?.setValue(null);

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

    const currentUserId = localStorage.getItem('email') || '';
    const productsData = this.mapToProducts(this.productsForm.value);

    if (this.isEditMode && this.productId) {
      productsData.id = this.productId;
      productsData.updatedby = currentUserId; // Required for updates
    } else {
      productsData.createdby = currentUserId; // Required for creation
    }

    const request = this.isEditMode && this.productId
      ? this.productService.update(this.productId, productsData)
      : this.productService.create(productsData);

    request.subscribe({
      next: (res) => {
        this.showDialog(true, res.message || (this.isEditMode ? 'Product updated successfully' : 'Product saved successfully'));
      },
      error: (err) => {
        this.showDialog(false, err.error?.message ?? 'Something went wrong');
      }
    });
  }

  private showDialog(isSuccess: boolean, msg: string) {
    this.dialog.open(StatusDialogComponent, {
      data: { isSuccess: isSuccess, message: msg }
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
  private mapToProducts(formValue: any): any {
    return {
      categoryId: formValue.categoryId,
      subcategoryId: formValue.subcategoryId,
      productName: formValue.productName?.trim(),
      sku: formValue.sku?.trim(),
      brand: formValue.brand?.trim(),
      unit: formValue.unit,
      hsnCode: formValue.hsnCode?.trim(),
      basePurchasePrice: Number(formValue.basePurchasePrice),
      mrp: Number(formValue.mrp),
      defaultGst: Number(formValue.defaultGst),
      minStock: Number(formValue.minStock),
      trackInventory: Boolean(formValue.trackInventory),
      isActive: Boolean(formValue.isActive),
      description: formValue.description?.trim(),
      saleRate: Number(formValue.saleRate),
      productType: formValue.productType ? String(formValue.productType) : '',
      damagedStock: formValue.damagedStock ? Number(formValue.damagedStock) : 0,
    };
  }
}