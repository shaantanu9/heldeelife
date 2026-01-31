# Database Migration 010: Refunds and Payment Methods

## 📋 Overview

This migration adds two new tables to support customer refund requests and saved payment methods management.

## ✅ Tables Created

### 1. `refunds` Table

**Purpose**: Track customer refund requests for orders

**Schema**:

- `id` (UUID, Primary Key)
- `order_id` (UUID, Foreign Key → orders)
- `user_id` (UUID, Foreign Key → auth.users)
- `reason` (TEXT, CHECK constraint: defective, wrong_item, damaged, not_as_described, changed_mind, other)
- `description` (TEXT, Required)
- `status` (TEXT, Default: 'pending', CHECK: pending, approved, rejected, processed)
- `amount` (NUMERIC(10,2), Required, >= 0)
- `rejection_reason` (TEXT, Optional)
- `processed_at` (TIMESTAMPTZ, Optional)
- `created_at` (TIMESTAMPTZ, Default: now())
- `updated_at` (TIMESTAMPTZ, Default: now())

**Constraints**:

- Only one pending refund per order (enforced via partial unique index)
- Refund amount cannot exceed order total (enforced via trigger)

### 2. `payment_methods` Table

**Purpose**: Store user's saved payment methods for faster checkout

**Schema**:

- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key → auth.users)
- `type` (TEXT, CHECK: card, upi, netbanking, wallet)
- `provider` (TEXT, Required - bank name, UPI ID, wallet name, etc.)
- `last_four` (TEXT, Optional - last 4 digits for cards)
- `expiry_month` (INTEGER, Optional, 1-12)
- `expiry_year` (INTEGER, Optional, 2020-2100)
- `cardholder_name` (TEXT, Optional)
- `is_default` (BOOLEAN, Default: false)
- `created_at` (TIMESTAMPTZ, Default: now())
- `updated_at` (TIMESTAMPTZ, Default: now())

**Constraints**:

- Only one default payment method per user (enforced via trigger)

## 📊 Indexes Created

### Refunds Indexes

1. **idx_refunds_user_status_created**
   - Columns: `user_id, status, created_at DESC`
   - Purpose: Fast queries for user's refunds filtered by status
   - Usage: User viewing their refund history

2. **idx_refunds_order_status**
   - Columns: `order_id, status`
   - Purpose: Quick lookup of refund status for an order
   - Usage: Checking if order has refund when viewing order details

3. **idx_refunds_status_created**
   - Columns: `status, created_at DESC`
   - Purpose: Admin dashboard - view all refunds by status
   - Usage: Admin viewing pending/approved refunds

4. **idx_refunds_pending**
   - Columns: `status, created_at DESC` (Partial: WHERE status = 'pending')
   - Purpose: Fast queries for pending refunds
   - Usage: Admin dashboard showing pending refunds count

5. **idx_refunds_processed**
   - Columns: `processed_at DESC` (Partial: WHERE processed_at IS NOT NULL)
   - Purpose: Queries for processed refunds
   - Usage: Reporting and analytics

6. **idx_refunds_order_pending_unique**
   - Columns: `order_id` (Partial Unique: WHERE status = 'pending')
   - Purpose: Ensure only one pending refund per order
   - Usage: Data integrity constraint

### Payment Methods Indexes

1. **idx_payment_methods_user_default**
   - Columns: `user_id, is_default DESC, created_at DESC`
   - Purpose: Fast queries for user's payment methods with default first
   - Usage: User viewing their saved payment methods

2. **idx_payment_methods_user_default_true**
   - Columns: `user_id, is_default` (Partial: WHERE is_default = true)
   - Purpose: Quick lookup of user's default payment method
   - Usage: Checkout page - finding default payment method

3. **idx_payment_methods_type**
   - Columns: `user_id, type`
   - Purpose: Filter payment methods by type
   - Usage: Showing only cards or only UPI methods

## 🔒 Row Level Security (RLS) Policies

### Refunds Policies

1. **Users can view own refunds**
   - Operation: SELECT
   - Condition: `user_id = auth.uid()`

