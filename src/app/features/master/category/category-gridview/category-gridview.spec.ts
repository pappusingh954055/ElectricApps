import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CategoryGridview } from './category-gridview';

describe('CategoryGridview', () => {
  let component: CategoryGridview;
  let fixture: ComponentFixture<CategoryGridview>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoryGridview]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CategoryGridview);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
