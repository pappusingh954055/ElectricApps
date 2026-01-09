import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PricelistItems } from './pricelist-items';

describe('PricelistItems', () => {
  let component: PricelistItems;
  let fixture: ComponentFixture<PricelistItems>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PricelistItems]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PricelistItems);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
