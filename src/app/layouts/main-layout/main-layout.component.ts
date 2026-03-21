import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header';
import { FooterComponent } from './components/footer/footer';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent],
  template: `
    <div class="layout-container">
      <app-header />

      <main class="content">
        <router-outlet />
      </main>

      <app-footer />
    </div>
  `,
  styles: `
    .layout-container {
      display: flex;
      flex-direction: column;
      min-height: 100vh; 
    }
    .content {
      flex: 1; 
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainLayoutComponent {}
