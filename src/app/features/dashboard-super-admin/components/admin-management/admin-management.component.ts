import { Component, OnInit, input, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { finalize } from 'rxjs';
import { Person, Gender } from '../../models/dashboard-shared.models';
import { AdminService } from '@features/services/adminService/admin.service';
import { UserCreateRequest } from '@core/models/users/userCreateRequest.module';
import { UserResponse } from '@core/models/users/userResponse.module';
import { Section } from '@core/enums/section.enum';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-admin-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-management.component.html',
  styleUrls: ['../../dashboard-super-admin.css'],
})
export class AdminManagementComponent implements OnInit {
  title = input<string>('إدارة المشرفين');
  addButtonLabel = input<string>('إضافة مشرف جديد');

  private adminService = inject(AdminService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  list = signal<Person[]>([]);
  gender = signal<Gender>('HOMME');
  searchQuery = signal<string>('');
  successMessage = signal<string>('');
  errorMessage = signal<string>('');
  submitError = signal<string>('');
  formErrors = signal<Record<string, string>>({});

  showFormModal = signal<boolean>(false);
  showDetailsModal = signal<boolean>(false);
  isEditing = signal(false);
  detailsUser = signal<Person | null>(null);

  formModel = {
    id: null as string | number | null,
    prenom: '',
    nom: '',
    email: '',
    telephone: '',
    gender: '' as '' | Gender,
    dateNaissance: '',
    password: '',
    password_confirmation: '',
  };

  loading = signal<boolean>(false);
  loadingSubmit = signal(false);
  loadingDelete = signal<boolean>(false);

  // Computed lists
  listMale = computed(() => this.list().filter((a) => a.gender === 'HOMME'));
  listFemale = computed(() => this.list().filter((a) => a.gender === 'FEMME'));


  listMaleFiltered = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return this.listMale();
    return this.listMale().filter(
      (a) =>
        (a.prenom + ' ' + a.nom).toLowerCase().includes(q) ||
        (a.email || '').toLowerCase().includes(q) ||
        (a.telephone || '').includes(q),
    );
  });

  listFemaleFiltered = computed(() => {
    for (const admin of this.list()) {
      console.log(admin.gender);
    }
    console.log(this.listFemale());
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return this.listFemale();
    return this.listFemale().filter(
      (a) =>
        (a.prenom + ' ' + a.nom).toLowerCase().includes(q) ||
        (a.email || '').toLowerCase().includes(q) ||
        (a.telephone || '').includes(q),
    );
  });



  ngOnInit(): void {
    this.loadList();

    const params = this.route.snapshot.queryParamMap;
    const genderParam = params.get('gender') as Gender | null;
    if (genderParam === 'HOMME' || genderParam === 'FEMME') {
      this.gender.set(genderParam);
    }

    const openForm = params.get('openForm');
    const mode = params.get('mode');
    const adminIdParam = params.get('adminId');

    if (openForm === 'true') {
      if (mode === 'edit' && adminIdParam) {
        const adminId = Number(adminIdParam);
        const allAdmins = [...this.listMale(), ...this.listFemale()];
        const admin = allAdmins.find((a) => a.id === adminId);
        if (admin) {
          this.editItem(admin);
        }
      } else if (mode === 'create') {
        this.openAddModal();
      }
    }
  }

  loadList(): void {
    this.loading.set(true);
    this.adminService.getList().subscribe({
      next: (items) => {
        console.log(items);
        this.loading.set(false);
        this.list.set((items || []).map((a) => this.toPerson(a)));
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  private toPerson(a: any): Person {
    return {
      id: a.id,
      prenom: a.prenom ?? a.first_name ?? a.firstname ?? '',
      nom: a.nom ?? a.last_name ?? a.lastname ?? '',
      email: a.email ?? '',
      telephone: a.telephone ?? a.phone ?? '',
      gender: a.section,
      section: a.section,
      dateNaissance: a.dateNaissance ?? a.birth_date ?? '',
      createdAt: a.createdAt ?? a.created_at ?? '',
      role: a.role === 'teacher' ? 'teacher' : 'admin',
    };
  }

  setGender(g: Gender): void {
    this.gender.set(g);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { gender: g },
      queryParamsHandling: 'merge',
    });
  }

  openAddModal(): void {
    this.isEditing.set(false);
    this.formErrors.set({});
    this.formModel = {
      id: null,
      prenom: '',
      nom: '',
      email: '',
      telephone: '',
      gender: '',
      dateNaissance: '',
      password: '',
      password_confirmation: '',
    };
    this.showFormModal.set(true);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { openForm: true, mode: 'create', adminId: null },
      queryParamsHandling: 'merge',
    });
  }

  closeFormModal(): void {
    this.showFormModal.set(false);
    this.formErrors.set({});
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { openForm: null, mode: null, adminId: null },
      queryParamsHandling: 'merge',
    });
  }

  editItem(admin: Person): void {
    this.isEditing.set(true);
    this.formModel = {
      id: admin.id,
      prenom: admin.prenom,
      nom: admin.nom,
      email: admin.email,
      telephone: admin.telephone || '',
      gender: admin.gender as Gender ?? 'HOMME',
      dateNaissance: admin.dateNaissance || '',
      password: '',
      password_confirmation: '',
    };
    this.showFormModal.set(true);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { openForm: true, mode: 'edit', adminId: admin.id },
      queryParamsHandling: 'merge',
    });
  }

  viewDetails(user: Person): void {
    this.detailsUser.set({ ...user });
    this.showDetailsModal.set(true);
  }

  closeDetailsModal(): void {
    this.showDetailsModal.set(false);
    this.detailsUser.set(null);
  }

  private mapBackendErrors(errors: Record<string, string[]> | undefined): Record<string, string> {
    if (!errors) return {};
    const fieldMap: Record<string, string> = {
      first_name: 'prenom',
      last_name: 'nom',
      password_confirmation: 'password_confirmation',
    };
    const out: Record<string, string> = {};
    for (const [key, messages] of Object.entries(errors)) {
      const field = fieldMap[key] ?? key;
      out[field] = Array.isArray(messages) ? messages[0] : String(messages);
    }
    return out;
  }

  submitForm(form: NgForm): void {
    this.formErrors.set({});
    this.submitError.set('');

    const m = this.formModel;

    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    if (!this.isEditing() && m.password !== m.password_confirmation) {
      this.formErrors.set({ 'password_confirmation': 'تأكيد كلمة المرور غير مطابق' });
      return;
    }

    this.loadingSubmit.set(true);

    const onUpdateResult = (result: UserResponse) => {
      const updatedAdmin = this.toPerson(result as any);
      this.list.update((items) =>
        items.map((item) => (item.id === updatedAdmin.id ? updatedAdmin : item)),
      );
      this.setSuccess('تم تحديث المشرف بنجاح');
      this.closeFormModal();
    };

    if (this.isEditing() && m.id) {
      this.adminService
        .update({
          id: String(m.id),
          user: {
            nom: m.nom.trim(),
            prenom: m.prenom.trim(),
            email: m.email.trim(),
            telephone: m.telephone?.trim() || '',
            dateNaissance: m.dateNaissance || '',
          },
          password: m.password,
          passwordConfirmation: m.password_confirmation || '',
        })
        .pipe(finalize(() => this.loadingSubmit.set(false)))
        .subscribe({
          next: onUpdateResult,
          error: (err) => {
            if (err?.status === 422 && err.error?.errors) {
              this.formErrors.set(this.mapBackendErrors(err.error.errors));
            }
            this.submitError.set(err?.error?.message || 'فشل في تحديث المشرف. تحقق من الاتصال بالخادم.');
          },
        });
    } else {
      const userRequest: UserCreateRequest = {
        id: '',
        nom: m.nom.trim(),
        prenom: m.prenom.trim(),
        email: m.email.trim(),
        telephone: m.telephone?.trim() || '',
        photoUrl: '',
        dateNaissance: m.dateNaissance || '',
        section: m.gender === 'FEMME' ? Section.FEMME : Section.HOMME,
        createdAt: '',
        password: m.password,
      };

      this.adminService
        .create(userRequest)
        .pipe(finalize(() => this.loadingSubmit.set(false)))
        .subscribe({
          next: (user: UserResponse) => {
            this.list.update((items) => [...items, this.toPerson(user as any)]);
            this.setSuccess('تمت إضافة المشرف بنجاح');
            this.closeFormModal();
          },
          error: (err) => {
            if (err?.status === 422 && err.error?.errors) {
              this.formErrors.set(this.mapBackendErrors(err.error.errors));
            }
            this.submitError.set(err?.error?.message || 'فشل في إضافة المشرف. تحقق من الاتصال بالخادم أو من البريد الإلكتروني.');
          },
        });
    }
  }

  confirmDelete(admin: Person): void {
    if (!confirm(`هل أنت متأكد؟ سيتم حذف المشرف ${admin.prenom} ${admin.nom} بشكل نهائي`))
      return;
    this.loadingDelete.set(true);
    this.adminService.delete(admin.id).subscribe({
      next: (ok) => {
        this.loadingDelete.set(false);
        if (ok) {
          this.list.update((items) => items.filter((a) => a.id !== admin.id));
          this.setSuccess('تم حذف المشرف بنجاح');
        } else {
          this.setError('فشل في حذف المشرف. تحقق من الاتصال بالخادم.');
        }
      },
      error: () => {
        this.loadingDelete.set(false);
        this.setError('فشل في حذف المشرف. تحقق من الاتصال بالخادم.');
      },
    });
  }

  private setSuccess(msg: string): void {
    this.successMessage.set(msg);
    this.errorMessage.set('');
    setTimeout(() => {
      this.successMessage.set('');
    }, 4000);
  }

  private setError(msg: string): void {
    this.errorMessage.set(msg);
    setTimeout(() => {
      this.errorMessage.set('');
    }, 5000);
  }
}
