import { Component, OnInit } from '@angular/core';
import { Validators, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../../shared/material/material/material-module';
import { CategoryService } from '../../../../core/services/category-service/category.service';

@Component({
  selector: 'app-category-form',
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './category-form.html',
  styleUrl: './category-form.scss',
})
export class CategoryForm implements OnInit {
  form!: FormGroup;

  constructor(private fb: FormBuilder,
    private service: CategoryService) { }

  ngOnInit(): void {
    this.form = this.fb.group({
      name: ['', Validators.required],
      code: [''],
      defaultGst: [null],
      description: [''],
      isActive: [true]
    });
  }

  save() {
    if (this.form.invalid) return;
    this.service.add(this.form.value as any);
  }
}