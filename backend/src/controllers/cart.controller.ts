import { Response } from 'express';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

/**
 * Get active cart items for the authenticated user.
 */
export async function getCart(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    const items = await prisma.cartItem.findMany({
      where: { userId: req.user.id },
      include: {
        menuItem: {
          select: {
            id: true,
            name: true,
            price: true,
            imageUrl: true,
            isAvailable: true,
            inStock: true,
          },
        },
      },
    });

    return res.status(200).json(items);
  } catch (error) {
    console.error('Get cart error:', error);
    return res.status(500).json({ error: 'Failed to retrieve cart items.' });
  }
}

/**
 * Add an item to the cart (or increment quantity if already present).
 */
export async function addToCart(req: AuthenticatedRequest, res: Response) {
  try {
    const { menuItemId, quantity } = req.body;
    const qty = quantity ? parseInt(quantity) : 1;

    if (!menuItemId) {
      return res.status(400).json({ error: 'Menu item ID is required.' });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    // Verify item exists and is available
    const item = await prisma.menuItem.findUnique({ where: { id: menuItemId } });
    if (!item || !item.isAvailable || !item.inStock) {
      return res.status(400).json({ error: 'This item is currently unavailable.' });
    }

    // Upsert cart item
    const cartItem = await prisma.cartItem.upsert({
      where: {
        userId_menuItemId: {
          userId: req.user.id,
          menuItemId,
        },
      },
      update: {
        quantity: { increment: qty },
      },
      create: {
        userId: req.user.id,
        menuItemId,
        quantity: qty,
      },
      include: { menuItem: true },
    });

    return res.status(200).json(cartItem);
  } catch (error) {
    console.error('Add to cart error:', error);
    return res.status(500).json({ error: 'Failed to add item to cart.' });
  }
}

/**
 * Update the quantity of a specific cart item.
 */
export async function updateCartItem(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params; // Cart item ID
    const { quantity } = req.body;

    if (quantity === undefined || parseInt(quantity) <= 0) {
      return res.status(400).json({ error: 'Valid quantity greater than 0 is required.' });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    // Ensure cart item belongs to the user
    const cartItem = await prisma.cartItem.findUnique({ where: { id } });
    if (!cartItem || cartItem.userId !== req.user.id) {
      return res.status(404).json({ error: 'Cart item not found.' });
    }

    const updated = await prisma.cartItem.update({
      where: { id },
      data: { quantity: parseInt(quantity) },
      include: { menuItem: true },
    });

    return res.status(200).json(updated);
  } catch (error) {
    console.error('Update cart item error:', error);
    return res.status(500).json({ error: 'Failed to update cart item.' });
  }
}

/**
 * Remove an item from the cart.
 */
export async function removeFromCart(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params; // Cart item ID

    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    // Ensure cart item belongs to the user
    const cartItem = await prisma.cartItem.findUnique({ where: { id } });
    if (!cartItem || cartItem.userId !== req.user.id) {
      return res.status(404).json({ error: 'Cart item not found.' });
    }

    await prisma.cartItem.delete({ where: { id } });
    return res.status(200).json({ message: 'Item removed from cart.' });
  } catch (error) {
    console.error('Remove from cart error:', error);
    return res.status(500).json({ error: 'Failed to remove item from cart.' });
  }
}

/**
 * Empty the user's cart.
 */
export async function clearCart(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    await prisma.cartItem.deleteMany({ where: { userId: req.user.id } });
    return res.status(200).json({ message: 'Cart cleared.' });
  } catch (error) {
    console.error('Clear cart error:', error);
    return res.status(500).json({ error: 'Failed to clear cart.' });
  }
}
