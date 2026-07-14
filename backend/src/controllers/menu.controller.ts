import { Request, Response } from 'express';
import prisma from '../config/db';

// ==========================================
// PUBLIC ENDPOINTS
// ==========================================

/**
 * Get all active categories sorted by sortOrder.
 */
export async function getCategories(req: Request, res: Response) {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    return res.status(200).json({ success: true, data: categories });
  } catch (error) {
    console.error('Get categories error:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve categories.' });
  }
}

/**
 * Get menu items, with optional category filtering.
 */
export async function getMenuItems(req: Request, res: Response) {
  try {
    const { categoryId } = req.query;

    const whereClause: any = { isAvailable: true };
    if (categoryId && typeof categoryId === 'string') {
      whereClause.categoryId = categoryId;
    }

    const items = await prisma.menuItem.findMany({
      where: whereClause,
      include: {
        category: {
          select: { name: true },
        },
      },
    });

    return res.status(200).json({ success: true, data: items });
  } catch (error) {
    console.error('Get menu items error:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve menu items.' });
  }
}

/**
 * Get a single menu item by ID.
 */
export async function getMenuItemById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const item = await prisma.menuItem.findUnique({
      where: { id },
      include: {
        category: { select: { name: true } },
      },
    });

    if (!item) {
      return res.status(404).json({ success: false, error: 'Menu item not found.' });
    }

    return res.status(200).json({ success: true, data: item });
  } catch (error) {
    console.error('Get menu item by ID error:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve menu item.' });
  }
}

/**
 * Search menu items by query string.
 */
export async function searchMenu(req: Request, res: Response) {
  try {
    const { q } = req.query;
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ success: false, error: 'Search query is required.' });
    }

    const items = await prisma.menuItem.findMany({
      where: {
        isAvailable: true,
        OR: [
          { name: { contains: q } },
          { description: { contains: q } },
        ],
      },
      include: {
        category: { select: { name: true } },
      },
    });

    return res.status(200).json({ success: true, data: items });
  } catch (error) {
    console.error('Search menu error:', error);
    return res.status(500).json({ success: false, error: 'Failed to search menu.' });
  }
}

// ==========================================
// ADMIN/OWNER ENDPOINTS
// ==========================================

/**
 * Add a new category.
 */
export async function addCategory(req: Request, res: Response) {
  try {
    const { name, description, imageUrl, sortOrder } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Category name is required.' });
    }

    const newCategory = await prisma.category.create({
      data: {
        name,
        description,
        imageUrl,
        sortOrder: sortOrder ? parseInt(sortOrder) : 0,
      },
    });

    return res.status(201).json(newCategory);
  } catch (error) {
    console.error('Add category error:', error);
    return res.status(500).json({ error: 'Failed to create category.' });
  }
}

/**
 * Update an existing category.
 */
export async function updateCategory(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { name, description, imageUrl, sortOrder, isActive } = req.body;

    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    const updated = await prisma.category.update({
      where: { id },
      data: {
        name: name !== undefined ? name : category.name,
        description: description !== undefined ? description : category.description,
        imageUrl: imageUrl !== undefined ? imageUrl : category.imageUrl,
        sortOrder: sortOrder !== undefined ? parseInt(sortOrder) : category.sortOrder,
        isActive: isActive !== undefined ? isActive : category.isActive,
      },
    });

    return res.status(200).json(updated);
  } catch (error) {
    console.error('Update category error:', error);
    return res.status(500).json({ error: 'Failed to update category.' });
  }
}

/**
 * Delete a category.
 */
export async function deleteCategory(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // Check if category has menu items
    const itemCount = await prisma.menuItem.count({ where: { categoryId: id } });
    if (itemCount > 0) {
      return res.status(400).json({
        error: 'Cannot delete category containing menu items. Reassign items first.',
      });
    }

    await prisma.category.delete({ where: { id } });
    return res.status(200).json({ message: 'Category deleted successfully.' });
  } catch (error) {
    console.error('Delete category error:', error);
    return res.status(500).json({ error: 'Failed to delete category.' });
  }
}

/**
 * Add a new menu item.
 */
export async function addMenuItem(req: Request, res: Response) {
  try {
    const { categoryId, name, description, price, imageUrl, isAvailable, inStock } = req.body;

    if (!categoryId || !name || price === undefined) {
      return res.status(400).json({ error: 'Category, name, and price are required.' });
    }

    const newItem = await prisma.menuItem.create({
      data: {
        categoryId,
        name,
        description,
        price: parseFloat(price),
        imageUrl,
        isAvailable: isAvailable !== undefined ? isAvailable : true,
        inStock: inStock !== undefined ? inStock : true,
      },
    });

    return res.status(201).json(newItem);
  } catch (error) {
    console.error('Add menu item error:', error);
    return res.status(500).json({ error: 'Failed to create menu item.' });
  }
}

/**
 * Update an existing menu item.
 */
export async function updateMenuItem(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { categoryId, name, description, price, imageUrl, isAvailable, inStock } = req.body;

    const item = await prisma.menuItem.findUnique({ where: { id } });
    if (!item) {
      return res.status(404).json({ error: 'Menu item not found.' });
    }

    const updated = await prisma.menuItem.update({
      where: { id },
      data: {
        categoryId: categoryId !== undefined ? categoryId : item.categoryId,
        name: name !== undefined ? name : item.name,
        description: description !== undefined ? description : item.description,
        price: price !== undefined ? parseFloat(price) : item.price,
        imageUrl: imageUrl !== undefined ? imageUrl : item.imageUrl,
        isAvailable: isAvailable !== undefined ? isAvailable : item.isAvailable,
        inStock: inStock !== undefined ? inStock : item.inStock,
      },
    });

    return res.status(200).json(updated);
  } catch (error) {
    console.error('Update menu item error:', error);
    return res.status(500).json({ error: 'Failed to update menu item.' });
  }
}

/**
 * Delete a menu item.
 */
export async function deleteMenuItem(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await prisma.menuItem.delete({ where: { id } });
    return res.status(200).json({ message: 'Menu item deleted successfully.' });
  } catch (error) {
    console.error('Delete menu item error:', error);
    return res.status(500).json({ error: 'Failed to delete menu item.' });
  }
}
