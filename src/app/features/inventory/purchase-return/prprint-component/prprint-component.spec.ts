import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PRPrintComponent } from './prprint-component';

describe('PRPrintComponent', () => {
  let component: PRPrintComponent;
  let fixture: ComponentFixture<PRPrintComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PRPrintComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PRPrintComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
