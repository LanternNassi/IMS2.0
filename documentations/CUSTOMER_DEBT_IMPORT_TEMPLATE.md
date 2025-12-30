# Customer Debt Import Template

This document provides the Excel column structure for importing customers with existing balances/debts from an external system into IMS.

## Overview

When importing customers with existing debts, the system will:
1. **Create or match customers** based on the provided information
2. **Create sales records** representing the debt transactions
3. **Set up outstanding balances** that can be tracked and collected

## Excel Column Structure

### Required Columns

| Column Name | Alternative Names | Data Type | Required | Description | Example |
|------------|-------------------|-----------|----------|-------------|----------|
| **CustomerName** | `name`, `customer name`, `customer_name` | Text | ✅ Yes | Full name of the customer | "John Doe" |
| **CustomerType** | `customer type`, `customer_type`, `type` | Text | ✅ Yes | Type of customer (e.g., "Retail", "Wholesale", "Corporate") | "Retail" |
| **SaleDate** | `sale date`, `sale_date`, `date`, `transaction date` | Date | ✅ Yes | Date when the debt/transaction occurred (YYYY-MM-DD or DD/MM/YYYY) | "2024-01-15" or "15/01/2024" |
| **TotalAmount** | `total amount`, `total_amount`, `amount`, `invoice amount` | Number | ✅ Yes | Total amount of the sale/debt (before any payments) | 50000.00 |
| **OutstandingAmount** | `outstanding amount`, `outstanding_amount`, `balance`, `debt` | Number | ✅ Yes | Current outstanding balance owed by customer | 35000.00 |
| **PaidAmount** | `paid amount`, `paid_amount`, `amount paid` | Number | ✅ Yes | Amount already paid (TotalAmount - OutstandingAmount) | 15000.00 |

### Optional Columns

| Column Name | Alternative Names | Data Type | Required | Description | Example |
|------------|-------------------|-----------|----------|-------------|----------|
| **Address** | `address`, `customer address`, `location` | Text | ❌ No | Customer's physical address | "123 Main Street, Kampala" |
| **Phone** | `phone`, `phone number`, `phone_number`, `mobile` | Text | ❌ No | Customer's phone number | "+256 700 123456" |
| **Email** | `email`, `email address`, `e-mail` | Text | ❌ No | Customer's email address | "john.doe@example.com" |
| **AccountNumber** | `account number`, `account_number`, `account` | Text | ❌ No | Customer's account number or reference | "ACC-001234" |
| **MoreInfo** | `more info`, `more_info`, `notes`, `description`, `info` | Text | ❌ No | Additional information about the customer | "VIP Customer" |
| **Discount** | `discount`, `discount amount`, `discount_amount` | Number | ❌ No | Discount applied to the sale (default: 0) | 5000.00 |
| **PaymentMethod** | `payment method`, `payment_method`, `method` | Text | ❌ No | Payment method used (CASH, MOBILE_MONEY, BANK_TRANSFER, CREDIT) | "CREDIT" |
| **Notes** | `notes`, `note`, `description`, `remarks`, `comments` | Text | ❌ No | Additional notes about the sale/debt | "Initial balance from old system" |

## Excel File Format

### Sample Data Structure

```
| CustomerName | CustomerType | SaleDate    | TotalAmount | PaidAmount | OutstandingAmount | Address              | Phone          | PaymentMethod | Notes                          |
|--------------|--------------|-------------|-------------|------------|-------------------|----------------------|----------------|---------------|--------------------------------|
| John Doe     | Retail       | 2024-01-15  | 50000       | 15000      | 35000             | 123 Main St, Kampala | +256700123456  | CREDIT        | Initial balance from old system |
| Jane Smith   | Wholesale    | 2024-02-20  | 100000      | 0          | 100000            | 456 Market Rd        | +256701234567  | CREDIT        | Unpaid invoice                  |
| ABC Corp     | Corporate    | 2024-03-10  | 250000      | 100000     | 150000            | 789 Business Ave      | +256702345678  | CREDIT        | Partial payment received         |
```

## Column Mapping Details

### CustomerName
- **Purpose**: Identifies the customer
- **Format**: Text string
- **Validation**: Cannot be empty
- **Matching**: If a customer with the same name exists, the system will match to that customer. Otherwise, a new customer will be created.

### CustomerType
- **Purpose**: Categorizes the customer
- **Format**: Text string
- **Common Values**: "Retail", "Wholesale", "Corporate", "Individual"
- **Default**: If not provided, system may use a default value

### SaleDate
- **Purpose**: Records when the debt transaction occurred
- **Format**: Date (YYYY-MM-DD, DD/MM/YYYY, or MM/DD/YYYY)
- **Validation**: Must be a valid date
- **Note**: This date will be used for aging analysis and reporting

