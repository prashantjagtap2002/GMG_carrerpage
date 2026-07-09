CREATE TABLE IF NOT EXISTS applications (
  id VARCHAR(255) PRIMARY KEY,
  job_id VARCHAR(255) NOT NULL,
  job_title VARCHAR(255) NOT NULL,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  current_title VARCHAR(255),
  country VARCHAR(255),
  website VARCHAR(255),
  source VARCHAR(255),
  message TEXT,
  resume_name VARCHAR(255),
  resume_link VARCHAR(255),
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  stage VARCHAR(50) NOT NULL
);
