# Credit Note and Debit Note Implementation Guide

## What Has Been Created

### 1. Database Models ✅

**Credit Note Models** (`Models/CreditNoteX/CreditNote.cs`):
- `CreditNote` - Main credit note entity
- `CreditNoteItem` - Line items for credit notes
- `CreditNoteReason` enum - Reasons for credit (ReturnedGoods, Overcharge, Discount, etc.)
- `CreditNoteStatus` enum - Status workflow (Pending, Applied, Cancelled, Refunded)
- DTOs for API operations

**Debit Note Models** (`Models/DebitNoteX/DebitNote.cs`):
- `DebitNote` - Main debit note entity
- `DebitNoteItem` - Line items for debit notes
- `DebitNoteReason` enum - Reasons for debit (ReturnedGoods, Undercharge, AdditionalCharge, etc.)
- `DebitNoteStatus` enum - Status workflow (Pending, Applied, Cancelled, Paid)
- DTOs for API operations

### 2. Database Context Updated ✅

**DBContext.cs** has been updated with:
- `DbSet<CreditNote>` and `DbSet<CreditNoteItem>`
- `DbSet<DebitNote>` and `DbSet<DebitNoteItem>`
- Query filters for soft delete
- Timestamp updates in `UpdateTimestamps()`

## What Needs to Be Done Next

### Step 1: Create Database Migration

Run the following command to create and apply the migration:

```bash
dotnet ef migrations add AddCreditDebitNotes --project IMS2.0/backend/ImsServer
dotnet ef database update --project IMS2.0/backend/ImsServer
```

### Step 2: Create Controllers

#### CreditNotesController.cs

**Endpoints to implement**:

1. **GET /api/CreditNotes**
   - List all credit notes with filters (customer, date range, status)
   - Pagination support

2. **GET /api/CreditNotes/{id}**
   - Get single credit note with details

3. **POST /api/CreditNotes**
   - Create new credit note
   - Auto-generate credit note number
   - Optionally apply to customer balance immediately

4. **POST /api/CreditNotes/{id}/Apply**
   - Apply credit note to customer balance
   - Update related sale's outstanding amount (if linked)
   - Update financial account balance

5. **PUT /api/CreditNotes/{id}**
   - Update credit note (if not applied)

6. **DELETE /api/CreditNotes/{id}**
   - Soft delete credit note (if not applied)

7. **POST /api/CreditNotes/{id}/Refund**
   - Mark credit note as refunded
   - Update financial account

#### DebitNotesController.cs

**Endpoints to implement**:

1. **GET /api/DebitNotes**
   - List all debit notes with filters (supplier, date range, status)
   - Pagination support

2. **GET /api/DebitNotes/{id}**
   - Get single debit note with details

3. **POST /api/DebitNotes**
   - Create new debit note
   - Auto-generate debit note number
   - Optionally apply to supplier balance immediately

4. **POST /api/DebitNotes/{id}/Apply**
   - Apply debit note to supplier balance
   - Update related purchase's outstanding amount (if linked)
   - Update financial account balance

5. **PUT /api/DebitNotes/{id}**
   - Update debit note (if not applied)

6. **DELETE /api/DebitNotes/{id}**
   - Soft delete debit note (if not applied)

7. **POST /api/DebitNotes/{id}/Pay**
   - Mark debit note as paid
   - Update financial account

### Step 3: Auto-Generate Note Numbers

**Credit Note Number Format**: `CN-YYYY-XXX`
- Example: `CN-2024-001`, `CN-2024-002`
- Sequential per year

**Debit Note Number Format**: `DN-YYYY-XXX`
- Example: `DN-2024-001`, `DN-2024-002`
- Sequential per year

**Implementation**:
```csharp
private async Task<string> GenerateCreditNoteNumber()
{
    var year = DateTime.Now.Year;
    var lastNote = await _db.CreditNotes
        .Where(cn => cn.CreditNoteNumber.StartsWith($"CN-{year}-"))
        .OrderByDescending(cn => cn.CreditNoteNumber)
        .FirstOrDefaultAsync();
    
    int nextNumber = 1;
    if (lastNote != null)
    {
        var parts = lastNote.CreditNoteNumber.Split('-');
        if (parts.Length == 3 && int.TryParse(parts[2], out int lastNum))
        {
            nextNumber = lastNum + 1;
        }
    }
    
    return $"CN-{year}-{nextNumber:D3}";
}
```

