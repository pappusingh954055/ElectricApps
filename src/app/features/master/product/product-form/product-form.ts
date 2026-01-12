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
  imports: [CommonModule, ReactiveFormsModule, MaterialModule, FormFooter],
  templateUrl: './product-form.html',
  styleUrl: './product-form.scss',
})
export class ProductForm implements OnInit {

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,

  ) { }
  productsForm!: FormGroup;

  readonly productLukupService = inject(ProductLookUpService);
  readonly productService = inject(ProductService);

  isSaving = false;
  isEditMode = false;
  productId!: number;

  categories: any = [];
  subcategories: any = [];

  createForm() {
    this.productsForm = this.fb.group({
      categoryid: [null, Validators.required],
      subcategoryid: [null, Validators.required],
      productname: ['', Validators.required],
      sku: [''],
      unit: ['', Validators.required],
      hsncode: [''],
      defaultgst: [0, [Validators.required, Validators.min(0), Validators.max(28)]],
      tracknventory: [],
      minstock: [],
      description: ['']
    });
  }

  onSave(): void {
    if (this.productsForm.invalid) return;

    this.isSaving = true;

    this.productService.create(this.mapToProducts(this.productsForm.value))
      .subscribe({
        next: (res) => {
          this.openDialog('success', 'Product Saved', res.message);
          this.isSaving = false;
        },
        error: (err) => {
          this.openDialog(
            'error',
            'Save Failed',
            err?.error?.message || 'Something went wrong'
          );
        }
      });
  }


  onCancel() {
    this.router.navigate(['/app/master/products']);
  }

  private openDialog(
    type: 'success' | 'error',
    title: string,
    message: string
  ): void {

    const dialogRef = this.dialog.open(ApiResultDialog, {
      disableClose: true,
      data: { type, title, message }
    });

    dialogRef.afterClosed().subscribe(() => {
      // 🔥 THIS IS THE FIX
      this.isSaving = false;
      this.cdr.detectChanges();
    });
  }

  // 🔹 SINGLE RESPONSIBILITY: MAPPING
  private mapToProducts(formValue: any): Product {
    return {
      categoryid: formValue.categoryid,
      subcategoryid: formValue.subcategoryid,
      productname: formValue.productname,
      sku: formValue.sku,
      unit: formValue.unit,
      hsncode: formValue.hsncode,
      defaultgst: Number(formValue.defaultgst),
      minstock: Number(formValue.minstock),
      trackinventory: Boolean(formValue.trackinventory),
      description: formValue.description?.trim(),
    };
  }


  ngOnInit() {
    this.createForm();
    this.fillCategorySubcategory();

  }

  fillCategorySubcategory() {
    this.productLukupService.getLookups().subscribe({
      next: ((res: any) => {
        this.categories = res.categories;
        this.subcategories = res.subcategories;
      })
    });
  }

  onCategoryChange(categoryId: string): void {

    this.subcategories = [];

    if (!categoryId) return;

    this.productLukupService
      .getSubcategoriesByCategory(categoryId)
      .subscribe({
        next: data => {
          this.subcategories = data;
          console.log(this.subcategories)
        },
        error: err => {
          console.log('failed to losad subcategories', err);
        }
      });
  }
}
