// src/app/core/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, tap, catchError, switchMap } from 'rxjs/operators';
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
   * 1. Try to get CSRF token from DOM meta tag
   * 2. If not in DOM, GET /login to fetch form and extract token from HTML
   * 3. POST /login with email, password, and _token in form data
   * 4. Server sets firefly_iii_session cookie if credentials are valid
   */
  login(email: string, password: string): Observable<AuthResponse> {
    // First try to get CSRF token from the current page's meta tag
    let csrfToken = this.getCsrfTokenFromMeta();

    // If token not in DOM, fetch the login form to get it
    if (!csrfToken) {
      return this.http
        .get(`${this.apiUrl}/login`, { 
          responseType: 'text',
          withCredentials: true 
        })
        .pipe(
          switchMap((html: string) => {
            csrfToken = this.extractCsrfTokenFromHtml(html);
            return this.submitLogin(email, password, csrfToken);
          }),
          catchError((error) => {
            console.error('Failed to fetch login form', error);
            // Try login without token as last resort
            return this.submitLogin(email, password, '');
          })
        );
    }

    // Token already available in DOM, submit directly
    return this.submitLogin(email, password, csrfToken);
  }

  /**
   * Submit login form with credentials and CSRF token
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
        tap((response) => {
          // For session-based auth, we store a token to track if user is authenticated
          localStorage.setItem('firefly_token', 'session');
          localStorage.setItem('firefly_user', JSON.stringify({
            id: (response.user?.id || 1).toString(),
            email: email,
            name: response.user?.name || 'User',
            role: 'user' as const,
          }));
          this.currentUserSubject.next({
            id: (response.user?.id || 1).toString(),
            email: email,
            name: response.user?.name || 'User',
            role: 'user' as const,
          });
        }),
        catchError((error) => {
          console.error('Login failed', error);
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
          }
          
          return throwError(() => new Error(errorMsg));
        })
      );
  }

  /**
   * Register new user
   * Similar to login, requires CSRF token and form submission
   */
  register(email: string, password: string): Observable<AuthResponse> {
    // First try to get CSRF token from the current page's meta tag
    let csrfToken = this.getCsrfTokenFromMeta();

    // If token not in DOM, fetch the register form to get it
    if (!csrfToken) {
      return this.http
        .get(`${this.apiUrl}/register`, { 
          responseType: 'text',
          withCredentials: true 
        })
        .pipe(
          switchMap((html: string) => {
            csrfToken = this.extractCsrfTokenFromHtml(html);
            return this.submitRegister(email, password, csrfToken);
          }),
          catchError((error) => {
            console.error('Failed to fetch register form', error);
            // Try register without token as last resort
            return this.submitRegister(email, password, '');
          })
        );
    }

    // Token already available in DOM, submit directly
    return this.submitRegister(email, password, csrfToken);
  }

  /**
   * Submit registration form with credentials and CSRF token
   */
  private submitRegister(email: string, password: string, csrfToken: string): Observable<AuthResponse> {
    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);
    formData.append('password_confirmation', password);
    if (csrfToken) {
      formData.append('_token', csrfToken);
    }

    return this.http
      .post<any>(`${this.apiUrl}/register`, formData, { 
        withCredentials: true
      })
      .pipe(
        tap((response) => {
          // For session-based auth, we store a token to track if user is authenticated
          localStorage.setItem('firefly_token', 'session');
          localStorage.setItem('firefly_user', JSON.stringify({
            id: (response.user?.id || 1).toString(),
            email: email,
            name: response.user?.name || 'User',
            role: 'user' as const,
          }));
          this.currentUserSubject.next({
            id: (response.user?.id || 1).toString(),
            email: email,
            name: response.user?.name || 'User',
            role: 'user' as const,
          });
        }),
        catchError((error) => {
          console.error('Registration failed', error);
          let errorMsg = 'Registration failed. Please try again.';
          
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
            errorMsg = 'Email already exists or invalid input.';
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
