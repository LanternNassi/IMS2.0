# Supplier Payable Import Template

This document provides the Excel column structure for importing suppliers with existing balances/debts (payables) from an external system into IMS.

## Overview

When importing suppliers with existing payables, the system will:
1. **Create or match suppliers** based on the provided information
2. **Create purchase records** representing the debt transactions (without purchase items)
3. **Set up outstanding balances** that can be tracked and paid

## Excel Column Structure

### Required Columns

| Column Name | Alternative Names | Data Type | Required | Description | Example |
|------------|-------------------|-----------|----------|-------------|----------|
| **SupplierName** | `suppliername`, `supplier name`, `supplier_name`, `companyname`, `company name` | Text | ✅ Yes | Company name of the supplier | "ABC Suppliers Ltd" |
| **PurchaseDate** | `purchasedate`, `purchase date`, `purchase_date`, `date`, `transaction date` | Date | ✅ Yes | Date when the debt/transaction occurred (YYYY-MM-DD or DD/MM/YYYY) | "2024-01-15" or "15/01/2024" |
| **GrandTotal** | `grandtotal`, `grand total`, `grand_total`, `total`, `amount`, `invoice amount` | Number | ✅ Yes | Total amount including tax (GrandTotal = TotalAmount + Tax) | 500000.00 |
| **PaidAmount** | `paidamount`, `paid amount`, `paid_amount`, `amount paid` | Number | ✅ Yes | Amount already paid to supplier | 200000.00 |
| **OutstandingAmount** | `outstandingamount`, `outstanding amount`, `outstanding_amount`, `balance`, `debt` | Number | ✅ Yes | Current outstanding balance owed to supplier | 300000.00 |

### Optional Columns

| Column Name | Alternative Names | Data Type | Required | Description | Example |
|------------|-------------------|-----------|----------|-------------|----------|
| **TotalAmount** | `totalamount`, `total amount`, `total_amount`, `subtotal` | Number | ❌ No | Subtotal before tax (if not provided, defaults to GrandTotal) | 450000.00 |
| **Tax** | `tax`, `vat`, `tax amount`, `tax_amount` | Number | ❌ No | Tax/VAT amount (default: 0) | 50000.00 |
| **PurchaseNumber** | `purchasenumber`, `purchase number`, `purchase_number`, `invoice number`, `invoice` | Text | ❌ No | Purchase order or invoice number | "PO-001" |
| **ContactPerson** | `contactperson`, `contact person`, `contact_person`, `contact` | Text | ❌ No | Contact person name | "John Manager" |
| **EmailAddress** | `emailaddress`, `email address`, `email_address`, `email`, `e-mail` | Text | ❌ No | Supplier's email address | "john@abcsuppliers.com" |
| **PhoneNumber** | `phonenumber`, `phone number`, `phone_number`, `phone`, `mobile` | Text | ❌ No | Supplier's phone number | "+256700123456" |
| **Address** | `address`, `supplier address`, `location` | Text | ❌ No | Supplier's physical address | "123 Industrial Road, Kampala" |
| **TIN** | `tin`, `tax id`, `tax_id`, `tax identification number` | Text | ❌ No | Tax Identification Number | "TIN-123456" |
| **MoreInfo** | `moreinfo`, `more info`, `more_info`, `info`, `description` | Text | ❌ No | Additional information about the supplier | "Preferred supplier" |
| **Notes** | `notes`, `note`, `description`, `remarks`, `comments` | Text | ❌ No | Additional notes about the purchase/debt | "Initial balance from old system" |

## Excel File Format

### Sample Data Structure

```
| SupplierName          | PurchaseDate | GrandTotal | TotalAmount | Tax    | PaidAmount | OutstandingAmount | PurchaseNumber | ContactPerson | PhoneNumber      | Address              | Notes                          |
|----------------------|--------------|------------|-------------|--------|------------|-------------------|----------------|---------------|------------------|----------------------|--------------------------------|
| ABC Suppliers Ltd    | 2024-01-15   | 500000     | 450000      | 50000  | 200000     | 300000            | PO-001         | John Manager  | +256700123456    | 123 Industrial Road  | Initial balance from old system |
| XYZ Trading Company  | 2024-02-20   | 1000000    | 900000      | 100000 | 0          | 1000000           | PO-002         | Jane Director | +256701234567    | 456 Business Park    | Unpaid invoice                  |
| Global Supplies Inc  | 2024-03-10   | 750000     | 700000      | 50000  | 300000     | 450000            | PO-003         | Bob Owner     | +256702345678    | 789 Warehouse Street | Partial payment received        |
```

## Column Mapping Details

### SupplierName
- **Purpose**: Identifies the supplier
- **Format**: Text string
- **Validation**: Cannot be empty
- **Matching**: If a supplier with the same company name exists, the system will match to that supplier. Otherwise, a new supplier will be created.

