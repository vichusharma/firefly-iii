// src/app/core/services/auth.service.ts
import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { BehaviorSubject, Observable, throwError } from "rxjs";
import { map, tap, catchError, switchMap, delay } from "rxjs/operators";
import { environment } from "@environments/environment";
import { User, AuthResponse } from "@shared/models";

@Injectable({
    providedIn: "root",
})
export class AuthService {
    private readonly apiUrl = environment.apiUrl;
    private currentUserSubject: BehaviorSubject<User | null>;
    public currentUser$: Observable<User | null>;

    constructor(private http: HttpClient) {
        this.currentUserSubject = new BehaviorSubject<User | null>(
            this.getUserFromStorage(),
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
            const token = metaElement.getAttribute("content");
            if (token) {
                return token;
            }
        }
        return "";
    }

    /**
     * Extract CSRF token from HTML form
     * Fallback if token is not in meta tag
     */
    private extractCsrfTokenFromHtml(html: string): string {
        // Look for _token input field
        const match = html.match(
            /<input[^>]*name=["\']_token["\'][^>]*value=["\']([^"\']+)["\']/i,
        );
        if (match && match[1]) {
            return match[1];
        }
        // Look for csrf-token meta tag in HTML
        const metaMatch = html.match(
            /<meta[^>]*name=["\']csrf-token["\'][^>]*content=["\']([^"\']+)["\']/i,
        );
        if (metaMatch && metaMatch[1]) {
            return metaMatch[1];
        }
        return "";
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
            .get<{ csrf_token: string }>("/csrf-token", {
                withCredentials: true,
            })
            .pipe(
                switchMap((response) => {
                    const csrfToken = response.csrf_token;
                    return this.submitLogin(email, password, csrfToken);
                }),
                catchError((error) => {
                    console.error("Failed to fetch CSRF token", error);
                    // Try login without token as last resort
                    return this.submitLogin(email, password, "");
                }),
            );
    }

    /**
     * Submit login form with credentials and CSRF token
     * Uses URLSearchParams for proper form data encoding
     * Firefly III expects form-based login, not JSON
     */
    private submitLogin(
        email: string,
        password: string,
        csrfToken: string,
    ): Observable<AuthResponse> {
        // Use URLSearchParams for proper form encoding
        const body = new URLSearchParams();
        body.set("email", email);
        body.set("password", password);
        if (csrfToken) {
            body.set("_token", csrfToken);
        }

        // Set proper headers for form data
        const headers = {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json",
        };

        return this.http
            .post<any>("/login", body.toString(), {
                headers: headers,
                withCredentials: true, // CRITICAL: sends session cookie
            })
            .pipe(
                delay(1000), // Wait for session cookie to be set and 302 redirect handled
                tap((loginResponse) => {
                    // Login successful - session cookie is now set
                    localStorage.setItem("firefly_token", "session");
                    localStorage.setItem(
                        "firefly_user",
                        JSON.stringify({
                            id: "1",
                            email: email,
                            name: "User",
                            role: "user" as const,
                        }),
                    );
                    this.currentUserSubject.next({
                        id: "1",
                        email: email,
                        name: "User",
                        role: "user" as const,
                    });
                }),
                catchError((error) => {
                    console.error("Login failed", error);
                    let errorMsg =
                        "Login failed. Please check your credentials.";

                    if (error.status === 422) {
                        errorMsg = "Invalid email or password.";
                    } else if (error.status === 419) {
                        errorMsg =
                            "Session expired. Please refresh and try again.";
                    } else if (error.status === 401 || error.status === 403) {
                        errorMsg = "Invalid email or password.";
                    } else if (error.status === 0) {
                        errorMsg =
                            "Network error. Please check your connection.";
                    } else if (error.error?.message) {
                        errorMsg = error.error.message;
                    }

                    return throwError(() => new Error(errorMsg));
                }),
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
            .get<{ csrf_token: string }>("/csrf-token", {
                withCredentials: true,
            })
            .pipe(
                switchMap((response) => {
                    const csrfToken = response.csrf_token;
                    return this.submitRegisterForm(email, password, csrfToken);
                }),
                catchError((error) => {
                    console.error("Failed to fetch CSRF token", error);
                    // Try register without token as last resort
                    return this.submitRegisterForm(email, password, "");
                }),
            );
    }

    /**
     * Submit registration form with credentials and CSRF token
     * Uses URLSearchParams for proper form data encoding
     * Firefly III expects form-based registration, not JSON
     */
    private submitRegisterForm(
        email: string,
        password: string,
        csrfToken: string,
    ): Observable<AuthResponse> {
        // Use URLSearchParams for proper form encoding
        const body = new URLSearchParams();
        body.set("email", email);
        body.set("password", password);
        body.set("password_confirmation", password);
        if (csrfToken) {
            body.set("_token", csrfToken);
        }

        // Set proper headers for form data
        const headers = {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json",
        };

        return this.http
            .post<any>("/register", body.toString(), {
                headers: headers,
                withCredentials: true, // CRITICAL: sends session cookie
            })
            .pipe(
                delay(1000), // Wait for session cookie to be set
                tap((response) => {
                    // If we got here, registration succeeded - user created & auto-logged in
                    localStorage.setItem("firefly_token", "session");
                    localStorage.setItem(
                        "firefly_user",
                        JSON.stringify({
                            id: "1",
                            email: email,
                            name: "User",
                            role: "user" as const,
                        }),
                    );
                    this.currentUserSubject.next({
                        id: "1",
                        email: email,
                        name: "User",
                        role: "user" as const,
                    });
                }),
                catchError((error) => {
                    console.error("Registration failed", error);
                    let errorMsg = "Registration failed. Please try again.";

                    if (error.error?.message) {
                        errorMsg = error.error.message;
                    } else if (error.status === 422) {
                        // Try to extract validation errors
                        if (error.error?.errors?.email) {
                            errorMsg = Array.isArray(error.error.errors.email)
                                ? error.error.errors.email[0]
                                : error.error.errors.email;
                        } else if (error.error?.errors?.password) {
                            errorMsg = Array.isArray(
                                error.error.errors.password,
                            )
                                ? error.error.errors.password[0]
                                : error.error.errors.password;
                        } else {
                            errorMsg = "Invalid email or password.";
                        }
                    } else if (error.status === 419) {
                        errorMsg =
                            "Session expired. Please refresh and try again.";
                    } else if (error.status === 405) {
                        errorMsg = "Registration endpoint not available.";
                    }

                    return throwError(() => new Error(errorMsg));
                }),
            );
    }

    /**
     * Logout user
     */
    logout(): Observable<any> {
        return this.http.post("/logout", {}, { withCredentials: true }).pipe(
            tap(() => {
                localStorage.removeItem("firefly_token");
                localStorage.removeItem("firefly_user");
                this.currentUserSubject.next(null);
            }),
            catchError(() => {
                // Even if logout fails, clear local data
                localStorage.removeItem("firefly_token");
                localStorage.removeItem("firefly_user");
                this.currentUserSubject.next(null);
                return new Observable((observer) => observer.complete());
            }),
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
                    localStorage.setItem("firefly_token", "session");
                }),
                map(() => true),
                catchError(() => {
                    // User is not authenticated
                    localStorage.removeItem("firefly_token");
                    this.currentUserSubject.next(null);
                    return throwError(() => new Error("Not authenticated"));
                }),
            );
    }

    /**
     * Get stored access token
     */
    getToken(): string | null {
        return localStorage.getItem("firefly_token");
    }

    /**
     * Get user from local storage
     */
    private getUserFromStorage(): User | null {
        const user = localStorage.getItem("firefly_user");
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
