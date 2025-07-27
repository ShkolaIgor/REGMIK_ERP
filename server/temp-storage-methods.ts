// Temporary file with new storage methods to add to db-storage.ts

// Add this method to DatabaseStorage class:

async getDepartments(): Promise<Department[]> {
  return await db.select().from(departments).where(eq(departments.isActive, true));
}

async getCategoriesWithDepartments(): Promise<(Category & { department?: Department })[]> {
  const result = await db
    .select({
      id: categories.id,
      name: categories.name,
      description: categories.description,
      departmentId: categories.departmentId,
      department: {
        id: departments.id,
        name: departments.name,
        description: departments.description,
        managerId: departments.managerId,
        isActive: departments.isActive,
        createdAt: departments.createdAt,
        updatedAt: departments.updatedAt,
      }
    })
    .from(categories)
    .leftJoin(departments, eq(categories.departmentId, departments.id));

  return result.map(row => ({
    id: row.id,
    name: row.name,
    description: row.description,
    departmentId: row.departmentId,
    department: row.department.id ? row.department : undefined
  }));
}