2. **Users can create own refunds**
   - Operation: INSERT
   - Condition: `user_id = auth.uid()`

3. **Users can update own pending refunds**
   - Operation: UPDATE
   - Condition: `user_id = auth.uid() AND status = 'pending'`
   - Note: Users can only update pending refunds

4. **Admins can manage all refunds**
   - Operation: ALL (SELECT, INSERT, UPDATE, DELETE)
   - Condition: User has admin role

### Payment Methods Policies

1. **Users can view own payment methods**
   - Operation: SELECT
   - Condition: `user_id = auth.uid()`

2. **Users can create own payment methods**
   - Operation: INSERT
   - Condition: `user_id = auth.uid()`

3. **Users can update own payment methods**
   - Operation: UPDATE
   - Condition: `user_id = auth.uid()`

4. **Users can delete own payment methods**
   - Operation: DELETE
   - Condition: `user_id = auth.uid()`

5. **Admins can view all payment methods**
   - Operation: SELECT
   - Condition: User has admin role
   - Note: Admins can view but not modify (for support purposes)

## ⚙️ Triggers & Functions

### Triggers

1. **update_refunds_updated_at**
   - Table: `refunds`
   - Event: BEFORE UPDATE
   - Function: `update_updated_at_column()`
   - Purpose: Auto-update `updated_at` timestamp

2. **update_payment_methods_updated_at**
   - Table: `payment_methods`
   - Event: BEFORE UPDATE
   - Function: `update_updated_at_column()`
   - Purpose: Auto-update `updated_at` timestamp

3. **trigger_ensure_single_default_payment_method**
   - Table: `payment_methods`
   - Event: BEFORE INSERT OR UPDATE
   - Function: `ensure_single_default_payment_method()`
   - Purpose: Ensure only one default payment method per user

4. **trigger_validate_refund_amount**
   - Table: `refunds`
   - Event: BEFORE INSERT OR UPDATE
   - Function: `validate_refund_amount()`
   - Purpose: Ensure refund amount doesn't exceed order total

### Functions

1. **ensure_single_default_payment_method()**
   - Purpose: When setting a payment method as default, unset all other defaults for that user
   - Returns: NEW record

2. **validate_refund_amount()**
   - Purpose: Validate that refund amount doesn't exceed the order's total amount
   - Returns: NEW record or raises exception

## 🚀 Migration Instructions

### Apply Migration

```bash
# Using Supabase CLI
supabase migration up

# Or apply directly via Supabase Dashboard
# Copy the SQL from 010_add_refunds_and_payment_methods.sql
# and run it in the SQL Editor
```

### Verify Migration

```sql
-- Check tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('refunds', 'payment_methods');

-- Check indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename IN ('refunds', 'payment_methods');

-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('refunds', 'payment_methods');

-- Check policies
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename IN ('refunds', 'payment_methods');
```

## 📝 Notes

1. **Security**:
   - Payment methods store minimal card data (last 4 digits only)
   - Full card numbers should be tokenized and stored with payment gateway
   - RLS ensures users can only access their own data

2. **Data Integrity**:
   - Partial unique index prevents multiple pending refunds per order
   - Trigger ensures refund amount validation
   - Trigger ensures single default payment method per user

3. **Performance**:
   - All common query patterns are indexed
   - Partial indexes reduce index size for filtered queries
   - Composite indexes support multi-column queries efficiently

4. **Future Enhancements**:
   - Add refund reason categories table for analytics
   - Add payment method expiration notifications
   - Add refund processing workflow states
   - Add payment method verification status

## ✅ Testing Checklist

- [ ] Tables created successfully
- [ ] Indexes created successfully
- [ ] RLS policies applied correctly
- [ ] Triggers working (updated_at, default payment method, refund validation)
- [ ] Users can create refund requests
- [ ] Users can view only their own refunds
- [ ] Users can add payment methods
- [ ] Only one default payment method per user
- [ ] Admins can view all refunds
- [ ] Refund amount validation works
- [ ] Partial unique index prevents duplicate pending refunds

