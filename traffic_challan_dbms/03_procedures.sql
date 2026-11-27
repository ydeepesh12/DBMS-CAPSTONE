-- ========================================================
-- Traffic Violation & Smart Challan Management System
-- Script: 03_procedures.sql
-- Description: Stored Procedures enforcing all business rules
-- ========================================================

USE traffic_challan;

DELIMITER $$

-- 1. Generate Challan from Violation
DROP PROCEDURE IF EXISTS sp_generate_challan$$
CREATE PROCEDURE sp_generate_challan(
    IN p_violation_id INT,
    OUT p_challan_id INT
)
proc_label: BEGIN
    DECLARE v_fine DECIMAL(10, 2);
    DECLARE v_status VARCHAR(20);
    DECLARE v_challan_num VARCHAR(30);
    DECLARE v_today DATE;
    DECLARE v_due DATE;
    DECLARE v_appeal_end DATE;

    -- Check violation existence and status
    SELECT v.status, vt.base_fine 
    INTO v_status, v_fine
    FROM violation v
    JOIN violation_type vt ON v.violation_type_id = vt.violation_type_id
    WHERE v.violation_id = p_violation_id;

    IF v_status IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Violation record not found';
    END IF;

    IF v_status = 'CHALLAN_GENERATED' THEN
        SELECT challan_id INTO p_challan_id FROM challan WHERE violation_id = p_violation_id;
        LEAVE proc_label;
    END IF;

    IF v_status = 'CANCELLED' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot generate challan for cancelled violation';
    END IF;

    SET v_today = CURDATE();
    SET v_due = DATE_ADD(v_today, INTERVAL 30 DAY);
    SET v_appeal_end = DATE_ADD(v_today, INTERVAL 15 DAY);
    SET v_challan_num = CONCAT('CH-', DATE_FORMAT(v_today, '%Y%m%d'), '-', LPAD(FLOOR(RAND() * 90000 + 10000), 5, '0'));

    START TRANSACTION;

    INSERT INTO challan (
        challan_number, violation_id, fine_amount, late_fee, total_amount,
        issue_date, due_date, status, appeal_window_end, version
    ) VALUES (
        v_challan_num, p_violation_id, v_fine, 0.00, v_fine,
        v_today, v_due, 'UNPAID', v_appeal_end, 1
    );

    SET p_challan_id = LAST_INSERT_ID();

    UPDATE violation 
    SET status = 'CHALLAN_GENERATED' 
    WHERE violation_id = p_violation_id;

    COMMIT;
END$$

-- 2. Process Payment with Concurrency & Idempotency Guards
DROP PROCEDURE IF EXISTS sp_process_payment$$
CREATE PROCEDURE sp_process_payment(
    IN p_challan_id INT,
    IN p_amount DECIMAL(10, 2),
    IN p_method VARCHAR(30),
    IN p_txn_ref VARCHAR(100)
)
BEGIN
    DECLARE v_current_status VARCHAR(20);
    DECLARE v_total_due DECIMAL(10, 2);
    DECLARE v_version INT;
    DECLARE v_receipt VARCHAR(50);
    DECLARE v_existing_tx INT DEFAULT 0;

    -- Check for duplicate transaction (Idempotency)
    SELECT COUNT(*) INTO v_existing_tx
    FROM payment
    WHERE transaction_reference = p_txn_ref;

    IF v_existing_tx > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Duplicate transaction reference: Payment already processed';
    END IF;

    START TRANSACTION;

    -- Pessimistic locking to prevent race condition
    SELECT status, total_amount, version 
    INTO v_current_status, v_total_due, v_version
    FROM challan 
    WHERE challan_id = p_challan_id 
    FOR UPDATE;

    IF v_current_status IS NULL THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Challan record not found';
    END IF;

    IF v_current_status = 'PAID' THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Challan has already been paid';
    END IF;

    IF v_current_status = 'CANCELLED' THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Challan has been cancelled';
    END IF;

    IF p_amount <> v_total_due THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Payment amount does not match total amount due';
    END IF;

    SET v_receipt = CONCAT('RCP-', DATE_FORMAT(NOW(), '%Y%m%d%H%i%s'), '-', LPAD(FLOOR(RAND() * 9000 + 1000), 4, '0'));

    INSERT INTO payment (
        challan_id, amount_paid, payment_date, payment_method, 
        transaction_reference, gateway_status, receipt_number
    ) VALUES (
        p_challan_id, p_amount, NOW(), p_method, 
        p_txn_ref, 'SUCCESS', v_receipt
    );

    UPDATE challan 
    SET status = 'PAID', version = version + 1
    WHERE challan_id = p_challan_id AND version = v_version;

    IF ROW_COUNT() = 0 THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Concurrency conflict: Challan was modified by another transaction';
    END IF;

    COMMIT;
