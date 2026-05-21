// src/app/app.component.ts
import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `
    <div [class.dark-theme]="isDarkMode">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }
  `],
})
export class AppComponent implements OnInit {
  isDarkMode = false;

  ngOnInit() {
    // Check system preference or user preference
    this.isDarkMode = this.getThemePreference();
  }

  private getThemePreference(): boolean {
    const saved = localStorage.getItem('theme-preference');
    if (saved) {
      return saved === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
}
