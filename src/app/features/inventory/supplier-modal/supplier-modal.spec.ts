import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupplierModal } from './supplier-modal';

describe('SupplierModal', () => {
  let component: SupplierModal;
  let fixture: ComponentFixture<SupplierModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SupplierModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SupplierModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
