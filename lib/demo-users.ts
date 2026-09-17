export const DEMO_USERS = [
  { id: "11111111-1111-4111-8111-111111111111", name: "Mira Shah", email: "mira@ajaia.demo" },
  { id: "22222222-2222-4222-8222-222222222222", name: "Alex Chen", email: "alex@ajaia.demo" },
  { id: "33333333-3333-4333-8333-333333333333", name: "Jordan Lee", email: "jordan@ajaia.demo" },
] as const;

export type DemoUser = (typeof DEMO_USERS)[number];
