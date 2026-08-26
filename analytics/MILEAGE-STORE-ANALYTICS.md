# Mileage Store & Analytics System

## Purpose
Provide a governed analytics model for mileage records, travel workflows, eStore transactions, resource usage and operational reporting.

## Mileage event
`mileage_id`, `actor_id`, `vehicle_id`, `trip_date`, `origin`, `destination`, `business_purpose`, `odometer_start`, `odometer_end`, `business_miles`, `commute_miles`, `rate_version`, `calculated_amount`, `source_ref`, `created_at`.

## Store event
`order_id`, `customer_id`, `sku`, `quantity`, `unit_price`, `tax_amount`, `discount_amount`, `gross_amount`, `refund_amount`, `status`, `created_at`.

## Analytics measures
- miles by program/term/user role
- business-purpose mileage by category
- eTextbook/resource utilization
- enrollments and completion
- assessment performance
- support tickets and resolution time
- eStore conversion, refunds and resource demand

## Controls
Mileage calculations must use a versioned rate table and retain the applicable tax year/source. Store analytics must use aggregated or pseudonymized identifiers. Production analytics never expose passwords, payment secrets, full taxpayer identifiers or unnecessary student records.
