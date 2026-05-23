// src/app/core/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, tap, catchError, switchMap, delay } from 'rxjs/operators';
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
   * Public method to check if logged in
   */
  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  /**
   * Get CSRF token from meta tag or form HTML
   * Firefly III stores CSRF token in <meta name="csrf-token"> tag
   */
  private getCsrfTokenFromMeta(): string {
    const metaElement = document.querySelector('meta[name="csrf-token"]');
    if (metaElement) {
      const token = metaElement.getAttribute('content');
      if (token) {
        return token;
      }
    }
    return '';
  }

  /**
   * Extract CSRF token from HTML form  
   * Fallback if token is not in meta tag
   */
  private extractCsrfTokenFromHtml(html: string): string {
    // Look for _token input field
    const match = html.match(/<input[^>]*name=["\']_token["\'][^>]*value=["\']([^"\']+)["\']/i);
    if (match && match[1]) {
      return match[1];
    }
    // Look for csrf-token meta tag in HTML
    const metaMatch = html.match(/<meta[^>]*name=["\']csrf-token["\'][^>]*content=["\']([^"\']+)["\']/i);
    if (metaMatch && metaMatch[1]) {
      return metaMatch[1];
    }
    return '';
  }

  /**
   * Login with credentials (Session-based using form submission)
   * Firefly III uses traditional form-based login with CSRF tokens
   * 
   * Flow:
   * 1. GET /csrf-token endpoint to get a fresh CSRF token
   * 2. POST /login with email, password, and _token in form data
   * 3. Server sets firefly_iii_session cookie if credentials are valid
   */
  login(email: string, password: string): Observable<AuthResponse> {
    // First fetch CSRF token from endpoint
    return this.http
      .get<{ csrf_token: string }>('/csrf-token', { 
        withCredentials: true
      })
      .pipe(
        switchMap((response) => {
          const csrfToken = response.csrf_token;
          return this.submitLogin(email, password, csrfToken);
        }),
        catchError((error) => {
          console.error('Failed to fetch CSRF token', error);
          // Try login without token as last resort
          return this.submitLogin(email, password, '');
        })
      );
  }

  /**
   * Submit login form with credentials and CSRF token
   * For Firefly III, login returns a 204 No Content response with session cookie set
   * We need to verify authentication by checking /api/v1/about after login
   */
  private submitLogin(email: string, password: string, csrfToken: string): Observable<AuthResponse> {
    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);
    if (csrfToken) {
      formData.append('_token', csrfToken);
    }

    return this.http
      .post<any>(`${this.apiUrl}/login`, formData, { 
        withCredentials: true
      })
      .pipe(
        delay(500), // Wait for session cookie to be set
        switchMap(() => {
          // Login returned 204 (no content), but session should be set
          // Verify authentication with /api/v1/about
          return this.http.get<any>(`${this.apiUrl}/api/v1/about`, { withCredentials: true });
        }),
        tap((aboutResponse) => {
          // User is authenticated, store the session token
          localStorage.setItem('firefly_token', 'session');
          
          // aboutResponse might be null for 204 No Content from login
          // In that case, just store a placeholder user
          if (!aboutResponse) {
            localStorage.setItem('firefly_user', JSON.stringify({
              id: '1',
              email: email,
              name: 'User',
              role: 'user' as const,
            }));
            this.currentUserSubject.next({
              id: '1',
              email: email,
              name: 'User',
              role: 'user' as const,
            });
            return;
          }
          
          const user = aboutResponse.data || aboutResponse;
          localStorage.setItem('firefly_user', JSON.stringify({
            id: (user?.id || 1).toString(),
            email: email,
            name: user?.attributes?.name || user?.name || 'User',
            role: 'user' as const,
          }));
          this.currentUserSubject.next({
            id: (user?.id || 1).toString(),
            email: email,
            name: user?.attributes?.name || user?.name || 'User',
            role: 'user' as const,
          });
        }),
        catchError((error) => {
          console.error('Login verification failed', error);
          let errorMsg = 'Login failed. Please check your credentials.';
          
          // Try to extract error message from various response formats
          if (error.error?.message) {
            errorMsg = error.error.message;
          } else if (error.error?.errors?.email?.[0]) {
            errorMsg = error.error.errors.email[0];
          } else if (error.error?.errors?.password?.[0]) {
            errorMsg = error.error.errors.password[0];
          } else if (typeof error.error === 'string') {
            errorMsg = error.error;
          } else if (error.status === 419) {
            errorMsg = 'Session expired. Please refresh and try again.';
          } else if (error.status === 422) {
            errorMsg = 'Invalid email or password.';
          } else if (error.status === 401 || error.status === 403) {
            errorMsg = 'Invalid email or password.';
          }
          
          return throwError(() => new Error(errorMsg));
        })
      );
  }

  /**
   * Register new user
   * Posts form data to the Laravel /register endpoint with CSRF token
   * Successfully registered users are redirected and a session cookie is set
   */
  register(email: string, password: string): Observable<AuthResponse> {
    // First fetch CSRF token
    return this.http
      .get<{ csrf_token: string }>('/csrf-token', {
        withCredentials: true
      })
      .pipe(
        switchMap((response) => {
          const csrfToken = response.csrf_token;
          return this.submitRegisterForm(email, password, csrfToken);
        }),
        catchError((error) => {
          console.error('Failed to fetch CSRF token', error);
          // Try register without token as last resort
          return this.submitRegisterForm(email, password, '');
        })
      );
  }

  /**
   * Submit registration form with credentials and CSRF token
   */
  private submitRegisterForm(email: string, password: string, csrfToken: string): Observable<AuthResponse> {
    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);
    formData.append('password_confirmation', password);
    if (csrfToken) {
      formData.append('_token', csrfToken);
    }

    return this.http
      .post<any>('/register', formData, { 
        withCredentials: true
      })
      .pipe(
        tap((response) => {
          // If we got here, registration was successful
          // Laravel sets the session cookie automatically
          localStorage.setItem('firefly_token', 'session');
          localStorage.setItem(
            'firefly_user',
            JSON.stringify({
              id: '1',
              email: email,
              name: 'User',
              role: 'user' as const,
            })
          );
          this.currentUserSubject.next({
            id: '1',
            email: email,
            name: 'User',
            role: 'user' as const,
          });
        }),
        catchError((error) => {
          console.error('Registration failed', error);
          let errorMsg = 'Registration failed. Please try again.';

          if (error.error?.message) {
            errorMsg = error.error.message;
          } else if (error.status === 422) {
            // Try to extract validation errors
            if (error.error?.errors?.email) {
              errorMsg = Array.isArray(error.error.errors.email) 
                ? error.error.errors.email[0] 
                : error.error.errors.email;
            } else if (error.error?.errors?.password) {
              errorMsg = Array.isArray(error.error.errors.password)
                ? error.error.errors.password[0]
                : error.error.errors.password;
            } else {
              errorMsg = 'Invalid email or password.';
            }
          } else if (error.status === 419) {
            errorMsg = 'Session expired. Please refresh and try again.';
          } else if (error.status === 405) {
            errorMsg = 'Registration endpoint not available.';
          }

          return throwError(() => new Error(errorMsg));
        })
      );
  }

  /**
   * Logout user
   */
  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/logout`, {}, { withCredentials: true })
      .pipe(
        tap(() => {
          localStorage.removeItem('firefly_token');
          localStorage.removeItem('firefly_user');
          this.currentUserSubject.next(null);
        }),
        catchError(() => {
          // Even if logout fails, clear local data
          localStorage.removeItem('firefly_token');
          localStorage.removeItem('firefly_user');
          this.currentUserSubject.next(null);
          return new Observable(observer => observer.complete());
        })
      );
  }

  /**
   * Check if user is authenticated (verify with backend)
   */
  checkAuth(): Observable<boolean> {
    return this.http
      .get<any>(`${this.apiUrl}/api/v1/about`, { withCredentials: true })
      .pipe(
        tap(() => {
          // User is authenticated
          localStorage.setItem('firefly_token', 'session');
        }),
        map(() => true),
        catchError(() => {
          // User is not authenticated
          localStorage.removeItem('firefly_token');
          this.currentUserSubject.next(null);
          return throwError(() => new Error('Not authenticated'));
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
   * Get user from local storage
   */
  private getUserFromStorage(): User | null {
    const user = localStorage.getItem('firefly_user');
    return user ? JSON.parse(user) : null;
  }

  /**
   * Check if token is expired (session-based, so always false)
   */
  isTokenExpired(): boolean {
    // Session-based auth doesn't have expiry in localStorage
    // Server will return 401/419 if session is invalid
    return false;
  }
}
