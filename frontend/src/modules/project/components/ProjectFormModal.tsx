import { useState, useEffect, type FormEvent } from 'react';
import { AlertCircle } from 'lucide-react';
import { Modal } from '../../../common/components/Modal';
import { FormField } from '../../../common/components/FormField';
import { Button } from '../../../common/components/Button';
import { createProject, updateProject, type ProjectDto } from '../api/projectsApi';
import { extractErrorMessage } from '../../../common/lib/api';

export function ProjectFormModal({
  isOpen,
  onClose,
  project,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  project?: ProjectDto | null;
  onSuccess: (project: ProjectDto) => void;
}) {
  const isEditMode = !!project;
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName(project?.name ?? '');
      setDescription(project?.description ?? '');
      setError(null);
    }
  }, [isOpen, project]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const result =
        isEditMode && project
          ? await updateProject(project.id, { name, description })
          : await createProject({ name, description: description || undefined });
      onSuccess(result);
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditMode ? 'Edit project' : 'New project'}>
      {error && (
        <div
          role="alert"
          className="mb-4 flex items-start gap-2 rounded-md border border-danger/30 bg-danger/5 px-3.5 py-2.5 text-sm text-danger"
        >
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          id="project-name"
          label="Project name"
          type="text"
          required
          minLength={2}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Website Revamp"
        />

        <div>
          <label
            htmlFor="project-description"
            className="mb-1.5 block font-mono text-[11px] tracking-wide text-muted uppercase"
          >
            Description
          </label>
          <textarea
            id="project-description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's this project about? (optional)"
            className="w-full rounded-md border border-border-light bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/60 focus:border-accent-done focus:outline-none focus:ring-2 focus:ring-accent-done/40"
          />
        </div>

        <Button type="submit" isLoading={isSubmitting}>
          {isSubmitting ? 'Saving…' : isEditMode ? 'Save changes' : 'Create project'}
        </Button>
      </form>
    </Modal>
  );
}
