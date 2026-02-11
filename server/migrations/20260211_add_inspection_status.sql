-- Add inspection status and approver fields
ALTER TABLE daily_inspections
ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'completed' 
  CHECK (status IN ('draft', 'pending_approval', 'completed', 'rejected')),
ADD COLUMN approver_id INTEGER REFERENCES users(id),
ADD COLUMN approved_at TIMESTAMP,
ADD COLUMN rejected_at TIMESTAMP,
ADD COLUMN rejection_reason TEXT;

-- Add indexes for better query performance
CREATE INDEX daily_inspections_status_idx ON daily_inspections(status);
CREATE INDEX daily_inspections_approver_id_idx ON daily_inspections(approver_id);

-- Add the same columns to periodic inspections
ALTER TABLE periodic_inspections
ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'completed' 
  CHECK (status IN ('draft', 'pending_approval', 'completed', 'rejected')),
ADD COLUMN approver_id INTEGER REFERENCES users(id),
ADD COLUMN approved_at TIMESTAMP,
ADD COLUMN rejected_at TIMESTAMP,
ADD COLUMN rejection_reason TEXT;

-- Add indexes for periodic inspections
CREATE INDEX periodic_inspections_status_idx ON periodic_inspections(status);
CREATE INDEX periodic_inspections_approver_id_idx ON periodic_inspections(approver_id);
