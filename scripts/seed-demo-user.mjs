#!/usr/bin/env node
/**
 * Create or refresh the demo advisor user on workspace 304.
 */

const AUTH_BASE = "https://x6if-wu0q-dtak.n7.xano.io/api:assetmark-pulse-auth";

const demoUser = {
  name: "Jordan Reed",
  email: "advisor.demo@assetmark.com",
  password: "DemoPass123!",
  advisor_id: 3,
};

async function ensureDemoUser() {
  const login = await fetch(`${AUTH_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: demoUser.email,
      password: demoUser.password,
    }),
  });

  if (login.ok) {
    console.log("Demo user already exists:", demoUser.email);
    return;
  }

  const signup = await fetch(`${AUTH_BASE}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(demoUser),
  });

  const body = await signup.text();
  if (!signup.ok) {
    throw new Error(`Failed to create demo user (${signup.status}): ${body}`);
  }

  console.log("Created demo user:", demoUser.email, "advisor_id:", demoUser.advisor_id);
}

ensureDemoUser().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
