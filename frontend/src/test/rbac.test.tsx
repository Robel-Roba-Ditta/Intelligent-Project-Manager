import { describe, it, expect, beforeAll } from 'vitest';
import {
  setToken,
  registerRequest,
  type AuthUser,
} from '../common/lib/api';
import {
  createProject,
  deactivateProject,
  activateProject,
  addProjectMember,
  removeProjectMember,
  updateProjectMemberRole,
  type ProjectDto,
} from '../modules/project/api/projectsApi';


function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.com`;
}


let ownerUser: AuthUser;
let ownerToken: string;

let memberUser: AuthUser;
let memberToken: string;

let testProject: ProjectDto;

function actAs(token: string) {
  setToken(token);
}


beforeAll(async () => {
  const ownerEmail = uniqueEmail('owner');
  const ownerRes = await registerRequest({
    email: ownerEmail,
    password: 'password123',
    fullName: 'Owner User',
  });
  ownerUser = ownerRes.user;
  ownerToken = ownerRes.accessToken;

  const memberEmail = uniqueEmail('member');
  const memberRes = await registerRequest({
    email: memberEmail,
    password: 'password123',
    fullName: 'Member User',
  });
  memberUser = memberRes.user;
  memberToken = memberRes.accessToken;

  actAs(ownerToken);
  testProject = await createProject({ name: 'RBAC Test Project', description: 'Testing roles' });

  testProject = await addProjectMember(testProject.id, {
    email: memberEmail,
    role: 'member',
  });
});


describe('Project Members & RBAC', () => {
  it('the project creator is assigned the "owner" role', () => {
    const ownerMembership = testProject.members.find((m) => m.userId === ownerUser.id);
    expect(ownerMembership).toBeDefined();
    expect(ownerMembership!.role).toBe('owner');
  });

  it('the added user is assigned the "member" role', () => {
    const memberMembership = testProject.members.find((m) => m.userId === memberUser.id);
    expect(memberMembership).toBeDefined();
    expect(memberMembership!.role).toBe('member');
  });

  it('a plain Member CANNOT deactivate the project (403)', async () => {
    actAs(memberToken);
    try {
      await deactivateProject(testProject.id);
      expect.unreachable('Member should not be able to deactivate the project');
    } catch (err: any) {
      expect(err.response?.status).toBe(403);
      expect(err.response?.data?.message).toMatch(/owner/i);
    }
  });

  it('a plain Member CANNOT add another member (403)', async () => {
    actAs(memberToken);
    const anotherEmail = uniqueEmail('blocked');
    try {
      await addProjectMember(testProject.id, { email: anotherEmail, role: 'member' });
      expect.unreachable('Member should not be able to add members');
    } catch (err: any) {
      expect(err.response?.status).toBe(403);
      expect(err.response?.data?.message).toMatch(/admin/i);
    }
  });

  it('a plain Member CANNOT remove another member (403)', async () => {
    actAs(memberToken);
    try {
      await removeProjectMember(testProject.id, ownerUser.id);
      expect.unreachable('Member should not be able to remove members');
    } catch (err: any) {
      expect(err.response?.status).toBe(403);
    }
  });

  it('a plain Member CANNOT change roles (403)', async () => {
    actAs(memberToken);
    try {
      await updateProjectMemberRole(testProject.id, ownerUser.id, 'member');
      expect.unreachable('Member should not be able to change roles');
    } catch (err: any) {
      expect(err.response?.status).toBe(403);
    }
  });

  it('the Owner CAN deactivate the project (200)', async () => {
    actAs(ownerToken);
    const result = await deactivateProject(testProject.id);
    expect(result.isActive).toBe(false);
  });

  it('the Owner CAN re-activate the project (200)', async () => {
    actAs(ownerToken);
    const result = await activateProject(testProject.id);
    expect(result.isActive).toBe(true);
  });

  it('an admin-role user CAN add a member but CANNOT deactivate', async () => {
    actAs(ownerToken);
    await updateProjectMemberRole(testProject.id, memberUser.id, 'admin');

    actAs(memberToken);
    const newEmail = uniqueEmail('new-member');
    try {
      await addProjectMember(testProject.id, { email: newEmail, role: 'member' });
      expect.unreachable('Should have gotten 404 for non-existent user');
    } catch (err: any) {
      expect(err.response?.status).toBe(404);
    }

    try {
      await deactivateProject(testProject.id);
      expect.unreachable('Admin should not be able to deactivate the project');
    } catch (err: any) {
      expect(err.response?.status).toBe(403);
      expect(err.response?.data?.message).toMatch(/owner/i);
    }

    actAs(ownerToken);
    await updateProjectMemberRole(testProject.id, memberUser.id, 'member');
  });

  it('cannot remove the project owner', async () => {
    actAs(ownerToken);
    try {
      await removeProjectMember(testProject.id, ownerUser.id);
      expect.unreachable('Should not be able to remove the project owner');
    } catch (err: any) {
      expect(err.response?.status).toBe(400);
      expect(err.response?.data?.message).toMatch(/owner/i);
    }
  });
});
