-- ========================================================
-- Traffic Violation & Smart Challan Management System
-- Script: 04_sample_data.sql
-- Description: Realistic test & demo seed data
-- ========================================================

USE traffic_challan;

SET FOREIGN_KEY_CHECKS = 0;
DELETE FROM challan_audit;
DELETE FROM appeal;
DELETE FROM payment;
DELETE FROM challan;
DELETE FROM evidence;
DELETE FROM violation;
DELETE FROM location;
DELETE FROM violation_type;
DELETE FROM officer;
DELETE FROM driver;
DELETE FROM license;
DELETE FROM vehicle;
DELETE FROM owner;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Owners
INSERT INTO owner (owner_id, name, email, phone, address, national_id) VALUES
(1, 'Aarav Sharma', 'aarav.sharma@example.com', '+91-9876543210', 'Flat 402, Lotus Heights, Sector 62, Noida', 'AADHAR-8812-4412-9901'),
(2, 'Priya Patel', 'priya.patel@example.com', '+91-9811223344', '12B, Rosewood Apartments, Bandra West, Mumbai', 'AADHAR-7721-3321-8812'),
(3, 'Rajesh Kumar Verma', 'rajesh.verma@example.com', '+91-9922334455', 'Plot 45, Green Glen Layout, Bellandur, Bengaluru', 'AADHAR-6632-2231-7723'),
(4, 'Sneha Mukherjee', 'sneha.m@example.com', '+91-9733445566', '77/1, Southern Avenue, South Kolkata', 'AADHAR-5543-1142-6634'),
(5, 'Vikram Singh Rathore', 'vikram.rathore@example.com', '+91-9644556677', 'Villa 9, Civil Lines, Jaipur', 'AADHAR-4454-9953-5545'),
(6, 'Amitabh Sengupta', 'amitabh.s@example.com', '+91-9555667788', '204, Deccan Gymkhana, Pune', 'AADHAR-3365-8864-4456');

-- 2. Vehicles
INSERT INTO vehicle (vehicle_id, registration_no, chassis_no, engine_no, make_model, vehicle_type, color, owner_id, rc_status, registration_date) VALUES
(1, 'DL01AB1234', 'CHAS-DL01-889123', 'ENG-HYU-44129', 'Hyundai Creta SX', 'CAR', 'Polar White', 1, 'ACTIVE', '2021-03-15'),
(2, 'MH02CD5678', 'CHAS-MH02-771829', 'ENG-HON-99214', 'Honda City ZX', 'CAR', 'Golden Brown', 2, 'ACTIVE', '2020-07-20'),
(3, 'KA03EF9012', 'CHAS-KA03-662910', 'ENG-ROY-11293', 'Royal Enfield Classic 350', 'MOTORCYCLE', 'Stealth Black', 3, 'ACTIVE', '2022-01-10'),
(4, 'HR26BC3456', 'CHAS-HR26-553821', 'ENG-MAR-88312', 'Maruti Suzuki Swift Dzire', 'CAR', 'Magma Grey', 4, 'ACTIVE', '2019-11-05'),
(5, 'WB04GH7890', 'CHAS-WB04-442918', 'ENG-TAT-77401', 'Tata Nexon EV', 'CAR', 'Daytona Grey', 5, 'ACTIVE', '2023-04-12'),
(6, 'RJ14JK2345', 'CHAS-RJ14-331827', 'ENG-KTM-66512', 'KTM Duke 390', 'MOTORCYCLE', 'Orange Blaze', 5, 'SUSPENDED', '2021-08-18'),
(7, 'MH12LM6789', 'CHAS-MH12-229810', 'ENG-ASH-55623', 'Ashok Leyland Cargo 1616', 'TRUCK', 'Deep Blue', 6, 'EXPIRED', '2018-05-30');

-- 3. Licenses
INSERT INTO license (license_id, license_number, issue_date, expiry_date, license_class, status, points_demerit) VALUES
(1, 'DL-0420150089123', '2015-06-12', '2035-06-11', 'LMV', 'ACTIVE', 2),
(2, 'MH-0120180045678', '2018-09-22', '2038-09-21', 'LMV', 'ACTIVE', 0),
(3, 'KA-0320190012934', '2019-02-14', '2039-02-13', 'MCWG', 'ACTIVE', 4),
(4, 'HR-2620120078129', '2012-04-10', '2024-04-09', 'LMV', 'EXPIRED', 8), -- EXPIRED
(5, 'WB-0220160034891', '2016-11-03', '2036-11-02', 'LMV', 'ACTIVE', 0),
(6, 'RJ-1420200056123', '2020-08-15', '2040-08-14', 'MCWG', 'SUSPENDED', 12); -- SUSPENDED

