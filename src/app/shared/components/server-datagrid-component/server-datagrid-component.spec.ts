import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServerDatagridComponent } from './server-datagrid-component';

describe('ServerDatagridComponent', () => {
  let component: ServerDatagridComponent;
  let fixture: ComponentFixture<ServerDatagridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServerDatagridComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ServerDatagridComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
