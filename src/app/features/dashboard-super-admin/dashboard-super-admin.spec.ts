import { ComponentFixture, TestBed } from '@angular/core/testing';

import { dashboardSuperAdmin } from './dashboard-super-admin';

describe('dashboardSuperAdmin', () => {
  let component: dashboardSuperAdmin;
  let fixture: ComponentFixture<dashboardSuperAdmin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [dashboardSuperAdmin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(dashboardSuperAdmin);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
