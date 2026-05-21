// src/app/core/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { environment } from '@environments/environment';
import { User, AuthResponse } from '@shared/models';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = environment.apiUrl;
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser$: Observable<User | null>;

  constructor(private http: HttpClient) {
    this.currentUserSubject = new BehaviorSubject<User | null>(
      this.getUserFromStorage()
    );
    this.currentUser$ = this.currentUserSubject.asObservable();
  }

  /**
   * Get current user value
   */
  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Check if user is authenticated
   */
  public get isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /**
   * Login with credentials
   */
  login(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/oauth/token`, {
        client_id: 'firefly-ui',
        client_secret: 'your-secret',
        grant_type: 'password',
        username: email,
        password: password,
        scope: '*',
      })
      .pipe(
        tap((response) => this.handleAuthResponse(response)),
        catchError((error) => {
          console.error('Login failed', error);
          return throwError(() => new Error('Login failed'));
        })
      );
  }

  /**
   * Logout user
   */
  logout(): void {
    localStorage.removeItem('firefly_token');
    localStorage.removeItem('firefly_user');
    this.currentUserSubject.next(null);
  }

  /**
   * Refresh access token
   */
  refreshToken(): Observable<AuthResponse> {
    const refreshToken = localStorage.getItem('firefly_refresh_token');
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http
      .post<AuthResponse>(`${this.apiUrl}/oauth/token`, {
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: 'firefly-ui',
        client_secret: 'your-secret',
        scope: '*',
      })
      .pipe(
        tap((response) => this.handleAuthResponse(response)),
        catchError((error) => {
          this.logout();
          return throwError(() => new Error('Token refresh failed'));
        })
      );
  }

  /**
   * Get stored access token
   */
  getToken(): string | null {
    return localStorage.getItem('firefly_token');
  }

  /**
   * Get stored refresh token
   */
  getRefreshToken(): string | null {
    return localStorage.getItem('firefly_refresh_token');
  }

  /**
   * Handle authentication response
   */
  private handleAuthResponse(response: AuthResponse): void {
    localStorage.setItem('firefly_token', response.access_token);
    localStorage.setItem('firefly_token_type', response.token_type);
    localStorage.setItem(
      'firefly_token_expires',
      (Date.now() + response.expires_in * 1000).toString()
    );

    if (response.user) {
      localStorage.setItem('firefly_user', JSON.stringify(response.user));
      this.currentUserSubject.next(response.user);
    }
  }

  /**
   * Get user from local storage
   */
  private getUserFromStorage(): User | null {
    const user = localStorage.getItem('firefly_user');
    return user ? JSON.parse(user) : null;
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(): boolean {
    const expiryTime = localStorage.getItem('firefly_token_expires');
    if (!expiryTime) return true;
    return Date.now() > parseInt(expiryTime);
  }
}
