# Firefly III Angular Material 3 UI Rewrite

## Project Overview

Complete rewrite of Firefly III user interface using **Angular 18+** with **Material Design 3** dark theme. This maintains 100% feature parity with the existing Laravel Blade + Vue/Alpine UI while providing a modern, performant, and maintainable codebase.

**Repository Branch**: `feat/angular-material3-ui-rewrite`
**Status**: Initialization Phase ✅ → Development Ready

---

## Quick Start (Docker-Based)

### Prerequisites
- Docker Desktop (includes docker-compose)
- Git
- Text editor (VS Code, etc.)

### 1. Development with Docker (Recommended)

```bash
# From repository root
cd C:\Vishnu\Code\firefly-iii

# Start development environment with Docker
docker-compose up -d

# This starts:
#  • Angular dev server (hot-reload) → http://localhost:4200
#  • Laravel backend API → http://localhost:8081
#  • MySQL database
#  • Data Importer → http://localhost:8888

# View logs
docker-compose logs -f firefly-ui-dev

# Make code changes in resources/angular/src/
# Changes auto-reload in browser! (Ctrl+Shift+R to hard refresh)
```

### 2. Inside Docker Container

```bash
# Access container shell
docker-compose exec firefly-ui-dev sh

# Run npm commands
docker-compose exec firefly-ui-dev npm test
docker-compose exec firefly-ui-dev npm run lint

# Generate Angular component
docker-compose exec firefly-ui-dev ng generate component features/accounts/account-list

# Run E2E tests
docker-compose exec firefly-ui-dev npm run e2e
```

### 3. Production Build with Docker

```bash
# Build production image
docker-compose build firefly-ui

# Start production deployment
docker-compose --profile prod up -d

# Access at http://localhost:80

# Production app is optimized and served by nginx
```

### 4. Stop Development Environment

```bash
# Stop all services (keeps volumes/data)
docker-compose down

# Remove volumes (WARNING: deletes database)
docker-compose down -v
```

---

## Local Development (Alternative - NOT Recommended)

If you prefer local Node.js (not recommended, use Docker instead):

```bash
# Navigate to Angular project
cd resources/angular

# Install dependencies (requires Node.js 18+ locally)
npm install

# Start development server
npm start

# Development server runs at http://localhost:4200
# Note: Backend API must be running separately
```

---

## Build for Production

```bash
# Option 1: Inside Docker (recommended)
docker-compose exec firefly-ui-dev npm run build:prod

# Option 2: Rebuild production image
docker-compose build firefly-ui

# Output: resources/angular/dist/firefly-ui/
```

---

## Project Structure

```
resources/angular/
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── auth/                 # Authentication (OAuth, tokens, guards)
│   │   │   ├── services/             # HTTP services (API integration)
│   │   │   ├── interceptors/         # HTTP interceptors (auth, error handling)
│   │   │   └── guards/               # Route guards (auth check, permissions)
│   │   │
│   │   ├── shared/
│   │   │   ├── components/           # Reusable Material 3 components
│   │   │   ├── directives/           # Custom directives (formatting, validation)
│   │   │   ├── pipes/                # Custom pipes (currency, date, etc.)
│   │   │   ├── models/               # TypeScript interfaces & models
│   │   │   └── utils/                # Utility functions
│   │   │
│   │   ├── features/
│   │   │   ├── dashboard/            # Dashboard module
│   │   │   ├── accounts/             # Accounts management
│   │   │   ├── transactions/         # Transaction CRUD
│   │   │   ├── budgets/              # Budget management
│   │   │   ├── categories/           # Category management
│   │   │   ├── bills/                # Bills management
│   │   │   ├── tags/                 # Tags management
│   │   │   ├── rules/                # Rules engine
│   │   │   ├── reports/              # Reports & analytics
│   │   │   ├── admin/                # Admin panel
│   │   │   └── settings/             # User settings
│   │   │
│   │   ├── layout/
│   │   │   ├── header/               # Top navigation bar
│   │   │   ├── sidebar/              # Left sidebar navigation
│   │   │   ├── footer/               # Footer
│   │   │   └── main-layout/          # Main layout container
│   │   │
│   │   ├── app.component.*           # Root component
│   │   └── app.routes.ts             # Main routing config
│   │
│   ├── styles/
│   │   ├── variables.scss            # SCSS variables & tokens
│   │   ├── themes.scss               # Material 3 theme definitions
│   │   ├── global.scss               # Global styles
│   │   └── material-overrides.scss   # Material 3 customizations
│   │
│   ├── assets/
│   │   ├── images/                   # Static images
│   │   ├── icons/                    # SVG icons
│   │   └── fonts/                    # Custom fonts
│   │
│   ├── environments/
│   │   ├── environment.ts            # Development config
│   │   └── environment.prod.ts       # Production config
│   │
│   ├── index.html                    # Main HTML template
│   └── main.ts                       # Application entry point
│
├── angular.json                      # Angular CLI configuration
├── tsconfig.json                     # TypeScript configuration
├── package.json                      # Dependencies
├── README.md                         # This file
└── .gitignore
```

