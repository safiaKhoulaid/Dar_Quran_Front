import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardSuperAdmin } from './dashboard-super-admin';

describe('DashboardSuperAdmin', () => {
  let component: DashboardSuperAdmin;
  let fixture: ComponentFixture<DashboardSuperAdmin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardSuperAdmin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardSuperAdmin);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
