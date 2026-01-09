import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SoForm } from './so-form';

describe('SoForm', () => {
  let component: SoForm;
  let fixture: ComponentFixture<SoForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SoForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SoForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