END$$

-- 3. Atomic Multi-Step Transaction with Simulation for DBMS Lab Viva
DROP PROCEDURE IF EXISTS sp_violation_to_payment$$
CREATE PROCEDURE sp_violation_to_payment(
    IN p_violation_id INT,
    IN p_method VARCHAR(30),
    IN p_txn_ref VARCHAR(100),
    IN p_simulate_failure INT,
    OUT p_result VARCHAR(50)
)
BEGIN
    DECLARE v_new_challan_id INT;
    DECLARE v_fine DECIMAL(10, 2);
    DECLARE v_today DATE;
    DECLARE v_due DATE;
    DECLARE v_appeal_end DATE;
    DECLARE v_challan_num VARCHAR(30);
    DECLARE v_receipt VARCHAR(50);

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_result = 'ROLLED_BACK_ON_ERROR';
    END;

    START TRANSACTION;

    SELECT vt.base_fine INTO v_fine
    FROM violation v
    JOIN violation_type vt ON v.violation_type_id = vt.violation_type_id
    WHERE v.violation_id = p_violation_id;

    IF v_fine IS NULL THEN
        ROLLBACK;
        SET p_result = 'FAILED_VIOLATION_NOT_FOUND';
    ELSE
        SET v_today = CURDATE();
        SET v_due = DATE_ADD(v_today, INTERVAL 30 DAY);
        SET v_appeal_end = DATE_ADD(v_today, INTERVAL 15 DAY);
        SET v_challan_num = CONCAT('CH-DEMO-', DATE_FORMAT(v_today, '%Y%m%d'), '-', LPAD(FLOOR(RAND() * 90000 + 10000), 5, '0'));

        INSERT INTO challan (
            challan_number, violation_id, fine_amount, late_fee, total_amount,
            issue_date, due_date, status, appeal_window_end, version
        ) VALUES (
            v_challan_num, p_violation_id, v_fine, 0.00, v_fine,
            v_today, v_due, 'UNPAID', v_appeal_end, 1
        );

        SET v_new_challan_id = LAST_INSERT_ID();

        UPDATE violation SET status = 'CHALLAN_GENERATED' WHERE violation_id = p_violation_id;

        -- Check simulation flag for viva demonstration
        IF p_simulate_failure = 1 THEN
            -- Simulate unhandled failure during payment execution (forces full rollback)
            ROLLBACK;
            SET p_result = 'ROLLED_BACK_SIMULATED_FAILURE';
        ELSE
            SET v_receipt = CONCAT('RCP-DEMO-', DATE_FORMAT(NOW(), '%Y%m%d%H%i%s'), '-', LPAD(FLOOR(RAND() * 9000 + 1000), 4, '0'));

            INSERT INTO payment (
                challan_id, amount_paid, payment_date, payment_method, 
                transaction_reference, gateway_status, receipt_number
            ) VALUES (
                v_new_challan_id, v_fine, NOW(), p_method, 
                p_txn_ref, 'SUCCESS', v_receipt
            );

            UPDATE challan SET status = 'PAID', version = version + 1 WHERE challan_id = v_new_challan_id;

            COMMIT;
            SET p_result = 'COMMITTED_SUCCESSFULLY';
        END IF;
    END IF;
