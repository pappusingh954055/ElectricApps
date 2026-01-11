import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApiResultDialog } from './api-result-dialog';

describe('ApiResultDialog', () => {
  let component: ApiResultDialog;
  let fixture: ComponentFixture<ApiResultDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApiResultDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ApiResultDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
