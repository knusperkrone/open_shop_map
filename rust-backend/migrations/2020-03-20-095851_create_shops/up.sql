-- Your SQL goes here

CREATE TABLE shops
(
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    url VARCHAR(255) NOT NULL,
    descr TEXT NOT NULL,
    location geography(point, 4326) NOT NULL,
    last_edited TIMESTAMP DEFAULT current_timestamp NOT NULL,
    UNIQUE(title, location)
);
