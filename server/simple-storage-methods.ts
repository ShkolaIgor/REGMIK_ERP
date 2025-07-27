// Simple SQL-based methods for categories with departments

import { pool } from "./db";

export async function getDepartments() {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT * FROM departments WHERE is_active = true ORDER BY name'
    );
    return result.rows;
  } finally {
    client.release();
  }
}

export async function getCategoriesWithDepartments() {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT 
        c.id,
        c.name,
        c.description,
        c.department_id,
        d.id as dept_id,
        d.name as dept_name,
        d.description as dept_description,
        d.is_active as dept_is_active
      FROM categories c
      LEFT JOIN departments d ON c.department_id = d.id
      ORDER BY c.name
    `);
    
    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      departmentId: row.department_id,
      department: row.dept_id ? {
        id: row.dept_id,
        name: row.dept_name,
        description: row.dept_description,
        isActive: row.dept_is_active,
        managerId: null,
        createdAt: null,
        updatedAt: null
      } : undefined
    }));
  } finally {
    client.release();
  }
}