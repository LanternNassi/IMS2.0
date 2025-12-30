# Excel Import Columns Reference

Quick reference for importing customers with existing debts.

## Required Columns (Must Have)

| Column Name | Data Type | Example | Description |
|------------|-----------|---------|-------------|
| **CustomerName** | Text | "John Doe" | Customer's full name |
| **CustomerType** | Text | "Retail" | Customer type (Retail/Wholesale/Corporate) |
| **SaleDate** | Date | "2024-01-15" | Date of debt transaction |
| **TotalAmount** | Number | 50000 | Total sale amount |
| **PaidAmount** | Number | 15000 | Amount already paid |
| **OutstandingAmount** | Number | 35000 | Current balance owed |

## Optional Columns (Recommended)

| Column Name | Data Type | Example | Description |
|------------|-----------|---------|-------------|
| **Address** | Text | "123 Main St, Kampala" | Customer address |
| **Phone** | Text | "+256700123456" | Phone number |
| **Email** | Text | "john@example.com" | Email address |
| **AccountNumber** | Text | "ACC-001" | Account reference |
| **Discount** | Number | 0 | Discount amount |
| **PaymentMethod** | Text | "CREDIT" | Payment method |
| **Notes** | Text | "Initial balance" | Additional notes |

## Column Name Variations

The system recognizes these alternative names (case-insensitive):

### CustomerName
- `name`
- `customer name`
- `customer_name`

### CustomerType
- `customer type`
- `customer_type`
- `type`

### SaleDate
- `sale date`
- `sale_date`
- `date`
- `transaction date`

### TotalAmount
- `total amount`
- `total_amount`
- `amount`
- `invoice amount`

### PaidAmount
- `paid amount`
- `paid_amount`
- `amount paid`

### OutstandingAmount
- `outstanding amount`
- `outstanding_amount`
- `balance`
- `debt`

### Address
- `address`
- `customer address`
- `location`

### Phone
- `phone`
- `phone number`
- `phone_number`
- `mobile`

### Email
- `email`
- `email address`
- `e-mail`

### AccountNumber
- `account number`
- `account_number`
- `account`

### Discount
- `discount`
- `discount amount`
- `discount_amount`

### PaymentMethod
- `payment method`
- `payment_method`
- `method`

### Notes
- `notes`
- `note`
- `description`
- `remarks`
- `comments`

## Payment Method Values

Use one of these exact values for PaymentMethod:
- `CASH`
- `MOBILE_MONEY`
- `BANK_TRANSFER`
- `CREDIT` (default)
- `CARD`
- `CHEQUE`

## Data Format Rules

### Numbers
- ✅ Correct: `50000`, `50000.00`, `50000.5`
- ❌ Wrong: `Shs 50,000`, `$50000`, `50,000`

### Dates
- ✅ Correct: `2024-01-15`, `15/01/2024`, `01/15/2024`
- ❌ Wrong: `Jan 15, 2024`, `15-Jan-2024`

### Text
- ✅ Correct: `John Doe`, `Retail`, `123 Main St`
- ❌ Wrong: `"John Doe"` (no quotes needed in Excel)

## Quick Example

```
CustomerName | CustomerType | SaleDate    | TotalAmount | PaidAmount | OutstandingAmount
John Doe     | Retail       | 2024-01-15  | 50000       | 15000      | 35000
```

## Validation Rules

1. **TotalAmount** must equal **PaidAmount** + **OutstandingAmount**
2. All amounts must be >= 0
3. **PaidAmount** must be <= **TotalAmount**
4. **SaleDate** must be a valid date
5. **CustomerName** cannot be empty
6. **CustomerType** cannot be empty

