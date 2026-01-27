import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PoSelectionDialog } from './po-selection-dialog';

describe('PoSelectionDialog', () => {
  let component: PoSelectionDialog;
  let fixture: ComponentFixture<PoSelectionDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PoSelectionDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PoSelectionDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
