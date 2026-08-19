/**
 * Sprints End-to-End Test Suite
 *
 * Tests the PLANNED → ACTIVE → COMPLETED state machine:
 * - Create a sprint → status=PLANNED, startDate=null
 * - Start it → status=ACTIVE, startDate is set
 * - Try starting again → 400 rejection
 * - Complete it → status=COMPLETED, endDate is set
 * - Try completing again → 400 rejection
 *
 * Requires the backend to be running on http://localhost:3000.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { setToken, registerRequest } from '../lib/api';
import { createProject, type ProjectDto } from '../lib/projectsApi';
import {
  listSprints,
  createSprint,
  startSprint,
  completeSprint,
  type SprintDto,
} from '../lib/sprintsApi';

/* ─── Helpers ────────────────────────────────────────────── */

function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.com`;
}

/* ─── Test State ─────────────────────────────────────────── */

let token: string;
let project: ProjectDto;
let sprint: SprintDto;

/* ─── Setup ──────────────────────────────────────────────── */

beforeAll(async () => {
  const res = await registerRequest({
    email: uniqueEmail('sprint-tester'),
    password: 'password123',
    fullName: 'Sprint Tester',
  });
  token = res.accessToken;
  setToken(token);

  project = await createProject({ name: 'Sprint Test Project' });
  sprint = await createSprint(project.id, { name: 'Sprint 1', goal: 'Ship MVP' });
});

/* ─── Tests ──────────────────────────────────────────────── */

describe('Sprints — state machine lifecycle', () => {
  it('newly created sprint has status PLANNED and null dates', () => {
    expect(sprint.status).toBe('PLANNED');
    expect(sprint.startDate).toBeNull();
    expect(sprint.endDate).toBeNull();
    expect(sprint.goal).toBe('Ship MVP');
  });

  it('starting a PLANNED sprint transitions to ACTIVE and stamps startDate', async () => {
    const started = await startSprint(sprint.id);
    expect(started.status).toBe('ACTIVE');
    expect(started.startDate).not.toBeNull();
    expect(started.endDate).toBeNull();
    // Update local ref for subsequent tests
    sprint = started;
  });

  it('starting an ACTIVE sprint is rejected (400)', async () => {
    try {
      await startSprint(sprint.id);
      expect.unreachable('Should not be able to start an already active sprint');
    } catch (err: any) {
      expect(err.response?.status).toBe(400);
      expect(err.response?.data?.message).toMatch(/active/i);
    }
  });

  it('rejects starting another sprint when one is already active', async () => {
    // sprint is currently ACTIVE. Create a new sprint in PLANNED.
    const secondSprint = await createSprint(project.id, { name: 'Sprint 2' });
    try {
      await startSprint(secondSprint.id);
      expect.unreachable('Should not be able to start a sprint if another is already active in the same project');
    } catch (err: any) {
      expect(err.response?.status).toBe(400);
      expect(err.response?.data?.message).toMatch(/first/i); // "Complete the active sprint first"
    }
  });

  it('completing an ACTIVE sprint transitions to COMPLETED and stamps endDate', async () => {
    const completed = await completeSprint(sprint.id);
    expect(completed.status).toBe('COMPLETED');
    expect(completed.endDate).not.toBeNull();
    expect(completed.startDate).not.toBeNull();
    sprint = completed;
  });

  it('completing a COMPLETED sprint is rejected (400)', async () => {
    try {
      await completeSprint(sprint.id);
      expect.unreachable('Should not be able to complete an already completed sprint');
    } catch (err: any) {
      expect(err.response?.status).toBe(400);
      expect(err.response?.data?.message).toMatch(/completed/i);
    }
  });

  it('starting a COMPLETED sprint is also rejected (400)', async () => {
    try {
      await startSprint(sprint.id);
      expect.unreachable('Should not be able to start a completed sprint');
    } catch (err: any) {
      expect(err.response?.status).toBe(400);
    }
  });

  it('sprint list is scoped to the project', async () => {
    const sprints = await listSprints(project.id);
    expect(sprints).toHaveLength(2);
    // Ordered by createdAt DESC
    expect(sprints[0].name).toBe('Sprint 2');
    expect(sprints[1].name).toBe('Sprint 1');
  });
});
