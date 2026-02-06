import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SaleReturnDetailsModal } from './sale-return-details-modal';

describe('SaleReturnDetailsModal', () => {
  let component: SaleReturnDetailsModal;
  let fixture: ComponentFixture<SaleReturnDetailsModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SaleReturnDetailsModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SaleReturnDetailsModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
