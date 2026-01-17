# Credit Note and Debit Note Functionality Design

## Overview

This document outlines the design and implementation of Credit Note and Debit Note functionality in the IMS system. These features allow you to handle adjustments, returns, and corrections for both customer sales and supplier purchases.

## What Are Credit Notes and Debit Notes?

### Credit Note
A **Credit Note** is issued to a **customer** when:
- Goods are returned by the customer
- Customer was overcharged
- Post-sale discount or adjustment is needed
- Goods were damaged on delivery
- Wrong items were delivered
- Order cancellation
- Warranty claims

**Effect**: Reduces the customer's outstanding balance (receivables)

### Debit Note
A **Debit Note** is issued to a **supplier** when:
- Goods are returned to the supplier
- Supplier undercharged
- Additional charges need to be added (freight, handling, etc.)
- Goods were damaged on receipt
- Wrong items were received
- Price adjustments/corrections
- Short delivery compensation

**Effect**: Increases the supplier's outstanding balance (payables)

## Database Models

### CreditNote Model

**Location**: `IMS2.0/backend/ImsServer/Models/CreditNoteX/CreditNote.cs`

**Key Fields**:
- `Id` - Unique identifier
- `CreditNoteNumber` - Auto-generated number (e.g., "CN-2024-001")
- `CreditNoteDate` - Date of credit note
- `SaleId` - Optional reference to original sale
- `CustomerId` - Customer receiving the credit
- `ProcessedById` - User who created the credit note
- `TotalAmount` - Total credit amount
- `TaxAmount` - Tax/VAT amount
- `SubTotal` - Subtotal before tax
- `Reason` - Reason for credit (enum: ReturnedGoods, Overcharge, Discount, etc.)
- `Status` - Status (Pending, Applied, Cancelled, Refunded)
- `IsApplied` - Whether credit has been applied to customer balance
- `CreditNoteItems` - Collection of line items

### DebitNote Model

**Location**: `IMS2.0/backend/ImsServer/Models/DebitNoteX/DebitNote.cs`

**Key Fields**:
- `Id` - Unique identifier
- `DebitNoteNumber` - Auto-generated number (e.g., "DN-2024-001")
- `DebitNoteDate` - Date of debit note
- `PurchaseId` - Optional reference to original purchase
- `SupplierId` - Supplier receiving the debit
- `ProcessedById` - User who created the debit note
- `TotalAmount` - Total debit amount
- `TaxAmount` - Tax/VAT amount
- `SubTotal` - Subtotal before tax
- `Reason` - Reason for debit (enum: ReturnedGoods, Undercharge, AdditionalCharge, etc.)
- `Status` - Status (Pending, Applied, Cancelled, Paid)
- `IsApplied` - Whether debit has been applied to supplier balance
- `DebitNoteItems` - Collection of line items

## Design Decisions

### 1. Separate Models for Credit and Debit Notes
- **Rationale**: Different business logic, relationships, and workflows
- **Benefits**: Clear separation, easier to maintain, type-safe

### 2. Optional Link to Original Sale/Purchase
- **Rationale**: Credit/Debit notes can be standalone adjustments or linked to specific transactions
- **Benefits**: Flexibility to handle both scenarios

### 3. Status-Based Workflow
- **Pending**: Created but not applied
- **Applied**: Applied to customer/supplier balance
- **Cancelled**: Voided/cancelled
- **Refunded/Paid**: Money has been refunded/paid

### 4. Line Items Support
- **Rationale**: Credit/Debit notes can have multiple items (like sales/purchases)
- **Benefits**: Detailed tracking, supports partial returns/adjustments

### 5. Apply to Balance Flag
- **Rationale**: Some credit/debit notes may need approval before applying
- **Benefits**: Workflow control, audit trail

## How It Works

### Credit Note Flow

1. **Create Credit Note**
   - Link to sale (optional) or create standalone
   - Add line items (products, quantities, amounts)
   - Set reason and description
   - Status: Pending

2. **Apply Credit Note**
   - Reduces customer's outstanding balance
   - Updates related sale's outstanding amount (if linked)
   - Updates financial account balance
   - Status: Applied

3. **Refund Credit Note** (Optional)
   - If credit is refunded in cash
   - Updates financial account
   - Status: Refunded

### Debit Note Flow

1. **Create Debit Note**
   - Link to purchase (optional) or create standalone
   - Add line items (products, quantities, amounts)
   - Set reason and description
   - Status: Pending

2. **Apply Debit Note**
   - Increases supplier's outstanding balance
   - Updates related purchase's outstanding amount (if linked)
   - Updates financial account balance
   - Status: Applied

