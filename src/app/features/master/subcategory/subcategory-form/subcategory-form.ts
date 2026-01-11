import { Component, inject, OnInit } from '@angular/core';
import { Validators, FormBuilder, ReactiveFormsModule, FormGroup } from '@angular/forms';


import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../../shared/material/material/material-module';
import { ActivatedRoute, Router } from '@angular/router';
import { SubcategoryService } from '../../../../core/services/subcategory-service/subcategory.service';



@Component({
  selector: 'app-subcategory-form',
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './subcategory-form.html',
  styleUrl: './subcategory-form.scss',
})
export class SubcategoryForm implements OnInit {

  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
   
  ) { }

   readonly subcategoryService=inject(SubcategoryService);

  // readonly categoryService = inject(CategoryService);

  // categories = this.categoryService.getAll();
  isEditMode = false;
  subcategoryId!: number;



  createForm() {
    this.form = this.fb.group({
      categoryId: [null, Validators.required],
      name: ['', Validators.required],
      defaultGst:[],
      code: [''],
      description: [''],
      isActive: [true]
    });
  }

  ngOnInit() {
    this.createForm();
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.isEditMode = true;
      this.subcategoryId = +id;

      const sub = this.subcategoryService.getById(this.subcategoryId);
      if (!sub) return;

      this.form.patchValue(sub);

      // 🔒 Enterprise rule: category cannot change in edit
      this.form.get('categoryId')?.disable();
    }
  }

  // save() {
  //   if (this.form.invalid) return;

  //   const raw = this.form.getRawValue();

  //   if (this.isEditMode) {
  //     this.subcategoryService.update({
  //       id: this.subcategoryId,
  //       ...raw
  //     } as any);
  //   } else {
  //     const category = this.categories.find(c => c.id === raw.categoryId);
  //     this.subcategoryService.add({
  //       ...raw,
  //       categoryName: category?.name
  //     } as any);
  //   }

  //   this.router.navigate(['/subcategories']);
  // }
}