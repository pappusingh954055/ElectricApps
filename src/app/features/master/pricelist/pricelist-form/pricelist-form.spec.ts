import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PricelistForm } from './pricelist-form';

describe('PricelistForm', () => {
  let component: PricelistForm;
  let fixture: ComponentFixture<PricelistForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PricelistForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PricelistForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
