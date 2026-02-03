import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SaleOrderDetailDialog } from './sale-order-detail-dialog';

describe('SaleOrderDetailDialog', () => {
  let component: SaleOrderDetailDialog;
  let fixture: ComponentFixture<SaleOrderDetailDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SaleOrderDetailDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SaleOrderDetailDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
