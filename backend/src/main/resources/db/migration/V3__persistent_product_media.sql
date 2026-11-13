CREATE TABLE product_media (name varchar(40) PRIMARY KEY, content bytea NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
