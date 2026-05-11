import app from "./server";

const getReq = (path: string) => app.fetch(new Request(`http://localhost${path}`));
const postReq = (path: string, body: object) =>
  app.fetch(new Request(`http://localhost${path}`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  }));

const json = async <T>(res: Response) => res.json() as Promise<T>;

async function runBenchmark(name: string, fn: () => Promise<void>, iterations = 1000) {
  const start = Date.now();
  for (let i = 0; i < iterations; i++) {
    await fn();
  }
  const elapsed = Date.now() - start;
  const reqPerSec = ((iterations * 1000) / elapsed).toFixed(2);
  console.log(`${name}: ${reqPerSec} req/s (${elapsed}ms for ${iterations} iterations)`);
}

const testEmail = `bench${Date.now()}@example.com`;

await runBenchmark("GET /", async () => {
  const res = await getReq("/");
  await json(res);
});

await runBenchmark("GET /api/v1/tables", async () => {
  const res = await getReq("/api/v1/tables");
  await json(res);
});

await runBenchmark("GET /api/v1/tables/users", async () => {
  const res = await getReq("/api/v1/tables/users");
  await json(res);
});

await runBenchmark("GET /api/v1/users", async () => {
  const res = await getReq("/api/v1/users");
  await json(res);
});

await runBenchmark("GET /api/v1/users/1", async () => {
  const res = await getReq("/api/v1/users/1");
  await json(res);
});

await runBenchmark("POST /api/v1/auth/register", async () => {
  const res = await postReq("/api/v1/auth/register", {
    email: `bench${Math.random()}@example.com`,
    password: "testpass123",
  });
  await json(res);
}, 100);

const loginRes = await postReq("/api/v1/auth/login", {
  email: testEmail,
  password: "testpass123",
});
await json(loginRes);

await runBenchmark("POST /api/v1/auth/login", async () => {
  const res = await postReq("/api/v1/auth/login", {
    email: testEmail,
    password: "testpass123",
  });
  await json(res);
}, 100);

console.log("\nBenchmark complete!");