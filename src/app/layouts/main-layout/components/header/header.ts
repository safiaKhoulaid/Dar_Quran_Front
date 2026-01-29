import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.html',
  styleUrls: ['./header.css']
})
export class HeaderComponent {
  isMenuOpen = false;

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu() {
    this.isMenuOpen = false;
  }

  navItems = [
    { label: 'Home', link: '/' },
    { label: 'Programs', link: '/programs' },
    { label: 'Find Tutors', link: '/tutors' },
    { label: 'Community', link: '/community' },
    { label: 'About', link: '/about' },
    { label: 'Contact', link: '/contact' }
  ];
}
