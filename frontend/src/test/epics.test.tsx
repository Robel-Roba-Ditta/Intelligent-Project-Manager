/**
 * Epics End-to-End Test Suite
 *
 * Creates two projects, adds epics to each, and confirms
 * project-scoped isolation — Project A's list shows exactly
 * its epics and never leaks Project B's.
 *
 * Requires the backend to be running on http://localhost:3000.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { setToken, registerRequest } from '../common/lib/api';
import { createProject, type ProjectDto } from '../modules/project/api/projectsApi';
import { listEpics, createEpic, updateEpic, deleteEpic, type EpicDto } from '../modules/epic/api/epicsApi';

/* ─── Helpers ────────────────────────────────────────────── */

function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.com`;
}

/* ─── Test State ─────────────────────────────────────────── */

let token: string;
let projectA: ProjectDto;
let projectB: ProjectDto;
let epicAlpha: EpicDto;
let epicBeta: EpicDto;

/* ─── Setup ──────────────────────────────────────────────── */

beforeAll(async () => {
  // Register a user
  const res = await registerRequest({
    email: uniqueEmail('epic-tester'),
    password: 'password123',
    fullName: 'Epic Tester',
  });
  token = res.accessToken;
  setToken(token);

  // Create two projects
  projectA = await createProject({ name: 'Project A (Epics)' });
  projectB = await createProject({ name: 'Project B (Epics)' });

  // Create epics
  epicAlpha = await createEpic(projectA.id, { name: 'Epic Alpha' });
  epicBeta = await createEpic(projectA.id, { name: 'Epic Beta', status: 'IN_PROGRESS' });
  await createEpic(projectB.id, { name: 'Epic Gamma' });
});

/* ─── Tests ──────────────────────────────────────────────── */

describe('Epics — project-scoped CRUD', () => {
  it('Project A has exactly 2 epics', async () => {
    const epics = await listEpics(projectA.id);
    expect(epics).toHaveLength(2);
    const names = epics.map((e) => e.name).sort();
    expect(names).toEqual(['Epic Alpha', 'Epic Beta']);
  });

  it('Project B has exactly 1 epic', async () => {
    const epics = await listEpics(projectB.id);
    expect(epics).toHaveLength(1);
    expect(epics[0].name).toBe('Epic Gamma');
  });

  it('Project A epics never contain Project B data (no leak)', async () => {
    const epics = await listEpics(projectA.id);
    const names = epics.map((e) => e.name);
    expect(names).not.toContain('Epic Gamma');
  });

  it('epic status defaults to OPEN', () => {
    expect(epicAlpha.status).toBe('OPEN');
  });

  it('epic can be created with a specific status', () => {
    expect(epicBeta.status).toBe('IN_PROGRESS');
  });

  it('an epic can be updated', async () => {
    const updated = await updateEpic(epicAlpha.id, { name: 'Epic Alpha Renamed', status: 'DONE' });
    expect(updated.name).toBe('Epic Alpha Renamed');
    expect(updated.status).toBe('DONE');

    // Restore original name for clean state
    await updateEpic(epicAlpha.id, { name: 'Epic Alpha', status: 'OPEN' });
  });

  it('an epic can be deleted', async () => {
    // Create a throwaway epic and delete it
    const throwaway = await createEpic(projectA.id, { name: 'Throwaway Epic' });
    const beforeDelete = await listEpics(projectA.id);
    expect(beforeDelete.map((e) => e.name)).toContain('Throwaway Epic');

    await deleteEpic(throwaway.id);

    const afterDelete = await listEpics(projectA.id);
    expect(afterDelete.map((e) => e.name)).not.toContain('Throwaway Epic');
    // Should be back to the original 2
    expect(afterDelete).toHaveLength(2);
  });
});
