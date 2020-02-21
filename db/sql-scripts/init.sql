CREATE DATABASE IF NOT EXISTS cus;

use cus;

CREATE TABLE IF NOT EXISTS customers (user_name VARCHAR(50) NOT NULL, contact_number VARCHAR(10) \
 NOT NULL, plan VARCHAR(20) NOT NULL, start_date DATE NOT NULL, end_date DATE NOT NULL, trials_left INT DEFAULT 1,\
 PRIMARY KEY(contact_number)) ;

 INSERT INTO customers(user_name, contact_number, plan, start_date, end_date, trials_left)
 values("Test_user", "000000000", "FREE", '2000-01-01', '2100-06-13', 1);