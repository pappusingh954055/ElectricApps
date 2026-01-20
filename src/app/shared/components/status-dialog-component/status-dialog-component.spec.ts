import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatusDialogComponent } from './status-dialog-component';

describe('StatusDialogComponent', () => {
  let component: StatusDialogComponent;
  let fixture: ComponentFixture<StatusDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatusDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StatusDialogComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
