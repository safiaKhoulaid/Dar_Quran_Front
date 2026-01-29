import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class HomeComponent {
  stats = [
    { number: '20,000+', label: 'Experienced Tutors' },
    { number: '1,47,570+', label: 'Reviews for tutors' },
    { number: '45,000+', label: 'Video Courses' },
    { number: '150+', label: 'Tutor Nationalities' }
  ];

  courses = [
    {
      title: 'Quran Reading Basics',
      price: '$99',
      image: 'https://images.unsplash.com/photo-1507842217343-583f7270bfba?w=400&h=300&fit=crop',
      level: 'Beginner',
      description: 'Learn the fundamentals of reading the Quran',
      lessons: 24
    },
    {
      title: 'Quran & Tajweed',
      price: '$35',
      image: 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=400&h=300&fit=crop',
      level: 'Intermediate',
      description: 'Master proper Quranic recitation rules',
      lessons: 18
    },
    {
      title: 'Quran Recitation',
      price: '$70',
      image: 'https://images.unsplash.com/photo-1516321318423-f06f70d504f0?w=400&h=300&fit=crop',
      level: 'Advanced',
      description: 'Perfect your Quran recitation skills',
      lessons: 32
    }
  ];

  testimonials = [
    {
      name: 'Sarah Ahmed',
      role: 'Student',
      comment: 'The tutors are very patient and knowledgeable. Highly recommended!',
      rating: 5
    },
    {
      name: 'Hassan Ibrahim',
      role: 'Parent',
      comment: 'My children have improved significantly in just a few months.',
      rating: 5
    },
    {
      name: 'Fatima Hassan',
      role: 'Student',
      comment: 'Affordable prices and professional instructors. Great experience!',
      rating: 5
    }
  ];
}
