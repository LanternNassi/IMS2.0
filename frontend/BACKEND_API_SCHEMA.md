# Backend API Schema Documentation

## Overview
This document describes the exact data structure that will be sent from the frontend when saving **Sales** and **Purchases** transactions.

---

## 📦 SALES TRANSACTION SCHEMA

### Endpoint (Expected)
**POST** `/api/sales` or `/api/Sales`

### Request Payload Structure

```typescript
{
  id: string                    // UUID generated on frontend (crypto.randomUUID())
  supplierId: string            // Actually CUSTOMER ID (field name kept for compatibility)
  supplierName: string          // Actually CUSTOMER NAME
  items: SalesItem[]            // Array of sales items
  totalAmount: number           // Calculated total (sum of all item.totalPrice - discount)
  createdAt: Date               // ISO 8601 timestamp
  notes?: string                // Optional notes field
}
```

### SalesItem Schema

```typescript
{
  id: string                    // UUID for the line item
  productId: string             // ID of the product being sold
  productName: string           // Name of the product
  basePrice: number             // Price per unit (can be wholesale/selling/custom price)
  quantity: number              // Quantity being sold
  totalPrice: number            // basePrice * quantity
  hasGeneric: boolean           // Always FALSE for sales (no batch info allowed)
  baseCostPrice?: number        // Optional: Product's cost price (for profit calculation)
  batchNumber?: string          // Will be undefined/null for sales
}
```

### Additional Context Available in Form

```typescript
// Customer Details (from CustomerAutocomplete)
{
  id: string
  name: string
  phone: string
  email: string
  address: string
  customerType: string
  accountNumber: string
  moreInfo: string
}

// Product Details (available but not all sent in item)
{
  id: string
  name: string
  baseCostPrice: number         // e.g., 100000
  baseWholeSalePrice: number    // e.g., 120000
  baseSellingPrice: number      // e.g., 150000
  stores: {
    [storeName: string]: number // e.g., { 'Front store': 4, 'Back store': 3 }
  }
}

// Financial Summary (calculated on frontend)
{
  totalAmount: number           // Sum of all item.totalPrice
  discount: number              // User-entered discount amount
  paidAmount: number            // User-entered paid amount
  returnAmount: number          // paidAmount - (totalAmount - discount)
}
```

### Example Sales Transaction Payload

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "supplierId": "cust-12345",
  "supplierName": "John's Pharmacy",
  "items": [
    {
      "id": "item-uuid-1",
      "productId": "prod-001",
      "productName": "Paracetamol",
      "basePrice": 150000,
      "quantity": 10,
      "totalPrice": 1500000,
      "hasGeneric": false
    },
    {
      "id": "item-uuid-2",
      "productId": "prod-002",
      "productName": "Ibuprofen",
      "basePrice": 180000,
      "quantity": 5,
      "totalPrice": 900000,
      "hasGeneric": false
    }
  ],
  "totalAmount": 2400000,
  "createdAt": "2025-11-29T10:30:00.000Z",
  "notes": "Customer paid in cash"
}
```

### Important Notes for Sales
1. **Field Name Confusion**: `supplierId` and `supplierName` actually contain **CUSTOMER** data (legacy naming)
2. **No Batch Info**: Sales items never have batch/generic information (`hasGeneric` always `false`)
3. **Price Selection**: `basePrice` can be one of:
   - Product's `baseWholeSalePrice`
   - Product's `baseSellingPrice`
   - Custom price entered by user
4. **Store Selection**: User selects which store the product is sold from (not sent in payload, but should be tracked for inventory)
5. **Number Formatting**: All prices are stored as raw numbers (e.g., 150000, not "150,000")

---

## 📦 PURCHASES TRANSACTION SCHEMA

### Endpoint (Expected)
**POST** `/api/purchases` or `/api/Purchases`

### Request Payload Structure

```typescript
{
  id: string                    // UUID generated on frontend
  supplierId: string            // Actual SUPPLIER ID
  supplierName: string          // Actual SUPPLIER NAME
  items: PurchaseItem[]         // Array of purchase items
  totalAmount: number           // Sum of all item.totalPrice
  createdAt: Date               // ISO 8601 timestamp
  notes?: string                // Optional notes field
}
```

### PurchaseItem Schema

```typescript
{
  id: string                    // UUID for the line item
  productId: string             // ID of the product being purchased
  productName: string           // Name of the product
  baseCostPrice: number         // Cost price per unit (can be edited inline)
  quantity: number              // Quantity being purchased
  totalPrice: number            // baseCostPrice * quantity
  hasGeneric: boolean           // TRUE if batch info added, FALSE otherwise
  batchNumber?: string          // Batch number (if hasGeneric = true)
  manufactureDateValue?: string // ISO date string (if hasGeneric = true)
  expiryDateValue?: string      // ISO date string (if hasGeneric = true)
}
```

### Additional Context Available in Form

```typescript
// Supplier Details (from SupplierAutocomplete)
{
  id: string
  companyName: string
  phoneNumber: string
  emailAddress: string
  address: string
}

