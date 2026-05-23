// src/app/core/services/settings.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private defaultCurrency = 'EUR';
  private currencySubject = new BehaviorSubject<string>(this.defaultCurrency);
  public currency$: Observable<string> = this.currencySubject.asObservable();

  constructor() {
    // Load from localStorage if available
    const stored = localStorage.getItem('firefly_currency');
    if (stored) {
      this.currencySubject.next(stored);
    }
  }

  /**
   * Get current currency code
   */
  getCurrency(): string {
    return this.currencySubject.value;
  }

  /**
   * Set currency code
   */
  setCurrency(code: string): void {
    localStorage.setItem('firefly_currency', code);
    this.currencySubject.next(code);
  }

  /**
   * Get default currency (EUR)
   */
  getDefaultCurrency(): string {
    return this.defaultCurrency;
  }
}
