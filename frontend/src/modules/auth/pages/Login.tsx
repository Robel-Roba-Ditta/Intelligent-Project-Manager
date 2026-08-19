import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { AuthLayout } from '../../../common/components/AuthLayout';
import { FormField } from '../../../common/components/FormField';
import { Button } from '../../../common/components/Button';
import { useAuth } from '../../../common/context/AuthContext';
import { extractErrorMessage } from '../../../common/lib/api';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate('/projects', { replace: true });
    } catch (err) {
      setFormError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="Welcome back"
      title="Pick up right where your sprint left off."
      subtitle="Track tasks, sprints, and team workload in one place."
    >
      <h2 className="mb-1 font-display text-2xl font-semibold text-ink">Log in</h2>
      <p className="mb-6 text-sm text-muted">
        New to IPM?{' '}
        <Link to="/signup" className="font-medium text-accent-done-dim hover:underline">
          Create an account
        </Link>
      </p>

      {formError && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/5 px-3.5 py-2.5 text-sm text-danger"
        >
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <FormField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
        <FormField
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
        <Button type="submit" isLoading={isSubmitting}>
          {isSubmitting ? 'Logging in…' : 'Log in'}
        </Button>
      </form>
    </AuthLayout>
  );
}
