# Bulk Product Management System

This document describes the comprehensive bulk product management system implemented for the HeldeeLife e-commerce platform.

## Overview

The bulk product management system allows administrators to efficiently manage large numbers of products through:

- **Bulk Import**: Import multiple products from Excel/CSV files
- **Bulk Operations**: Perform actions on multiple selected products simultaneously
- **Bulk Inventory Management**: Update inventory for multiple products at once
- **Template Download**: Download Excel template for easy product import

## Features

### 1. Bulk Product Import

Import multiple products at once using Excel files.

#### API Endpoint

```
POST /api/admin/products/bulk-import
```

#### File Format

- Accepts `.xlsx` and `.xls` files
- First row should contain headers
- Required fields: `name`, `price`
- Optional fields: All other product fields

#### Supported Fields

| Field                | Required | Type           | Description                                       |
| -------------------- | -------- | -------------- | ------------------------------------------------- |
| name                 | Yes      | String         | Product name                                      |
| slug                 | No       | String         | URL-friendly identifier (auto-generated if empty) |
| price                | Yes      | Number         | Product price                                     |
| sku                  | No       | String         | Stock Keeping Unit                                |
| category             | No       | String         | Category name (must match existing category)      |
| description          | No       | String         | Full product description                          |
| short_description    | No       | String         | Brief description                                 |
| image                | No       | String         | Main product image URL                            |
| images               | No       | String         | Comma-separated image URLs                        |
| is_active            | No       | Boolean/String | Active status (default: true)                     |
| is_featured          | No       | Boolean/String | Featured status (default: false)                  |
| initial_quantity     | No       | Number         | Initial stock quantity                            |
| compare_at_price     | No       | Number         | Original/compare price                            |
| cost_price           | No       | Number         | Cost price                                        |
| manufacturer         | No       | String         | Manufacturer name                                 |
| ingredients          | No       | String         | Product ingredients                               |
| usage_instructions   | No       | String         | Usage instructions                                |
| storage_instructions | No       | String         | Storage requirements                              |
| expiry_info          | No       | String         | Expiry information                                |
| meta_title           | No       | String         | SEO meta title                                    |
| meta_description     | No       | String         | SEO meta description                              |

#### Example Import File

```excel
name              | price   | sku      | category      | is_active | initial_quantity
------------------|---------|----------|---------------|-----------|-----------------
Product 1         | 999.99  | SKU-001  | Category A    | true      | 100
Product 2         | 1299.99 | SKU-002  | Category B    | true      | 50
```

#### Response Format

```json
{
  "message": "Import completed: 10 successful, 2 errors",
  "results": {
    "success": [
      {
        "row": 2,
        "product": {
          "id": "uuid",
          "name": "Product 1"
        }
      }
    ],
    "errors": [
      {
        "row": 5,
        "error": "Name and price are required",
        "data": { ... }
      }
    ],
    "total": 12
  }
}
```

### 2. Bulk Operations

Perform actions on multiple selected products simultaneously.

#### API Endpoint

```
POST /api/admin/products/bulk-operations
```

#### Request Body

```json
{
  "productIds": ["uuid1", "uuid2", "uuid3"],
  "operation": "activate",
  "data": {} // Optional, depends on operation
}
```

#### Supported Operations

##### Activate Products

```json
{
  "productIds": ["uuid1", "uuid2"],
  "operation": "activate"
}
```

Sets `is_active = true` for selected products.

##### Deactivate Products

```json
{
  "productIds": ["uuid1", "uuid2"],
  "operation": "deactivate"
}
```

Sets `is_active = false` for selected products.

##### Feature Products

```json
{
  "productIds": ["uuid1", "uuid2"],
  "operation": "feature"
}
```

Sets `is_featured = true` for selected products.

##### Unfeature Products

```json
{
  "productIds": ["uuid1", "uuid2"],
  "operation": "unfeature"
}
```

Sets `is_featured = false` for selected products.

##### Delete Products

```json
{
  "productIds": ["uuid1", "uuid2"],
  "operation": "delete"
}
```

**Warning**: This permanently deletes products and their inventory. Cannot be undone.

##### Update Category

```json
{
  "productIds": ["uuid1", "uuid2"],
  "operation": "update_category",
  "data": {
    "category_id": "category-uuid" // or null to remove category
  }
}
```

##### Update Price

```json
{
  "productIds": ["uuid1", "uuid2"],
  "operation": "update_price",
  "data": {
    "price": 999.99
  }
}
```

##### Update Inventory

```json
{
  "productIds": ["uuid1", "uuid2"],
  "operation": "update_inventory",
  "data": {
    "quantity": 100,
    "location": "main" // Optional, defaults to "main"
  }
}
```

Creates inventory records if they don't exist, or updates existing ones.

### 3. Template Download

Download an Excel template with example data and field descriptions.

#### API Endpoint

