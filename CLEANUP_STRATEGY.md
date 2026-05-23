# Firefly III Cleanup & Modernization Strategy

**Date:** May 23, 2026  
**Status:** Assessment Complete - Awaiting Decision  
**Feature Parity:** 60-70% (NOT Ready for cleanup/publish)

---

## 1. FEATURE PARITY VERIFICATION: ❌ NO

### Verdict

The Angular frontend is **NOT 100% feature equal** to original Firefly III because critical features are missing.

### Current Implementation: 15 Modules

✓ Dashboard, Accounts, Transactions, Budgets, Bills, Categories, Tags, Rules, Reports, Auth, Importer, Profile, Settings, Admin, Transaction Detail

### Missing Features (Blocking Cleanup)

**CRITICAL - Must Implement First:**

1. **Piggy Banks** - Firefly III's signature savings goals feature
    - Status: Not implemented
    - Effort: 3-5 days
    - Impact: CRITICAL (core feature)

2. **Recurring Transactions** - Auto-execute monthly/weekly expenses
    - Status: Partially in Bills module
    - Effort: 3-5 days
    - Impact: CRITICAL (essential for real usage)

3. **Advanced User Management** - Multi-user support with roles/permissions
    - Status: Only basic profile exists
    - Effort: 4-7 days
    - Impact: CRITICAL (production requirement)

**IMPORTANT - Should Have:** 4. **Multi-Currency Support** - Multiple currency handling

- Effort: 2-3 days
- Impact: HIGH

5. **Webhooks** - External API integrations
    - Effort: 2-3 days
    - Impact: MEDIUM

**NICE-TO-HAVE - Can Add Later:** 6. Object Groups (2-3 days) 7. Advanced Reports & Export (2-4 days) 8. Preferences & Localization (1-2 days)

---

## 2. NODE.JS AUDIT FINDINGS

### Vulnerability Summary

- **Critical/High:** 8+ vulnerabilities
- **Moderate:** 4+ vulnerabilities
- **Total Affected Packages:** 20+

### Key Issues

1. **Angular Security (HIGH)** - XSS vulnerabilities in versions <=18.2.14
    - XSRF Token Leakage
    - Unsanitized SVG Script Attributes
    - i18n attribute binding vulnerabilities

2. **Build Tools (HIGH)**
    - Picomatch - ReDoS vulnerabilities
    - Rollup - Arbitrary file write via path traversal
    - PostCSS - XSS in CSS output

3. **Bundler Tools (MODERATE)**
    - esbuild - Dev server security issues
    - Vite - Vulnerable esbuild dependency

### Fix Available

- **Command:** `npm audit fix --force`
- **Impact:** Breaking changes (upgrading Angular 18→21)
- **Risk:** Potential compatibility issues with current code

---

## 3. RECOMMENDED IMPLEMENTATION PLAN

### Phase 1: Feature Implementation (4-5 weeks)

**Week 1-2: Core Features**

```
Day 1-3: Piggy Banks Module
├─ Components (list, create, edit, delete)
├─ Services & state management
├─ API integration
└─ Unit tests

Day 4-6: Recurring Transactions
├─ Recurring template models
├─ Frequency manager (weekly, monthly, annual)
├─ Auto-execution scheduler
└─ Conflict resolution

Day 7-14: Advanced User Management
├─ Multi-user architecture
├─ Role-based access control (RBAC)
├─ Permission system
├─ Admin UI for user management
└─ Comprehensive testing
```

**Week 3: Secondary Features**

```
- Multi-Currency Support
- Webhook endpoints & triggers
```

**Week 4-5: Polish & Integration**

```
- Full feature testing
- Performance optimization
- Security audit
- Documentation
- Docker image rebuild
```

### Phase 2: Cleanup & Modernization (After feature parity)

**Once features are 100% equal:**