END$$

-- 4. File Appeal with Window Validation
DROP PROCEDURE IF EXISTS sp_file_appeal$$
CREATE PROCEDURE sp_file_appeal(
    IN p_challan_id INT,
    IN p_reason TEXT,
    IN p_date DATE
)
BEGIN
    DECLARE v_status VARCHAR(20);
    DECLARE v_window_end DATE;
    DECLARE v_existing_pending INT DEFAULT 0;

    SELECT status, appeal_window_end 
    INTO v_status, v_window_end
    FROM challan 
    WHERE challan_id = p_challan_id;

    IF v_status IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Challan record not found';
    END IF;

    IF v_status NOT IN ('UNPAID', 'OVERDUE') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Only UNPAID or OVERDUE challans can be appealed';
    END IF;

    IF p_date > v_window_end THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Appeal window (15 days) has expired for this challan';
    END IF;

    SELECT COUNT(*) INTO v_existing_pending
    FROM appeal
    WHERE challan_id = p_challan_id AND status = 'PENDING';

    IF v_existing_pending > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'An appeal is already pending review for this challan';
    END IF;

    START TRANSACTION;

    INSERT INTO appeal (challan_id, reason, appeal_date, status)
    VALUES (p_challan_id, p_reason, p_date, 'PENDING');

    UPDATE challan 
    SET status = 'APPEALED', version = version + 1
    WHERE challan_id = p_challan_id;

    COMMIT;
END$$

-- 5. Decide Appeal (Accepted or Rejected)
DROP PROCEDURE IF EXISTS sp_decide_appeal$$
CREATE PROCEDURE sp_decide_appeal(
    IN p_appeal_id INT,
    IN p_officer_id INT,
    IN p_decision VARCHAR(20),
    IN p_remarks TEXT,
    IN p_date DATE
)
BEGIN
    DECLARE v_challan_id INT;
    DECLARE v_status VARCHAR(20);

    SELECT challan_id, status 
    INTO v_challan_id, v_status
    FROM appeal 
    WHERE appeal_id = p_appeal_id;

    IF v_status IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Appeal record not found';
    END IF;

    IF v_status <> 'PENDING' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Appeal has already been decided';
    END IF;

    IF p_decision NOT IN ('ACCEPTED', 'REJECTED') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Invalid decision value: Must be ACCEPTED or REJECTED';
    END IF;

    START TRANSACTION;

    UPDATE appeal
    SET status = p_decision,
        reviewing_officer_id = p_officer_id,
        decision_date = p_date,
        officer_remarks = p_remarks
    WHERE appeal_id = p_appeal_id;

    IF p_decision = 'ACCEPTED' THEN
        UPDATE challan 
        SET status = 'CANCELLED', version = version + 1
        WHERE challan_id = v_challan_id;
    ELSE
        UPDATE challan 
        SET status = 'UNPAID', version = version + 1
        WHERE challan_id = v_challan_id;
    END IF;

    COMMIT;
END$$

-- 6. Apply Late Fees Batch Job
DROP PROCEDURE IF EXISTS sp_apply_late_fees$$
CREATE PROCEDURE sp_apply_late_fees(
    IN p_as_of_date DATE
)
BEGIN
    START TRANSACTION;

    UPDATE challan
    SET late_fee = fn_late_fee(fine_amount, due_date, p_as_of_date),
        total_amount = fine_amount + fn_late_fee(fine_amount, due_date, p_as_of_date),
        status = 'OVERDUE',
        version = version + 1
    WHERE status = 'UNPAID'
      AND due_date < p_as_of_date;

    COMMIT;
END$$

DELIMITER ;