```
GET /api/admin/products/template
```

#### Features

- Includes example product row
- Contains "Instructions" sheet with field descriptions
- Ready-to-use format for bulk import

## Frontend Implementation

### Product Selection

Products can be selected individually or all at once:

- **Individual Selection**: Click checkbox next to each product
- **Select All**: Click checkbox in table header
- **Selection Counter**: Shows number of selected products in bulk actions button

### Bulk Actions Menu

Located in the top toolbar, provides:

- Activate/Deactivate selected products
- Feature/Unfeature selected products
- Update category (with category selector dialog)
- Update price (with price input dialog)
- Update inventory (with quantity input dialog)
- Delete selected products (with confirmation)

### Bulk Import Dialog

Accessible via "Bulk Import" button:

1. **Download Template**: Get Excel template with instructions
2. **Select File**: Choose Excel file to import
3. **Import**: Upload and process products
4. **Results**: Shows success/error counts

## Usage Examples

### Example 1: Import 100 Products

1. Click "Bulk Import" button
2. Click "Download Template" to get the format
3. Fill in product data in Excel
4. Save as `.xlsx` file
5. Click "Select File" and choose your file
6. Click "Import Products"
7. Review results for any errors

### Example 2: Activate Multiple Products

1. Select products using checkboxes
2. Click "Bulk Actions" dropdown
3. Select "Activate Selected"
4. Products are activated immediately

### Example 3: Update Prices for Category

1. Filter products by category (if needed)
2. Select all products in that category
3. Click "Bulk Actions" → "Update Price"
4. Enter new price in dialog
5. Click "Update"
6. All selected products get the new price

### Example 4: Bulk Inventory Update

1. Select products needing inventory update
2. Click "Bulk Actions" → "Update Inventory"
3. Enter quantity in dialog
4. Click "Update"
5. Inventory is created/updated for all selected products

## Error Handling

### Import Errors

- **Validation Errors**: Missing required fields, invalid data types
- **Database Errors**: Duplicate SKUs, invalid category names, constraint violations
- **Row-level Errors**: Each error includes row number and error message

### Operation Errors

- **Selection Required**: Operations require at least one selected product
- **Confirmation Required**: Destructive operations (delete) require confirmation
- **Validation**: Price and quantity must be valid numbers

## Best Practices

### 1. Import Preparation

- **Use Template**: Always download and use the template
- **Validate Data**: Check for required fields before importing
- **Test Small Batch**: Import a few products first to verify format
- **Category Names**: Ensure category names match exactly (case-sensitive)

### 2. Bulk Operations

- **Select Carefully**: Double-check selected products before operations
- **Backup First**: Export products before bulk delete operations
- **Test on Few**: Test operations on a small selection first
- **Monitor Results**: Check operation results for any failures

### 3. Inventory Management

- **Location Consistency**: Use consistent location names
- **Quantity Validation**: Ensure quantities are non-negative
- **Reserved Quantity**: System automatically handles reserved inventory

## Technical Details

### File Processing

- Files are processed server-side for security
- Maximum file size: Configured by server
- Supported formats: `.xlsx`, `.xls`
- Encoding: UTF-8

### Performance

- **Batch Processing**: Products are processed one by one
- **Transaction Safety**: Each product is inserted independently
- **Error Recovery**: Failed products don't stop the import process
- **Progress Feedback**: Real-time feedback via toast notifications

### Security

- **Authentication Required**: Admin role required for all operations
- **Input Validation**: All inputs are validated server-side
- **SQL Injection Protection**: Using parameterized queries
- **File Type Validation**: Only Excel files accepted

## API Response Codes

- `200`: Success
- `400`: Bad Request (missing/invalid data)
- `401`: Unauthorized (not authenticated)
- `403`: Forbidden (not admin)
- `500`: Internal Server Error

## Troubleshooting

### Import Issues

**Problem**: "No data found in file"

- **Solution**: Ensure file has data rows (not just headers)

**Problem**: "Category not found"

- **Solution**: Check category name spelling and case sensitivity

**Problem**: "Duplicate SKU"

- **Solution**: Ensure SKUs are unique or leave blank

### Operation Issues

**Problem**: "No products selected"

- **Solution**: Select at least one product before performing operation

**Problem**: "Operation failed"

- **Solution**: Check server logs for detailed error messages

## Future Enhancements

Potential improvements:

- [ ] CSV format support
- [ ] Import preview before processing
- [ ] Undo functionality for bulk operations
- [ ] Scheduled bulk operations
- [ ] Export/Import product images
- [ ] Bulk variant management
- [ ] Advanced filtering for bulk selection
- [ ] Progress bar for large imports

## Support

For issues or questions:

1. Check error messages in import results
2. Review server logs for detailed errors
3. Verify data format matches template
4. Test with small dataset first

---

**Last Updated**: 2024-01-15
**Version**: 1.0.0