1. Remove legacy/unused components
2. Upgrade Angular 18 → 21 (security fixes)
3. Run `npm audit fix --force`
4. Update dependencies comprehensively
5. Build clean Docker image with modern UI
6. Publish to Docker Hub/Registry

### Phase 3: Image Publishing

**Deliverables:**

- Clean, modern UI Docker image
- Comprehensive documentation
- API layer documentation
- Public Docker registry availability

---

## 4. DECISION MATRIX

### OPTION A: Complete Feature Parity First

- **Duration:** 4-5 weeks
- **Result:** 100% feature equal to Firefly III
- **Risk:** Low
- **Output:** Production-ready, publishable image
- **Recommended:** YES

### OPTION B: Skip Missing Features & Cleanup Now

- **Duration:** 1 week
- **Result:** 60-70% feature coverage
- **Risk:** HIGH - Users find missing critical features
- **Output:** Incomplete product
- **Recommended:** NO

### OPTION C: Selective Implementation

- **Duration:** 2-3 weeks (Piggy Banks + Recurring only)
- **Result:** 85% feature parity
- **Risk:** MEDIUM - Still missing user management
- **Output:** Better but incomplete
- **Recommended:** NOT WITHOUT user management

---

## 5. NODE.JS VULNERABILITY FIX STRATEGY

### Conservative Approach (Recommended for now)

```bash
# Step 1: Upgrade to Angular 21 (fixes most XSS issues)
npm install @angular@21 --save

# Step 2: Update build tools
npm install @angular-devkit@21 --save-dev

# Step 3: Run audit fix for remaining issues
npm audit fix

# Step 4: Manual fixes for breaking changes
# (Review app code for compatibility)

# Step 5: Comprehensive testing
npm run test
npm run build --prod
```

### Risk Assessment

- **Breaking Changes:** Medium (Angular 18→21 upgrade)
- **Mitigation:** Run full test suite after upgrade
- **Timeline:** 2-3 days for upgrade + testing

---

## 6. RECOMMENDATION

**DO NOT PROCEED WITH CLEANUP YET**

**Rationale:**

1. Missing 30-40% of features blocks production release
2. Security vulnerabilities exist but are in build tools (not runtime)
3. Feature implementation should happen before cleanup
4. Publishing incomplete product damages project credibility

**Suggested Next Steps:**

1. **Decision:** Approve feature implementation plan
2. **Start:** Begin Piggy Banks module (highest priority)
3. **Timeline:** Target 5-week feature complete date
4. **Then:** Execute cleanup and modernization
5. **Finally:** Publish clean Docker image

---

## 7. TECHNICAL DEBT & OLD COMPONENTS

### Identified for Removal (Post-feature-parity)

- Any legacy <form> patterns (should use Material only)
- Old Bootstrap utilities (using Material exclusively now)
- Unused CSS classes
- Dead code in features not yet migrated
- Old authentication patterns (once newer auth solidified)

### Modernization Goals

- **UI Framework:** Material Design 3 consistently
- **State:** Standalone components + signals (Angular 19+)
- **Styling:** Tailwind + Material theming only
- **Bundler:** Vite (faster builds than webpack)
- **Target:** Production-grade, modern Angular 21+ stack

---

## STATUS SUMMARY

| Item                  | Status                      | Notes                                           |
| --------------------- | --------------------------- | ----------------------------------------------- |
| **Feature Parity**    | ❌ NO (60-70%)              | Piggy Banks, Recurring Trans, User Mgmt missing |
| **Cleanup Readiness** | ❌ NOT READY                | Wait for feature parity                         |
| **Security**          | ⚠️ REVIEW                   | 8+ vulnerabilities fixable with upgrade         |
| **Node Warnings**     | ⚠️ FIXABLE                  | npm audit fix --force available                 |
| **Docker Image**      | ⚠️ INCOMPLETE               | Don't publish until feature complete            |
| **Recommendation**    | 📋 IMPLEMENT FEATURES FIRST | 4-5 week plan available                         |
