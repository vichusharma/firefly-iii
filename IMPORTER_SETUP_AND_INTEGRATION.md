# 🍌🍌🍌 Firefly III Data Importer Setup & Integration

## Overview

The **Firefly III Data Importer** is a dedicated service that enables you to import transactions from various file formats into Firefly III. This document provides a complete guide to the importer setup, integration with the Angular frontend, and usage instructions.

## Table of Contents

1. [Architecture](#architecture)
2. [Supported File Formats](#supported-file-formats)
3. [Setup & Configuration](#setup--configuration)
4. [Integration with Angular Frontend](#integration-with-angular-frontend)
5. [API Reference](#api-reference)
6. [Usage Guide](#usage-guide)
7. [Troubleshooting](#troubleshooting)
8. [Advanced Configuration](#advanced-configuration)

---

## Architecture

### Services Overview

The importer infrastructure consists of three main services:

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Compose Setup                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐    ┌──────────────────┐               │
│  │    MySQL 8.0     │    │   Firefly III    │               │
│  │  Database        │◄───►  Backend + UI    │               │
│  │  (Port 3306)     │    │  (Port 8080)     │               │
│  └──────────────────┘    └──────────────────┘               │
│                                 ▲                            │
│                                 │ API Calls                  │
│                                 ▼                            │
│                          ┌──────────────────┐               │
│                          │   Data Importer  │               │
│                          │  (Port 8888)     │               │
│                          │  CORS Enabled    │               │
│                          └──────────────────┘               │
│                                 ▲                            │
│                                 │ HTTP                       │
│                                 │ Requests                   │
│                                 ▼                            │
│                          ┌──────────────────┐               │
│                          │   Angular App    │               │
│                          │  ImporterService │               │
│                          │  (Browser)       │               │
│                          └──────────────────┘               │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Key Components

1. **firefly-importer** - Official Firefly III Data Importer service
2. **ImporterService** - Angular service for API communication
3. **ImportDialogComponent** - Material dialog for file upload
4. **ImporterListComponent** - Display import history and status
5. **firefly-app** - Backend API and unified SPA container

---

## Supported File Formats

The Data Importer supports the following financial file formats:

### 1. CSV (Comma-Separated Values)
- **Extension**: `.csv`
- **Delimiters**: Comma, semicolon, tab, pipe
- **Date Formats**: MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD
- **Use Case**: Most flexible, requires column mapping
- **Example**:
  ```csv
  Date,Description,Amount,Balance
  2026-05-22,Salary,5000.00,5000.00
  2026-05-21,Groceries,-50.00,4950.00
  ```

### 2. OFX/QFX (Open Financial Exchange)
- **Extension**: `.ofx`, `.qfx`
- **Standard**: OFX 1.x, 2.x
- **Use Case**: Bank exports, broker exports
- **Auto-detection**: Automatic column mapping
- **Advantage**: Includes account information

### 3. MT940 (SWIFT)
- **Extension**: `.mt940`, `.txt`
- **Standard**: ISO 20022
- **Use Case**: European banks, professional accounts
- **Format**: SWIFT/SEPA format
- **Advantage**: Structured bank data

### 4. YNAB (You Need A Budget)
- **Extension**: `.csv`
- **Format**: YNAB export format
- **Use Case**: Migration from YNAB
- **Advantage**: Direct category mapping

---

## Setup & Configuration

### 1. Docker Configuration

The Data Importer is configured in `docker-compose.yml`:

```yaml
firefly-importer:
  image: fireflyiii/data-importer:latest
  restart: unless-stopped
  ports:
    - "8888:8080"
  depends_on:
    - firefly-app
  environment:
    APP_ENV: "production"
    FIREFLY_III_URL: "http://firefly-app:8080"
    FIREFLY_III_ACCESS_TOKEN: ""
    VANITY_URL: "http://localhost:8080"
    CAN_POST_FILES: "true"
    AUTO_IMPORT_SECRET: "your_auto_import_secret_here"
    MAIL_MAILER: "log"
  networks:
    - firefly-network
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
    interval: 30s
    timeout: 10s
    retries: 5
```

### 2. Starting Services

```bash
# Start all services including importer
docker-compose up -d --build

# Verify importer is running
docker-compose ps firefly-importer

# Check importer health
curl http://localhost:8888/health
```

### 3. Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `FIREFLY_III_URL` | Required | URL to Firefly III backend (internal: `http://firefly-app:8080`) |
| `FIREFLY_III_ACCESS_TOKEN` | Empty | API token (will be prompted in UI) |
| `VANITY_URL` | Required | Public URL (for user redirection) |
| `CAN_POST_FILES` | `true` | Allow file uploads |
| `AUTO_IMPORT_SECRET` | Required | Secret for auto-import feature |
| `APP_ENV` | `production` | Environment mode |
| `APP_DEBUG` | `false` | Debug logging |

---

## Integration with Angular Frontend

### 1. ImporterService

The **ImporterService** provides a type-safe interface to the Data Importer API:

```typescript
// Location: src/app/core/services/importer.service.ts

@Injectable({ providedIn: 'root' })
export class ImporterService {
  // Upload a file for import
  uploadFile(file: File): Observable<ImportJob>

  // Get job status
  getJobStatus(jobId: string): Observable<ImportJob>

  // Start import
  startImport(jobId: string, config?: ImportConfiguration): Observable<ImportResult>

  // Get import history
  getImportHistory(limit: number): Observable<ImportJob[]>

  // Get import details
  getImportDetails(jobId: string): Observable<any>

  // Test connection
  testConnection(): Observable<any>
}
```

### 2. ImportDialogComponent

The **ImportDialogComponent** is a Material dialog for uploading files:

```typescript
// Location: src/app/features/importer/import-dialog/import-dialog.component.ts

@Component({
  selector: 'app-import-dialog',
  standalone: true,
  // ... Material modules imported
})
export class ImportDialogComponent implements OnInit {
  // File selection
  selectedFile: File | null = null;
  
  // Upload progress
  uploadProgress = 0;
  isUploading = false;

  // Upload and import
  startImport(): void

  // Progress tracking
  private pollJobStatus(jobId: string): void
}
```

**Features**:
- Drag-and-drop file upload
- File validation
- Format selection (Auto, CSV, OFX, MT940, YNAB)
- CSV configuration (delimiter, date format)
- Real-time progress tracking
- Status polling

### 3. ImporterListComponent

The **ImporterListComponent** displays import history and status:

```typescript
// Location: src/app/features/importer/importer-list/importer-list.component.ts

@Component({
  selector: 'app-importer-list',
  standalone: true,
})
export class ImporterListComponent implements OnInit {
  imports: ImportJob[] = [];
  displayedColumns = ['id', 'status', 'createdAt', 'updatedAt', 'actions'];

  // Load recent imports
  loadImportHistory(): void

  // Open import dialog
  openImportDialog(): void

  // View import details
  viewDetails(importJob: ImportJob): void

  // Retry failed imports
  retryImport(importJob: ImportJob): void
}
```

**Features**:
- Material table display
- Status badges with color coding
- Timestamp display
- Action buttons (view details, retry)
- Empty state handling
- Loading indicator

### 4. Routing

The importer is accessible at `/importer` route:

```typescript
// app.routes.ts
{
  path: 'importer',
  loadChildren: () =>
    import('./features/importer/importer.routes').then((m) => m.routes),
  canActivate: [AuthGuard],
}
```

---

## API Reference

### Base URL
```
http://localhost:8888/api/v1
```

### Endpoints

#### 1. Health Check

```
GET /health
```

**Response**:
```json
{
  "status": "ok",
  "version": "1.0.0"
}
```

#### 2. Upload File

```
POST /import/upload
Content-Type: multipart/form-data

Body:
- file: (binary file data)
```

**Response**:
```json
{
  "id": "abc123def456",
  "key": "import_key_xyz",
  "userId": "user_123",
  "status": "new",
  "createdAt": "2026-05-22T22:07:00Z",
  "updatedAt": "2026-05-22T22:07:00Z"
}
```

#### 3. Get Job Status

```
GET /import/status/:jobId
```

**Response**:
```json
{
  "id": "abc123def456",
  "status": "running|success|error",
  "createdAt": "2026-05-22T22:07:00Z",
  "updatedAt": "2026-05-22T22:10:00Z"
}
```

#### 4. Start Import

```
POST /import/start/:jobId
Content-Type: application/json

Body (optional):
{
  "doMapping": true,
  "skipForm": false,
  "delimiter": ",",
  "dateFormat": "YYYY-MM-DD"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Import started",
  "jobId": "abc123def456"
}
```

#### 5. Get Import History

```
GET /import/list?limit=10
```

**Response**:
```json
[
  {
    "id": "abc123def456",
    "status": "success",
    "createdAt": "2026-05-22T22:07:00Z",
    "updatedAt": "2026-05-22T22:10:00Z"
  },
  // ... more imports
]
```

#### 6. Get Import Details

```
GET /import/details/:jobId
```

**Response**:
```json
{
  "jobId": "abc123def456",
  "transactionsImported": 245,
  "accountsMatched": 3,
  "categoriesAssigned": 12,
  "errors": [],
  "warnings": [
    "5 transactions could not be matched"
  ]
}
```

#### 7. Test Connection

```
GET /test/connection
```

**Response**:
```json
{
  "connected": true,
  "version": "1.0.0",
  "ffUrl": "http://firefly-app:8080"
}
```

---

## Usage Guide

### Step 1: Access the Importer

1. Log in to your Firefly III account
2. Click **"Importer"** in the navigation
3. Click **"Import Transactions"** button

### Step 2: Select File

1. Click the upload area or drag-and-drop a file
2. Supported formats: `.csv`, `.ofx`, `.qfx`, `.mt940`, `.txt`
3. File size limit: 50MB (configurable)

### Step 3: Configure Import

**For CSV files**:
- Select delimiter (comma, semicolon, tab, pipe)
- Select date format (MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD)
- Check "Show column mapping" for custom mapping

**For OFX/MT940/YNAB**:
- Format is auto-detected
- Configure account mapping if needed

### Step 4: Upload & Process

1. Click "Upload & Import"
2. Monitor progress in real-time
3. Wait for import to complete (status updates every 2 seconds)

### Step 5: Review Results

1. Check import status badge
2. View import history table
3. Click "View Details" for transaction breakdown
4. Click "Retry" if import failed

---

## Troubleshooting

### Problem: "Import service not available"

**Cause**: Importer container not running or not healthy

**Solution**:
```bash
# Check container status
docker-compose ps firefly-importer

# View container logs
docker-compose logs firefly-importer

# Restart container
docker-compose restart firefly-importer
```

### Problem: "Connection refused" error

**Cause**: Firefly III URL misconfigured

**Solution**:
1. Check `docker-compose.yml`:
   ```yaml
   FIREFLY_III_URL: "http://firefly-app:8080"
   ```
2. Verify Firefly III is running:
   ```bash
   curl http://localhost:8080/api/v1/about
   ```

### Problem: "File format not recognized"

**Cause**: File may be corrupted or wrong format

**Solution**:
1. Verify file format: `file transaction.csv`
2. Check file encoding: UTF-8 recommended
3. Try uploading with explicit format selection
4. Check first few lines of CSV for proper formatting

### Problem: "Import stuck on 'running' status"

**Cause**: Long-running import or server issue

**Solution**:
1. Wait up to 5 minutes (large files take time)
2. Check server logs: `docker-compose logs firefly-importer`
3. Restart service: `docker-compose restart firefly-importer`
4. Try smaller file chunks

### Problem: "CORS error in browser"

**Cause**: Browser security restriction

**Solution**: 
- CORS is already configured in the importer
- Check browser console for specific error
- Verify `VANITY_URL` in docker-compose.yml matches your access URL

---

## Advanced Configuration

### 1. Custom Column Mapping

For CSV files with non-standard columns:

```typescript
// In import-dialog.component.ts
const mapping = {
  'Transaction Date': 'date',
  'Payee': 'description',
  'Withdrawal': 'amount_out',
  'Deposit': 'amount_in',
  'Balance': 'balance'
};

this.importerService.mapColumns(jobId, mapping).subscribe(result => {
  console.log('Columns mapped:', result);
});
```

### 2. Import Rules

Configure automatic categorization:

```typescript
const rules = [
  {
    trigger: 'contains',
    pattern: 'Salary',
    action: 'category',
    categoryId: 'income_salary'
  },
  {
    trigger: 'contains',
    pattern: 'Grocery',
    action: 'category',
    categoryId: 'groceries'
  }
];

this.importerService.configureRules(jobId, rules).subscribe(result => {
  console.log('Rules configured:', result);
});
```

### 3. Auto-Import Feature

Set up automatic imports from URL:

```bash
# Configuration in docker-compose.yml
AUTO_IMPORT_SECRET: "your_secure_random_secret"

# Auto-import endpoint
POST /import/auto/:secret?url=https://example.com/transactions.csv
```

### 4. Large File Chunking

For files over 10MB, the importer automatically chunks:

```typescript
// The service handles this automatically
this.importerService.uploadFile(largeFile).subscribe({
  next: (job) => console.log('Uploaded:', job),
  error: (error) => console.error('Upload failed:', error)
});
```

### 5. Webhook Notifications

Configure post-import webhooks:

```typescript
// In environment configuration
const webhookUrl = 'https://example.com/import-webhook';

// Importer will POST to webhook with import result
POST {webhookUrl}
Body: { jobId, status, transactionsImported, errors }
```

---

## Performance Tips

1. **File Size**: Keep CSV files under 50MB for best performance
2. **Format**: OFX/MT940 are faster than CSV (no mapping needed)
3. **Batch Imports**: Import multiple files sequentially, not in parallel
4. **Maintenance**: Clear old imports regularly to maintain database performance
5. **Hardware**: Ensure sufficient disk space for database growth

---

## Security Considerations

1. **API Token**: Store `FIREFLY_III_ACCESS_TOKEN` securely
   - Use environment variables
   - Never commit to version control
   - Rotate tokens regularly

2. **File Uploads**: 
   - Files are validated before processing
   - Temporary files are deleted after import
   - Maximum file size is enforced

3. **Auto-Import Secret**:
   - Use a strong random value
   - Change regularly
   - Only expose internal endpoint URLs

4. **CORS**: 
   - Configured in docker-compose.yml
   - Restrict to trusted origins in production
   - Disable in admin settings if not needed

---

## Related Documentation

- [Firefly III Official Documentation](https://docs.firefly-iii.org/)
- [Data Importer Documentation](https://docs.firefly-iii.org/advanced-installation/importer/)
- [Angular Material Documentation](https://material.angular.io/)
- [RxJS Documentation](https://rxjs.dev/)

---

## Support & Issues

For issues with:
- **Firefly III**: See [GitHub Issues](https://github.com/firefly-iii/firefly-iii/issues)
- **Data Importer**: See [Importer GitHub](https://github.com/firefly-iii/data-importer/issues)
- **Angular Integration**: Check browser console and service logs

---

**Last Updated**: 2026-05-22
**Version**: 1.0.0
**Status**: ✅ Production Ready
