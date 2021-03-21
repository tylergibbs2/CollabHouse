CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE TYPE element_type AS ENUM ('link', 'image', 'video', 'contact', 'text', 'code', 'title');

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
    creator INTEGER NOT NULL REFERENCES users(id),
    last_updated TIMESTAMP NOT NULL DEFAULT NOW() at time zone 'utc',
    created_at TIMESTAMP NOT NULL DEFAULT NOW() at time zone 'utc'
);

CREATE TABLE discord_watched_channels (
    channel_id BIGINT NOT NULL,
    room_id uuid NOT NULL REFERENCES rooms(id),
    PRIMARY KEY (channel_id, room_id)
);

CREATE TABLE room_components (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4 (),
    room_id uuid NOT NULL REFERENCES rooms(id),
    type element_type NOT NULL,
    content TEXT NOT NULL,
    content_extra TEXT,
    x_pos INTEGER NOT NULL,
    y_pos INTEGER NOT NULL,
    width INTEGER NOT NULL DEFAULT 200,
    height INTEGER NOT NULL DEFAULT 200
);