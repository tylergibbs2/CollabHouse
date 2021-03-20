CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE TYPE element_type AS ENUM ('link', 'image', 'video', 'contact');

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE old_tokens (
    token TEXT NOT NULL,
    nulled_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE rooms (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4 (),
    name TEXT NOT NULL,
    last_updated TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE room_elements (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4 (),
    room_id uuid NOT NULL REFERENCES rooms(id),
    type element_type NOT NULL,
    content TEXT NOT NULL,
    x_pos INTEGER NOT NULL,
    y_pos INTEGER NOT NULL
);