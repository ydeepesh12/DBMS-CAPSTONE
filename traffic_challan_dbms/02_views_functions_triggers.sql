-- ========================================================
-- Traffic Violation & Smart Challan Management System
-- Script: 02_views_functions_triggers.sql
-- Description: Views, deterministic functions, and triggers
-- ========================================================

USE traffic_challan;

-- --------------------------------------------------------
-- FUNCTIONS
-- --------------------------------------------------------

DELIMITER $$

DROP FUNCTION IF EXISTS fn_outstanding$$
CREATE FUNCTION fn_outstanding(p_challan_id INT)
RETURNS DECIMAL(10, 2)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_status VARCHAR(20);
    DECLARE v_total DECIMAL(10, 2);
    DECLARE v_paid DECIMAL(10, 2) DEFAULT 0.00;

    SELECT status, total_amount INTO v_status, v_total
    FROM challan
    WHERE challan_id = p_challan_id;

    IF v_status = 'PAID' OR v_status = 'CANCELLED' THEN
        RETURN 0.00;
    END IF;

    SELECT IFNULL(SUM(amount_paid), 0.00) INTO v_paid
    FROM payment
    WHERE challan_id = p_challan_id AND gateway_status = 'SUCCESS';

    RETURN GREATEST(0.00, v_total - v_paid);
END$$

DROP FUNCTION IF EXISTS fn_late_fee$$
CREATE FUNCTION fn_late_fee(p_fine DECIMAL(10, 2), p_due DATE, p_as_of DATE)
RETURNS DECIMAL(10, 2)
DETERMINISTIC
NO SQL
BEGIN
    DECLARE v_days_late INT;
    DECLARE v_fee DECIMAL(10, 2);

    IF p_as_of <= p_due THEN
        RETURN 0.00;
    END IF;

    SET v_days_late = DATEDIFF(p_as_of, p_due);
    -- 5% per 15-day block overdue, capped at 100% of base fine
    SET v_fee = p_fine * (CEIL(v_days_late / 15.0) * 0.05);

    IF v_fee > p_fine THEN
        SET v_fee = p_fine;
    END IF;

    RETURN ROUND(v_fee, 2);
END$$

DELIMITER ;

-- --------------------------------------------------------
-- VIEWS
-- --------------------------------------------------------

DROP VIEW IF EXISTS v_outstanding_challans;
CREATE VIEW v_outstanding_challans AS
SELECT 
    c.challan_id,
    c.challan_number,
    v.registration_no,
    o.name AS owner_name,
    o.phone AS owner_phone,
    vt.title AS violation_title,
    c.fine_amount,
    c.late_fee,
    c.total_amount,
    c.issue_date,
    c.due_date,
    c.status,
    GREATEST(0, DATEDIFF(CURDATE(), c.due_date)) AS days_overdue,
    fn_outstanding(c.challan_id) AS outstanding_amount
FROM challan c
JOIN violation viol ON c.violation_id = viol.violation_id
JOIN vehicle v ON viol.vehicle_id = v.vehicle_id
JOIN owner o ON v.owner_id = o.owner_id
JOIN violation_type vt ON viol.violation_type_id = vt.violation_type_id
WHERE c.status IN ('UNPAID', 'OVERDUE');

DROP VIEW IF EXISTS v_officer_workload;
CREATE VIEW v_officer_workload AS
SELECT 
    off.officer_id,
    off.name AS officer_name,
    off.badge_number,
    off.police_station,
    off.status AS officer_status,
    COUNT(viol.violation_id) AS total_violations_recorded,
    COUNT(c.challan_id) AS challans_generated,
    IFNULL(SUM(c.fine_amount), 0.00) AS total_fines_levied,
    IFNULL(SUM(CASE WHEN c.status = 'PAID' THEN c.total_amount ELSE 0 END), 0.00) AS total_fines_collected