// Product Details (available but not all sent in item)
{
  id: string
  name: string
  baseCostPrice: number         // e.g., 100000
  baseWholeSalePrice: number    // e.g., 120000
  baseSellingPrice: number      // e.g., 150000
  stores: {
    [storeName: string]: number // e.g., { 'Front store': 4, 'Back store': 3 }
  }
  inventory: number             // Total across all stores (calculated)
}

// Financial Summary (available on frontend)
{
  totalAmount: number           // Sum of all item.totalPrice
  discount: number              // User-entered discount (not currently applied)
  paidAmount: number            // User-entered paid amount
  returnAmount: number          // Calculated return/balance
}
```

### Example Purchase Transaction Payload (Without Batch Info)

```json
{
  "id": "650e8400-e29b-41d4-a716-446655440001",
  "supplierId": "supp-67890",
  "supplierName": "Premium Pharma Distributors",
  "items": [
    {
      "id": "item-uuid-3",
      "productId": "prod-001",
      "productName": "Paracetamol",
      "baseCostPrice": 100000,
      "quantity": 100,
      "totalPrice": 10000000,
      "hasGeneric": false
    },
    {
      "id": "item-uuid-4",
      "productId": "prod-003",
      "productName": "Aspirin",
      "baseCostPrice": 70000,
      "quantity": 50,
      "totalPrice": 3500000,
      "hasGeneric": false
    }
  ],
  "totalAmount": 13500000,
  "createdAt": "2025-11-29T10:45:00.000Z",
  "notes": "Delivery scheduled for next week"
}
```

### Example Purchase Transaction Payload (With Batch Info)

```json
{
  "id": "750e8400-e29b-41d4-a716-446655440002",
  "supplierId": "supp-67890",
  "supplierName": "Premium Pharma Distributors",
  "items": [
    {
      "id": "item-uuid-5",
      "productId": "prod-001",
      "productName": "Paracetamol",
      "baseCostPrice": 100000,
      "quantity": 100,
      "totalPrice": 10000000,
      "hasGeneric": true,
      "batchNumber": "BATCH-2025-001",
      "manufactureDateValue": "2025-01-15",
      "expiryDateValue": "2027-01-15"
    },
    {
      "id": "item-uuid-6",
      "productId": "prod-003",
      "productName": "Aspirin",
      "baseCostPrice": 70000,
      "quantity": 50,
      "totalPrice": 3500000,
      "hasGeneric": true,
      "batchNumber": "BATCH-2025-002",
      "manufactureDateValue": "2025-02-01",
      "expiryDateValue": "2026-12-31"
    }
  ],
  "totalAmount": 13500000,
  "createdAt": "2025-11-29T10:45:00.000Z",
  "notes": "Delivery scheduled for next week"
}
```

### Important Notes for Purchases
1. **Batch Information**: Purchases CAN have batch/generic details (manufacturer date, expiry date, batch number)
2. **Inline Editing**: Users can edit `baseCostPrice` and `quantity` directly in the table
3. **Price Editable**: Unlike Sales, the cost price can be modified per transaction (different from product's base cost)
4. **Inventory Calculation**: Frontend shows total inventory across all stores (sum of all store quantities)
5. **Generic Info**: When `hasGeneric = true`, expect `batchNumber`, `manufactureDateValue`, `expiryDateValue` fields

---

## 🔄 COMMON PATTERNS

### Date Handling
- All dates are sent as ISO 8601 strings
- `createdAt`: Full timestamp with timezone
- Batch dates: Date-only strings (YYYY-MM-DD)

### ID Generation
- Frontend generates UUIDs using `crypto.randomUUID()`
- All IDs are strings

### Number Format
- All numeric values are sent as raw numbers (no comma formatting)
- Frontend displays with commas but sends raw values
- Examples: 150000 (not "150,000"), 2500000.50 (not "2,500,000.50")

### Field Name Legacy Issue
⚠️ **WARNING**: In Sales transactions, `supplierId` and `supplierName` actually refer to **CUSTOMER** data. This is a legacy naming issue that should be fixed in a future refactor.

---

## 📊 VALIDATION REQUIREMENTS

### Required Fields - Sales
- `id` (auto-generated)
- `supplierId` (customer ID)
- `supplierName` (customer name)
- `items[]` (at least 1 item required)
- `totalAmount`
- `createdAt` (auto-generated)

### Required Fields - Purchases
- `id` (auto-generated)
- `supplierId` (supplier ID)
- `supplierName` (supplier name)
- `items[]` (at least 1 item required)
- `totalAmount`
- `createdAt` (auto-generated)

### Required Fields - Items (Both)
- `id`
- `productId`
- `productName`
- `quantity` (must be > 0)
- `totalPrice`
- `hasGeneric`

### Conditional Fields - Purchase Items
If `hasGeneric = true`:
- `batchNumber` (should be present)
- `manufactureDateValue` (optional but recommended)
- `expiryDateValue` (optional but recommended)

---

## 🛠️ BACKEND IMPLEMENTATION RECOMMENDATIONS

### 1. Database Schema Considerations

**Sales Table:**
```sql
CREATE TABLE sales (
  id UUID PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),  -- Map from supplierId
  customer_name VARCHAR(255),
  total_amount DECIMAL(15, 2),
  discount DECIMAL(15, 2),
  paid_amount DECIMAL(15, 2),
  return_amount DECIMAL(15, 2),
  notes TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE sales_items (
  id UUID PRIMARY KEY,
  sale_id UUID REFERENCES sales(id),
  product_id UUID REFERENCES products(id),
  product_name VARCHAR(255),
  base_price DECIMAL(15, 2),
  quantity DECIMAL(10, 2),
  total_price DECIMAL(15, 2),
  store_id UUID,  -- Track which store item was sold from
  created_at TIMESTAMP
);
```

**Purchases Table:**
```sql
CREATE TABLE purchases (
  id UUID PRIMARY KEY,
  supplier_id UUID REFERENCES suppliers(id),
  supplier_name VARCHAR(255),
  total_amount DECIMAL(15, 2),
  discount DECIMAL(15, 2),
  paid_amount DECIMAL(15, 2),
  return_amount DECIMAL(15, 2),
  notes TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE purchase_items (
  id UUID PRIMARY KEY,
  purchase_id UUID REFERENCES purchases(id),
  product_id UUID REFERENCES products(id),
  product_name VARCHAR(255),
  base_cost_price DECIMAL(15, 2),
  quantity DECIMAL(10, 2),
  total_price DECIMAL(15, 2),
  has_generic BOOLEAN,
  batch_number VARCHAR(100),
  manufacture_date DATE,
  expiry_date DATE,
  created_at TIMESTAMP
);
```

### 2. Business Logic

**On Sales Transaction:**
1. Validate customer exists
2. Validate products exist and have sufficient inventory
3. **Deduct inventory** from the selected store for each item
4. Update customer purchase history
5. Calculate profit margins (basePrice - baseCostPrice)
6. Update financial records

**On Purchase Transaction:**
1. Validate supplier exists
2. Validate products exist
3. **Add inventory** to stores
4. Create batch records if `hasGeneric = true`
5. Update product cost price if different
6. Update supplier transaction history
7. Update financial records

### 3. Inventory Management

**Sales:**
- Deduct from specific store (store selection from frontend)
- Validate available quantity before saving
- Update product inventory across stores

**Purchases:**
- Add to inventory (store should be selected or default)
- Create new batch entries if batch info provided
- Update product base cost if different

### 4. Error Handling

Return appropriate HTTP status codes:
- `201` - Transaction created successfully
- `400` - Validation error (missing fields, invalid data)
- `404` - Customer/Supplier/Product not found
- `409` - Insufficient inventory (for sales)
- `500` - Server error

---

## 📝 ADDITIONAL NOTES

1. **Financial Summary**: Frontend calculates discount, paid amount, and return amount but currently only `totalAmount` is sent. Consider adding these fields to the payload.

2. **Store Tracking**: For sales, the user selects which store to sell from, but this information is not currently in the payload. You may need to add `storeId` to SalesItem.

3. **Price History**: Consider maintaining price history since both sales and purchases allow price modifications at transaction time.

4. **Batch Tracking**: For purchases with batch info, you'll need a separate batch inventory table to track FIFO/FEFO.

5. **Audit Trail**: All transactions include `createdAt`. Consider adding `updatedAt`, `createdBy`, `updatedBy` for audit purposes.

---

## 🔗 RELATED ENDPOINTS NEEDED

```
GET    /api/customers/:id          - Get customer details
GET    /api/customers?keywords=    - Search customers
GET    /api/suppliers/:id          - Get supplier details  
GET    /api/suppliers?keywords=    - Search suppliers
GET    /api/products/:id           - Get product details
GET    /api/products?keywords=     - Search products
POST   /api/sales                  - Create sale transaction
POST   /api/purchases              - Create purchase transaction
GET    /api/sales/:id              - Get sale details (for editing)
GET    /api/purchases/:id          - Get purchase details (for editing)
PUT    /api/sales/:id              - Update sale transaction
PUT    /api/purchases/:id          - Update purchase transaction
```

---

**Document Version**: 1.0  
**Last Updated**: November 29, 2025  
**Frontend Version**: IMS 2.0
