export interface User {
  id: string;
  username: string;
  password: string;
}

export interface Item {
  id: string;
  title: string;
  body: string | null;
  ownerId: string;
  createdAt: string;
}

/** Demo users. Passwords are plaintext on purpose: this is a drill with no database. */
export const users: User[] = [
  { id: 'u-alice', username: 'alice', password: 'password123' },
  { id: 'u-bob', username: 'bob', password: 'password123' },
];

const items = new Map<string, Item>();
let counter = 0;

export function findUser(username: string): User | undefined {
  return users.find((user) => user.username === username);
}

export function listItems(): Item[] {
  return [...items.values()];
}

export function getItem(id: string): Item | undefined {
  return items.get(id);
}

export function createItem(input: {
  title: string;
  body: string | null;
  ownerId: string;
}): Item {
  counter += 1;
  const item: Item = {
    id: `item-${counter}`,
    title: input.title,
    body: input.body,
    ownerId: input.ownerId,
    createdAt: new Date().toISOString(),
  };
  items.set(item.id, item);
  return item;
}

export function deleteItem(id: string): boolean {
  return items.delete(id);
}

/** Test helper: clears all items and resets the id counter. */
export function resetStore(): void {
  items.clear();
  counter = 0;
}
