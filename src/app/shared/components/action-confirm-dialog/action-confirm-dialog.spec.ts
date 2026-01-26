import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActionConfirmDialog } from './action-confirm-dialog';

describe('ActionConfirmDialog', () => {
  let component: ActionConfirmDialog;
  let fixture: ComponentFixture<ActionConfirmDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActionConfirmDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ActionConfirmDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
