-- MyWork – MySQL / MariaDB schema (MariaDB 10.3+ or MySQL 8+)
--
-- phpMyAdmin: select (or create) the `mywork` database, open the Import tab,
-- choose this file and click Import. Safe to import again: tables are only
-- created when missing, and nothing is deleted.
--
-- All rules (who can see what, check-in times, leave balance, approvals) are
-- enforced by the PHP API in /api, so the database needs no triggers or
-- stored procedures.

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS employees (
  id                INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  email             VARCHAR(190) NOT NULL UNIQUE,
  password_hash     VARCHAR(255) NOT NULL,
  employee_id       VARCHAR(32)  NULL UNIQUE,
  full_name         VARCHAR(120) NOT NULL,
  job_title         VARCHAR(120) NOT NULL DEFAULT '',
  department        VARCHAR(120) NOT NULL DEFAULT '',
  phone             VARCHAR(40)  NOT NULL DEFAULT '',
  address           VARCHAR(255) NOT NULL DEFAULT '',
  joined_on         DATE         NULL,
  status            ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
  app_role          ENUM('employee','manager') NOT NULL DEFAULT 'employee',
  annual_leave_days TINYINT UNSIGNED NOT NULL DEFAULT 12,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Times are stored in UTC; work_date is the company's local date.
CREATE TABLE IF NOT EXISTS attendance (
  id        INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id   INT UNSIGNED NOT NULL,
  work_date DATE NOT NULL,
  check_in  DATETIME NOT NULL,
  check_out DATETIME NULL,
  location  VARCHAR(120) NOT NULL DEFAULT 'Head Office',
  UNIQUE KEY one_per_day (user_id, work_date),
  CONSTRAINT attendance_user FOREIGN KEY (user_id) REFERENCES employees (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS requests (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id         INT UNSIGNED NOT NULL,
  type            ENUM('cuti','izin','lembur','reimburse') NOT NULL,
  title           VARCHAR(60) NOT NULL,
  date_from       DATE NOT NULL,
  date_to         DATE NOT NULL,
  note            TEXT NOT NULL,
  amount          DECIMAL(14,2) NULL,
  category        VARCHAR(60) NULL,
  attachment_file VARCHAR(80)  NULL,
  attachment_name VARCHAR(255) NULL,
  status          ENUM('Pending','Approved','Rejected') NOT NULL DEFAULT 'Pending',
  review_note     VARCHAR(500) NULL,
  reviewed_by     INT UNSIGNED NULL,
  reviewed_at     DATETIME NULL,
  created_at      DATETIME NOT NULL,
  KEY requests_user (user_id, created_at),
  KEY requests_status (status),
  CONSTRAINT requests_user FOREIGN KEY (user_id) REFERENCES employees (id) ON DELETE CASCADE,
  CONSTRAINT requests_reviewer FOREIGN KEY (reviewed_by) REFERENCES employees (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notifications (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NOT NULL,
  title      VARCHAR(120) NOT NULL,
  body       VARCHAR(500) NOT NULL DEFAULT '',
  icon       VARCHAR(30)  NOT NULL DEFAULT 'bell',
  color      ENUM('blue','red','green','orange','purple') NOT NULL DEFAULT 'blue',
  link       VARCHAR(60)  NULL,
  is_read    TINYINT(1)   NOT NULL DEFAULT 0,
  created_at DATETIME     NOT NULL,
  KEY notifications_user (user_id, created_at),
  CONSTRAINT notifications_user FOREIGN KEY (user_id) REFERENCES employees (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS announcements (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  category     ENUM('Company','HR','IT') NOT NULL,
  icon         VARCHAR(30) NOT NULL DEFAULT 'megaphone',
  color        ENUM('blue','red','green','orange','purple') NOT NULL DEFAULT 'blue',
  title        VARCHAR(160) NOT NULL,
  body         TEXT NOT NULL,
  published_on DATE NOT NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Uploaded files live on disk (see storage_dir in api/config.php) under a random name.
CREATE TABLE IF NOT EXISTS documents (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED NOT NULL,
  name        VARCHAR(160) NOT NULL,
  file_name   VARCHAR(255) NOT NULL,
  size_bytes  INT UNSIGNED NOT NULL DEFAULT 0,
  kind        ENUM('blue','red','green','orange','purple') NOT NULL DEFAULT 'blue',
  stored_name VARCHAR(80) NOT NULL UNIQUE,
  created_at  DATETIME NOT NULL,
  CONSTRAINT documents_user FOREIGN KEY (user_id) REFERENCES employees (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- earnings / deductions: JSON arrays of [label, amount], e.g. [["Basic Salary", 6500000]]
CREATE TABLE IF NOT EXISTS payslips (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NOT NULL,
  period     CHAR(7) NOT NULL COMMENT 'YYYY-MM',
  earnings   LONGTEXT NOT NULL,
  deductions LONGTEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY one_per_month (user_id, period),
  CONSTRAINT payslips_user FOREIGN KEY (user_id) REFERENCES employees (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- user_id NULL = shown to everyone (e.g. public holidays)
CREATE TABLE IF NOT EXISTS schedule_events (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NULL,
  event_date DATE NOT NULL,
  start_time TIME NULL,
  title      VARCHAR(160) NOT NULL,
  place      VARCHAR(120) NOT NULL DEFAULT '',
  color      ENUM('blue','red','green','orange','purple') NOT NULL DEFAULT 'blue',
  is_holiday TINYINT(1) NOT NULL DEFAULT 0,
  KEY schedule_date (event_date),
  CONSTRAINT schedule_user FOREIGN KEY (user_id) REFERENCES employees (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Failed sign-ins, for slowing down password guessing.
CREATE TABLE IF NOT EXISTS login_attempts (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  email        VARCHAR(190) NOT NULL,
  ip           VARCHAR(45)  NOT NULL,
  attempted_at DATETIME     NOT NULL,
  KEY attempts_email (email, attempted_at),
  KEY attempts_ip (ip, attempted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
