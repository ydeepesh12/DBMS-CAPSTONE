-- ========================================================
-- Traffic Violation & Smart Challan Management System
-- Script: 05_advanced_queries.sql
-- Description: Analytical & Reporting Queries for Dashboard
-- ========================================================

USE traffic_challan;

-- 1. Repeat Offenders: Vehicles with frequent violations in the past 6 months
SELECT 
    v.vehicle_id,
    v.registration_no,
    v.make_model,
    v.vehicle_type,
    o.name AS owner_name,
    o.phone AS owner_phone,
    COUNT(viol.violation_id) AS total_violations_count,
    SUM(c.fine_amount) AS total_fine_incurred,
    SUM(CASE WHEN c.status = 'PAID' THEN 1 ELSE 0 END) AS paid_violations,
    SUM(CASE WHEN c.status IN ('UNPAID', 'OVERDUE') THEN 1 ELSE 0 END) AS pending_violations
FROM vehicle v
JOIN owner o ON v.owner_id = o.owner_id
JOIN violation viol ON v.vehicle_id = viol.vehicle_id
LEFT JOIN challan c ON viol.violation_id = c.violation_id
WHERE viol.violation_timestamp >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
GROUP BY v.vehicle_id, v.registration_no, v.make_model, v.vehicle_type, o.name, o.phone
HAVING COUNT(viol.violation_id) >= 2 -- Configurable threshold (set to >=2 for demo test set)
ORDER BY total_violations_count DESC;

-- 2. High Unpaid Fine Defaulters above Threshold (e.g. >= 2000)
SELECT 
    c.challan_id,
    c.challan_number,
    v.registration_no,
    o.name AS owner_name,
    o.phone AS owner_phone,
    o.email AS owner_email,
    c.total_amount,
    c.due_date,
    c.status,
    GREATEST(0, DATEDIFF(CURDATE(), c.due_date)) AS days_overdue
FROM challan c
JOIN violation viol ON c.violation_id = viol.violation_id
JOIN vehicle v ON viol.vehicle_id = v.vehicle_id
JOIN owner o ON v.owner_id = o.owner_id
WHERE c.status IN ('UNPAID', 'OVERDUE')
  AND c.total_amount >= 2000.00
ORDER BY c.total_amount DESC;

-- 3. Violation Hotspots Ranked with Geo-Coordinates for Heatmap
SELECT 
    loc.location_id,
    loc.area_name,
    loc.junction_name,
    loc.latitude,
    loc.longitude,
    loc.zone_type,
    loc.camera_id,
    COUNT(viol.violation_id) AS total_violations,
    SUM(CASE WHEN vt.severity = 'CRITICAL' THEN 1 ELSE 0 END) AS critical_violations,
    IFNULL(SUM(vt.base_fine), 0.00) AS total_fines_generated
FROM location loc
LEFT JOIN violation viol ON loc.location_id = viol.location_id
LEFT JOIN violation_type vt ON viol.violation_type_id = vt.violation_type_id
GROUP BY loc.location_id, loc.area_name, loc.junction_name, loc.latitude, loc.longitude, loc.zone_type, loc.camera_id
ORDER BY total_violations DESC;

-- 4. Monthly Collection with Running Cumulative Total and Month-Over-Month Change
WITH MonthlyCollections AS (
    SELECT 
        DATE_FORMAT(payment_date, '%Y-%m') AS month_label,
        COUNT(payment_id) AS transaction_count,
        SUM(amount_paid) AS monthly_amount
    FROM payment
    WHERE gateway_status = 'SUCCESS'
    GROUP BY DATE_FORMAT(payment_date, '%Y-%m')
)
SELECT 
    month_label,
    transaction_count,
    monthly_amount,
    SUM(monthly_amount) OVER (ORDER BY month_label ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_total,
    LAG(monthly_amount, 1, 0.00) OVER (ORDER BY month_label) AS prev_month_amount,
    ROUND(
        CASE 
            WHEN LAG(monthly_amount, 1, 0.00) OVER (ORDER BY month_label) = 0 THEN 0.0
            ELSE ((monthly_amount - LAG(monthly_amount, 1, 0.00) OVER (ORDER BY month_label)) / LAG(monthly_amount, 1, 0.00) OVER (ORDER BY month_label)) * 100 
        END, 2
    ) AS mom_percentage_growth
FROM MonthlyCollections
ORDER BY month_label;

-- 5. Appealed vs Non-Appealed Comparison
SELECT 
    CASE 
        WHEN a.appeal_id IS NOT NULL THEN 'APPEALED'
        ELSE 'NOT_APPEALED'
    END AS appeal_category,
    COUNT(c.challan_id) AS total_challans,
    SUM(c.total_amount) AS total_value,
    SUM(CASE WHEN c.status = 'PAID' THEN 1 ELSE 0 END) AS paid_count,
    ROUND((SUM(CASE WHEN c.status = 'PAID' THEN 1 ELSE 0 END) / COUNT(c.challan_id)) * 100, 2) AS settlement_rate
FROM challan c
LEFT JOIN appeal a ON c.challan_id = a.challan_id
GROUP BY appeal_category;

-- 6. Collection Efficiency per Violation Type
SELECT 
    vt.violation_type_id,
    vt.code,
    vt.title,
    vt.severity,
    COUNT(c.challan_id) AS challans_issued,
    SUM(c.total_amount) AS total_demanded,
    SUM(CASE WHEN c.status = 'PAID' THEN c.total_amount ELSE 0.00 END) AS total_collected,
    ROUND(
        IFNULL((SUM(CASE WHEN c.status = 'PAID' THEN c.total_amount ELSE 0.00 END) / NULLIF(SUM(c.total_amount), 0)) * 100, 0), 
        2
    ) AS collection_efficiency_percentage
FROM violation_type vt
JOIN violation v ON vt.violation_type_id = v.violation_type_id
JOIN challan c ON v.violation_id = c.violation_id
GROUP BY vt.violation_type_id, vt.code, vt.title, vt.severity
ORDER BY collection_efficiency_percentage DESC;

-- 7. Licence Risk: Violations by Suspended/Expired Drivers
SELECT 
    d.driver_id,
    d.name AS driver_name,
    l.license_number,
    l.status AS license_status,
    l.points_demerit,
    v.registration_no,
    vt.title AS violation_committed,
    viol.violation_timestamp
FROM violation viol
JOIN driver d ON viol.driver_id = d.driver_id
JOIN license l ON d.license_id = l.license_id
JOIN vehicle v ON viol.vehicle_id = v.vehicle_id
JOIN violation_type vt ON viol.violation_type_id = vt.violation_type_id
WHERE l.status IN ('SUSPENDED', 'EXPIRED', 'REVOKED')
ORDER BY viol.violation_timestamp DESC;

-- 8. Officer Workload (View invocation)
SELECT * FROM v_officer_workload ORDER BY total_violations_recorded DESC;
