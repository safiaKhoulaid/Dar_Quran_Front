import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [RouterModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  stats = [
    { number: '+٢٠٬٠٠٠', label: 'معلم متخصص' },
    { number: '+١٤٧٬٠٠٠', label: 'تقييم من الطلاب' },
    { number: '+٤٥٬٠٠٠', label: 'دورة مرئية' },
    { number: '+١٥٠', label: 'جنسية من المعلمين' }
  ];

  courses = [
    {
      title: 'أساسيات قراءة القرآن',
      price: '٩٩ دولار',
      image: 'https://images.unsplash.com/photo-1507842217343-583f7270bfba?w=400&h=300&fit=crop',
      level: 'مبتدئ',
      description: 'تعلّم أساسيات قراءة القرآن الكريم بطريقة صحيحة',
      lessons: 24
    },
    {
      title: 'القرآن والتجويد',
      price: '٣٥ دولار',
      image: 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=400&h=300&fit=crop',
      level: 'متوسط',
      description: 'إتقان قواعد التجويد وتحسين التلاوة القرآنية',
      lessons: 18
    },
    {
      title: 'الحفظ والتلاوة',
      price: '٧٠ دولار',
      image: 'https://images.unsplash.com/photo-1516321318423-f06f70d504f0?w=400&h=300&fit=crop',
      level: 'متقدم',
      description: 'تحسين مهارة التلاوة والحفظ مع المعلمين المتخصصين',
      lessons: 32
    }
  ];

  testimonials = [
    {
      name: 'سارة أحمد',
      role: 'طالبة',
      comment: 'المعلمون صبورون ومتخصصون. أنصح به بشدة لكل من أراد تعلم القرآن!',
      rating: 5
    },
    {
      name: 'حسن إبراهيم',
      role: 'ولي أمر',
      comment: 'تحسّن أبنائي بشكل ملحوظ في وقت قصير. منصة رائعة وموثوقة.',
      rating: 5
    },
    {
      name: 'فاطمة حسن',
      role: 'طالبة',
      comment: 'أسعار مناسبة ومعلمون محترفون. تجربة تعليمية استثنائية!',
      rating: 5
    }
  ];
}