FROM officer off
LEFT JOIN violation viol ON off.officer_id = viol.officer_id
LEFT JOIN challan c ON viol.violation_id = c.violation_id
GROUP BY off.officer_id, off.name, off.badge_number, off.police_station, off.status;

DROP VIEW IF EXISTS v_public_challan_status;
CREATE VIEW v_public_challan_status AS
SELECT 
    c.challan_id,
    c.challan_number,
    veh.registration_no,
    vt.title AS violation_title,
    vt.section_act,
    loc.area_name,
    loc.junction_name,
    viol.violation_timestamp,
    c.fine_amount,
    c.late_fee,
    c.total_amount,
    c.issue_date,
    c.due_date,
    c.status,
    c.appeal_window_end,
    p.payment_date,
    p.transaction_reference,
    p.receipt_number
FROM challan c
JOIN violation viol ON c.violation_id = viol.violation_id
JOIN vehicle veh ON viol.vehicle_id = veh.vehicle_id
JOIN violation_type vt ON viol.violation_type_id = vt.violation_type_id
JOIN location loc ON viol.location_id = loc.location_id
LEFT JOIN payment p ON c.challan_id = p.challan_id AND p.gateway_status = 'SUCCESS';

-- --------------------------------------------------------
-- TRIGGERS
-- --------------------------------------------------------

DELIMITER $$

-- Trigger 1: Audit trail on challan insertion
DROP TRIGGER IF EXISTS trg_challan_after_insert_audit$$
CREATE TRIGGER trg_challan_after_insert_audit
AFTER INSERT ON challan
FOR EACH ROW
BEGIN
    INSERT INTO challan_audit (
        challan_id, old_status, new_status, old_amount, new_amount, action, performed_by
    ) VALUES (
        NEW.challan_id, NULL, NEW.status, 0.00, NEW.total_amount, 'CHALLAN_CREATED', 'SYSTEM'
    );
END$$

-- Trigger 2: Audit trail and version increment on challan update
DROP TRIGGER IF EXISTS trg_challan_after_update_audit$$
CREATE TRIGGER trg_challan_after_update_audit
AFTER UPDATE ON challan
FOR EACH ROW
BEGIN
    IF OLD.status <> NEW.status OR OLD.total_amount <> NEW.total_amount THEN
        INSERT INTO challan_audit (
            challan_id, old_status, new_status, old_amount, new_amount, action, performed_by
        ) VALUES (
            NEW.challan_id, OLD.status, NEW.status, OLD.total_amount, NEW.total_amount, 
            CASE 
                WHEN NEW.status = 'PAID' THEN 'PAYMENT_RECEIVED'
                WHEN NEW.status = 'APPEALED' THEN 'APPEAL_FILED'
                WHEN NEW.status = 'CANCELLED' THEN 'CHALLAN_CANCELLED'
                WHEN NEW.status = 'OVERDUE' THEN 'LATE_FEE_APPLIED'
                ELSE 'CHALLAN_UPDATED'
            END,
            'SYSTEM'
        );
    END IF;
END$$

-- Trigger 3: Payment guard trigger
DROP TRIGGER IF EXISTS trg_payment_before_insert_guard$$
CREATE TRIGGER trg_payment_before_insert_guard
BEFORE INSERT ON payment
FOR EACH ROW
BEGIN
    DECLARE v_status VARCHAR(20);
    DECLARE v_total DECIMAL(10, 2);

    SELECT status, total_amount INTO v_status, v_total
    FROM challan
    WHERE challan_id = NEW.challan_id;

    IF v_status IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Challan record does not exist';
    END IF;

    IF v_status = 'PAID' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Payment rejected: Challan is already PAID';
    END IF;

    IF v_status = 'CANCELLED' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Payment rejected: Challan is CANCELLED';
    END IF;

    IF NEW.amount_paid <> v_total THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Payment rejected: Amount does not match total challan amount';
    END IF;
END$$

DELIMITER ;
