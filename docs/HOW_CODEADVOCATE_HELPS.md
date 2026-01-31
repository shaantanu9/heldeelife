# How CodeAdvocate Helps with New Features

This document demonstrates how CodeAdvocate automatically enforces best practices, enables utility reuse, and ensures quality through standards and checklists.

## 1. Follow Best Practices Automatically

### ✅ Active Rules Enforcing Best Practices

CodeAdvocate has **10 active coding rules** that automatically guide your development:

#### Example: React Hook Dependencies Rule
**Rule**: Always use `useCallback` for functions in `useEffect` dependencies

**When you code:**
```typescript
// ❌ WRONG - Will be flagged
const fetchData = async () => {
  // fetch logic
}

useEffect(() => {
  fetchData()
}, [fetchData]) // Error: fetchData changes on every render
```

**CodeAdvocate provides the correct pattern:**
```typescript
// ✅ CORRECT - From saved pattern
const fetchData = useCallback(async () => {
  // fetch logic
}, [dependency1, dependency2])

useEffect(() => {
  fetchData()
}, [fetchData]) // Safe: fetchData is memoized
```

#### Example: API Route Error Handling Rule
**Rule**: All API routes must follow standard error handling pattern

**CodeAdvocate provides ready-to-use template:**
```typescript
// ✅ Standard pattern from CodeAdvocate
export async function GET(request: NextRequest) {
  try {
    // 1. Authentication check
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 2. Business logic
    const { data, error } = await supabaseAdmin.from("table").select("*")

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Error in GET /api/route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
```

### Active Rules Summary

1. **React Hook Dependencies** (ERROR) - Enforces `useCallback` pattern
2. **API Route Error Handling** (ERROR) - Standard error handling
3. **Authentication & Authorization** (ERROR) - Security patterns
4. **Server Components by Default** (ERROR) - Performance optimization
5. **Next.js Image Component** (ERROR) - Image optimization
6. **Supabase Client Usage** (ERROR) - Correct client selection
7. **Database Migration Standards** (ERROR) - Idempotent migrations
8. **Code Formatting** (ERROR) - Prettier enforcement
9. **JSX Entity Escaping** (WARNING) - React compliance
10. **TypeScript Naming** (WARNING) - Consistent naming

---

## 2. Reuse Utilities Without Rewriting

### ✅ 2,052+ Utility Functions Available

Instead of rewriting common functions, fetch them from CodeAdvocate:

#### Example: Need Pricing Utilities?

**Search**: "pricing utilities"
**Get**: Ready-to-use functions:
- `applyCharmPricing(price)` - Apply .99 ending
- `formatPrice(price)` - Format with Indian number formatting
- `calculateSavings(original, current)` - Calculate savings
- `getPriceDisplay(price, compareAtPrice)` - Price anchoring

**Usage:**
```typescript
// Just import and use - no rewriting needed!
import { formatPrice, applyCharmPricing } from '@/lib/utils/pricing'

const displayPrice = formatPrice(499.99) // "₹499.99"
const charmPrice = applyCharmPricing(500) // 499.99
```

#### Example: Need Date Formatting?

**Search**: "date utilities"
**Get**: Complete date handling:
- `formatUTC(date, format)` - UTC formatting
- `formatLocal(date, format, timezone)` - Timezone-aware
- `getCurrentUTCISO()` - Current timestamp
- `formatDateDisplay(date)` - User-friendly display

**Usage:**
```typescript
import { formatDateDisplay, getCurrentUTCISO } from '@/lib/utils/date'

const display = formatDateDisplay('2025-12-24') // "24/12/2025"
const now = getCurrentUTCISO() // "2025-12-24T12:00:00.000Z"
```

#### Example: Need Validation?

**Search**: "validation utilities"
**Get**: Zod schemas and validators:
- `validate<T>(schema, data)` - Type-safe validation
- `safeParse<T>(schema, data)` - Non-throwing validation
- Pre-defined schemas: `email`, `phone`, `pincode`, `uuid`

**Usage:**
```typescript
import { validate, schemas } from '@/lib/utils/validation'

const email = validate(schemas.email, userInput)
// Automatically validates and throws ApiError on failure
```

### Utility Categories Available

1. **Authentication** - Phone/email conversion
2. **Validation** - Zod schemas
3. **Date/Time** - Day.js with timezone
4. **Pricing** - Conversion-optimized
5. **SEO** - Metadata generation
6. **Slug** - URL-friendly generation
7. **Cache** - Multi-layer with TTL
8. **Readability** - Content analysis
9. **Export** - Excel & PDF
10. **Structured Data** - JSON-LD
11. **LLM-Friendly** - AI optimization
12. **API Error Handling** - Standardized errors

