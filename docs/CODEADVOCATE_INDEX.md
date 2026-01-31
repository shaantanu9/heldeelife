# CodeAdvocate Knowledge Base Index

This is the master index for all patterns, utilities, rules, and documentation saved in CodeAdvocate for the HeldeeLife project.

## Quick Access Guide

### 🎯 For New Features
1. **Get Patterns**: Search snippets with tag `pattern`
2. **Get Utilities**: Search snippets with tag `utility`
3. **Check Standards**: Read `CODING_STANDARDS.md`
4. **Review Checklist**: Read `PR_GUIDELINES.md`

### 📚 Documentation Files

All documentation is saved in `/docs/` directory:

1. **CODING_STANDARDS.md** - Complete coding standards and rules
2. **PR_GUIDELINES.md** - Pull request requirements and checklist
3. **LEARNING_PATTERNS.md** - Best practices and learnings
4. **UTILITY_FUNCTIONS_GUIDE.md** - All utility functions catalog
5. **HOW_CODEADVOCATE_HELPS.md** - How to use CodeAdvocate effectively
6. **CODEADVOCATE_INDEX.md** - This file (master index)

### 🔧 Active Rules (10 Rules)

#### Coding Standards (8 Rules)
1. **React Hook Dependencies** (ERROR) - `useCallback` pattern enforcement
2. **API Route Error Handling** (ERROR) - Standard error handling pattern
3. **Authentication & Authorization** (ERROR) - Security patterns
4. **Server Components by Default** (ERROR) - Performance optimization
5. **Next.js Image Component** (ERROR) - Image optimization requirement
6. **Supabase Client Usage** (ERROR) - Correct client selection
7. **Database Migration Standards** (ERROR) - Idempotent migrations
8. **Code Formatting** (ERROR) - Prettier enforcement

#### Naming & Style (2 Rules)
9. **JSX Entity Escaping** (WARNING) - React compliance
10. **TypeScript Naming Conventions** (WARNING) - Consistent naming

### 📋 PR Rules (4 Rules)

1. **Code Quality Checklist** - Pre-merge quality checks
2. **Testing & Documentation Checklist** - Testing requirements
3. **PR Description Template** - Required PR format
4. **Merge Conditions** - Automated checks and blocking conditions

### 💻 Code Patterns (16+ Saved)

Search with tag `pattern` to find:
- API route patterns
- Supabase query patterns
- Role-based access control
- Error handling patterns
- React Context patterns
- Debounced search patterns
- And more...

### 🛠️ Utility Functions (2,052+ Available)

Search with tag `utility` to find utilities in 12 categories:
1. Authentication utilities
2. Validation utilities
3. Date/Time utilities
4. Pricing utilities
5. SEO utilities
6. Slug utilities
7. Cache utilities
8. Readability utilities
9. Export utilities (Excel, PDF)
10. Structured Data utilities
11. LLM-Friendly utilities
12. API Error Handling utilities

## How to Fetch Resources

### Using MCP Tools

#### List All Snippets
```typescript
listSnippets({
  repositoryId: "6c119199-0ac9-4055-a297-5bf044fdb64d",
  limit: 20
})
```

#### Search Snippets
```typescript
// By keyword
listSnippets({
  repositoryId: "6c119199-0ac9-4055-a297-5bf044fdb64d",
  search: "pricing",
  limit: 10
})

// By language
listSnippets({
  repositoryId: "6c119199-0ac9-4055-a297-5bf044fdb64d",
  language: "typescript",
  limit: 20
})

// By tags
listSnippets({
  repositoryId: "6c119199-0ac9-4055-a297-5bf044fdb64d",
  tags: "utility",
  limit: 10
})
```

#### Get Specific Snippet
```typescript
getSnippet({
  snippetId: "snippet-id-here"
})
```

#### List Documentation Files
```typescript
listRepositoryFiles({
  repositoryId: "6c119199-0ac9-4055-a297-5bf044fdb64d",
  limit: 50
})
```

