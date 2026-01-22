import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EnterpriseHierarchicalGridComponent } from './enterprise-hierarchical-grid-component';

describe('EnterpriseHierarchicalGridComponent', () => {
  let component: EnterpriseHierarchicalGridComponent;
  let fixture: ComponentFixture<EnterpriseHierarchicalGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EnterpriseHierarchicalGridComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EnterpriseHierarchicalGridComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
