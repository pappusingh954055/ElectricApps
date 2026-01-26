import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GrnListComponent } from './grn-list-component';

describe('GrnListComponent', () => {
  let component: GrnListComponent;
  let fixture: ComponentFixture<GrnListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GrnListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GrnListComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
