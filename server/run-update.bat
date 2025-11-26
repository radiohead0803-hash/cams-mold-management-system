@echo off
echo ========================================
echo Railway Database Update Script
echo ========================================
echo.

cd /d "%~dp0"

echo Connecting to Railway PostgreSQL...
echo.

railway run psql -c "ALTER TABLE mold_specifications ADD COLUMN IF NOT EXISTS mold_id INTEGER;"
if %errorlevel% neq 0 (
    echo Error: Failed to add column
    pause
    exit /b 1
)

railway run psql -c "DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_mold_specifications_mold_id') THEN ALTER TABLE mold_specifications ADD CONSTRAINT fk_mold_specifications_mold_id FOREIGN KEY (mold_id) REFERENCES molds(id) ON UPDATE CASCADE ON DELETE SET NULL; END IF; END $$;"
if %errorlevel% neq 0 (
    echo Error: Failed to add foreign key
    pause
    exit /b 1
)

railway run psql -c "CREATE INDEX IF NOT EXISTS idx_mold_specifications_mold_id ON mold_specifications(mold_id);"
if %errorlevel% neq 0 (
    echo Error: Failed to create index
    pause
    exit /b 1
)

railway run psql -c "UPDATE mold_specifications ms SET mold_id = m.id FROM molds m WHERE m.specification_id = ms.id AND ms.mold_id IS NULL;"
if %errorlevel% neq 0 (
    echo Error: Failed to update data
    pause
    exit /b 1
)

echo.
echo ========================================
echo Verification Query
echo ========================================
railway run psql -c "SELECT COUNT(*) as total_specs, COUNT(mold_id) as specs_with_mold_id FROM mold_specifications;"

echo.
echo ========================================
echo Update completed successfully!
echo ========================================
pause
