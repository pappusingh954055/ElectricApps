import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupplierComponent } from './supplier-component';

describe('SupplierComponent', () => {
  let component: SupplierComponent;
  let fixture: ComponentFixture<SupplierComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SupplierComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SupplierComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