-- 4. Drivers
INSERT INTO driver (driver_id, name, license_id, phone, email, address) VALUES
(1, 'Aarav Sharma', 1, '+91-9876543210', 'aarav.sharma@example.com', 'Flat 402, Lotus Heights, Noida'),
(2, 'Priya Patel', 2, '+91-9811223344', 'priya.patel@example.com', '12B, Rosewood Apartments, Mumbai'),
(3, 'Rajesh Kumar Verma', 3, '+91-9922334455', 'rajesh.verma@example.com', 'Plot 45, Green Glen, Bengaluru'),
(4, 'Ramesh Babu (Chauffeur)', 4, '+91-9122334455', 'ramesh.babu@example.com', 'Gali 4, Old Gurgaon, Gurugram'),
(5, 'Sneha Mukherjee', 5, '+91-9733445566', 'sneha.m@example.com', '77/1, Southern Avenue, Kolkata'),
(6, 'Karan Rathore', 6, '+91-9611224488', 'karan.rathore@example.com', 'Civil Lines, Jaipur');

-- 5. Officers
INSERT INTO officer (officer_id, badge_number, name, designation, police_station, contact_number, email, status) VALUES
(1, 'TP-DEL-1042', 'Inspector Vikram Malhotra', 'Inspector of Police', 'Connaught Place Traffic Police Station', '+91-9411220011', 'vikram.malhotra@traffic.gov.in', 'ACTIVE'),
(2, 'TP-MUM-2088', 'Sub-Inspector Kavita Deshmukh', 'Sub-Inspector', 'Bandra Traffic Division', '+91-9411220022', 'kavita.deshmukh@traffic.gov.in', 'ACTIVE'),
(3, 'TP-BLR-3055', 'Head Constable Manjunath Gowda', 'Head Constable', 'Indiranagar Traffic Station', '+91-9411220033', 'manjunath.gowda@traffic.gov.in', 'ACTIVE'),
(4, 'TP-DEL-4019', 'Assistant Sub-Inspector Deepak Rao', 'Assistant Sub-Inspector', 'Dhaula Kuan Traffic Circle', '+91-9411220044', 'deepak.rao@traffic.gov.in', 'ACTIVE');

-- 6. Violation Types
INSERT INTO violation_type (violation_type_id, code, title, description, section_act, base_fine, late_fee_rate, demerit_points, severity) VALUES
(1, 'V-SPEED-01', 'Overspeeding (Light Motor Vehicle)', 'Exceeding the designated speed limit by more than 15 km/h', 'Section 183(1) Motor Vehicles Act', 2000.00, 0.05, 3, 'HIGH'),
(2, 'V-LIGHT-01', 'Red Light Signal Jumping', 'Failing to stop at a red signal light at intersection', 'Section 184 Motor Vehicles Act', 1000.00, 0.05, 2, 'HIGH'),
(3, 'V-HELMET-01', 'Riding Without Helmet', 'Driver or pillion rider not wearing an approved safety helmet', 'Section 194D Motor Vehicles Act', 1000.00, 0.05, 1, 'MEDIUM'),
(4, 'V-BELT-01', 'Not Wearing Seat Belt', 'Driving light motor vehicle without fastening safety belt', 'Section 194B(1) Motor Vehicles Act', 1000.00, 0.05, 1, 'MEDIUM'),
(5, 'V-MOBILE-01', 'Using Handheld Phone While Driving', 'Operating mobile phone while operating moving vehicle', 'Section 184(c) Motor Vehicles Act', 5000.00, 0.05, 4, 'CRITICAL'),
(6, 'V-WRONGWAY-01', 'Wrong Side / Dangerous Driving', 'Driving against the flow of traffic on one-way or dual carriage road', 'Section 184 Motor Vehicles Act', 5000.00, 0.05, 4, 'CRITICAL'),
(7, 'V-PARK-01', 'Improper Parking / Obstruction', 'Parking in no-parking zone or causing obstruction to traffic', 'Section 122/177 Motor Vehicles Act', 500.00, 0.05, 0, 'LOW'),
(8, 'V-ALCOHOL-01', 'Driving Under Influence of Alcohol', 'Operating vehicle with blood alcohol content above permissible threshold', 'Section 185 Motor Vehicles Act', 10000.00, 0.05, 6, 'CRITICAL');