### PurchaseDate
- **Purpose**: Records when the payable transaction occurred
- **Format**: Date (YYYY-MM-DD, DD/MM/YYYY, or MM/DD/YYYY)
- **Validation**: Must be a valid date
- **Note**: This date will be used for aging analysis and reporting

### GrandTotal
- **Purpose**: Total amount including tax (what you owe)
- **Format**: Decimal number (no currency symbols)
- **Validation**: Must be > 0
- **Calculation**: Should equal TotalAmount + Tax (or just the total amount if tax is not specified)

### TotalAmount
- **Purpose**: Subtotal before tax
- **Format**: Decimal number (no currency symbols)
- **Validation**: Must be >= 0
- **Default**: If not provided, defaults to GrandTotal
- **Note**: GrandTotal = TotalAmount + Tax

### Tax
- **Purpose**: Tax/VAT amount
- **Format**: Decimal number (no currency symbols)
- **Validation**: Must be >= 0
- **Default**: 0 if not provided
- **Note**: GrandTotal = TotalAmount + Tax

### PaidAmount
- **Purpose**: Amount already paid to the supplier
- **Format**: Decimal number (no currency symbols)
- **Validation**: Must be >= 0 and <= GrandTotal
- **Default**: 0 if not provided

### OutstandingAmount
- **Purpose**: Current balance owed to the supplier
- **Format**: Decimal number (no currency symbols)
- **Validation**: Must be >= 0
- **Calculation**: Should equal GrandTotal - PaidAmount
- **Note**: If OutstandingAmount > 0, the purchase will be marked as unpaid/partial

## Important Notes

### Data Validation Rules

1. **Amount Consistency**:
   - `GrandTotal` = `TotalAmount` + `Tax` (if both provided)
   - `GrandTotal` = `PaidAmount` + `OutstandingAmount`
   - If these don't match, the system will use `GrandTotal - PaidAmount` for OutstandingAmount

2. **Supplier Matching**:
   - Suppliers are matched by company name (case-insensitive)
   - If multiple suppliers have the same name, the first match will be used
   - Consider using TIN for more precise matching if available

3. **Date Format**:
   - Dates can be in various formats (YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY)
   - The system will attempt to parse the date automatically

4. **Payment Status**:
   - If `OutstandingAmount` = 0, the purchase will be marked as fully paid
   - If `OutstandingAmount` > 0, the purchase will be marked as unpaid or partial

### Best Practices

1. **Prepare Your Data**:
   - Clean supplier names (remove extra spaces, standardize format)
   - Ensure amounts are numeric (no currency symbols, commas, or spaces)
   - Verify date formats are consistent

2. **Data Quality**:
   - Include as much supplier information as possible (phone, address, email) for better matching
   - Use TIN if your old system had unique supplier identifiers
   - Add Notes to track the source of the debt (e.g., "Migrated from System X")

3. **Testing**:
   - Start with a small sample (5-10 records) to test the import
   - Verify the imported data matches your expectations
   - Check that suppliers are created/matched correctly

4. **Backup**:
   - Always backup your database before importing large datasets
   - Keep a copy of your original Excel file

## Example Excel File Structure

### Minimal Required Columns
```
SupplierName | PurchaseDate | GrandTotal | PaidAmount | OutstandingAmount
ABC Suppliers Ltd | 2024-01-15 | 500000 | 200000 | 300000
```

### Complete Example with All Columns
```
SupplierName | PurchaseDate | GrandTotal | TotalAmount | Tax | PaidAmount | OutstandingAmount | PurchaseNumber | ContactPerson | EmailAddress | PhoneNumber | Address | TIN | Notes
ABC Suppliers Ltd | 2024-01-15 | 500000 | 450000 | 50000 | 200000 | 300000 | PO-001 | John Manager | john@abcsuppliers.com | +256700123456 | 123 Industrial Road | TIN-123456 | Initial balance
```

## Import Process

1. **Prepare Excel File**: Create your Excel file with the columns listed above
2. **Open Import Dialog**: Navigate to the Payables page and click "Import Payables"
3. **Select File**: Choose your prepared Excel file
4. **Review Preview**: Check the preview to ensure data is parsed correctly
5. **Import**: Click import to process all records
6. **Verify**: Check the Payables page to confirm all debts were imported correctly

## Troubleshooting

### Common Issues

1. **"Required column not found"**
   - Ensure column headers match one of the alternative names listed
   - Check for typos or extra spaces in headers

2. **"Invalid date format"**
   - Ensure dates are in a recognizable format
   - Try using YYYY-MM-DD format

3. **"Amount validation failed"**
   - Ensure amounts are numeric (no currency symbols)
   - Check that GrandTotal = PaidAmount + OutstandingAmount

4. **"Supplier not found"**
   - This is normal - new suppliers will be created automatically
   - Ensure SupplierName is provided

## Support

If you encounter issues during import:
1. Check the error message for specific field validation errors
2. Verify your Excel file matches the template structure
3. Review the sample data examples above
4. Contact system administrator if problems persist

