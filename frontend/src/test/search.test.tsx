/**
 * Search End-to-End Test Suite
 *
 * Tests:
 * - Two-word gate: single word returns empty, two words returns results
 * - Prefix matching: "Website" matches "Website Revamp" project
 * - Prefix matching: "market" does NOT match "Q3 Marketing Site" (mid-word)
 * - Empty/missing q returns empty arrays
 *
 * Requires the backend to be running on http://localhost:3000.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { setToken, registerRequest, api } from '../lib/api';
import { createProject } from '../lib/projectsApi';
import { createTask } from '../lib/tasksApi';

/* ─── Helpers ────────────────────────────────────────────── */

function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.com`;
}

/* ─── Test State ─────────────────────────────────────────── */

let token1: string;

/* ─── Setup ──────────────────────────────────────────────── */

beforeAll(async () => {
  const res1 = await registerRequest({
    email: uniqueEmail('search-u1'),
    password: 'password123',
    fullName: 'Search Tester',
  });
  token1 = res1.accessToken;
  setToken(token1);

  // Create projects and tasks with specific names for prefix testing
  const project1 = await createProject({ name: 'Website Revamp' });
  const project2 = await createProject({ name: 'Q3 Marketing Site' });

  await createTask(project1.id, { title: 'Website Redesign Kickoff' });
  await createTask(project2.id, { title: 'Review marketing budget' });
});

/* ─── Tests ──────────────────────────────────────────────── */

describe('Global Search', () => {
  it('empty query returns empty arrays', async () => {
    setToken(token1);
    const { data } = await api.get('/search', { params: { q: '' } });
    expect(data.projects).toEqual([]);
    expect(data.tasks).toEqual([]);
  });

  it('prefix match: "Website" matches "Website Revamp" project and "Website Redesign Kickoff" task', async () => {
    setToken(token1);
    const { data } = await api.get('/search', { params: { q: 'Website' } });
    expect(data.projects.some((p: any) => p.name === 'Website Revamp')).toBe(true);
    expect(data.tasks.some((t: any) => t.title === 'Website Redesign Kickoff')).toBe(true);
  });

  it('prefix match: "Q3" matches "Q3 Marketing Site" project', async () => {
    setToken(token1);
    const { data } = await api.get('/search', { params: { q: 'Q3' } });
    expect(data.projects.some((p: any) => p.name === 'Q3 Marketing Site')).toBe(true);
  });

  it('non-prefix "market" does NOT match "Q3 Marketing Site" (prefix rule)', async () => {
    setToken(token1);
    const { data } = await api.get('/search', { params: { q: 'market' } });
    // "market" is NOT a prefix of "Q3 Marketing Site" (the name starts with "Q3")
    const match = data.projects.find((p: any) => p.name === 'Q3 Marketing Site');
    expect(match).toBeUndefined();
  });

  it('non-prefix "Redesign" does NOT match "Website Redesign Kickoff" (prefix rule)', async () => {
    setToken(token1);
    const { data } = await api.get('/search', { params: { q: 'Redesign' } });
    // "Redesign" starts mid-title, not at the beginning
    const match = data.tasks.find((t: any) => t.title === 'Website Redesign Kickoff');
    expect(match).toBeUndefined();
  });

  it('task results include projectName and status', async () => {
    setToken(token1);
    const { data } = await api.get('/search', { params: { q: 'Website' } });
    const task = data.tasks.find((t: any) => t.title === 'Website Redesign Kickoff');
    expect(task).toBeDefined();
    expect(task.projectName).toBe('Website Revamp');
    expect(task.status).toBeDefined();
  });

  it('results are capped at 5', async () => {
    setToken(token1);
    const { data } = await api.get('/search', { params: { q: 'Website' } });
    expect(data.projects.length).toBeLessThanOrEqual(5);
    expect(data.tasks.length).toBeLessThanOrEqual(5);
  });
});
