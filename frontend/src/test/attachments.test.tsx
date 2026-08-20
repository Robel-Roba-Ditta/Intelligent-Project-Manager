import { describe, it, expect, beforeAll } from 'vitest';
import { setToken, registerRequest } from '../common/lib/api';
import { createProject } from '../modules/project/api/projectsApi';
import { createTask, type TaskDto } from '../modules/task/api/tasksApi';
import {
  listAttachments,
  createAttachment,
  type AttachmentDto,
} from '../modules/attachment/api/attachmentsApi';


function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.com`;
}


let token: string;
let task: TaskDto;
let attachment: AttachmentDto;

const TEST_FILE_NAME = 'design-spec.pdf';
const TEST_FILE_URL = 'https://example.com/files/design-spec.pdf';


beforeAll(async () => {
  const res = await registerRequest({
    email: uniqueEmail('attach'),
    password: 'password123',
    fullName: 'Attach Tester',
  });
  token = res.accessToken;
  setToken(token);

  const project = await createProject({ name: 'Attachment Test Project' });
  task = await createTask(project.id, { title: 'Attachment Target Task' });

  attachment = await createAttachment(task.id, {
    fileName: TEST_FILE_NAME,
    fileUrl: TEST_FILE_URL,
  });
});


describe('Attachments', () => {
  it('attachment was created with correct data', () => {
    expect(attachment.id).toBeDefined();
    expect(attachment.taskId).toBe(task.id);
    expect(attachment.fileName).toBe(TEST_FILE_NAME);
    expect(attachment.fileUrl).toBe(TEST_FILE_URL);
    expect(attachment.addedBy).toBeDefined();
    expect(attachment.addedBy.fullName).toBe('Attach Tester');
  });

  it('attachment appears in the list for the task', async () => {
    setToken(token);
    const attachments = await listAttachments(task.id);
    expect(attachments.length).toBeGreaterThanOrEqual(1);
    const found = attachments.find((a) => a.id === attachment.id);
    expect(found).toBeDefined();
    expect(found!.fileName).toBe(TEST_FILE_NAME);
  });

  it('attachment fileUrl is a real URL that can be used as an href', () => {
    const url = new URL(attachment.fileUrl);
    expect(url.protocol).toBe('https:');
    expect(url.hostname).toBe('example.com');
    expect(attachment.fileUrl).toBe(TEST_FILE_URL);
  });
});