---

## Architecture & Design Patterns

### 1. Component Architecture

```
Smart Components (Containers)
└── Handles routing, state, API calls
    └── Passes data to Dumb Components via @Input/@Output

Presentational Components (Dumb)
└── Pure components, no side effects
    └── Receives data via @Input
    └── Emits user actions via @Output
```

### 2. Service Layer

**Core Services**:
- `AuthService`: OAuth, token management, login/logout
- `ApiService`: Base HTTP client for all endpoints
- `AccountService`: Account CRUD operations
- `TransactionService`: Transaction management
- [+ similar for all features]

**Reactive Pattern**:
```typescript
// Services use RxJS Observables
private subject$ = new BehaviorSubject(initialState);
public data$ = this.subject$.asObservable();

// Components subscribe
constructor(private service: MyService) {
  this.service.data$.subscribe(data => this.data = data);
}
```

### 3. HTTP Interceptors

```typescript
// auth.interceptor.ts - Add Authorization header
// error.interceptor.ts - Handle errors globally
// loading.interceptor.ts - Show/hide loading spinner
```

### 4. Module Organization

```typescript
// Feature modules are lazy-loaded
const routes: Routes = [
  {
    path: 'accounts',
    loadChildren: () => import('./features/accounts/accounts.module')
      .then(m => m.AccountsModule)
  }
];
```

---

## Material Design 3 Implementation

### Color Tokens

```scss
// variables.scss
$md-primary: #6750a4;        // Purple-ish
$md-secondary: #625b71;      // Gray-purple
$md-tertiary: #7d5260;       // Rose-ish
$md-error: #b3261e;          // Red
$md-neutral: #49454f;        // Dark gray
$md-neutral-variant: #79747e; // Light gray

// Dark theme
$md-primary-dark: #d0bcff;
$md-surface-dark: #1c1b1f;
$md-background-dark: #fffbfe;
```

### Typography

```scss
$md-display-large: 3.5rem;
$md-headline-large: 2rem;
$md-title-large: 1.375rem;
$md-body-large: 1rem;
$md-label-small: 0.75rem;
```

### Components

```typescript
// All Material 3 components via Angular Material
@NgModule({
  imports: [
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatDialogModule,
    MatSnackBarModule,
    // ... etc
  ]
})
```

---

## API Integration

### Authentication Flow

```typescript
// 1. User provides credentials
loginForm.submit() → AuthService.authenticate()

// 2. Service calls backend OAuth endpoint
POST /oauth/token
  ↓
Response: { access_token, refresh_token, expires_in }

// 3. Store tokens (localStorage with expiry check)
localStorage.setItem('access_token', token)
localStorage.setItem('refresh_token', refreshToken)

// 4. Set Authorization header for all requests
HttpClient interceptor adds: Authorization: Bearer {token}

// 5. On token expiry, refresh automatically
IF response.status === 401
  → Call refreshToken()
  → Retry original request
```

### API Service Pattern

