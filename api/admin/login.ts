import { Hono, Context } from 'hono';  // <-- add Context here

const app = new Hono();

const ADMIN_USERNAME = "QNQgod1688";
const ADMIN_PASSWORD = "$$$QNQgod1688";

app.post('/login', async (c: Context) => {
  try {
    const { username, password } = await c.req.json();

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      return c.json({ success: true });
    } else {
      return c.json({ error: "Invalid credentials" }, 401);
    }
  } catch (error) {
    return c.json({ error: "Invalid request" }, 400);
  }
});

export default app;