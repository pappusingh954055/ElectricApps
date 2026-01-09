import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PricelistList } from './pricelist-list';

describe('PricelistList', () => {
  let component: PricelistList;
  let fixture: ComponentFixture<PricelistList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PricelistList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PricelistList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