```typescript
// api.service.ts
@Injectable()
export class ApiService {
  constructor(private http: HttpClient) {}

  // Generic GET
  get<T>(endpoint: string, params?: any): Observable<T> {
    return this.http.get<T>(`/api/${endpoint}`, { params });
  }

  // Specific endpoint example
  getAccounts(): Observable<Account[]> {
    return this.get<Account[]>('accounts');
  }

  // POST with request body
  createAccount(account: Account): Observable<Account> {
    return this.http.post<Account>('/api/accounts', account);
  }
}
```

---

## Feature Modules

### Dashboard Module

**Components**:
- Dashboard page (main)
- Quick stats card
- Recent transactions widget
- Budget overview widget
- Charts widget

**Services**:
- DashboardService (aggregates data from multiple endpoints)

### Accounts Module

**Components**:
- Accounts list page
- Account creation dialog
- Account edit form
- Account detail page

**Routing**:
```
/accounts              → List
/accounts/create       → Create dialog
/accounts/{id}        → Detail
/accounts/{id}/edit   → Edit dialog
```

### Transactions Module

**Components**:
- Transaction list (with advanced filters)
- Transaction creation form
- Split transactions handler
- Transaction detail modal

**Features**:
- Sorting & pagination
- Advanced filtering (date range, account, category, amount)
- Bulk operations
- Import integration

---

## Development Guidelines

### 1. Creating Components

```bash
# Generate component with Material schematics
ng generate component features/accounts/account-list

# Generated files:
# - account-list.component.ts
# - account-list.component.html
# - account-list.component.scss
# - account-list.component.spec.ts
```

### 2. Component Template Example

```html
<mat-card class="account-card">
  <mat-card-header>
    <mat-card-title>Accounts</mat-card-title>
  </mat-card-header>
  
  <mat-card-content>
    <!-- Material table -->
    <table mat-table [dataSource]="accounts">
      <ng-container matColumnDef="name">
        <th mat-header-cell *matHeaderCellDef>Name</th>
        <td mat-cell *matCellDef="let account">{{account.name}}</td>
      </ng-container>
      
      <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
      <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
    </table>
  </mat-card-content>
</mat-card>
```

### 3. Service Interaction

```typescript
export class AccountListComponent implements OnInit {
  accounts$ = this.accountService.accounts$;
  
  constructor(private accountService: AccountService) {}
  
  ngOnInit() {
    this.accountService.loadAccounts();
  }
  
  deleteAccount(id: string) {
    this.accountService.delete(id).subscribe({
      next: () => this.showSnackBar('Account deleted'),
      error: (err) => this.showError(err.message)
    });
  }
}
```

### 4. Testing

```typescript
describe('AccountListComponent', () => {
  let component: AccountListComponent;
  let fixture: ComponentFixture<AccountListComponent>;
  
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AccountListComponent],
      providers: [AccountService]
    }).compileComponents();
    
    fixture = TestBed.createComponent(AccountListComponent);
    component = fixture.componentInstance;
  });
  
  it('should load accounts on init', () => {
    spyOn(component['accountService'], 'loadAccounts');
    component.ngOnInit();
    expect(component['accountService'].loadAccounts).toHaveBeenCalled();
  });
});
```

---

## Styling & Theming

### SCSS Variables

```scss
// Use Material 3 tokens
@import '@angular/material/prebuilt-themes/indigo-pink.css';

// Custom overrides
$custom-primary: mat.define-palette($custom-primary-palette, 500);
$custom-accent: mat.define-palette($custom-accent-palette, 200);
$custom-warn: mat.define-palette($custom-warn-palette);

$custom-theme: mat.define-light-theme((
  color: (
    primary: $custom-primary,
    accent: $custom-accent,
    warn: $custom-warn,
  )
));

@include mat.all-component-colors($custom-theme);
```

### Dark Theme

```scss
// Define dark theme
$dark-primary: mat.define-palette($dark-primary-palette);
$dark-theme: mat.define-dark-theme((
  color: (
    primary: $dark-primary,
    accent: $dark-accent,
    warn: $dark-warn,
  )
));

// Apply with class
.dark-theme {
  @include mat.all-component-colors($dark-theme);
}
```

---

## Docker Deployment

### Build Docker Image

