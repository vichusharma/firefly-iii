import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';

export interface ImportJob {
  id: string;
  key: string;
  userId: string;
  status: 'new' | 'configured' | 'running' | 'success' | 'error';
  createdAt: string;
  updatedAt: string;
}

export interface ImportResult {
  success: boolean;
  message: string;
  jobId?: string;
  errors?: string[];
}

export interface ImportConfiguration {
  doMapping?: boolean;
  skipForm?: boolean;
  accounts?: Record<string, string>;
  delimiter?: string;
  dateFormat?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ImporterService {
  private importerUrl = 'http://localhost:8888';
  private readonly API_V1 = `${this.importerUrl}/api/v1`;

  constructor(private http: HttpClient) {
    // Override with environment-specific URL if needed
    if (environment.production) {
      this.importerUrl = `${environment.apiUrl.replace(':8081', ':8888')}`;
    }
  }

  /**
   * Get the importer health status
   */
  getHealth(): Observable<any> {
    return this.http.get(`${this.importerUrl}/health`);
  }

  /**
   * Upload a file for import (CSV, OFX, MT940, etc.)
   * @param file The file to upload
   * @returns Observable with import job information
   */
  uploadFile(file: File): Observable<ImportJob> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<ImportJob>(`${this.API_V1}/import/upload`, formData);
  }

  /**
   * Get the status of an import job
   * @param jobId The import job ID
   */
  getJobStatus(jobId: string): Observable<ImportJob> {
    return this.http.get<ImportJob>(`${this.API_V1}/import/status/${jobId}`);
  }

  /**
   * Start an import job
   * @param jobId The import job ID
   * @param config Optional import configuration
   */
  startImport(jobId: string, config?: ImportConfiguration): Observable<ImportResult> {
    const body = config || {};
    return this.http.post<ImportResult>(
      `${this.API_V1}/import/start/${jobId}`,
      body
    );
  }

  /**
   * Get import history (list of recent imports)
   * @param limit Number of recent imports to fetch
   */
  getImportHistory(limit: number = 10): Observable<ImportJob[]> {
    return this.http.get<ImportJob[]>(
      `${this.API_V1}/import/list?limit=${limit}`
    );
  }

  /**
   * Get details of a completed import
   * @param jobId The import job ID
   */
  getImportDetails(jobId: string): Observable<any> {
    return this.http.get(`${this.API_V1}/import/details/${jobId}`);
  }

  /**
   * Test the importer connection to Firefly III API
   */
  testConnection(): Observable<any> {
    return this.http.get(`${this.API_V1}/test/connection`);
  }

  /**
   * Get supported file formats
   */
  getSupportedFormats(): Observable<string[]> {
    return this.http.get<string[]>(`${this.API_V1}/import/formats`);
  }

  /**
   * Map columns in uploaded file
   * @param jobId The import job ID
   * @param mapping Column mapping configuration
   */
  mapColumns(jobId: string, mapping: Record<string, string>): Observable<ImportResult> {
    return this.http.post<ImportResult>(
      `${this.API_V1}/import/map/${jobId}`,
      { mapping }
    );
  }

  /**
   * Configure import rules
   * @param jobId The import job ID
   * @param rules Import rules
   */
  configureRules(jobId: string, rules: any[]): Observable<ImportResult> {
    return this.http.post<ImportResult>(
      `${this.API_V1}/import/configure/${jobId}`,
      { rules }
    );
  }
}
