import { Router } from 'express';
import type { Request, Response } from 'express';
import { createItem, deleteItem, getItem, listItems } from './store';
import { ApiError } from './errors';
import { requireAuth } from './auth';

export const itemsRouter = Router();

itemsRouter.get('/', (_req: Request, res: Response) => {
  res.json(listItems());
});

itemsRouter.get('/:id', (req: Request, res: Response) => {
  const item = getItem(req.params.id);
  if (!item) {
    throw new ApiError(404, 'Item not found');
  }
  res.json(item);
});

itemsRouter.post('/', requireAuth, (req: Request, res: Response) => {
  const user = req.user;
  if (!user) {
    throw new ApiError(401, 'Not authenticated');
  }
  const { title, body } = req.body as { title?: unknown; body?: unknown };
  if (typeof title !== 'string' || title.trim() === '') {
    throw new ApiError(400, 'title is required');
  }
  if (body !== undefined && body !== null && typeof body !== 'string') {
    throw new ApiError(400, 'body must be a string');
  }
  const item = createItem({
    title: title.trim(),
    body: typeof body === 'string' ? body : null,
    ownerId: user.sub,
  });
  res.status(201).json(item);
});

itemsRouter.delete('/:id', requireAuth, (req: Request, res: Response) => {
  const user = req.user;
  if (!user) {
    throw new ApiError(401, 'Not authenticated');
  }
  const item = getItem(req.params.id);
  if (!item) {
    throw new ApiError(404, 'Item not found');
  }
  if (item.ownerId !== user.sub) {
    throw new ApiError(403, 'Only the owner can delete this item');
  }
  deleteItem(item.id);
  res.status(204).send();
});
