// src/app/core/services/api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { ApiResponse } from '@shared/models';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly apiUrl = environment.apiUrl;
  private readonly apiVersion = environment.apiVersion;

  constructor(private http: HttpClient) {}

  /**
   * Build full API endpoint URL
   */
  private buildUrl(endpoint: string): string {
    return `${this.apiUrl}/api/${this.apiVersion}/${endpoint}`;
  }

  /**
   * Generic GET request
   */
  get<T>(endpoint: string, params?: any): Observable<ApiResponse<T>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach((key) => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get<ApiResponse<T>>(this.buildUrl(endpoint), {
      params: httpParams,
      withCredentials: true,
    });
  }

  /**
   * Generic POST request
   */
  post<T>(endpoint: string, body: any): Observable<ApiResponse<T>> {
    return this.http.post<ApiResponse<T>>(this.buildUrl(endpoint), body, {
      withCredentials: true,
    });
  }

  /**
   * Generic PUT request
   */
  put<T>(endpoint: string, body: any): Observable<ApiResponse<T>> {
    return this.http.put<ApiResponse<T>>(this.buildUrl(endpoint), body, {
      withCredentials: true,
    });
  }

  /**
   * Generic DELETE request
   */
  delete<T>(endpoint: string): Observable<ApiResponse<T>> {
    return this.http.delete<ApiResponse<T>>(this.buildUrl(endpoint), {
      withCredentials: true,
    });
  }

  /**
   * Generic PATCH request
   */
  patch<T>(endpoint: string, body: any): Observable<ApiResponse<T>> {
    return this.http.patch<ApiResponse<T>>(this.buildUrl(endpoint), body, {
      withCredentials: true,
    });
  }
}
