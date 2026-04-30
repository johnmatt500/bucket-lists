CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS "user" (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR     NOT NULL,
  email           VARCHAR     NOT NULL UNIQUE,
  password_hash   VARCHAR     NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at   TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS bucket (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR     NOT NULL,
  location        VARCHAR,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by      UUID        NOT NULL REFERENCES "user"(id),
  expiration_date DATE,
  is_completed    BOOLEAN     NOT NULL DEFAULT FALSE,
  completion_date TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS bucket_member (
  bucket_id   UUID        NOT NULL REFERENCES bucket(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (bucket_id, user_id)
);

CREATE TABLE IF NOT EXISTS item (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_id            UUID        NOT NULL REFERENCES bucket(id) ON DELETE CASCADE,
  name                 VARCHAR     NOT NULL,
  full_address         VARCHAR,
  address_line_1       VARCHAR,
  address_line_2       VARCHAR,
  city                 VARCHAR,
  state_province       VARCHAR,
  postal_code          VARCHAR,
  country_code         CHAR(2),
  latitude             DECIMAL(9,6),
  longitude            DECIMAL(9,6),
  importance           INTEGER     NOT NULL CHECK (importance BETWEEN 1 AND 5),
  amount_time_required INTEGER     NOT NULL,
  time_scale           VARCHAR     NOT NULL CHECK (time_scale IN ('hours', 'days')),
  total_hours_required INTEGER     NOT NULL,
  status               VARCHAR     NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  is_completed         BOOLEAN     NOT NULL DEFAULT FALSE,
  completion_date      TIMESTAMPTZ,
  completed_by         UUID        REFERENCES "user"(id),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by           UUID        NOT NULL REFERENCES "user"(id)
);

CREATE TABLE IF NOT EXISTS item_vote (
  item_id   UUID        NOT NULL REFERENCES item(id) ON DELETE CASCADE,
  user_id   UUID        NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  vote      VARCHAR     NOT NULL CHECK (vote IN ('approve', 'reject')),
  cast_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (item_id, user_id)
);

CREATE TABLE IF NOT EXISTS invitation (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_id      UUID        NOT NULL REFERENCES bucket(id) ON DELETE CASCADE,
  invited_email  VARCHAR     NOT NULL,
  invited_by     UUID        NOT NULL REFERENCES "user"(id),
  token          UUID        NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at    TIMESTAMPTZ
);
