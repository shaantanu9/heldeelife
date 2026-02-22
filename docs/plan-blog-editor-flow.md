# Plan: Blog Editor Flow – Fix and Test

## Summary
Make the admin blog editor (create/edit/delete) work correctly and stabilize tests. No new database or API contracts; focus on edit-page form behavior, test fixes, and coverage.

## Scope
- **Edit page** (`app/admin/blog/[id]/page.tsx`): Controlled Selects for status and category so UI and form state stay in sync after load and save.
- **Tests**: Fix 4 failing tests across rich-text-editor, blog-post-form-flow, and blog-edit-and-delete-flow; resolve act() warnings where needed.

## Stories (ordered by dependency)

| ID   | Title | Description |
|------|--------|-------------|
| S-1  | Fix edit page controlled Selects | Use `value={watch('status')}` and `value={watch('category_id')}` (and `onValueChange` + `setValue`) for Status and Category Selects so they reflect and update form state. |
| S-2  | Fix RichTextEditor content-sync test | In `tests/components/editor/rich-text-editor.test.tsx`, change assertion to expect `setContent(newContent, { emitUpdate: false })` to match TipTap API. |
| S-3  | Fix new post form render test | In blog-post-form-flow, ensure "renders new blog post form with required fields" waits for auth/loading to finish and uses stable selectors (e.g. wait for "Create Post" or placeholder "Enter post title") so the form is visible before asserting. |
| S-4  | Fix edit and delete flow tests | In blog-edit-and-delete-flow: (1) Edit test – ensure fetch mock returns post with long content, form populates, and save button is clicked; fix any act() or timing issues. (2) Delete test – open delete dialog, click confirm (AlertDialogAction "Delete"), assert DELETE and list refresh; wrap async updates in act() if needed. |
| S-5  | Optional: Add one flow test | Add a single test that creates a draft (or mocks create), navigates to edit, changes title, saves (PUT), and asserts PUT body; or document manual verification. Skip if time-boxed. |

## Key files
- `app/admin/blog/[id]/page.tsx` – edit form, Selects
- `app/admin/blog/new/page.tsx` – new form (reference only)
- `components/editor/rich-text-editor.tsx` – setContent(_, { emitUpdate: false })
- `tests/components/editor/rich-text-editor.test.tsx`
- `tests/app/admin/blog/blog-post-form-flow.test.tsx`
- `tests/app/admin/blog/blog-edit-and-delete-flow.test.tsx`

## Out of scope
- Database or API schema changes
- New API routes
- E2E/Cypress changes (existing doc references imagekit-upload.cy.ts)
