# Credit Note and Debit Note Controllers - Implementation Summary

## ✅ Controllers Created

### 1. CreditNotesController.cs

**Location**: `IMS2.0/backend/ImsServer/Controllers/CreditNotesController.cs`

**Endpoints Implemented**:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/CreditNotes` | List all credit notes with filters and pagination |
| GET | `/api/CreditNotes/{id}` | Get single credit note with details |
| POST | `/api/CreditNotes` | Create new credit note |
| POST | `/api/CreditNotes/{id}/Apply` | Apply credit note to customer balance |
| POST | `/api/CreditNotes/{id}/Refund` | Mark credit note as refunded |
| PUT | `/api/CreditNotes/{id}` | Update credit note (if not applied) |
| DELETE | `/api/CreditNotes/{id}` | Soft delete credit note (if not applied) |
| POST | `/api/CreditNotes/{id}/Cancel` | Cancel credit note |

**Features**:
- ✅ Auto-generates credit note numbers (CN-YYYY-XXX format)
- ✅ Supports linking to original sales
- ✅ Applies credit to customer balances (FIFO - oldest sales first)
- ✅ Updates financial account balances
- ✅ Transaction-based operations for data integrity
- ✅ Comprehensive filtering and pagination
- ✅ Metadata support for reporting

### 2. DebitNotesController.cs

**Location**: `IMS2.0/backend/ImsServer/Controllers/DebitNotesController.cs`

**Endpoints Implemented**:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/DebitNotes` | List all debit notes with filters and pagination |
| GET | `/api/DebitNotes/{id}` | Get single debit note with details |
| POST | `/api/DebitNotes` | Create new debit note |
| POST | `/api/DebitNotes/{id}/Apply` | Apply debit note to supplier balance |
| POST | `/api/DebitNotes/{id}/Pay` | Mark debit note as paid |
| PUT | `/api/DebitNotes/{id}` | Update debit note (if not applied) |
| DELETE | `/api/DebitNotes/{id}` | Soft delete debit note (if not applied) |
| POST | `/api/DebitNotes/{id}/Cancel` | Cancel debit note |

**Features**:
- ✅ Auto-generates debit note numbers (DN-YYYY-XXX format)
- ✅ Supports linking to original purchases
- ✅ Applies debit to supplier balances
- ✅ Creates purchase records for standalone debit notes
- ✅ Updates financial account balances
- ✅ Transaction-based operations for data integrity
- ✅ Comprehensive filtering and pagination
- ✅ Metadata support for reporting

## Key Implementation Details

### Auto-Generated Note Numbers

**Credit Notes**: `CN-YYYY-XXX`
- Example: `CN-2024-001`, `CN-2024-002`
- Sequential per year
- Resets each year

**Debit Notes**: `DN-YYYY-XXX`
- Example: `DN-2024-001`, `DN-2024-002`
- Sequential per year
- Resets each year

### Balance Adjustment Logic

#### Credit Note Application
1. If linked to a specific sale, applies credit to that sale first
2. Remaining credit is applied to customer's oldest outstanding sales (FIFO)
3. Updates each sale's `OutstandingAmount` and `PaidAmount`
4. Updates sale's `IsPaid` status if fully paid
5. Updates linked financial account balance (decreases)
6. Marks credit note as `Applied`

#### Debit Note Application
1. If linked to a specific purchase, increases that purchase's outstanding amount
2. If standalone, applies to oldest outstanding purchase or creates new purchase record
3. Updates purchase's `OutstandingAmount`, `GrandTotal`, `TotalAmount`, and `Tax`
4. Updates purchase's `IsPaid` and `WasPartialPayment` status
5. Marks debit note as `Applied`
6. Financial account balance is updated when debit note is paid (not on application)

### Query Filters

**Credit Notes**:
- `customerId` - Filter by customer
- `saleId` - Filter by linked sale
- `startDate` / `endDate` - Date range filter
- `status` - Filter by status (Pending, Applied, Cancelled, Refunded)
- `reason` - Filter by reason (ReturnedGoods, Overcharge, Discount, etc.)
- `minAmount` / `maxAmount` - Amount range filter
- `includeMetadata` - Include summary statistics
- `page` / `pageSize` - Pagination

