import { Component, OnInit, input, signal, computed, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Gender, Section } from '../../models/dashboard-shared.models';
import { ClassItem } from '@features/models/class/class.model';
import { ClassService } from '@features/services/classService/class.service';
import { TeacherService, TeacherOption } from '@features/services/teacherService/teacher.service';
import { Section as SectionEnum } from '@core/enums/section.enum';

@Component({
  selector: 'app-class-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './class-management.component.html',
  styleUrls: ['../../dashboard-super-admin.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClassManagementComponent implements OnInit {

  title = input<string>('إدارة الفصول الدراسية');
  addButtonLabel = input<string>('إضافة فصل جديد');
  restrictToSection = input<Section | undefined>(undefined);

  private classService = inject(ClassService);
  private teacherService = inject(TeacherService);

  list = signal<ClassItem[]>([]);
  gender = signal<Gender>('HOMME');
  loading = signal<boolean>(false);

  // Create Class Modal
  showCreateModal = signal<boolean>(false);
  showDetailsModal = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  createForm!: FormGroup;
  private fb = inject(FormBuilder);

  // Assign Teacher Modal (selon la section du classe)
  showAssignTeacherModal = signal<boolean>(false);
  selectedClass = signal<ClassItem | null>(null);
  teachersBySection = signal<TeacherOption[]>([]);
  assignTeacherLoading = signal<boolean>(false);
  selectedTeacherId = signal<string | null>(null);

  listMale = computed(() => this.list().filter(c => c.gender === 'HOMME'));
  listFemale = computed(() => this.list().filter(c => c.gender === 'FEMME'));

  ngOnInit(): void {
    const restricted = this.restrictToSection();
    if (restricted) {
      this.gender.set(restricted);
    }
    this.createForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      gender: [this.gender(), Validators.required],
      capacity: [20, [Validators.required, Validators.min(1)]]
    });
    this.loadList();
  }

  loadList(): void {
    this.loading.set(true);
    this.classService.getList().subscribe({
      next: (items) => {
        this.loading.set(false);
        const restricted = this.restrictToSection();
        let filtered = items || [];
        if (restricted) {
          filtered = filtered.filter(i => i.gender === restricted);
        }
        this.list.set(filtered);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  setGender(g: Gender): void {
    if (this.restrictToSection()) return;
    this.gender.set(g);
  }

  deleteClass(id: string | number): void {
    if (confirm('هل أنت متأكد من حذف هذا الفصل؟')) {
      this.classService.delete(id).subscribe({
        next: (success) => {
          if (success) {
            this.list.update(items => items.filter(i => i.id !== id));
          }
        }
      });
    }
  }

  openCreateModal(): void {
    this.isEditing.set(false);
    this.createForm.reset({ gender: this.gender(), capacity: 20 });
    this.showCreateModal.set(true);
  }

  closeCreateModal(): void {
    this.showCreateModal.set(false);
    this.isEditing.set(false);
  }

  editItem(c: ClassItem): void {
    this.isEditing.set(true);
    this.selectedClass.set(c);
    this.createForm.patchValue({
      name: c.name,
      gender: c.gender,
      capacity: c.studentsCount
    });
    this.showCreateModal.set(true);
  }

  viewDetails(c: ClassItem): void {
    this.selectedClass.set(c);
    this.showDetailsModal.set(true);
  }

  closeDetailsModal(): void {
    this.showDetailsModal.set(false);
    this.selectedClass.set(null);
  }

  submitForm(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const m = this.createForm.value;

    if (this.isEditing() && this.selectedClass()?.id) {
      this.classService.update(this.selectedClass()!.id, m).subscribe({
        next: (updated) => {
          this.loading.set(false);
          if (updated) {
            this.list.update(items => items.map(i => i.id === updated.id ? updated : i));
            this.closeCreateModal();
          }
        },
        error: () => this.loading.set(false)
      });
    } else {
      this.classService.create(m).subscribe({
        next: (newItem) => {
          this.loading.set(false);
          if (newItem) {
            this.list.update(items => [...items, newItem]);
            this.closeCreateModal();
          }
        },
        error: () => this.loading.set(false)
      });
    }
  }

  /** Ouvre le modal d'affectation et charge les enseignants de la même section que la classe. */
  openAssignTeacherModal(c: ClassItem): void {
    this.selectedClass.set(c);
    this.selectedTeacherId.set(c.teacher_id ?? null);
    this.showAssignTeacherModal.set(true);
    const sectionEnum: SectionEnum = c.gender === 'HOMME' ? SectionEnum.HOMME : SectionEnum.FEMME;
    this.teacherService.getListBySection(sectionEnum).subscribe({
      next: (teachers) => this.teachersBySection.set(teachers),
      error: () => this.teachersBySection.set([])
    });
  }

  closeAssignTeacherModal(): void {
    this.showAssignTeacherModal.set(false);
    this.selectedClass.set(null);
    this.selectedTeacherId.set(null);
  }

  selectTeacherForAssign(teacherId: string): void {
    this.selectedTeacherId.set(teacherId);
  }

  submitAssignTeacher(): void {
    const classItem = this.selectedClass();
    const teacherId = this.selectedTeacherId();
    if (!classItem?.id) return;

    this.assignTeacherLoading.set(true);
    this.classService.update(classItem.id, {
      name: classItem.name,
      gender: classItem.gender,
      capacity: classItem.studentsCount ?? 20,
      teacher_id: teacherId ?? null
    }).subscribe({
      next: (updated) => {
        this.assignTeacherLoading.set(false);
        if (updated) {
          this.list.update(items =>
            items.map(i => i.id === classItem.id
              ? { ...i, teacher_id: updated.teacher_id ?? null, teacherName: updated.teacherName ?? null }
              : i)
          );
          this.closeAssignTeacherModal();
        }
      },
      error: () => this.assignTeacherLoading.set(false)
    });
  }
}