### TotalAmount
- **Purpose**: Original total amount of the sale/debt
- **Format**: Decimal number (no currency symbols)
- **Validation**: Must be >= 0
- **Calculation**: Should equal PaidAmount + OutstandingAmount

### PaidAmount
- **Purpose**: Amount already collected from the customer
- **Format**: Decimal number (no currency symbols)
- **Validation**: Must be >= 0 and <= TotalAmount
- **Default**: 0 if not provided

### OutstandingAmount
- **Purpose**: Current balance owed by the customer
- **Format**: Decimal number (no currency symbols)
- **Validation**: Must be >= 0
- **Calculation**: Should equal TotalAmount - PaidAmount
- **Note**: If OutstandingAmount > 0, the sale will be marked as unpaid/partial

### PaymentMethod
- **Purpose**: Method used for any payments made
- **Format**: Text string
- **Valid Values**:
  - `CASH` - Cash payment
  - `MOBILE_MONEY` - Mobile money payment
  - `BANK_TRANSFER` - Bank transfer
  - `CREDIT` - Credit/debt transaction
  - `CARD` - Card payment
  - `CHEQUE` - Cheque payment
- **Default**: `CREDIT` if not provided

### Discount
- **Purpose**: Discount applied to the sale
- **Format**: Decimal number (no currency symbols)
- **Validation**: Must be >= 0
- **Default**: 0 if not provided
- **Note**: Discount reduces the TotalAmount before calculating outstanding

## Important Notes

### Data Validation Rules

1. **Amount Consistency**:
   - `TotalAmount` = `PaidAmount` + `OutstandingAmount`
   - If these don't match, the system will use `TotalAmount - PaidAmount` for OutstandingAmount

2. **Customer Matching**:
   - Customers are matched by name (case-insensitive)
   - If multiple customers have the same name, the first match will be used
   - Consider using AccountNumber for more precise matching if available

3. **Date Format**:
   - Dates can be in various formats (YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY)
   - The system will attempt to parse the date automatically

4. **Payment Status**:
   - If `OutstandingAmount` = 0, the sale will be marked as fully paid
   - If `OutstandingAmount` > 0, the sale will be marked as unpaid or partial

### Best Practices

1. **Prepare Your Data**:
   - Clean customer names (remove extra spaces, standardize format)
   - Ensure amounts are numeric (no currency symbols, commas, or spaces)
   - Verify date formats are consistent

2. **Data Quality**:
   - Include as much customer information as possible (phone, address) for better matching
   - Use AccountNumber if your old system had unique customer identifiers
   - Add Notes to track the source of the debt (e.g., "Migrated from System X")

3. **Testing**:
   - Start with a small sample (5-10 records) to test the import
   - Verify the imported data matches your expectations
   - Check that customers are created/matched correctly

4. **Backup**:
   - Always backup your database before importing large datasets
   - Keep a copy of your original Excel file

## Example Excel File Structure

### Minimal Required Columns
```
CustomerName | CustomerType | SaleDate    | TotalAmount | PaidAmount | OutstandingAmount
John Doe     | Retail       | 2024-01-15  | 50000       | 15000      | 35000
```

### Complete Example with All Columns
```
CustomerName | CustomerType | SaleDate    | TotalAmount | PaidAmount | OutstandingAmount | Discount | Address              | Phone          | Email                | AccountNumber | PaymentMethod | Notes
John Doe     | Retail       | 2024-01-15  | 50000       | 15000      | 35000             | 0         | 123 Main St, Kampala | +256700123456  | john@example.com     | ACC-001       | CREDIT        | Initial balance
Jane Smith   | Wholesale    | 2024-02-20  | 100000      | 0          | 100000            | 5000      | 456 Market Rd        | +256701234567  | jane@example.com     | ACC-002       | CREDIT        | Unpaid invoice
```

## Import Process

1. **Prepare Excel File**: Create your Excel file with the columns listed above
2. **Open Import Dialog**: Navigate to the Receivables page and use the import feature
3. **Select File**: Choose your prepared Excel file
4. **Review Preview**: Check the preview to ensure data is parsed correctly
5. **Import**: Click import to process all records
6. **Verify**: Check the Receivables page to confirm all debts were imported correctly

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
   - Check that TotalAmount = PaidAmount + OutstandingAmount

4. **"Customer not found"**
   - This is normal - new customers will be created automatically
   - Ensure CustomerName is provided

## Support

If you encounter issues during import:
1. Check the error message for specific field validation errors
2. Verify your Excel file matches the template structure
3. Review the sample data examples above
4. Contact system administrator if problems persist