3. **Pay Debit Note** (Optional)
   - If debit is paid to supplier
   - Updates financial account
   - Status: Paid

## Integration Points

### With Sales (Receivables)
- Credit notes reduce customer outstanding balances
- Can be linked to specific sales
- Affects receivables reporting

### With Purchases (Payables)
- Debit notes increase supplier outstanding balances
- Can be linked to specific purchases
- Affects payables reporting

### With Financial Accounts
- Credit notes: Reduce account balance (money going out)
- Debit notes: Increase account balance (money coming in, but increases payables)

### With Tax Records
- Credit notes may reduce VAT/tax obligations
- Debit notes may increase VAT/tax obligations
- Integration with TaxRecord model (future enhancement)

## Next Steps for Implementation

### 1. Create Controllers
- `CreditNotesController.cs` - CRUD operations for credit notes
- `DebitNotesController.cs` - CRUD operations for debit notes
- Endpoints:
  - `POST /api/CreditNotes` - Create credit note
  - `POST /api/CreditNotes/{id}/Apply` - Apply credit note to balance
  - `GET /api/CreditNotes` - List credit notes
  - Similar for DebitNotes

### 2. Auto-Generate Note Numbers
- Format: `CN-YYYY-XXX` for credit notes
- Format: `DN-YYYY-XXX` for debit notes
- Sequential numbering per year

### 3. Balance Adjustment Logic
- When applying credit note: Reduce customer's total outstanding
- When applying debit note: Increase supplier's total outstanding
- Update related sale/purchase if linked

### 4. Frontend Implementation
- Credit Note management page
- Debit Note management page
- Integration with Receivables/Payables pages
- Create credit/debit note dialogs

### 5. Reporting Integration
- Include credit notes in receivables reports
- Include debit notes in payables reports
- Track credit/debit note history

## Example Use Cases

### Use Case 1: Customer Returns Goods
1. Customer returns 2 items from Sale #123
2. Create Credit Note linked to Sale #123
3. Add 2 items to credit note
4. Apply credit note → Reduces customer's outstanding balance
5. Stock is returned (handled separately via refund or stock adjustment)

### Use Case 2: Supplier Undercharged
1. Supplier invoice shows $1000, should be $1200
2. Create Debit Note linked to Purchase #456
3. Add adjustment item for $200
4. Apply debit note → Increases supplier's outstanding balance

### Use Case 3: Post-Sale Discount
1. Customer negotiated discount after sale
2. Create Credit Note (not linked to sale, or linked for reference)
3. Add discount amount
4. Apply credit note → Reduces customer's outstanding balance

## Database Schema

### CreditNotes Table
```
- Id (Guid, PK)
- CreditNoteNumber (string)
- CreditNoteDate (DateTime)
- SaleId (Guid?, FK to Sales)
- CustomerId (Guid, FK to Customers)
- ProcessedById (Guid, FK to Users)
- TotalAmount (decimal)
- TaxAmount (decimal)
- SubTotal (decimal)
- Reason (int/enum)
- Description (string?)
- Notes (string?)
- Status (int/enum)
- IsApplied (bool)
- LinkedFinancialAccountId (Guid?, FK to FinancialAccounts)
- AddedAt, AddedBy, UpdatedAt, LastUpdatedBy, DeletedAt (GeneralFields)
```

### CreditNoteItems Table
```
- Id (Guid, PK)
- CreditNoteId (Guid, FK to CreditNotes)
- ProductVariationId (Guid?, FK to ProductVariations)
- ProductName (string?)
- Description (string?)
- Quantity (decimal)
- UnitPrice (decimal)
- TotalPrice (decimal)
- TaxAmount (decimal?)
- SaleItemId (Guid?, FK to SalesItems)
- AddedAt, AddedBy, UpdatedAt, LastUpdatedBy, DeletedAt (GeneralFields)
```

Similar structure for DebitNotes and DebitNoteItems.

## Best Practices

1. **Always Link When Possible**: Link credit/debit notes to original sales/purchases for better traceability
2. **Clear Descriptions**: Always provide clear reason and description
3. **Approval Workflow**: Consider adding approval workflow for large amounts
4. **Audit Trail**: All credit/debit notes are tracked with timestamps and user info
5. **Number Generation**: Use sequential numbering for easy reference
6. **Status Management**: Properly manage status transitions (Pending → Applied → Refunded/Paid)

## Future Enhancements

- Email credit/debit notes to customers/suppliers
- Print credit/debit note documents
- Bulk credit/debit note creation
- Credit/debit note templates
- Integration with accounting software
- Credit/debit note approval workflow
- Automatic stock adjustment on returns

