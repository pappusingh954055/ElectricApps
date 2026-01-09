import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SoList } from './so-list';

describe('SoList', () => {
  let component: SoList;
  let fixture: ComponentFixture<SoList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SoList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SoList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
