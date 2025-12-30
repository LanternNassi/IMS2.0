# Quick Start: Importing Customers with Existing Debts

## Overview
This guide helps you import customers with existing balances/debts from your old system into IMS.

## Step 1: Prepare Your Excel File

### Required Columns (Minimum)
Your Excel file **must** include these columns:

1. **CustomerName** - Customer's full name
2. **CustomerType** - Type (e.g., "Retail", "Wholesale", "Corporate")
3. **SaleDate** - Date of the debt transaction (YYYY-MM-DD format)
4. **TotalAmount** - Total amount of the sale/debt
5. **PaidAmount** - Amount already paid
6. **OutstandingAmount** - Current balance owed

### Optional Columns (Recommended)
- **Address** - Customer address
- **Phone** - Phone number
- **Email** - Email address
- **AccountNumber** - Account reference
- **Discount** - Discount amount (default: 0)
- **PaymentMethod** - Payment method (CASH, MOBILE_MONEY, BANK_TRANSFER, CREDIT)
- **Notes** - Additional notes

## Step 2: Data Format Requirements

### Customer Information
- **CustomerName**: Text (required)
- **CustomerType**: Text (required) - Common values: "Retail", "Wholesale", "Corporate"
- **Address**: Text (optional)
- **Phone**: Text (optional) - Format: "+256700123456"
- **Email**: Text (optional) - Valid email format
- **AccountNumber**: Text (optional)

### Financial Information
- **SaleDate**: Date (required) - Format: YYYY-MM-DD or DD/MM/YYYY
- **TotalAmount**: Number (required) - No currency symbols, e.g., 50000.00
- **PaidAmount**: Number (required) - Amount already collected
- **OutstandingAmount**: Number (required) - Current balance
- **Discount**: Number (optional) - Default: 0

### Important Calculations
```
TotalAmount = PaidAmount + OutstandingAmount
```

If your data doesn't match this exactly, the system will calculate:
```
OutstandingAmount = TotalAmount - PaidAmount
```

## Step 3: Sample Data

### Minimal Example
```
CustomerName | CustomerType | SaleDate    | TotalAmount | PaidAmount | OutstandingAmount
John Doe     | Retail       | 2024-01-15  | 50000       | 15000      | 35000
```

### Complete Example
```
CustomerName      | CustomerType | SaleDate    | TotalAmount | PaidAmount | OutstandingAmount | Address              | Phone          | PaymentMethod | Notes
John Doe          | Retail       | 2024-01-15  | 50000       | 15000      | 35000             | 123 Main St, Kampala | +256700123456  | CREDIT        | Initial balance
Jane Smith        | Wholesale    | 2024-02-20  | 100000      | 0          | 100000            | 456 Market Rd        | +256701234567  | CREDIT        | Unpaid invoice
ABC Corporation   | Corporate    | 2024-03-10  | 250000      | 100000     | 150000            | 789 Business Ave     | +256702345678  | CREDIT        | Partial payment
```

## Step 4: Column Header Names

The system recognizes these column names (case-insensitive):

| Field | Recognized Column Names |
|-------|-------------------------|
| Customer Name | `CustomerName`, `name`, `customer name`, `customer_name` |
| Customer Type | `CustomerType`, `customer type`, `customer_type`, `type` |
| Sale Date | `SaleDate`, `sale date`, `sale_date`, `date`, `transaction date` |
| Total Amount | `TotalAmount`, `total amount`, `total_amount`, `amount`, `invoice amount` |
| Paid Amount | `PaidAmount`, `paid amount`, `paid_amount`, `amount paid` |
| Outstanding Amount | `OutstandingAmount`, `outstanding amount`, `outstanding_amount`, `balance`, `debt` |
| Address | `Address`, `address`, `customer address`, `location` |
| Phone | `Phone`, `phone`, `phone number`, `phone_number`, `mobile` |
| Email | `Email`, `email`, `email address`, `e-mail` |
| Account Number | `AccountNumber`, `account number`, `account_number`, `account` |
| Discount | `Discount`, `discount`, `discount amount`, `discount_amount` |
| Payment Method | `PaymentMethod`, `payment method`, `payment_method`, `method` |
| Notes | `Notes`, `notes`, `note`, `description`, `remarks`, `comments` |

## Step 5: Payment Method Values

When specifying PaymentMethod, use one of these values:
- `CASH` - Cash payment
- `MOBILE_MONEY` - Mobile money
- `BANK_TRANSFER` - Bank transfer
- `CREDIT` - Credit/debt (default if not specified)
- `CARD` - Card payment
- `CHEQUE` - Cheque payment

## Step 6: Data Preparation Checklist

Before importing, ensure:

- [ ] All required columns are present
- [ ] Customer names are clean (no extra spaces)
- [ ] Amounts are numeric (no currency symbols like $, Shs, commas)
- [ ] Dates are in valid format (YYYY-MM-DD recommended)
- [ ] TotalAmount = PaidAmount + OutstandingAmount (or close)
- [ ] CustomerType values are consistent
- [ ] Phone numbers are in standard format
- [ ] Email addresses are valid (if provided)

## Step 7: Import Process

1. **Open the Import Dialog**
   - Navigate to the Receivables page
   - Click the "Import" button (if available)
   - Or use the Excel Import feature

2. **Select Your File**
   - Choose your prepared Excel file (.xlsx or .xls)
   - The system will parse and preview the data

3. **Review Preview**
   - Check that all columns are mapped correctly
   - Verify sample data looks correct
   - Fix any mapping issues if needed

4. **Import Data**
   - Click "Import" to process all records
   - Wait for the import to complete
   - Review any error messages

5. **Verify Results**
   - Check the Receivables page for imported debts
   - Verify customer information
   - Confirm outstanding amounts are correct

## Common Issues & Solutions

### Issue: "Required column not found"
**Solution**: Check that your column headers match one of the recognized names listed above. Column names are case-insensitive but must match exactly (spaces and underscores matter).

### Issue: "Invalid date format"
**Solution**: Use YYYY-MM-DD format (e.g., 2024-01-15) or ensure dates are in a standard Excel date format.

### Issue: "Amount validation failed"
**Solution**: 
- Remove currency symbols ($, Shs, etc.)
- Remove commas from numbers
- Ensure amounts are numeric values only
- Check that TotalAmount = PaidAmount + OutstandingAmount

### Issue: "Customer not found"
**Solution**: This is normal! New customers will be created automatically. Ensure CustomerName is provided.

### Issue: Duplicate customers created
**Solution**: 
- Use consistent customer names (exact match, case-insensitive)
- Consider using AccountNumber for unique identification
- Review and merge duplicates after import if needed

## Tips for Success

1. **Start Small**: Test with 5-10 records first
2. **Backup First**: Always backup your database before large imports
3. **Use Account Numbers**: If your old system had unique customer IDs, include them in AccountNumber
4. **Add Notes**: Use the Notes column to track the source (e.g., "Migrated from System X on 2024-01-15")
5. **Verify Calculations**: Double-check that your amounts add up correctly
6. **Clean Data**: Remove duplicates and fix formatting issues before importing

## Next Steps After Import

1. **Review Receivables**: Check the Receivables page to see all imported debts
2. **Verify Customers**: Review the Customers page to ensure customer information is correct
3. **Test Payment Recording**: Try recording a payment to ensure the debt tracking works
4. **Generate Reports**: Use the reporting features to analyze your receivables

## Need Help?

Refer to the detailed documentation: `CUSTOMER_DEBT_IMPORT_TEMPLATE.md`

For technical support, contact your system administrator.

