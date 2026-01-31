# Memory Bank: heldeelife

This directory contains comprehensive documentation about the heldeelife project. The memory bank serves as the single source of truth for understanding the project's current state, architecture, and future direction.

## File Structure

### Core Documentation

1. **[projectbrief.md](./projectbrief.md)**
   - Project overview and mission
   - Core goals and requirements
   - Target audience
   - Success criteria
   - **Start here** for project understanding

2. **[productContext.md](./productContext.md)**
   - Why the project exists
   - Problems we solve
   - User experience goals
   - Brand identity
   - Content strategy

3. **[activeContext.md](./activeContext.md)**
   - Current work focus
   - Recent changes
   - What's working vs. what's missing
   - Next steps
   - Active decisions
   - **Most frequently updated**

4. **[systemPatterns.md](./systemPatterns.md)**
   - Architecture overview
   - Technical decisions
   - Component structure
   - Data flow patterns
   - Database schema patterns
   - API patterns

5. **[techContext.md](./techContext.md)**
   - Technology stack
   - Development setup
   - Project structure
   - Dependencies
   - Environment variables
   - Deployment considerations

6. **[progress.md](./progress.md)**
   - What works ✅
   - What's partially working ⚠️
   - What's left to build ❌
   - Current status summary
   - Known issues
   - Next milestones

### Feature Documentation

7. **[MVP_FEATURES.md](./MVP_FEATURES.md)**
   - MVP definition
   - Must-have features checklist
   - Feature priority matrix
   - MVP completion checklist
   - Post-MVP features
   - **Critical for understanding what needs to be built**

## How to Use This Memory Bank

### For New Team Members

1. Read `projectbrief.md` for project overview
2. Read `productContext.md` for product understanding
3. Read `techContext.md` for technical setup
4. Read `systemPatterns.md` for architecture
5. Read `activeContext.md` for current state
6. Read `progress.md` for what's done
7. Read `MVP_FEATURES.md` for what needs to be built

### For Ongoing Development

1. Check `activeContext.md` for current focus
2. Check `progress.md` for status
3. Reference `systemPatterns.md` for patterns
4. Update `activeContext.md` after significant changes
5. Update `progress.md` when features are completed

### For Planning

1. Review `MVP_FEATURES.md` for priorities
2. Check `activeContext.md` for next steps
3. Reference `projectbrief.md` for goals
4. Use `progress.md` to track completion

## Update Guidelines

### When to Update

- **After major feature completion**: Update `progress.md` and `activeContext.md`
- **When starting new work**: Update `activeContext.md`
- **After architectural changes**: Update `systemPatterns.md`
- **When adding dependencies**: Update `techContext.md`
- **When priorities change**: Update `MVP_FEATURES.md`

### Update Frequency

- **activeContext.md**: Update weekly or after significant changes
- **progress.md**: Update when features are completed
- **Other files**: Update when relevant information changes

## Quick Reference

### Current Status

- **MVP Completion**: ~60%
- **Phase**: MVP Development
- **Focus**: Product migration and order system

### Critical Path

1. Product migration to database
2. Order system implementation
3. Payment gateway integration
4. Admin management UIs

### Tech Stack

- Next.js 14 + TypeScript
- Supabase (PostgreSQL + Auth)
- NextAuth.js
- shadcn/ui + Tailwind CSS

## Related Documentation

### External Documentation

- [AUTH_SETUP.md](../AUTH_SETUP.md) - Authentication setup details
- [BLOG_SETUP.md](../BLOG_SETUP.md) - Blog system documentation
- [PRODUCT_DATABASE_SETUP.md](../PRODUCT_DATABASE_SETUP.md) - Product schema
- [ROLE_BASED_ACCESS.md](../ROLE_BASED_ACCESS.md) - RBAC implementation
- [SUPABASE_SETUP.md](../SUPABASE_SETUP.md) - Supabase configuration

### Code Documentation

- Component documentation in code comments
- API route documentation in route files
- Type definitions in `types/` directory

---

**Last Updated**: 2025-01-27
**Maintained By**: Development Team









