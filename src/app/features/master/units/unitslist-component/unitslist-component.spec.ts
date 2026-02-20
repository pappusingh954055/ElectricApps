import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnitslistComponent } from './unitslist-component';

describe('UnitslistComponent', () => {
  let component: UnitslistComponent;
  let fixture: ComponentFixture<UnitslistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UnitslistComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UnitslistComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
