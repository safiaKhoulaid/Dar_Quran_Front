import { Component, OnInit, input, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Section, Student, Gender } from '../../models/dashboard-shared.models';
import { StudentService } from '@features/services/studentService/student.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-student-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './student-management.component.html',
  styleUrls: ['../../dashboard-super-admin.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StudentManagementComponent implements OnInit {
  title = input<string>('إدارة الطلاب');
  addButtonLabel = input<string>('إضافة طالب جديد');
  restrictToSection = input<Section | undefined>(undefined);

  private studentService = inject(StudentService);

  list = signal<Student[]>([]);
  gender = signal<Gender>('HOMME');
  searchQuery = signal<string>('');

  successMessage = signal<string>('');
  errorMessage = signal<string>('');
  formErrors = signal<Record<string, string>>({});

  showFormModal = signal<boolean>(false);
  showDetailsModal = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  detailsUser = signal<Student | null>(null);

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
  listMale = computed(() => this.list().filter(s => s.section === 'HOMME'));
  listFemale = computed(() => this.list().filter(s => s.section === 'FEMME'));

  listMaleFiltered = computed(() => {
    let items = this.listMale();
    const q = this.searchQuery().trim().toLowerCase();
    if (q) {
      items = items.filter(s =>
        (s.nom + ' ' + s.prenom).toLowerCase().includes(q) ||
        (s.email || '').toLowerCase().includes(q) ||
        (s.telephone || '').includes(q)
      );
    }
    return items;
  });

  listFemaleFiltered = computed(() => {
    let items = this.listFemale();
    const q = this.searchQuery().trim().toLowerCase();
    if (q) {
      items = items.filter(s =>
        (s.nom + ' ' + s.prenom).toLowerCase().includes(q) ||
        (s.email || '').toLowerCase().includes(q) ||
        (s.telephone || '').includes(q)
      );
    }
    return items;
  });

  ngOnInit(): void {
    this.loadList();
  }

  loadList(): void {
    this.loading.set(true);
    const restricted = this.restrictToSection();
    if (restricted) {
      this.gender.set(restricted);
    }
    this.studentService.getList().pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (items) => {
        this.list.set((items || []).map(s => this.toStudent(s)));
      },
      error: () => { /* Handle error if needed */ }
    });
  }

  private toStudent(s: any): Student {
    const rawSection = s.section;
    const section = (rawSection === 'FEMME' || rawSection === 1) ? 'FEMME' : 'HOMME';

    // Preserve raw ID
    const id = s.id;

    return {
      id,
      nom: s.nom ?? s.last_name ?? s.lastname ?? '',
      prenom: s.prenom ?? s.first_name ?? s.firstname ?? '',
      email: s.email ?? '',
      telephone: s.telephone ?? s.phone ?? '',
      section,
      gender: section,
      dateNaissance: s.dateNaissance ?? s.birth_date ?? '',
      createdAt: s.createdAt ?? s.created_at
        ? (typeof (s.createdAt ?? s.created_at) === 'string'
          ? (s.createdAt ?? s.created_at)
          : (s.createdAt ?? s.created_at as any)?.date ?? '')
        : '',
      role: undefined,
      status: (s as any).status ?? 'نشط'
      ,
      className: (s as any).className ?? (s as any).class_name ?? '',
      teacherName: (s as any).teacherName ?? (s as any).teacher_name ?? ''
    };
  }

  setGender(g: Gender): void {
    if (this.restrictToSection()) return;
    this.gender.set(g);
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

  editItem(student: Student): void {
    this.isEditing.set(true);
    this.formErrors.set({});
    this.formModel = {
      id: student.id,
      prenom: student.prenom,
      nom: student.nom,
      email: student.email,
      telephone: student.telephone || '',
      section: student.section ?? 'HOMME',
      dateNaissance: student.dateNaissance || '',
      password: '',
      password_confirmation: '',
    };
    this.showFormModal.set(true);
  }

  viewDetails(student: Student): void {
    this.detailsUser.set({ ...student });
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
      this.studentService.update(m.id, {
        prenom: m.prenom.trim(),
        nom: m.nom.trim(),
        email: m.email.trim(),
        telephone: m.telephone?.trim(),
        section: m.section as any,
        dateNaissance: m.dateNaissance || undefined,
      } as any).pipe(finalize(() => this.loadingSubmit.set(false))).subscribe({
        next: (updated) => {
          if (updated) {
            const updatedStudent = this.toStudent(updated);
            this.list.update(items => items.map(s => s.id === m.id ? updatedStudent : s));
            this.setSuccess('تم تحديث الطالب بنجاح');
            this.closeFormModal();
          } else {
            this.setError('فشل في تحديث الطالب.');
          }
        },
        error: () => this.setError('خطأ في الاتصال بالخادم.')
      });
    } else {
      this.studentService.create({
        prenom: m.prenom.trim(),
        nom: m.nom.trim(),
        email: m.email.trim(),
        telephone: m.telephone?.trim(),
        section: m.section as any,
        dateNaissance: m.dateNaissance || undefined,
        password: m.password,
      } as any).pipe(finalize(() => this.loadingSubmit.set(false))).subscribe({
        next: (created) => {
          if (created) {
            this.list.update(items => [...items, this.toStudent(created)]);
            this.setSuccess('تمت إضافة الطالب بنجاح');
            this.closeFormModal();
          } else {
            this.setError('فشل في إضافة الطالب.');
          }
        },
        error: () => this.setError('خطأ في الاتصال بالخادم.')
      });
    }
  }

  confirmDelete(student: Student): void {
    if (!confirm(`هل أنت متأكد من حذف الطالب ${student.prenom} ${student.nom}?`)) return;

    this.loadingDelete.set(true);
    this.studentService.delete(student.id).pipe(finalize(() => this.loadingDelete.set(false))).subscribe({
      next: (ok) => {
        if (ok) {
          this.list.update(items => items.filter(s => s.id !== student.id));
          this.setSuccess('تم حذف الطالب بنجاح');
        } else {
          this.setError('فشل في حذف الطالب.');
        }
      },
      error: () => this.setError('خطأ في الاتصال بالخادم.')
    });
  }

  private setSuccess(msg: string): void {
    this.successMessage.set(msg);
    setTimeout(() => this.successMessage.set(''), 4000);
  }

  private setError(msg: string): void {
    this.errorMessage.set(msg);
    setTimeout(() => this.errorMessage.set(''), 5000);
  }
}
