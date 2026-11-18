import express from 'express';
import type { Express, NextFunction, Request, Response } from 'express';
import { itemsRouter } from './items';
import { login } from './auth';
import { ApiError } from './errors';

export function createApp(): Express {
  const app = express();
  app.use(express.json());

  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok' });
  });

  app.post('/auth/login', (req: Request, res: Response) => {
    const { username, password } = req.body as {
      username?: unknown;
      password?: unknown;
    };
    if (typeof username !== 'string' || typeof password !== 'string') {
      throw new ApiError(400, 'username and password are required');
    }
    const token = login(username, password);
    res.json({ token });
  });

  app.use('/items', itemsRouter);

  app.use((_req: Request, _res: Response, next: NextFunction) => {
    next(new ApiError(404, 'Not found'));
  });

  app.use(
    (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
      if (err instanceof SyntaxError) {
        res.status(400).json({ error: 'Invalid JSON' });
        return;
      }
      if (err instanceof ApiError) {
        res.status(err.status).json({ error: err.message });
        return;
      }
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    },
  );

  return app;
}
