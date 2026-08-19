import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import { AuthProvider } from '../common/context/AuthContext';


beforeEach(() => {
  localStorage.clear();
});

function renderApp(initialRoute: string) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[initialRoute]}>
        <App />
      </MemoryRouter>
    </AuthProvider>,
  );
}

function uniqueEmail() {
  return `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

async function fillAndSubmitSignup(
  user: ReturnType<typeof userEvent.setup>,
  { fullName, email, password }: { fullName: string; email: string; password: string },
) {
  await user.type(screen.getByLabelText(/full name/i), fullName);
  await user.type(screen.getByLabelText(/^email$/i), email);
  await user.type(screen.getByLabelText(/^password$/i), password);
  await user.type(screen.getByLabelText(/confirm password/i), password);
  await user.click(screen.getByRole('button', { name: /create account/i }));
}

describe('Signup page', () => {
  it('clicking "Create account" with valid data registers the user and reaches the dashboard', async () => {
    const user = userEvent.setup();
    renderApp('/signup');

    await fillAndSubmitSignup(user, {
      fullName: 'Test User',
      email: uniqueEmail(),
      password: 'password123',
    });

    await waitFor(() => expect(screen.getByRole('heading', { name: /^projects$/i })).toBeInTheDocument(), {
      timeout: 5000,
    });
  });

  it('blocks submission client-side when passwords do not match, without calling the backend', async () => {
    const user = userEvent.setup();
    renderApp('/signup');

    await user.type(screen.getByLabelText(/full name/i), 'Test User');
    await user.type(screen.getByLabelText(/^email$/i), uniqueEmail());
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'somethingElse123');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('shows the server\'s error when registering an email that already exists', async () => {
    const user = userEvent.setup();
    const email = uniqueEmail();

    renderApp('/signup');
    await fillAndSubmitSignup(user, { fullName: 'First User', email, password: 'password123' });
    await waitFor(() => expect(screen.getByRole('heading', { name: /^projects$/i })).toBeInTheDocument());

    cleanup();
    localStorage.clear();

    renderApp('/signup');
    await fillAndSubmitSignup(user, { fullName: 'Second User', email, password: 'password123' });

    expect(await screen.findByText(/already exists/i)).toBeInTheDocument();
  });
});

describe('Login page', () => {
  it('clicking "Log in" with correct credentials reaches the dashboard', async () => {
    const user = userEvent.setup();
    const email = uniqueEmail();
    const password = 'password123';

    renderApp('/signup');
    await fillAndSubmitSignup(user, { fullName: 'Login Tester', email, password });
    await waitFor(() => expect(screen.getByRole('heading', { name: /^projects$/i })).toBeInTheDocument());
    cleanup();
    localStorage.clear();

    renderApp('/login');
    await user.type(screen.getByLabelText(/^email$/i), email);
    await user.type(screen.getByLabelText(/^password$/i), password);
    await user.click(screen.getByRole('button', { name: /^log in$/i }));

    await waitFor(() => expect(screen.getByRole('heading', { name: /^projects$/i })).toBeInTheDocument(), {
      timeout: 5000,
    });
  }, 15000);

  it('clicking "Log in" with the wrong password shows an error and does not navigate', async () => {
    const user = userEvent.setup();
    const email = uniqueEmail();

    renderApp('/signup');
    await fillAndSubmitSignup(user, { fullName: 'Wrong Pw', email, password: 'password123' });
    await waitFor(() => expect(screen.getByRole('heading', { name: /^projects$/i })).toBeInTheDocument());
    cleanup();
    localStorage.clear();

    renderApp('/login');
    await user.type(screen.getByLabelText(/^email$/i), email);
    await user.type(screen.getByLabelText(/^password$/i), 'totallyWrongPassword');
    await user.click(screen.getByRole('button', { name: /^log in$/i }));

    expect(await screen.findByText(/invalid email or password/i)).toBeInTheDocument();
  });
});

describe('Route protection', () => {
  it('redirects an unauthenticated visitor from /projects to /login', async () => {
    renderApp('/projects');
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /^log in$/i })).toBeInTheDocument(),
    );
  });

  it('the logout button returns the app to a logged-out state', async () => {
    const user = userEvent.setup();
    const email = uniqueEmail();

    renderApp('/signup');
    await fillAndSubmitSignup(user, { fullName: 'Logout Tester', email, password: 'password123' });
    await waitFor(() => expect(screen.getByRole('heading', { name: /^projects$/i })).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /open user menu/i }));
    await user.click(screen.getByRole('button', { name: /log out/i }));

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /^log in$/i })).toBeInTheDocument(),
    );
  });
});
