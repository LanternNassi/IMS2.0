# Quick Start: Importing Suppliers with Existing Payables

## Overview
This guide helps you import suppliers with existing balances/debts (payables) from your old system into IMS.

## Step 1: Prepare Your Excel File

### Required Columns (Minimum)
Your Excel file **must** include these columns:

1. **SupplierName** - Supplier's company name
2. **PurchaseDate** - Date of the payable transaction (YYYY-MM-DD format)
3. **GrandTotal** - Total amount including tax
4. **PaidAmount** - Amount already paid
5. **OutstandingAmount** - Current balance owed

### Optional Columns (Recommended)
- **TotalAmount** - Subtotal before tax
- **Tax** - Tax/VAT amount
- **PurchaseNumber** - Purchase order/invoice number
- **ContactPerson** - Contact person name
- **EmailAddress** - Email address
- **PhoneNumber** - Phone number
- **Address** - Supplier address
- **TIN** - Tax Identification Number
- **Notes** - Additional notes

## Step 2: Data Format Requirements

### Supplier Information
- **SupplierName**: Text (required)
- **ContactPerson**: Text (optional)
- **EmailAddress**: Text (optional) - Valid email format
- **PhoneNumber**: Text (optional) - Format: "+256700123456"
- **Address**: Text (optional)
- **TIN**: Text (optional)

### Financial Information
- **PurchaseDate**: Date (required) - Format: YYYY-MM-DD or DD/MM/YYYY
- **GrandTotal**: Number (required) - No currency symbols, e.g., 500000.00
- **TotalAmount**: Number (optional) - Subtotal before tax
- **Tax**: Number (optional) - Tax/VAT amount (default: 0)
- **PaidAmount**: Number (required) - Amount already paid
- **OutstandingAmount**: Number (required) - Current balance

### Important Calculations
```
GrandTotal = TotalAmount + Tax (if both provided)
GrandTotal = PaidAmount + OutstandingAmount
```

If your data doesn't match this exactly, the system will calculate:
```
OutstandingAmount = GrandTotal - PaidAmount
```

## Step 3: Sample Data

### Minimal Example
```
SupplierName | PurchaseDate | GrandTotal | PaidAmount | OutstandingAmount
ABC Suppliers Ltd | 2024-01-15 | 500000 | 200000 | 300000
```

### Complete Example
```
SupplierName | PurchaseDate | GrandTotal | TotalAmount | Tax | PaidAmount | OutstandingAmount | PurchaseNumber | ContactPerson | PhoneNumber | Address | Notes
ABC Suppliers Ltd | 2024-01-15 | 500000 | 450000 | 50000 | 200000 | 300000 | PO-001 | John Manager | +256700123456 | 123 Industrial Road | Initial balance
XYZ Trading | 2024-02-20 | 1000000 | 900000 | 100000 | 0 | 1000000 | PO-002 | Jane Director | +256701234567 | 456 Business Park | Unpaid invoice
```

## Step 4: Column Header Names

The system recognizes these column names (case-insensitive):

| Field | Recognized Column Names |
|-------|-------------------------|
| Supplier Name | `SupplierName`, `suppliername`, `supplier name`, `supplier_name`, `companyname`, `company name` |
| Purchase Date | `PurchaseDate`, `purchasedate`, `purchase date`, `purchase_date`, `date`, `transaction date` |
| Grand Total | `GrandTotal`, `grandtotal`, `grand total`, `grand_total`, `total`, `amount`, `invoice amount` |
| Total Amount | `TotalAmount`, `totalamount`, `total amount`, `total_amount`, `subtotal` |
| Tax | `Tax`, `tax`, `vat`, `tax amount`, `tax_amount` |
| Paid Amount | `PaidAmount`, `paidamount`, `paid amount`, `paid_amount`, `amount paid` |
| Outstanding Amount | `OutstandingAmount`, `outstandingamount`, `outstanding amount`, `outstanding_amount`, `balance`, `debt` |
| Purchase Number | `PurchaseNumber`, `purchasenumber`, `purchase number`, `purchase_number`, `invoice number`, `invoice` |
| Contact Person | `ContactPerson`, `contactperson`, `contact person`, `contact_person`, `contact` |
| Email Address | `EmailAddress`, `emailaddress`, `email address`, `email_address`, `email`, `e-mail` |
| Phone Number | `PhoneNumber`, `phonenumber`, `phone number`, `phone_number`, `phone`, `mobile` |
| Address | `Address`, `address`, `supplier address`, `location` |
| TIN | `TIN`, `tin`, `tax id`, `tax_id`, `tax identification number` |
| Notes | `Notes`, `notes`, `note`, `description`, `remarks`, `comments` |

## Step 5: Data Preparation Checklist

Before importing, ensure:

- [ ] All required columns are present
- [ ] Supplier names are clean (no extra spaces)
- [ ] Amounts are numeric (no currency symbols like $, Shs, commas)
- [ ] Dates are in valid format (YYYY-MM-DD recommended)
- [ ] GrandTotal = PaidAmount + OutstandingAmount (or close)
- [ ] Phone numbers are in standard format
- [ ] Email addresses are valid (if provided)

## Step 6: Import Process

1. **Open the Import Dialog**
   - Navigate to the Payables page
   - Click the "Import Payables" button

2. **Select Your File**
   - Choose your prepared Excel file (.xlsx or .xls)
   - The system will parse and preview the data

3. **Review Preview**
   - Check that all columns are mapped correctly
   - Verify sample data looks correct
   - Fix any mapping issues if needed

4. **Import Data**
   - Click "Import Payables" to process all records
   - Wait for the import to complete
   - Review any error messages

5. **Verify Results**
   - Check the Payables page for imported debts
   - Verify supplier information
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
- Check that GrandTotal = PaidAmount + OutstandingAmount

### Issue: "Supplier not found"
**Solution**: This is normal! New suppliers will be created automatically. Ensure SupplierName is provided.

### Issue: Duplicate suppliers created
**Solution**: 
- Use consistent supplier names (exact match, case-insensitive)
- Consider using TIN for unique identification
- Review and merge duplicates after import if needed

## Tips for Success

1. **Start Small**: Test with 5-10 records first
2. **Backup First**: Always backup your database before large imports
3. **Use TIN**: If your old system had unique supplier IDs, include them in TIN
4. **Add Notes**: Use the Notes column to track the source (e.g., "Migrated from System X on 2024-01-15")
5. **Verify Calculations**: Double-check that your amounts add up correctly
6. **Clean Data**: Remove duplicates and fix formatting issues before importing

## Next Steps After Import

1. **Review Payables**: Check the Payables page to see all imported debts
2. **Verify Suppliers**: Review the Suppliers page to ensure supplier information is correct
3. **Test Payment Recording**: Try recording a payment to ensure the debt tracking works
4. **Generate Reports**: Use the reporting features to analyze your payables

## Need Help?

Refer to the detailed documentation: `SUPPLIER_PAYABLE_IMPORT_TEMPLATE.md`

For technical support, contact your system administrator.