### Step 4: Balance Adjustment Logic

**When Applying Credit Note**:
1. Find all sales for the customer with outstanding amounts
2. Reduce outstanding amounts (FIFO or as specified)
3. Update customer's total receivables
4. Update financial account balance (decrease)
5. Create transaction record

**When Applying Debit Note**:
1. Find all purchases for the supplier with outstanding amounts
2. Increase outstanding amounts (or create new payable)
3. Update supplier's total payables
4. Update financial account balance (if applicable)
5. Create transaction record

### Step 5: Frontend Implementation

**Pages to Create**:
1. `/CreditNotes` - List and manage credit notes
2. `/DebitNotes` - List and manage debit notes
3. `/CreditNotes/Create` - Create credit note form
4. `/DebitNotes/Create` - Create debit note form

**Components to Create**:
1. `CreditNoteDialog` - Create/edit credit note
2. `DebitNoteDialog` - Create/edit debit note
3. `CreditNoteItemForm` - Add items to credit note
4. `DebitNoteItemForm` - Add items to debit note

**Integration Points**:
- Add "Create Credit Note" button in Receivables page
- Add "Create Debit Note" button in Payables page
- Show credit/debit notes in customer/supplier detail views

## Key Implementation Details

### Credit Note Application Logic

```csharp
// Pseudo-code for applying credit note
1. Validate credit note exists and is not already applied
2. Get customer's outstanding sales (ordered by date)
3. Apply credit amount to sales (FIFO or as specified)
4. Update each sale's OutstandingAmount
5. Update customer's total receivables
6. Update financial account balance
7. Mark credit note as Applied
8. Create audit trail
```

### Debit Note Application Logic

```csharp
// Pseudo-code for applying debit note
1. Validate debit note exists and is not already applied
2. Get supplier's outstanding purchases (ordered by date)
3. Apply debit amount to purchases (or create new payable)
4. Update each purchase's OutstandingAmount
5. Update supplier's total payables
6. Update financial account balance (if applicable)
7. Mark debit note as Applied
8. Create audit trail
```

## Database Relationships

### CreditNote Relationships
- `SaleId` → `Sale` (optional, nullable)
- `CustomerId` → `Customer` (required)
- `ProcessedById` → `User` (required)
- `LinkedFinancialAccountId` → `FinancialAccount` (optional)
- `CreditNoteItems` → Collection of `CreditNoteItem`

### DebitNote Relationships
- `PurchaseId` → `Purchase` (optional, nullable)
- `SupplierId` → `Supplier` (required)
- `ProcessedById` → `User` (required)
- `LinkedFinancialAccountId` → `FinancialAccount` (optional)
- `DebitNoteItems` → Collection of `DebitNoteItem`

## Testing Checklist

- [ ] Create credit note without linking to sale
- [ ] Create credit note linked to sale
- [ ] Apply credit note to customer balance
- [ ] Verify customer's outstanding balance is reduced
- [ ] Verify linked sale's outstanding is reduced (if applicable)
- [ ] Create debit note without linking to purchase
- [ ] Create debit note linked to purchase
- [ ] Apply debit note to supplier balance
- [ ] Verify supplier's outstanding balance is increased
- [ ] Verify linked purchase's outstanding is increased (if applicable)
- [ ] Test soft delete
- [ ] Test status transitions
- [ ] Test number generation
- [ ] Test with multiple items
- [ ] Test with tax amounts

## Migration Command

After creating the models, run:

```bash
cd IMS2.0/backend/ImsServer
dotnet ef migrations add AddCreditDebitNotes
dotnet ef database update
```

This will create the database tables for CreditNotes, CreditNoteItems, DebitNotes, and DebitNoteItems.

## Summary

The foundation for Credit Note and Debit Note functionality has been created:

✅ **Models Created**: CreditNote, CreditNoteItem, DebitNote, DebitNoteItem
✅ **DBContext Updated**: Added DbSets and query filters
✅ **Documentation**: Design and implementation guides

**Next Steps**:
1. Run database migration
2. Create controllers with CRUD operations
3. Implement balance adjustment logic
4. Create frontend pages and components
5. Test thoroughly

The models are ready for use and follow the same patterns as your existing Sale and Purchase models.

