import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { resetStore } from '../src/store';

const app = createApp();

async function loginAs(username: string, password = 'password123'): Promise<string> {
  const res = await request(app)
    .post('/auth/login')
    .send({ username, password });
  expect(res.status).toBe(200);
  return res.body.token as string;
}

describe('muse-drill-rest-api', () => {
  beforeEach(() => {
    resetStore();
  });

  it('POST /auth/login with valid credentials returns a JWT', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ username: 'alice', password: 'password123' });
    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe('string');
    expect((res.body.token as string).split('.')).toHaveLength(3);
  });

  it('POST /auth/login with a wrong password returns 401', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ username: 'alice', password: 'nope' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid credentials');
  });

  it('POST /items without a token returns 401', async () => {
    const res = await request(app).post('/items').send({ title: 'x' });
    expect(res.status).toBe(401);
  });

  it('POST /items with a token creates an item owned by the caller', async () => {
    const token = await loginAs('alice');
    const res = await request(app)
      .post('/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'First', body: 'hello' });
    expect(res.status).toBe(201);
    expect(res.body.ownerId).toBe('u-alice');
    expect(res.body.title).toBe('First');
    expect(res.body.id).toBe('item-1');
  });

  it('GET /items and GET /items/:id return created items', async () => {
    const token = await loginAs('alice');
    const created = await request(app)
      .post('/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Listed' });
    expect(created.status).toBe(201);

    const list = await request(app).get('/items');
    expect(list.status).toBe(200);
    expect(list.body).toHaveLength(1);

    const one = await request(app).get(`/items/${created.body.id as string}`);
    expect(one.status).toBe(200);
    expect(one.body.title).toBe('Listed');

    const missing = await request(app).get('/items/nope');
    expect(missing.status).toBe(404);
  });

  it('DELETE /items/:id by the owner returns 204 and the item is gone', async () => {
    const token = await loginAs('alice');
    const created = await request(app)
      .post('/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Mine' });
    const id = created.body.id as string;

    const del = await request(app)
      .delete(`/items/${id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(del.status).toBe(204);

    const gone = await request(app).get(`/items/${id}`);
    expect(gone.status).toBe(404);
  });

  it("DELETE /items/:id by another user returns 403 (access control)", async () => {
    const alice = await loginAs('alice');
    const bob = await loginAs('bob');
    const created = await request(app)
      .post('/items')
      .set('Authorization', `Bearer ${alice}`)
      .send({ title: "Alice's item" });
    const id = created.body.id as string;

    const del = await request(app)
      .delete(`/items/${id}`)
      .set('Authorization', `Bearer ${bob}`);
    expect(del.status).toBe(403);
    expect(del.body.error).toBe('Only the owner can delete this item');

    // The item must still exist afterwards.
    const stillThere = await request(app).get(`/items/${id}`);
    expect(stillThere.status).toBe(200);
    expect(stillThere.body.ownerId).toBe('u-alice');
  });
});
