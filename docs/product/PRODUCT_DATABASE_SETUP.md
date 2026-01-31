# Product Database Setup - Complete

This document describes the complete product management, inventory, and analytics database schema that has been set up in Supabase.

## 📊 Database Schema Overview

### Core Tables

#### 1. **product_categories**

- Hierarchical category system with parent-child relationships
- Supports display ordering and active/inactive status
- Fields: `id`, `name`, `slug`, `description`, `image`, `parent_id`, `display_order`, `is_active`

#### 2. **products**

- Comprehensive product information table
- Includes pricing (price, compare_at_price, cost_price), SEO fields, product details
- Tracks views, sales, ratings, and reviews
- Fields: All product information including `name`, `slug`, `description`, `price`, `sku`, `category_id`, `images[]`, `benefits[]`, `ingredients`, `rating`, `views_count`, `sales_count`, etc.

#### 3. **inventory**

- Stock management with support for multiple locations and batches
- Tracks quantity, reserved quantity, and available quantity (auto-calculated)
- Low stock thresholds and reorder points
- Fields: `product_id`, `quantity`, `reserved_quantity`, `available_quantity`, `low_stock_threshold`, `reorder_point`, `location`, `batch_number`, `expiry_date`, etc.

#### 4. **inventory_history**

- Complete audit trail for all inventory changes
- Tracks: restock, sale, return, adjustment, reserve, unreserve, damaged, expired
- Fields: `inventory_id`, `product_id`, `change_type`, `quantity_change`, `quantity_before`, `quantity_after`, `reference_id`, `notes`

#### 5. **orders**

- Customer orders with payment and shipping information
- Auto-generates order numbers (format: ORD-YYYYMMDD-XXXX)
- Tracks order status and payment status
- Fields: `order_number`, `user_id`, `status`, `payment_status`, `subtotal`, `tax_amount`, `shipping_amount`, `total_amount`, `shipping_address`, `billing_address`, etc.

#### 6. **order_items**

- Individual items in an order with price snapshots
- Preserves product information at time of purchase
- Fields: `order_id`, `product_id`, `product_name`, `quantity`, `unit_price`, `total_price`

### Analytics Tables

#### 7. **product_views**

- Tracks product page views
- Fields: `product_id`, `user_id`, `session_id`, `ip_address`, `user_agent`, `referrer`, `viewed_at`

#### 8. **product_sales_analytics**

- Daily aggregated sales and view analytics per product
- Fields: `product_id`, `date`, `views`, `unique_views`, `orders_count`, `quantity_sold`, `revenue`, `conversion_rate`

#### 9. **cart_analytics**

- Tracks cart additions, removals, and conversions
- Fields: `product_id`, `user_id`, `session_id`, `added_at`, `removed_at`, `purchased_at`, `order_id`

#### 10. **product_searches**

- Tracks product search queries and results
- Fields: `search_query`, `user_id`, `session_id`, `results_count`, `clicked_product_id`, `searched_at`

#### 11. **inventory_alerts**

- Alerts for inventory issues
- Types: `low_stock`, `out_of_stock`, `reorder_needed`, `expiring_soon`, `expired`
- Fields: `inventory_id`, `product_id`, `alert_type`, `current_quantity`, `threshold_quantity`, `is_resolved`

## 🔄 Automatic Features

### Triggers & Functions

1. **Order Number Generation**
   - Automatically generates unique order numbers when orders are created
   - Format: `ORD-YYYYMMDD-XXXX`

2. **Inventory Updates on Orders**
   - When order is confirmed: Reserves inventory
   - When order is shipped: Deducts from inventory and releases reservation
   - When order is cancelled: Releases reserved inventory

3. **Product Sales Count**
   - Automatically updates `products.sales_count` when orders are confirmed/shipped/delivered

4. **Product Views Count**
   - Automatically updates `products.views_count` when product views are tracked

5. **Inventory Alerts**
   - Automatically creates alerts for:
     - Low stock (when available quantity <= low_stock_threshold)
     - Out of stock (when available quantity = 0)
     - Reorder needed (when available quantity <= reorder_point)
     - Expiring soon (within 30 days)
     - Expired items

6. **Updated Timestamps**
   - Automatically updates `updated_at` on all tables when records are modified

## 📈 Helper Views

### 1. **products_with_inventory**

- Products with aggregated inventory information
- Includes: `total_quantity`, `total_reserved`, `total_available`, `stock_status`

### 2. **daily_sales_summary**

- Daily aggregated sales summary
- Includes: `sale_date`, `total_orders`, `unique_customers`, `total_revenue`, `total_items_sold`, `average_order_value`

### 3. **product_performance**

- Product performance metrics
- Includes: `units_sold`, `revenue`, `current_stock`, `conversion_rate`

## 🔒 Security (RLS Policies)

All tables have Row Level Security (RLS) enabled with the following policies:

- **Public Access**: Can view active products and categories
- **User Access**: Can view their own orders and order items, can create orders
- **Admin Access**: Full access to all tables (products, inventory, analytics, orders)

## 📝 Usage Examples

### Insert a Product

```sql
INSERT INTO products (name, slug, price, description, category_id, sku)
VALUES ('Saline Tulsi Nasal Spray 115ml', 'saline-tulsi-nasal-spray', 129.00, 'Description...', 'category-uuid', 'SKU-001');
```

### Add Inventory

```sql
INSERT INTO inventory (product_id, quantity, low_stock_threshold, reorder_point)
VALUES ('product-uuid', 100, 10, 20);
```

### Create an Order

```sql
INSERT INTO orders (user_id, subtotal, total_amount, status, payment_status)
VALUES ('user-uuid', 129.00, 129.00, 'pending', 'pending');

INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price)
VALUES ('order-uuid', 'product-uuid', 'Saline Tulsi Nasal Spray', 1, 129.00, 129.00);
```

### Track Product View

```sql
INSERT INTO product_views (product_id, user_id, session_id)
VALUES ('product-uuid', 'user-uuid', 'session-id');
```

### Query Products with Inventory

```sql
SELECT * FROM products_with_inventory WHERE stock_status = 'in_stock';
```

### View Daily Sales

```sql
SELECT * FROM daily_sales_summary ORDER BY sale_date DESC LIMIT 30;
```

### View Product Performance

```sql
SELECT * FROM product_performance ORDER BY revenue DESC;
```

## 📁 Files Created

1. **supabase/migrations/product_schema.sql** - Complete schema reference file
2. **PRODUCT_DATABASE_SETUP.md** - This documentation file

## ✅ Migration Files Applied

All migrations have been successfully applied to the Supabase database:

- `create_product_categories`
- `create_products_table`
- `create_inventory_table`
- `create_orders_tables`
- `create_analytics_tables`
- `create_indexes_fixed`
- `setup_rls_policies`
- `create_functions_and_triggers`
- `create_helper_views`

## 🚀 Next Steps

1. **Populate Categories**: Create product categories
2. **Migrate Products**: Move hardcoded products from frontend to database
3. **Set Up Inventory**: Add inventory records for each product
4. **Build Admin UI**: Create admin pages for product/inventory management
5. **Integrate Analytics**: Connect frontend to track views and sales

## 📚 Related Documentation

- See `supabase/migrations/product_schema.sql` for complete SQL schema
- See existing blog schema for similar patterns
- See `SUPABASE_SETUP.md` for general Supabase setup

