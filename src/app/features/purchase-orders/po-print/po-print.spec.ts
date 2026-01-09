import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PoPrint } from './po-print';

describe('PoPrint', () => {
  let component: PoPrint;
  let fixture: ComponentFixture<PoPrint>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PoPrint]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PoPrint);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
