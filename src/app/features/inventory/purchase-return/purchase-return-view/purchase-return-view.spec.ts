import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PurchaseReturnView } from './purchase-return-view';

describe('PurchaseReturnView', () => {
  let component: PurchaseReturnView;
  let fixture: ComponentFixture<PurchaseReturnView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PurchaseReturnView]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PurchaseReturnView);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