-- 7. Locations (with accurate coordinates for map plotting)
INSERT INTO location (location_id, area_name, junction_name, latitude, longitude, speed_limit, camera_id, zone_type) VALUES
(1, 'Connaught Place', 'Barakhamba Road Circle', 28.6315000, 77.2167000, 50, 'CAM-DEL-CP-01', 'COMMERCIAL'),
(2, 'Dhaula Kuan', 'Ring Road Flyover Junction', 28.5921000, 77.1563000, 60, 'CAM-DEL-DK-04', 'HIGHWAY'),
(3, 'Bandra West', 'Linking Road - Turner Road Crossing', 19.0596000, 72.8295000, 40, 'CAM-MUM-BW-02', 'COMMERCIAL'),
(4, 'Worli Sea Face', 'Worli Sea Face North Promenade', 19.0176000, 72.8150000, 50, 'CAM-MUM-WS-01', 'COMMERCIAL'),
(5, 'Indiranagar', '100 Feet Road - 12th Main Junction', 12.9784000, 77.6408000, 40, 'CAM-BLR-IN-03', 'COMMERCIAL'),
(6, 'Silk Board', 'Hosur Road Outer Ring Junction', 12.9172000, 77.6229000, 50, 'CAM-BLR-SB-05', 'HIGHWAY'),
(7, 'Cyber City', 'DLF CyberHub Entry Crossing', 28.4950000, 77.0895000, 50, 'CAM-GUR-CC-01', 'COMMERCIAL');

-- 8. Violations
INSERT INTO violation (violation_id, vehicle_id, driver_id, violation_type_id, location_id, officer_id, violation_timestamp, speed_recorded, remarks, status) VALUES
(1, 1, 1, 1, 1, 1, '2026-10-15 11:20:00', 78, 'Captured by ANPR automated radar camera exceeding 50 km/h', 'CHALLAN_GENERATED'),
(2, 2, 2, 2, 3, 2, '2026-10-20 14:45:00', NULL, 'Crossed signal during red light phase at Turner Road junction', 'CHALLAN_GENERATED'),
(3, 3, 3, 3, 5, 3, '2026-11-01 09:15:00', NULL, 'Rider observed without ISI certified helmet', 'CHALLAN_GENERATED'),
(4, 4, 4, 5, 7, 1, '2026-11-05 18:30:00', NULL, 'Driver speaking on handheld device while navigating roundabout', 'CHALLAN_GENERATED'),
(5, 5, 5, 4, 2, 4, '2026-11-10 16:10:00', NULL, 'Driver without seatbelt fastened on Ring Road flyover', 'CHALLAN_GENERATED'),
(6, 6, 6, 1, 1, 1, '2026-11-12 21:05:00', 85, 'High speed night driving detected on Barakhamba Radial', 'CHALLAN_GENERATED'),
(7, 1, 1, 2, 2, 4, '2026-11-15 10:05:00', NULL, 'Signal jumping at Dhaula Kuan bypass', 'CHALLAN_GENERATED'),
(8, 1, 1, 1, 7, 1, '2026-11-18 17:40:00', 72, 'Overspeeding in CyberHub approach lane', 'CHALLAN_GENERATED'),
(9, 7, NULL, 6, 6, 3, '2026-11-20 08:30:00', NULL, 'Heavy truck entering one-way ramp during peak hours', 'LOGGED');

