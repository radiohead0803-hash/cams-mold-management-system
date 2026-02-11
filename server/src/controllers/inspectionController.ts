import { Request, Response } from 'express';
import { pool } from '../db';
import { NotFoundError } from '../errors/notFoundError';
import { BadRequestError } from '../errors/badRequestError';
import { NotAuthorizedError } from '../errors/notAuthorizedError';

export const saveDailyInspectionDraft = async (req: Request, res: Response) => {
  const { session_id, mold_id, production_quantity, ng_quantity, checklist_items, notes } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const result = await client.query(
      `INSERT INTO daily_inspections 
       (session_id, mold_id, production_quantity, ng_quantity, checklist_items, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'draft')
       RETURNING id`,
      [session_id, mold_id, production_quantity, ng_quantity, JSON.stringify(checklist_items), notes]
    );

    await client.query('COMMIT');
    res.status(201).json({ id: result.rows[0].id });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export const requestDailyInspectionApproval = async (req: Request, res: Response) => {
  const { session_id, mold_id, production_quantity, ng_quantity, checklist_items, notes, approver_id } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Verify approver exists and is system_admin
    const approverResult = await client.query(
      'SELECT role FROM users WHERE id = $1',
      [approver_id]
    );

    if (approverResult.rows.length === 0) {
      throw new NotFoundError('승인자를 찾을 수 없습니다');
    }

    if (approverResult.rows[0].role !== 'system_admin') {
      throw new BadRequestError('승인자는 시스템 관리자여야 합니다');
    }

    const result = await client.query(
      `INSERT INTO daily_inspections 
       (session_id, mold_id, production_quantity, ng_quantity, checklist_items, notes, status, approver_id)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending_approval', $7)
       RETURNING id`,
      [session_id, mold_id, production_quantity, ng_quantity, JSON.stringify(checklist_items), notes, approver_id]
    );

    await client.query('COMMIT');
    res.status(201).json({ id: result.rows[0].id });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export const submitDailyInspection = async (req: Request, res: Response) => {
  const { session_id, mold_id, production_quantity, ng_quantity, checklist_items, notes } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const result = await client.query(
      `INSERT INTO daily_inspections 
       (session_id, mold_id, production_quantity, ng_quantity, checklist_items, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'completed')
       RETURNING id`,
      [session_id, mold_id, production_quantity, ng_quantity, JSON.stringify(checklist_items), notes]
    );

    await client.query('COMMIT');
    res.status(201).json({ id: result.rows[0].id });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export const approveDailyInspection = async (req: Request, res: Response) => {
  const { id } = req.params;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Verify inspection exists and is pending approval
    const inspectionResult = await client.query(
      'SELECT status, approver_id FROM daily_inspections WHERE id = $1',
      [id]
    );

    if (inspectionResult.rows.length === 0) {
      throw new NotFoundError('점검 기록을 찾을 수 없습니다');
    }

    const inspection = inspectionResult.rows[0];
    if (inspection.status !== 'pending_approval') {
      throw new BadRequestError('승인 대기 중인 점검만 승인할 수 있습니다');
    }

    if (inspection.approver_id !== req.user!.id) {
      throw new NotAuthorizedError('지정된 승인자만 승인할 수 있습니다');
    }

    await client.query(
      `UPDATE daily_inspections 
       SET status = 'completed', approved_at = NOW()
       WHERE id = $1`,
      [id]
    );

    await client.query('COMMIT');
    res.status(200).json({ message: '점검이 승인되었습니다' });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export const rejectDailyInspection = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { rejection_reason } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Verify inspection exists and is pending approval
    const inspectionResult = await client.query(
      'SELECT status, approver_id FROM daily_inspections WHERE id = $1',
      [id]
    );

    if (inspectionResult.rows.length === 0) {
      throw new NotFoundError('점검 기록을 찾을 수 없습니다');
    }

    const inspection = inspectionResult.rows[0];
    if (inspection.status !== 'pending_approval') {
      throw new BadRequestError('승인 대기 중인 점검만 반려할 수 있습니다');
    }

    if (inspection.approver_id !== req.user!.id) {
      throw new NotAuthorizedError('지정된 승인자만 반려할 수 있습니다');
    }

    await client.query(
      `UPDATE daily_inspections 
       SET status = 'rejected', rejected_at = NOW(), rejection_reason = $2
       WHERE id = $1`,
      [id, rejection_reason]
    );

    await client.query('COMMIT');
    res.status(200).json({ message: '점검이 반려되었습니다' });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export const getDailyInspectionsByStatus = async (req: Request, res: Response) => {
  const { status } = req.params;
  const validStatuses = ['draft', 'pending_approval', 'completed', 'rejected'];
  
  if (!validStatuses.includes(status)) {
    throw new BadRequestError('유효하지 않은 상태입니다');
  }

  const result = await pool.query(
    `SELECT 
       di.*,
       u.name as approver_name,
       m.code as mold_code,
       m.name as mold_name
     FROM daily_inspections di
     LEFT JOIN users u ON di.approver_id = u.id
     LEFT JOIN molds m ON di.mold_id = m.id
     WHERE di.status = $1
     ORDER BY di.created_at DESC`,
    [status]
  );

  res.json(result.rows);
};

export const getDailyInspection = async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await pool.query(
    `SELECT 
       di.*,
       u.name as approver_name,
       m.code as mold_code,
       m.name as mold_name
     FROM daily_inspections di
     LEFT JOIN users u ON di.approver_id = u.id
     LEFT JOIN molds m ON di.mold_id = m.id
     WHERE di.id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('점검 기록을 찾을 수 없습니다');
  }

  res.json(result.rows[0]);
};
