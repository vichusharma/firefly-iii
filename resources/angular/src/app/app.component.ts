// src/app/app.component.ts
import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NavbarComponent } from '@shared/components/navbar/navbar.component';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, MatToolbarModule, NavbarComponent],
  template: `
    <div [class.dark-theme]="isDarkMode">
      <app-navbar *ngIf="isAuthenticated && !isLoginPage"></app-navbar>
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }

    div {
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    router-outlet {
      flex: 1;
    }
  `],
})
export class AppComponent implements OnInit {
  isDarkMode = false;
  isAuthenticated = false;
  isLoginPage = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.isDarkMode = this.getThemePreference();
    this.checkAuthStatus();
    this.router.events.subscribe(() => {
      this.isLoginPage = this.router.url === '/login' || this.router.url === '/register';
      this.checkAuthStatus();
    });
  }

  private checkAuthStatus(): void {
    this.isAuthenticated = this.authService.isLoggedIn();
  }

  private getThemePreference(): boolean {
    const saved = localStorage.getItem('theme-preference');
    if (saved) {
      return saved === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
}
