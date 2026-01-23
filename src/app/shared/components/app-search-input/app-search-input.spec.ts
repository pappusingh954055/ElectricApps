import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppSearchInput } from './app-search-input';

describe('AppSearchInput', () => {
  let component: AppSearchInput;
  let fixture: ComponentFixture<AppSearchInput>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppSearchInput]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AppSearchInput);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
