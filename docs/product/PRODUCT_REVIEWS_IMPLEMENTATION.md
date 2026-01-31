# Product Reviews System - Complete Implementation

## Overview

A comprehensive product review system has been implemented with enhanced features including review images, helpful voting, admin responses, and improved moderation.

## Database Schema Enhancements

### Migration: `015_enhance_product_reviews.sql`

#### New Columns Added to `product_reviews`:

- `review_images` (TEXT[]) - Array of image URLs uploaded with reviews
- `admin_response` (TEXT) - Response from admin/seller
- `admin_response_at` (TIMESTAMPTZ) - Timestamp of admin response
- `admin_response_by` (UUID) - Admin user who responded
- `moderation_status` (TEXT) - Status: 'pending', 'approved', 'rejected', 'flagged'

#### New Table: `review_helpful_votes`

- Tracks which users found reviews helpful
- Prevents duplicate votes per user per review
- Automatically updates `helpful_count` on `product_reviews`

#### Indexes Created:

- `idx_product_reviews_moderation_status` - For filtering by status
- `idx_product_reviews_product_approved_rating` - Composite index for approved reviews
- `idx_review_helpful_votes_review` - For helpful votes queries
- `idx_review_helpful_votes_user` - For user vote queries
- `idx_review_helpful_votes_review_helpful` - Partial index for helpful count

#### Functions & Triggers:

- `update_review_helpful_count()` - Updates helpful_count when votes change
- `update_product_rating()` - Updated to use `moderation_status` instead of `is_approved`
- Both functions handle INSERT, UPDATE, and DELETE operations

#### RLS Policies:

- Public can view approved reviews
- Users can view their own reviews
- Users can create/update/delete their own reviews
- Admins have full access to all reviews
- Helpful votes follow similar pattern

## API Routes

### Enhanced Routes

#### `GET /api/reviews`

- Filters by `moderation_status` instead of `is_approved`
- Admins can filter by status (pending, approved, rejected, flagged)
- Public users only see approved reviews
- Returns reviews with user data

#### `POST /api/reviews`

- Accepts `review_images` array (max 5 images)
- Validates image count
- Sets `moderation_status` to 'pending'
- Maintains backward compatibility with `is_approved`

#### `PUT /api/reviews/[id]`

- Admins can update `moderation_status`, `admin_response`, and all fields
- Users can only update their own reviews (rating, title, comment, images)
- Syncs `is_approved` with `moderation_status` for backward compatibility

#### `DELETE /api/reviews/[id]`

- Users can delete their own reviews
- Admins can delete any review

### New Routes

#### `POST /api/reviews/[id]/helpful`

- Marks a review as helpful
- Upserts vote (allows changing vote)
- Returns updated helpful count

#### `DELETE /api/reviews/[id]/helpful`

- Removes helpful vote
- Returns updated helpful count

#### `GET /api/reviews/[id]/helpful`

- Returns user's vote status for a review
- Returns `has_voted` and `is_helpful` boolean

## Frontend Components

### `ReviewForm` Component

**Location:** `app/products/[slug]/review-form.tsx`

**Features:**

- Star rating input (1-5 stars)
- Optional review title
- Review comment (required if no title)
- Image upload (max 5 images)
- Image preview with remove option
- Character counter for comment
- Form validation
- Success/error handling with toast notifications

**Props:**

- `productId` - Product ID
- `productName` - Product name for display
- `orderId` - Optional order ID for verified purchase
- `onSuccess` - Callback after successful submission
- `onCancel` - Callback to cancel form

### Enhanced `ProductReviews` Component

**Location:** `app/products/[slug]/product-reviews.tsx`

**New Features:**

1. **Review Form Integration**
   - Toggle to show/hide review form
   - Integrated with existing reviews display

2. **Sorting Options**
   - Newest First (default)
   - Oldest First
   - Highest Rating
   - Lowest Rating
   - Most Helpful

3. **Rating Filtering**
   - Click on rating distribution bars to filter
   - Shows only reviews with selected rating
   - Clear filter button

4. **Helpful Voting**
   - "Helpful" button on each review
   - Shows current helpful count
   - Visual feedback when user has voted
   - Updates count in real-time

5. **Review Images Display**
   - Grid layout for review images (max 4 per row)
   - Hover effect with image icon
   - Click to view full size (future enhancement)

6. **Admin Response Display**
   - Special styled section for admin responses
   - Shows response timestamp
   - Blue background to distinguish from review

7. **Enhanced Review Display**
   - Verified purchase badge
   - User avatar placeholder
   - Star ratings
   - Formatted dates
   - Better spacing and layout

## Usage

### For Users

1. **Writing a Review:**
   - Navigate to product page
   - Click "Write a Review" button
   - Select rating (1-5 stars)
   - Optionally add title
   - Write review comment
   - Optionally upload images (max 5)
   - Submit review
   - Review will be pending approval

2. **Voting on Reviews:**
   - Click "Helpful" button on any review
   - Can change vote by clicking again
   - Helpful count updates immediately

3. **Filtering Reviews:**
   - Click on rating distribution bars to filter
   - Use sort dropdown to change order
   - Clear filter to see all reviews

### For Admins

1. **Moderating Reviews:**
   - Access admin reviews page
   - Filter by moderation status
   - Approve/reject/flag reviews
   - Add admin responses

2. **Responding to Reviews:**
   - Update review via API
   - Set `admin_response` field
   - Response appears in blue box below review

## Database Migration

To apply the migration:

```bash
# Apply migration via Supabase CLI
supabase migration up

# Or apply directly in Supabase dashboard
# Copy contents of supabase/migrations/015_enhance_product_reviews.sql
```

## Key Features

✅ Review images (up to 5 per review)
✅ Helpful voting system
✅ Admin responses to reviews
✅ Enhanced moderation status
✅ Rating filtering
✅ Multiple sort options
✅ Verified purchase badges
✅ Real-time helpful count updates
✅ Backward compatibility with existing reviews
✅ Proper RLS policies
✅ Optimized database indexes

## Future Enhancements

- [ ] Image lightbox for full-size viewing
- [ ] Review editing by users
- [ ] Review reporting/flagging
- [ ] Review replies/threads
- [ ] Review analytics dashboard
- [ ] Automated review request emails
- [ ] Review moderation queue UI
- [ ] Review export functionality

## Notes

- The system maintains backward compatibility with `is_approved` field
- `moderation_status` is the new primary field for moderation
- Helpful votes are automatically counted via database triggers
- Product ratings only include approved reviews
- All images are uploaded to ImageKit via `/api/images/upload`

