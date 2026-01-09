import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SalesInvoice } from './sales-invoice';

describe('SalesInvoice', () => {
  let component: SalesInvoice;
  let fixture: ComponentFixture<SalesInvoice>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SalesInvoice]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SalesInvoice);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
