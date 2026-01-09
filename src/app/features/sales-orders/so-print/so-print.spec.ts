import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SoPrint } from './so-print';

describe('SoPrint', () => {
  let component: SoPrint;
  let fixture: ComponentFixture<SoPrint>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SoPrint]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SoPrint);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
