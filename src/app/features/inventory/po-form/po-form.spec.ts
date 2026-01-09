import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PoForm } from './po-form';

describe('PoForm', () => {
  let component: PoForm;
  let fixture: ComponentFixture<PoForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PoForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PoForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