-- 9. Evidence
INSERT INTO evidence (evidence_id, violation_id, media_type, storage_path, mongo_evidence_id, captured_at, file_size_kb, md5_hash) VALUES
(1, 1, 'IMAGE', '/uploads/evidence/ev_001.jpg', '655e8c11a0b1c2d3e4f50001', '2026-10-15 11:20:05', 420, 'd41d8cd98f00b204e9800998ecf8427e'),
(2, 2, 'IMAGE', '/uploads/evidence/ev_002.jpg', '655e8c11a0b1c2d3e4f50002', '2026-10-20 14:45:08', 512, '9e107d9d372bb6826bd81d3542a419d6'),
(3, 3, 'IMAGE', '/uploads/evidence/ev_003.jpg', '655e8c11a0b1c2d3e4f50003', '2026-11-01 09:15:10', 380, 'c4ca4238a0b923820dcc509a6f75849b'),
(4, 4, 'IMAGE', '/uploads/evidence/ev_004.jpg', '655e8c11a0b1c2d3e4f50004', '2026-11-05 18:30:12', 450, 'c81e728d9d4c2f636f067f89cc14862c'),
(5, 5, 'IMAGE', '/uploads/evidence/ev_005.jpg', '655e8c11a0b1c2d3e4f50005', '2026-11-10 16:10:02', 395, 'eccbc87e4b5ce2fe28308fd9f2a7baf3');

-- 10. Challans
INSERT INTO challan (challan_id, challan_number, violation_id, fine_amount, late_fee, total_amount, issue_date, due_date, status, appeal_window_end, version) VALUES
(1, 'CH-20261015-81923', 1, 2000.00, 200.00, 2200.00, '2026-10-15', '2026-11-14', 'OVERDUE', '2026-10-30', 2),
(2, 'CH-20261020-55412', 2, 1000.00, 0.00, 1000.00, '2026-10-20', '2026-11-19', 'UNPAID', '2026-11-04', 1),
(3, 'CH-20261101-99210', 3, 1000.00, 0.00, 1000.00, '2026-11-01', '2026-12-01', 'APPEALED', '2026-11-16', 2),
(4, 'CH-20261105-33129', 4, 5000.00, 0.00, 5000.00, '2026-11-05', '2026-12-05', 'UNPAID', '2026-11-20', 1),
(5, 'CH-20261110-14920', 5, 1000.00, 0.00, 1000.00, '2026-11-10', '2026-12-10', 'UNPAID', '2026-11-25', 1),
(6, 'CH-20261112-78219', 6, 2000.00, 0.00, 2000.00, '2026-11-12', '2026-12-12', 'UNPAID', '2026-11-27', 1),
(7, 'CH-20261115-44219', 7, 1000.00, 0.00, 1000.00, '2026-11-15', '2026-12-15', 'UNPAID', '2026-11-30', 1),
(8, 'CH-20261118-88391', 8, 2000.00, 0.00, 2000.00, '2026-11-18', '2026-12-18', 'UNPAID', '2026-12-03', 1);

-- 11. Payments
INSERT INTO payment (payment_id, challan_id, amount_paid, payment_date, payment_method, transaction_reference, gateway_status, receipt_number) VALUES
(1, 2, 1000.00, '2026-10-22 15:30:00', 'UPI', 'TXN-UPI-992817293810', 'SUCCESS', 'RCP-20261022153000-8812');

UPDATE challan SET status = 'PAID', version = 2 WHERE challan_id = 2;

-- 12. Appeals
INSERT INTO appeal (appeal_id, challan_id, reason, appeal_date, status, reviewing_officer_id, decision_date, officer_remarks) VALUES
(1, 3, 'I was wearing a state-approved protective helmet with reflective strip. The lighting camera angle obscured it.', '2026-11-03', 'PENDING', NULL, NULL, NULL);

-- 13. Audit Log Entries
INSERT INTO challan_audit (challan_id, old_status, new_status, old_amount, new_amount, action, performed_by) VALUES
(1, NULL, 'UNPAID', 0.00, 2000.00, 'CHALLAN_CREATED', 'SYSTEM'),
(1, 'UNPAID', 'OVERDUE', 2000.00, 2200.00, 'LATE_FEE_APPLIED', 'BATCH_JOB'),
(2, NULL, 'UNPAID', 0.00, 1000.00, 'CHALLAN_CREATED', 'SYSTEM'),
(2, 'UNPAID', 'PAID', 1000.00, 1000.00, 'PAYMENT_RECEIVED', 'GATEWAY'),
(3, NULL, 'UNPAID', 0.00, 1000.00, 'CHALLAN_CREATED', 'SYSTEM'),
(3, 'UNPAID', 'APPEALED', 1000.00, 1000.00, 'APPEAL_FILED', 'CITIZEN_PORTAL');
