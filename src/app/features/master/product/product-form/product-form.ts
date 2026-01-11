import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MaterialModule } from '../../../../shared/material/material/material-module';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../service/product.service';

import { SubcategoryService } from '../../../../core/services/subcategory-service/subcategory.service';
import { Subcategory } from '../../../../core/models/subcategory-models/subcategory.model';


@Component({
  selector: 'app-product-form',
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './product-form.html',
  styleUrl: './product-form.scss',
})
export class ProductForm implements OnInit {

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,

  ) { }
  form!: FormGroup;
  // readonly categoryService = inject(CategoryService);
  readonly subcategoryService = inject(SubcategoryService);

  // categories = this.categoryService.getAll();
  subcategories = this.subcategoryService.getAll();
  filteredSubcategories: Subcategory[] = [];

  isEditMode = false;
  productId!: number;

  createForm() {
    this.form = this.fb.group({
      categoryId: [null, Validators.required],
      subcategoryId: [null, Validators.required],

      name: ['', Validators.required],
      sku: [''],
      unit: ['PCS', Validators.required],

      hsnCode: [''],
      gstPercent: [0, [Validators.required, Validators.min(0), Validators.max(28)]],

      trackInventory: [true],
      minStock: [null],

      isActive: [true]
    });
  }



  ngOnInit() {
    this.createForm();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.productId = +id;

      const product = this.productService.getById(this.productId);
      if (!product) return;

      this.form.patchValue(product);
      this.onCategoryChange(product.categoryId);
    }
  }

  onCategoryChange(categoryId: number) {
    this.filteredSubcategories = this.subcategories.filter(s => s.categoryId === categoryId);

    this.form.patchValue({ subcategoryId: null });
  }

  // save() {
  //   if (this.form.invalid) return;

  //   const raw = this.form.value;

  //   const category = this.categories.find(c => c.id === raw.categoryId);
  //   const subcategory = this.subcategories.find(s => s.id === raw.subcategoryId);

  //   const product = {
  //     ...raw,
  //     id: this.productId,
  //     categoryName: category?.name,
  //     subcategoryName: subcategory?.name
  //   } as any;

  //   this.isEditMode
  //     ? this.productService.update(product)
  //     : this.productService.add(product);

  //   this.router.navigate(['/products']);
  // }
}