```bash
# Build multi-stage Docker image
docker build -f docker/Dockerfile.angular -t firefly-ui:latest .

# Run container
docker run -p 8080:80 firefly-ui:latest
```

### Docker Compose Integration

```yaml
# Updated docker-compose.yml
services:
  firefly-db:
    image: mysql:8.0
    # ... existing config

  firefly-app:
    image: fireflyiii/core:latest
    # ... existing config (backend API)

  firefly-ui:
    build:
      context: .
      dockerfile: docker/Dockerfile.angular
    ports:
      - "80:80"
    depends_on:
      - firefly-app
    environment:
      FIREFLY_API_URL: "http://firefly-app:8080"
    # Angular SPA will proxy /api/* to firefly-app

  firefly-importer:
    image: fireflyiii/data-importer:latest
    # ... existing config
```

---

## Testing Strategy

### Unit Tests

```bash
npm test

# With coverage
npm test -- --code-coverage
```

### E2E Tests

```bash
# Run Cypress E2E tests
npm run e2e

# Interactive mode
npm run e2e -- --open
```

### Test Coverage Goals
- Components: 80%+
- Services: 90%+
- Overall: 80%+

---

## Performance Optimization

### Code Splitting
```typescript
// Lazy-load feature modules
const routes: Routes = [
  {
    path: 'accounts',
    loadChildren: () => import('./features/accounts/accounts.module')
      .then(m => m.AccountsModule)
  }
];
```

### Bundle Analysis
```bash
# Analyze bundle size
npm run build -- --stats-json
npx webpack-bundle-analyzer dist/firefly-ui/stats.json
```

### Image Optimization
```html
<!-- Use native lazy loading -->
<img [ngSrc]="imagePath" 
     width="200" 
     height="200" 
     [loading]="'lazy'" />
```

### Change Detection
```typescript
// Use OnPush strategy for better performance
@Component({
  selector: 'app-account-card',
  templateUrl: './account-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
```

---

## Deployment Checklist

- [ ] All tests passing (unit + E2E)
- [ ] No console errors/warnings
- [ ] Lighthouse score 90+
- [ ] Bundle size < 1MB (gzipped)
- [ ] Dark mode functional
- [ ] Responsive on mobile/tablet/desktop
- [ ] Accessibility (WCAG AA)
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] API endpoints tested
- [ ] Error handling verified
- [ ] Loading states implemented
- [ ] Nginx SPA routing tested
- [ ] Docker build successful
- [ ] docker-compose up works
- [ ] Zero-downtime deployment ready

---

## Troubleshooting

### Development Issues

**Problem**: Port 4200 already in use
```bash
ng serve --port 4201
```

**Problem**: Module not found
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Problem**: Styles not compiling
```bash
# Clear Angular cache
ng cache clean
npm run build
```

### Production Issues

**Problem**: API requests failing
- Check CORS headers on backend
- Verify /api proxy routing in nginx
- Check Docker network connectivity

**Problem**: SPA routes not working
- Verify nginx try_files rule
- Check that index.html exists in dist/
- Test with `curl http://localhost/accounts`

---

## Git Workflow

```bash
# Feature branch
git checkout -b feat/angular-material3-ui-rewrite

# Make changes
git add .
git commit -m "feat: implement accounts module with Material 3"

# Push
git push origin feat/angular-material3-ui-rewrite

# Create Pull Request
# → Code review
# → Merge to main

# Deployment
git checkout main
git pull
docker-compose up -d
```

---

## Resources

- **Angular Docs**: https://angular.io/docs
- **Angular Material**: https://material.angular.io/
- **Material Design 3**: https://m3.material.io/
- **RxJS Guide**: https://rxjs.dev/
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/
- **Firefly III API**: https://api-docs.firefly-iii.org/

---

## Contributing

1. Create feature branch from `feat/angular-material3-ui-rewrite`
2. Follow Angular style guide
3. Write tests for new features
4. Test responsive design
5. Verify dark mode compatibility
6. Submit PR for code review

---

## License

GNU Affero General Public License v3.0 (same as Firefly III)

---

**Status**: Ready for Development
**Last Updated**: 2026-05-21
**Maintained By**: Development Team
