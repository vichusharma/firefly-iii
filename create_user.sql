INSERT INTO firefly_users (
  email, 
  password, 
  name,
  blocked,
  blocked_code,
  created_at,
  updated_at
) VALUES (
  'demo@example.com',
  '$2y$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/KFm',
  'Demo User',
  0,
  '',
  NOW(),
  NOW()
);
