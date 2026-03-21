import { Component, OnInit, input, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Person, Section, Gender } from '../../models/dashboard-shared.models';
import { TeacherService } from '@features/services/teacherService/teacher.service';
import { Section as SectionEnum } from '@core/enums/section.enum';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-teacher-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './teacher-management.component.html',
  styleUrls: ['../../dashboard-super-admin.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TeacherManagementComponent implements OnInit {
  title = input<string>('إدارة المعلمين');
  addButtonLabel = input<string>('إضافة معلم جديد');
  restrictToSection = input<Section | undefined>(undefined);

  private teacherService = inject(TeacherService);

  list = signal<Person[]>([]);
  section = signal<Section>('HOMME');
  successMessage = signal<string>('');
  errorMessage = signal<string>('');
  formErrors = signal<Record<string, string>>({});

  showFormModal = signal<boolean>(false);
  showDetailsModal = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  detailsUser = signal<Person | null>(null);

  formModel = {
    id: null as string | number | null,
    prenom: '',
    nom: '',
    email: '',
    telephone: '',
    section: '' as '' | Section,
    dateNaissance: '',
    password: '',
    password_confirmation: '',
  };

  loading = signal<boolean>(false);
  loadingSubmit = signal<boolean>(false);
  loadingDelete = signal<boolean>(false);

  // Computed lists
  listMale = computed(() => this.list().filter((t) => t.section === 'HOMME'));
  listFemale = computed(() => this.list().filter((t) => t.section === 'FEMME'));

  ngOnInit(): void {
    this.loadList();
  }

  loadList(): void {
    this.loading.set(true);
    const restricted = this.restrictToSection();
    if (restricted) {
      this.section.set(restricted);
    }
    this.teacherService.getList().subscribe({
      next: (items) => {
        this.loading.set(false);
        this.list.set((items || []).map((t) => this.toPerson(t)));
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  private toPerson(a: any): Person {
    const section = a.section === SectionEnum.FEMME || a.section === 'FEMME' ? 'FEMME' : 'HOMME';
    const id = a.id;
    return {
      id,
      nom: a.nom ?? a.last_name ?? a.lastname ?? '',
      prenom: a.prenom ?? a.first_name ?? a.firstname ?? '',
      email: a.email ?? '',
      telephone: a.phone ?? a.telephone ?? '',
      section,
      dateNaissance: a.dateNaissance ?? a.birth_date ?? '',
      createdAt: a.createdAt ?? '',
      role: 'teacher'
    };
  }

  setGender(g: Section): void {
    if (this.restrictToSection()) return; // Cannot change if restricted
    this.section.set(g);
  }

  openAddModal(): void {
    const restricted = this.restrictToSection();
    this.isEditing.set(false);
    this.formErrors.set({});
    this.formModel = {
      id: null,
      prenom: '',
      nom: '',
      email: '',
      telephone: '',
      section: restricted || '',
      dateNaissance: '',
      password: '',
      password_confirmation: '',
    };
    this.showFormModal.set(true);
  }

  closeFormModal(): void {
    this.showFormModal.set(false);
    this.formErrors.set({});
  }

  editItem(teacher: Person): void {
    this.isEditing.set(true);
    this.formModel = {
      id: teacher.id,
      prenom: teacher.prenom,
      nom: teacher.nom,
      email: teacher.email,
      telephone: teacher.telephone || '',
      section: teacher.section ?? 'HOMME',
      dateNaissance: teacher.dateNaissance || '',
      password: '',
      password_confirmation: '',
    };
    console.log("this.formModel", this.formModel);
    this.showFormModal.set(true);
  }

  viewDetails(user: Person): void {
    this.detailsUser.set({ ...user });
    this.showDetailsModal.set(true);
  }

  closeDetailsModal(): void {
    this.showDetailsModal.set(false);
    this.detailsUser.set(null);
  }

  submitForm(): void {
    const errors: Record<string, string> = {};
    const m = this.formModel;
    if (!m.prenom?.trim()) errors['prenom'] = 'الاسم مطلوب';
    if (!m.nom?.trim()) errors['nom'] = 'اللقب مطلوب';
    if (!m.email?.trim()) errors['email'] = 'البريد الإلكتروني مطلوب';
    if (!this.isEditing()) {
      if (!m.password?.trim()) errors['password'] = 'كلمة المرور مطلوبة';
      else if ((m.password || '').length < 6)
        errors['password'] = 'كلمة المرور 6 أحرف على الأقل';
      if (m.password !== m.password_confirmation)
        errors['password_confirmation'] = 'تأكيد كلمة المرور غير مطابق';
    }

    if (Object.keys(errors).length > 0) {
      this.formErrors.set(errors);
      return;
    }

    this.loadingSubmit.set(true);
    if (this.isEditing() && (m.id !== null && m.id !== undefined)) {
      this.teacherService
        .update(m.id, {
          prenom: m.prenom.trim(),
          nom: m.nom.trim(),
          email: m.email.trim(),
          telephone: m.telephone?.trim() || undefined,
          section: (m.section || 'HOMME') === 'FEMME' ? SectionEnum.FEMME : SectionEnum.HOMME,
          dateNaissance: m.dateNaissance || undefined,
        })
        .pipe(finalize(() => this.loadingSubmit.set(false)))
        .subscribe({
          next: (updated) => {
            if (updated) {
              const updatedPerson = this.toPerson(updated);
              this.list.update(items => items.map(t => t.id === m.id ? updatedPerson : t));
              this.setSuccess('تم تحديث المعلم بنجاح');
              this.closeFormModal();
            } else {
              this.setError('فشل في تحديث المعلم. تحقق من الاتصال بالخادم.');
            }
          },
          error: () => this.setError('فشل في تحديث المعلم.')
        });
    } else {
      this.teacherService
        .create({
          id: '',
          prenom: m.prenom.trim(),
          nom: m.nom.trim(),
          email: m.email.trim(),
          telephone: m.telephone?.trim(),
          section: (m.section || 'HOMME') === 'FEMME' ? SectionEnum.FEMME : SectionEnum.HOMME,
          dateNaissance: m.dateNaissance || undefined,
          password: m.password,
          passwordConfirmation: m.password_confirmation,
          createdAt: '',
        })
        .pipe(finalize(() => this.loadingSubmit.set(false)))
        .subscribe({
          next: (created) => {
            if (created) {
              this.list.update(items => [...items, this.toPerson(created)]);
              this.setSuccess('تمت إضافة المعلم بنجاح');
              this.closeFormModal();
            } else {
              this.setError('فشل في إضافة المعلم. تحقق من الاتصال بالخادم أو من البريد الإلكتروني.');
            }
          },
          error: () => this.setError('فشل في إضافة المعلم.')
        });
    }
  }

  confirmDelete(teacher: Person): void {
    if (!confirm(`هل أنت متأكد؟ سيتم حذف المعلم ${teacher.nom} ${teacher.prenom} بشكل نهائي`))
      return;
    this.loadingDelete.set(true);
    this.teacherService.delete(teacher.id).pipe(finalize(() => this.loadingDelete.set(false))).subscribe({
      next: (ok) => {
        if (ok) {
          this.list.update(items => items.filter((t) => t.id !== teacher.id));
          this.setSuccess('تم حذف المعلم بنجاح');
        } else {
          this.setError('فشل في حذف المعلم. تحقق من الاتصال بالخادم.');
        }
      },
      error: () => this.setError('فشل في حذف المعلم.')
    });
  }

  private setSuccess(msg: string): void {
    this.successMessage.set(msg);
    this.errorMessage.set('');
    setTimeout(() => this.successMessage.set(''), 4000);
  }

  private setError(msg: string): void {
    this.errorMessage.set(msg);
    setTimeout(() => this.errorMessage.set(''), 5000);
  }
}
