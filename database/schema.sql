CREATE TABLE IF NOT EXISTS guests_aiman (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  phone_number VARCHAR(32) NOT NULL,
  attendance ENUM('attending', 'not_attending') NOT NULL,
  guest_count TINYINT UNSIGNED NOT NULL DEFAULT 1,
  message VARCHAR(500) NULL,
  display_wish BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY guests_phone_number_unique (phone_number),
  CONSTRAINT guests_guest_count_check CHECK (guest_count BETWEEN 0 AND 10)
);