#### Get Specific File
```typescript
getRepositoryFile({
  repositoryId: "6c119199-0ac9-4055-a297-5bf044fdb64d",
  fileId: "file-id-here"
})
```

#### List Repository Rules
```typescript
listRepositoryRules({
  repositoryId: "6c119199-0ac9-4055-a297-5bf044fdb64d",
  limit: 20
})
```

#### List PR Rules
```typescript
listRepositoryPrRules({
  repositoryId: "6c119199-0ac9-4055-a297-5bf044fdb64d",
  limit: 10
})
```

## Common Use Cases

### Creating a New API Route
1. Get API route pattern: `listSnippets({ tags: "pattern", search: "API route" })`
2. Check error handling rule: `listRepositoryRules({ search: "error handling" })`
3. Get validation utilities: `listSnippets({ tags: "utility", search: "validation" })`
4. Review standards: `getRepositoryFile({ fileId: "CODING_STANDARDS.md" })`

### Adding a New Component
1. Get React patterns: `listSnippets({ tags: "pattern", search: "React" })`
2. Check useCallback rule: `listRepositoryRules({ search: "useCallback" })`
3. Get utility functions if needed: `listSnippets({ tags: "utility" })`
4. Review PR checklist: `getRepositoryFile({ fileId: "PR_GUIDELINES.md" })`

### Creating Database Migration
1. Get migration template: `listRepositoryRules({ search: "migration" })`
2. Check migration standards: `getRepositoryFile({ fileId: "CODING_STANDARDS.md" })`
3. Review best practices: `getRepositoryFile({ fileId: "LEARNING_PATTERNS.md" })`

### Before PR Submission
1. Review PR checklist: `getRepositoryFile({ fileId: "PR_GUIDELINES.md" })`
2. Check PR rules: `listRepositoryPrRules({ repositoryId: "..." })`
3. Verify code quality: `listRepositoryRules({ search: "formatting" })`

## Repository Information

- **Repository ID**: `6c119199-0ac9-4055-a297-5bf044fdb64d`
- **Total Snippets**: 207+ (in this repository)
- **Total Utilities**: 2,052+ (across all repositories)
- **Documentation Files**: 6 files
- **Active Rules**: 10 coding rules
- **PR Rules**: 4 PR rules

## File IDs Reference

For quick access to documentation files:

- **CODING_STANDARDS.md**: `ab20045f-084f-4ea4-a8ec-ed94058be7d4`
- **PR_GUIDELINES.md**: `fbc7dded-3f84-4d31-92ee-1b844048ab74`
- **LEARNING_PATTERNS.md**: `85d6f013-daf4-4684-a29a-74351d783085`
- **UTILITY_FUNCTIONS_GUIDE.md**: `f8240fd3-0340-468d-8e73-c5eea7601ae1`
- **HOW_CODEADVOCATE_HELPS.md**: `5325ae8f-fbbd-4c6a-9744-3bdbb053af98`
- **CODEADVOCATE_INDEX.md**: (This file - to be saved)

## Benefits

✅ **Follow Best Practices Automatically** - 10 active rules enforce patterns
✅ **Reuse Utilities Without Rewriting** - 2,052+ utilities available
✅ **Ensure Quality with Standards** - 4 PR rules with checklists

## Quick Links

- **All Patterns**: Search `tags: "pattern"`
- **All Utilities**: Search `tags: "utility"`
- **API Patterns**: Search `search: "API route"`
- **React Patterns**: Search `search: "React"` or `search: "useCallback"`
- **Supabase Patterns**: Search `search: "Supabase"`
- **Validation**: Search `search: "validation"`
- **Pricing**: Search `search: "pricing"`
- **Date/Time**: Search `search: "date"` or `search: "timezone"`

---

**Last Updated**: 2025-12-25
**Repository**: heldeeLife
**Status**: ✅ All resources properly saved and indexed

