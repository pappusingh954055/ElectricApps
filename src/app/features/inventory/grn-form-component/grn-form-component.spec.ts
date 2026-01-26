import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GrnFormComponent } from './grn-form-component';

describe('GrnFormComponent', () => {
  let component: GrnFormComponent;
  let fixture: ComponentFixture<GrnFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GrnFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GrnFormComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
