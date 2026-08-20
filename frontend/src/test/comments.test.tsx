import { describe, it, expect, beforeAll } from 'vitest';
import { setToken, registerRequest, type AuthUser } from '../common/lib/api';
import { createProject, addProjectMember } from '../modules/project/api/projectsApi';
import { createTask, type TaskDto } from '../modules/task/api/tasksApi';
import {
  listComments,
  createComment,
  type CommentDto,
} from '../modules/comment/api/commentsApi';


function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.com`;
}


let user1: AuthUser;
let token1: string;
let user2: AuthUser;
let token2: string;
let task: TaskDto;
let commentA: CommentDto;


beforeAll(async () => {
  const res1 = await registerRequest({
    email: uniqueEmail('comment-u1'),
    password: 'password123',
    fullName: 'Alice Commenter',
  });
  user1 = res1.user;
  token1 = res1.accessToken;

  const res2 = await registerRequest({
    email: uniqueEmail('comment-u2'),
    password: 'password123',
    fullName: 'Bob Commenter',
  });
  user2 = res2.user;
  token2 = res2.accessToken;

  setToken(token1);
  const project = await createProject({ name: 'Comment Test Project' });

  await addProjectMember(project.id, { email: res2.user.email, role: 'member' });

  task = await createTask(project.id, { title: 'Comment Target Task' });

  setToken(token1);
  commentA = await createComment(task.id, 'First comment by Alice');

  await new Promise((r) => setTimeout(r, 50));

  setToken(token2);
  await createComment(task.id, 'Second comment by Bob');
});


describe('Comments', () => {
  it('both comments are returned in chronological order (oldest first)', async () => {
    setToken(token1);
    const comments = await listComments(task.id);
    expect(comments.length).toBeGreaterThanOrEqual(2);

    const first = comments[0];
    const second = comments[1];
    expect(new Date(first.createdAt).getTime()).toBeLessThanOrEqual(
      new Date(second.createdAt).getTime(),
    );
  });

  it('first comment is attributed to Alice', async () => {
    setToken(token1);
    const comments = await listComments(task.id);
    const first = comments[0];
    expect(first.body).toBe('First comment by Alice');
    expect(first.author.fullName).toBe('Alice Commenter');
    expect(first.author.id).toBe(user1.id);
  });

  it('second comment is attributed to Bob', async () => {
    setToken(token1);
    const comments = await listComments(task.id);
    const second = comments[1];
    expect(second.body).toBe('Second comment by Bob');
    expect(second.author.fullName).toBe('Bob Commenter');
    expect(second.author.id).toBe(user2.id);
  });

  it('comment has expected shape', () => {
    expect(commentA.id).toBeDefined();
    expect(commentA.taskId).toBe(task.id);
    expect(commentA.createdAt).toBeDefined();
    expect(commentA.updatedAt).toBeDefined();
  });
});
