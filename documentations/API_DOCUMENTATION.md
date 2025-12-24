# Product Management API Documentation

This document provides sample payloads for creating products and managing their variations, generics (batches), and storage locations.

---

## Table of Contents
1. [Create a Product](#1-create-a-product)
2. [Add Product Variations](#2-add-product-variations)
3. [Add Product Generics (Batches)](#3-add-product-generics-batches)
4. [Add Product Storage](#4-add-product-storage)
5. [Complete Workflow Example](#5-complete-workflow-example)

---

## 1. Create a Product

**Endpoint:** `POST /api/Products`

**Description:** Creates a new product. The system automatically creates a main variation based on the product's base properties.

### Request Body

```json
{
  "id": "00000000-0000-0000-0000-000000000000",
  "productName": "Paracetamol 500mg",
  "barCode": "8901234567890",
  "description": "Pain relief and fever reducer medication",
  "baseCostPrice": 15.50,
  "baseRetailPrice": 25.00,
  "baseWholeSalePrice": 20.00,
  "baseDiscount": 0,
  "stackSize": 10,
  "basicUnitofMeasure": "Tablets",
  "reorderLevel": 50,
  "isTaxable": true,
  "taxRate": 16,
  "isActive": true
}
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | GUID | Yes | Use `00000000-0000-0000-0000-000000000000` for new records |
| `productName` | string | Yes | Name of the product |
| `barCode` | string | No | Product barcode/SKU |
| `description` | string | No | Detailed product description |
| `baseCostPrice` | decimal | Yes | Cost price per unit |
| `baseRetailPrice` | decimal | Yes | Retail selling price |
| `baseWholeSalePrice` | decimal | Yes | Wholesale selling price |
| `baseDiscount` | decimal | No | Discount percentage or amount |
| `stackSize` | decimal | Yes | Number of units per package |
| `basicUnitofMeasure` | string | Yes | Unit of measure (e.g., Tablets, Bottles, Boxes) |
| `reorderLevel` | decimal | Yes | Minimum stock level before reordering |
| `isTaxable` | boolean | Yes | Whether the product is subject to tax |
| `taxRate` | decimal | No | Tax rate percentage (required if `isTaxable` is true) |
| `isActive` | boolean | Yes | Whether the product is active for sale |

### Response

**Status:** `201 Created`

```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "productName": "Paracetamol 500mg",
  "barCode": "8901234567890",
  "description": "Pain relief and fever reducer medication",
  "baseCostPrice": 15.50,
  "baseRetailPrice": 25.00,
  "baseWholeSalePrice": 20.00,
  "baseDiscount": 0,
  "stackSize": 10,
  "basicUnitofMeasure": "Tablets",
  "reorderLevel": 50,
  "isTaxable": true,
  "taxRate": 16,
  "isActive": true
}
```

**Note:** The system automatically creates a main variation with the same properties as the product.

---

## 2. Add Product Variations

**Endpoint:** `POST /api/ProductVariations`

**Description:** Add different variations/packages of the same product (e.g., different sizes, packaging).

### Single Variation

```json
{
  "id": "00000000-0000-0000-0000-000000000000",
  "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "name": "Paracetamol 500mg - Strip of 10",
  "unitSize": 10,
  "retailPrice": 25.00,
  "wholeSalePrice": 20.00,
  "discount": 0,
  "unitofMeasure": "Strip",
  "isActive": true,
  "isMain": false
}
```

### Bulk Variations

**Endpoint:** `POST /api/ProductVariations/Bulk`

```json
[
  {
    "id": "00000000-0000-0000-0000-000000000000",
    "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "name": "Paracetamol 500mg - Strip of 10",
    "unitSize": 10,
    "retailPrice": 25.00,
    "wholeSalePrice": 20.00,
    "discount": 0,
    "unitofMeasure": "Strip",
    "isActive": true,
    "isMain": false
  },
  {
    "id": "00000000-0000-0000-0000-000000000000",
    "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "name": "Paracetamol 500mg - Box of 100",
    "unitSize": 100,
    "retailPrice": 220.00,
    "wholeSalePrice": 180.00,
    "discount": 5,
    "unitofMeasure": "Box",
    "isActive": true,
    "isMain": false
  },
  {
    "id": "00000000-0000-0000-0000-000000000000",
    "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "name": "Paracetamol 500mg - Bottle of 500",
    "unitSize": 500,
    "retailPrice": 1000.00,
    "wholeSalePrice": 850.00,
    "discount": 10,
    "unitofMeasure": "Bottle",
    "isActive": true,
    "isMain": false
  }
]
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | GUID | Yes | Use `00000000-0000-0000-0000-000000000000` for new records |
| `productId` | GUID | Yes | ID of the parent product |
| `name` | string | Yes | Variation name (typically includes size/packaging) |
| `unitSize` | decimal | Yes | Number of units in this variation |
| `retailPrice` | decimal | Yes | Retail price for this variation |
| `wholeSalePrice` | decimal | Yes | Wholesale price for this variation |
| `discount` | decimal | No | Discount for this variation |
| `unitofMeasure` | string | No | Unit of measure for this variation |
| `isActive` | boolean | Yes | Whether this variation is available |
| `isMain` | boolean | Yes | Whether this is the primary variation (only one per product) |

### Response

**Status:** `200 OK`

```json
[
  {
    "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "name": "Paracetamol 500mg - Strip of 10",
    "unitSize": 10,
    "retailPrice": 25.00,
    "wholeSalePrice": 20.00,
    "discount": 0,
    "unitofMeasure": "Strip",
    "isActive": true,
    "isMain": false
  }
]
```

---

## 3. Add Product Generics (Batches)

**Endpoint:** `POST /api/ProductGenerics`

**Description:** Add batch/generic information for products (expiry dates, manufacture dates, batch numbers, supplier).

### Single Generic

```json
{
  "id": "00000000-0000-0000-0000-000000000000",
  "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "expiryDate": "2026-12-31T23:59:59Z",
  "manufactureDate": "2024-01-15T00:00:00Z",
  "batchNumber": "BATCH-2024-001",
  "supplierId": "a1b2c3d4-5678-90ab-cdef-1234567890ab"
}
```

### Bulk Generics

**Endpoint:** `POST /api/ProductGenerics/Bulk`

```json
[
  {
    "id": "00000000-0000-0000-0000-000000000000",
    "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "expiryDate": "2026-12-31T23:59:59Z",
    "manufactureDate": "2024-01-15T00:00:00Z",
    "batchNumber": "BATCH-2024-001",
    "supplierId": "a1b2c3d4-5678-90ab-cdef-1234567890ab"
  },
  {
    "id": "00000000-0000-0000-0000-000000000000",
    "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "expiryDate": "2027-06-30T23:59:59Z",
    "manufactureDate": "2024-06-01T00:00:00Z",
    "batchNumber": "BATCH-2024-002",
    "supplierId": "a1b2c3d4-5678-90ab-cdef-1234567890ab"
  }
]
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | GUID | Yes | Use `00000000-0000-0000-0000-000000000000` for new records |
| `productId` | GUID | Yes | ID of the product |
| `expiryDate` | DateTime | Yes | When the batch expires (ISO 8601 format) |
| `manufactureDate` | DateTime | Yes | When the batch was manufactured |
| `batchNumber` | string | No | Batch/lot number from manufacturer |
| `supplierId` | GUID | Yes | ID of the supplier who provided this batch |

**Validation Rules:**
- `expiryDate` must be after `manufactureDate`
- `manufactureDate` cannot be in the future
- Both `productId` and `supplierId` must exist in the database

### Response

**Status:** `201 Created`

```json
{
  "id": "9d8c7b6a-5432-1098-fedc-ba9876543210",
  "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "expiryDate": "2026-12-31T23:59:59Z",
  "manufactureDate": "2024-01-15T00:00:00Z",
  "batchNumber": "BATCH-2024-001",
  "supplierId": "a1b2c3d4-5678-90ab-cdef-1234567890ab"
}
```

---

## 4. Add Product Storage

**Endpoint:** `POST /api/ProductStorages`

**Description:** Track inventory at specific storage locations, linking a product batch (generic) with a variation at a store.

### Single Storage Entry

```json
{
  "id": "00000000-0000-0000-0000-000000000000",
  "productGenericId": "9d8c7b6a-5432-1098-fedc-ba9876543210",
  "productVariationId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "quantity": 150,
  "storageId": "f1e2d3c4-b5a6-9788-0011-223344556677",
  "reorderLevel": 30
}
```

### Bulk Storage Entries

**Endpoint:** `POST /api/ProductStorages/Bulk`

```json
[
  {
    "id": "00000000-0000-0000-0000-000000000000",
    "productGenericId": "9d8c7b6a-5432-1098-fedc-ba9876543210",
    "productVariationId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "quantity": 150,
    "storageId": "f1e2d3c4-b5a6-9788-0011-223344556677",
    "reorderLevel": 30
  },
  {
    "id": "00000000-0000-0000-0000-000000000000",
    "productGenericId": "9d8c7b6a-5432-1098-fedc-ba9876543210",
    "productVariationId": "8d7c6b5a-4321-0987-fedc-ba0987654321",
    "quantity": 50,
    "storageId": "f1e2d3c4-b5a6-9788-0011-223344556677",
    "reorderLevel": 10
  }
]
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | GUID | Yes | Use `00000000-0000-0000-0000-000000000000` for new records |
| `productGenericId` | GUID | Yes | ID of the product batch/generic |
| `productVariationId` | GUID | Yes | ID of the product variation |
| `quantity` | decimal | Yes | Current stock quantity |
| `storageId` | GUID | Yes | ID of the store/warehouse location |
| `reorderLevel` | decimal | Yes | Minimum quantity before restocking needed |

**Validation Rules:**
- `productGenericId`, `productVariationId`, and `storageId` must exist
- The variation and generic must belong to the same product
- `quantity` and `reorderLevel` cannot be negative
- No duplicate entries (same generic + variation + storage combination)

### Response

**Status:** `201 Created`

```json
{
  "id": "1a2b3c4d-5e6f-7890-abcd-ef1234567890",
  "productGenericId": "9d8c7b6a-5432-1098-fedc-ba9876543210",
  "productVariationId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "quantity": 150,
  "storageId": "f1e2d3c4-b5a6-9788-0011-223344556677",
  "reorderLevel": 30
}
```

---

## 5. Complete Workflow Example

Here's a complete step-by-step example of creating a product with variations, batches, and storage.

### Step 1: Create the Product

**Request:** `POST /api/Products`

```json
{
  "id": "00000000-0000-0000-0000-000000000000",
  "productName": "Ibuprofen 400mg",
  "barCode": "8901234567891",
  "description": "Anti-inflammatory medication",
  "baseCostPrice": 12.00,
  "baseRetailPrice": 20.00,
  "baseWholeSalePrice": 16.00,
  "baseDiscount": 0,
  "stackSize": 20,
  "basicUnitofMeasure": "Tablets",
  "reorderLevel": 100,
  "isTaxable": true,
  "taxRate": 16,
  "isActive": true
}
```

**Response:** Product created with ID `3fa85f64-5717-4562-b3fc-2c963f66afa6`  
(Main variation automatically created)

---

### Step 2: Add Additional Variations

**Request:** `POST /api/ProductVariations/Bulk`

```json
[
  {
    "id": "00000000-0000-0000-0000-000000000000",
    "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "name": "Ibuprofen 400mg - Blister Pack (20)",
    "unitSize": 20,
    "retailPrice": 20.00,
    "wholeSalePrice": 16.00,
    "discount": 0,
    "unitofMeasure": "Pack",
    "isActive": true,
    "isMain": false
  },
  {
    "id": "00000000-0000-0000-0000-000000000000",
    "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "name": "Ibuprofen 400mg - Bottle (100)",
    "unitSize": 100,
    "retailPrice": 90.00,
    "wholeSalePrice": 75.00,
    "discount": 5,
    "unitofMeasure": "Bottle",
    "isActive": true,
    "isMain": false
  }
]
```

**Response:** Variations created with IDs:
- `7c9e6679-7425-40de-944b-e07fc1f90ae7` (Pack of 20)
- `8d7c6b5a-4321-0987-fedc-ba0987654321` (Bottle of 100)

---

### Step 3: Add Product Batches

**Request:** `POST /api/ProductGenerics/Bulk`

```json
[
  {
    "id": "00000000-0000-0000-0000-000000000000",
    "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "expiryDate": "2026-11-30T23:59:59Z",
    "manufactureDate": "2024-11-01T00:00:00Z",
    "batchNumber": "IBU-2024-NOV-001",
    "supplierId": "a1b2c3d4-5678-90ab-cdef-1234567890ab"
  },
  {
    "id": "00000000-0000-0000-0000-000000000000",
    "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "expiryDate": "2027-03-31T23:59:59Z",
    "manufactureDate": "2025-03-01T00:00:00Z",
    "batchNumber": "IBU-2025-MAR-001",
    "supplierId": "a1b2c3d4-5678-90ab-cdef-1234567890ab"
  }
]
```

**Response:** Generics created with IDs:
- `9d8c7b6a-5432-1098-fedc-ba9876543210` (Nov 2024 batch)
- `1f2e3d4c-5b6a-7988-0011-223344556688` (Mar 2025 batch)

---

### Step 4: Add Storage Entries

**Request:** `POST /api/ProductStorages/Bulk`

```json
[
  {
    "id": "00000000-0000-0000-0000-000000000000",
    "productGenericId": "9d8c7b6a-5432-1098-fedc-ba9876543210",
    "productVariationId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "quantity": 200,
    "storageId": "f1e2d3c4-b5a6-9788-0011-223344556677",
    "reorderLevel": 50
  },
  {
    "id": "00000000-0000-0000-0000-000000000000",
    "productGenericId": "9d8c7b6a-5432-1098-fedc-ba9876543210",
    "productVariationId": "8d7c6b5a-4321-0987-fedc-ba0987654321",
    "quantity": 100,
    "storageId": "f1e2d3c4-b5a6-9788-0011-223344556677",
    "reorderLevel": 20
  },
  {
    "id": "00000000-0000-0000-0000-000000000000",
    "productGenericId": "1f2e3d4c-5b6a-7988-0011-223344556688",
    "productVariationId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "quantity": 150,
    "storageId": "f1e2d3c4-b5a6-9788-0011-223344556677",
    "reorderLevel": 50
  }
]
```

**Response:** Storage entries created successfully.

---

## Additional Useful Endpoints

### Query Product Storage

**Get Low Stock Items:**
```
GET /api/ProductStorages/LowStock?storageId=f1e2d3c4-b5a6-9788-0011-223344556677
```

**Get Expiring Soon Items:**
```
GET /api/ProductGenerics/ExpiringSoon?days=30
```

**Get Expired Items:**
```
GET /api/ProductGenerics/Expired
```

**Get Storage by Store:**
```
GET /api/ProductStorages/ByStore/f1e2d3c4-b5a6-9788-0011-223344556677
```

**Update Stock Quantity:**
```
PUT /api/ProductStorages/{id}/UpdateQuantity
Body: 175
```

**Adjust Stock (Add/Remove):**
```
PUT /api/ProductStorages/{id}/AdjustQuantity
Body: -25  (removes 25 units)
Body: 50   (adds 50 units)
```

---

## Error Responses

All endpoints return appropriate HTTP status codes and error messages:

### 400 Bad Request
```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
  "title": "Bad Request",
  "status": 400,
  "detail": "The specified product does not exist."
}
```

### 404 Not Found
```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.4",
  "title": "Not Found",
  "status": 404,
  "detail": "Entity set 'DBContext.Products' is null."
}
```

### 500 Internal Server Error
```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.6.1",
  "title": "Internal Server Error",
  "status": 500,
  "detail": "An error occurred while processing your request."
}
```

---

## Notes

1. **GUIDs:** Always use `00000000-0000-0000-0000-000000000000` for the `id` field when creating new records. The system will generate actual GUIDs.

2. **DateTime Format:** Use ISO 8601 format with UTC timezone (e.g., `2025-12-31T23:59:59Z`).

3. **Relationships:** Ensure that all foreign keys (productId, supplierId, storageId, etc.) reference existing records.

4. **Soft Deletes:** All delete operations are soft deletes. Use the restore endpoints to recover deleted records.

5. **Main Variation:** Each product must have exactly one main variation. The system automatically creates one when you create a product.

6. **Stock Tracking:** Storage entries link a specific batch (generic) with a specific package size (variation) at a specific location (store).