**Debit Notes**:
- `supplierId` - Filter by supplier
- `purchaseId` - Filter by linked purchase
- `startDate` / `endDate` - Date range filter
- `status` - Filter by status (Pending, Applied, Cancelled, Paid)
- `reason` - Filter by reason (ReturnedGoods, Undercharge, AdditionalCharge, etc.)
- `minAmount` / `maxAmount` - Amount range filter
- `includeMetadata` - Include summary statistics
- `page` / `pageSize` - Pagination

### Status Workflow

**Credit Notes**:
- `Pending` → `Applied` → `Refunded`
- Can be `Cancelled` from `Pending` status

**Debit Notes**:
- `Pending` → `Applied` → `Paid`
- Can be `Cancelled` from `Pending` status

### Validation Rules

**Credit Notes**:
- Cannot update/delete if already applied
- Cannot apply if already applied
- Cannot apply if cancelled
- Must be applied before refunding

**Debit Notes**:
- Cannot update/delete if already applied
- Cannot apply if already applied
- Cannot apply if cancelled
- Must be applied before paying

## Example API Calls

### Create Credit Note

```http
POST /api/CreditNotes
Content-Type: application/json

{
  "customerId": "guid-here",
  "processedById": "guid-here",
  "saleId": "guid-here", // optional
  "creditNoteDate": "2024-01-15T00:00:00Z",
  "totalAmount": 500.00,
  "taxAmount": 0,
  "subTotal": 500.00,
  "reason": 0, // ReturnedGoods
  "description": "Customer returned 2 items",
  "notes": "Items were damaged",
  "applyToBalance": true,
  "items": [
    {
      "productName": "Product A",
      "quantity": 2,
      "unitPrice": 250.00,
      "totalPrice": 500.00
    }
  ]
}
```

### Apply Credit Note

```http
POST /api/CreditNotes/{id}/Apply
Content-Type: application/json

{
  "saleId": "guid-here" // optional - apply to specific sale
}
```

### Create Debit Note

```http
POST /api/DebitNotes
Content-Type: application/json

{
  "supplierId": "guid-here",
  "processedById": "guid-here",
  "purchaseId": "guid-here", // optional
  "debitNoteDate": "2024-01-15T00:00:00Z",
  "totalAmount": 300.00,
  "taxAmount": 0,
  "subTotal": 300.00,
  "reason": 1, // Undercharge
  "description": "Supplier undercharged by $300",
  "notes": "Price adjustment",
  "applyToBalance": true,
  "items": [
    {
      "description": "Price adjustment",
      "quantity": 1,
      "unitPrice": 300.00,
      "totalPrice": 300.00
    }
  ]
}
```

## Next Steps

1. ✅ **Models Created** - CreditNote, CreditNoteItem, DebitNote, DebitNoteItem
2. ✅ **DBContext Updated** - Added DbSets and query filters
3. ✅ **Controllers Created** - Full CRUD operations with balance adjustment
4. ⏳ **Database Migration** - Run migration to create tables
5. ⏳ **Frontend Implementation** - Create UI pages and components
6. ⏳ **Testing** - Test all endpoints and workflows

## Database Migration

Run the following commands to create the database tables:

```bash
cd IMS2.0/backend/ImsServer
dotnet ef migrations add AddCreditDebitNotes
dotnet ef database update
```

## Testing Checklist

- [ ] Create credit note without linking to sale
- [ ] Create credit note linked to sale
- [ ] Apply credit note to customer balance
- [ ] Verify customer's outstanding balance is reduced
- [ ] Verify linked sale's outstanding is reduced
- [ ] Create debit note without linking to purchase
- [ ] Create debit note linked to purchase
- [ ] Apply debit note to supplier balance
- [ ] Verify supplier's outstanding balance is increased
- [ ] Verify linked purchase's outstanding is increased
- [ ] Test soft delete
- [ ] Test status transitions
- [ ] Test number generation
- [ ] Test with multiple items
- [ ] Test with tax amounts
- [ ] Test pagination and filters
- [ ] Test metadata endpoints

## Notes

- All operations use database transactions for data integrity
- Credit notes reduce customer receivables
- Debit notes increase supplier payables
- Financial account balances are updated appropriately
- All timestamps and user tracking are handled automatically by DBContext
- Soft delete is supported for all entities