---

## 3. Ensure Quality with Standards and Checklists

### ✅ PR Rules Enforcing Quality

CodeAdvocate has **4 active PR rules** that ensure quality:

#### PR Rule 1: Code Quality Checklist
**Enforces**:
- ✅ Code formatted with Prettier
- ✅ ESLint passes
- ✅ TypeScript errors resolved
- ✅ No `console.log` statements
- ✅ All `useCallback` dependencies correct
- ✅ JSX entities escaped
- ✅ Next.js `Image` component used
- ✅ Server Components by default
- ✅ API routes have error handling
- ✅ Migrations are idempotent

**Result**: Code automatically follows all standards before PR submission.

#### PR Rule 2: Testing & Documentation Checklist
**Enforces**:
- ✅ Code changes tested manually
- ✅ Error handling for new features
- ✅ API routes tested with authentication
- ✅ Database migrations tested
- ✅ Breaking changes documented
- ✅ Environment variables documented
- ✅ Complex logic commented

**Result**: All features are properly tested and documented.

#### PR Rule 3: PR Description Template
**Enforces**:
- ✅ Description of changes
- ✅ Type of change identified
- ✅ Files modified listed
- ✅ Testing steps documented
- ✅ Checklist completed
- ✅ Related issues linked

**Result**: Clear, consistent PR descriptions for reviewers.

#### PR Rule 4: Merge Conditions
**Enforces**:
- ✅ All automated checks pass
- ✅ No security vulnerabilities
- ✅ No breaking changes without docs
- ✅ Migrations properly tested
- ✅ Authentication checks present

**Result**: Only high-quality code gets merged.

---

## Real-World Example: Creating a "Notifications" Feature

### Step 1: Get API Route Pattern
**Ask CodeAdvocate**: "Show me API route pattern"
**Get**: Complete template with:
- Authentication check
- Error handling
- Role-based access
- Supabase query pattern

**Result**: Copy-paste template, customize for notifications.

### Step 2: Get Utility Functions
**Ask CodeAdvocate**: "Show me date utilities"
**Get**: `formatDateDisplay()`, `getCurrentUTCISO()`

**Ask CodeAdvocate**: "Show me validation utilities"
**Get**: Zod schemas for notification data

**Result**: No need to write date formatting or validation from scratch.

### Step 3: Follow Best Practices
**CodeAdvocate automatically enforces**:
- ✅ Use `useCallback` for functions in `useEffect`
- ✅ Use Server Components by default
- ✅ Use Next.js `Image` component
- ✅ Proper error handling pattern
- ✅ Authentication checks

**Result**: Code automatically follows all best practices.

### Step 4: Before PR Submission
**CodeAdvocate checklist ensures**:
- ✅ Code formatted
- ✅ ESLint passes
- ✅ TypeScript errors resolved
- ✅ Tests written
- ✅ Documentation updated
- ✅ PR description complete

**Result**: PR is ready for review with all quality checks passed.

---

## Benefits Summary

### 1. Follow Best Practices Automatically ✅
- **10 active rules** enforce patterns
- **No guesswork** - patterns are provided
- **Consistent codebase** - everyone follows same patterns
- **Fewer bugs** - proven patterns reduce errors

### 2. Reuse Utilities Without Rewriting ✅
- **2,052+ utilities** available
- **12 categories** of reusable functions
- **Copy-paste ready** - no rewriting needed
- **Type-safe** - Full TypeScript support
- **Well-documented** - JSDoc comments included

### 3. Ensure Quality with Standards and Checklists ✅
- **4 PR rules** enforce quality
- **Automated checks** before merge
- **Clear checklists** for reviewers
- **Consistent standards** across all PRs
- **Quality gates** prevent bad code

---

## How to Use CodeAdvocate

### When Starting a New Feature:

1. **Get Patterns**: `listSnippets({ tags: "pattern" })`
2. **Get Utilities**: `listSnippets({ tags: "utility" })`
3. **Check Standards**: `getRepositoryFile({ fileId: "CODING_STANDARDS.md" })`
4. **Review Checklist**: `getRepositoryFile({ fileId: "PR_GUIDELINES.md" })`

### When Writing Code:

1. **Follow Rules**: CodeAdvocate rules guide you automatically
2. **Reuse Utilities**: Import from saved utilities
3. **Use Patterns**: Copy proven patterns from snippets

### Before PR Submission:

1. **Run Checklist**: Use PR rules checklist
2. **Verify Standards**: Ensure all rules followed
3. **Complete Template**: Use PR description template

---

**Result**: Faster development, consistent quality, fewer bugs, better code reviews.

