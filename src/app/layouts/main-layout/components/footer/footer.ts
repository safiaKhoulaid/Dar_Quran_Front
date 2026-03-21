import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-footer',
  imports: [RouterModule],
  templateUrl: './footer.html',
  styleUrls: ['./footer.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent {
  currentYear = 2026;

  onNewsletterSubmit() { }

  footerSections = [
    {
      title: 'البرامج',
      links: [
        { label: 'أساسيات القرآن', href: '#' },
        { label: 'اللغة العربية للمبتدئين', href: '#' },
        { label: 'الدراسات الإسلامية', href: '#' },
        { label: 'إتقان التجويد', href: '#' },
      ]
    },
    {
      title: 'الموارد',
      links: [
        { label: 'المواد التعليمية', href: '#' },
        { label: 'الدروس المرئية', href: '#' },
        { label: 'المدونة', href: '#' },
        { label: 'الأسئلة الشائعة', href: '#' },
      ]
    },
    {
      title: 'الشركة',
      links: [
        { label: 'من نحن', href: '#' },
        { label: 'اتصل بنا', href: '#' },
        { label: 'فرص العمل', href: '#' },
        { label: 'انضم كمعلم', href: '#' },
      ]
    },
    {
      title: 'قانوني',
      links: [
        { label: 'سياسة الخصوصية', href: '#' },
        { label: 'شروط الخدمة', href: '#' },
        { label: 'سياسة ملفات تعريف الارتباط', href: '#' },
        { label: 'الدعم', href: '#' },
      ]
    }
  ];
}
