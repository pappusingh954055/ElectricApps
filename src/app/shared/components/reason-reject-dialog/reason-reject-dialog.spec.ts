import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReasonRejectDialog } from './reason-reject-dialog';

describe('ReasonRejectDialog', () => {
  let component: ReasonRejectDialog;
  let fixture: ComponentFixture<ReasonRejectDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReasonRejectDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReasonRejectDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
