import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './footer.html',
  styleUrls: ['./footer.css']
})
export class FooterComponent {
  currentYear = new Date().getFullYear();

  onNewsletterSubmit() {
    console.log('Newsletter subscription submitted');
  }

  footerSections = [
    {
      title: 'Programs',
      links: [
        { label: 'Quran Basics', href: '#' },
        { label: 'Arabic for Beginners', href: '#' },
        { label: 'Islamic Studies', href: '#' },
        { label: 'Tajweed Mastery', href: '#' }
      ]
    },
    {
      title: 'Resources',
      links: [
        { label: 'Learning Materials', href: '#' },
        { label: 'Video Lessons', href: '#' },
        { label: 'Blog', href: '#' },
        { label: 'FAQ', href: '#' }
      ]
    },
    {
      title: 'Company',
      links: [
        { label: 'About Us', href: '#' },
        { label: 'Contact', href: '#' },
        { label: 'Careers', href: '#' },
        { label: 'Become a Tutor', href: '#' }
      ]
    },
    {
      title: 'Legal',
      links: [
        { label: 'Privacy Policy', href: '#' },
        { label: 'Terms of Service', href: '#' },
        { label: 'Cookie Policy', href: '#' },
        { label: 'Contact Support', href: '#' }
      ]
    }
  ];
}
