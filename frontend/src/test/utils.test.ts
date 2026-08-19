import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getInitials, avatarColorForName, formatDueDate, formatRelativeTime } from '../lib/utils';

describe('getInitials', () => {
  it('returns two initials from "Alice Bob"', () => {
    expect(getInitials('Alice Bob')).toBe('AB');
  });

  it('returns one initial from single name', () => {
    expect(getInitials('Alice')).toBe('A');
  });

  it('handles three-word name (first + last)', () => {
    expect(getInitials('Alice Middle Bob')).toBe('AB');
  });

  it('handles extra whitespace', () => {
    expect(getInitials('  Alice   Bob  ')).toBe('AB');
  });

  it('returns empty string for empty input', () => {
    expect(getInitials('')).toBe('');
  });

  it('uppercases lowercase initials', () => {
    expect(getInitials('alice bob')).toBe('AB');
  });
});

describe('avatarColorForName', () => {
  it('returns a string (hex color)', () => {
    const color = avatarColorForName('Test User');
    expect(typeof color).toBe('string');
    expect(color).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('returns the same color for the same name', () => {
    const a = avatarColorForName('Consistent');
    const b = avatarColorForName('Consistent');
    expect(a).toBe(b);
  });

  it('returns from the known palette', () => {
    const palette = ['#0c66e4', '#1f9d7c', '#e8a33d', '#d64545', '#7c5cff', '#0f9b8e'];
    const color = avatarColorForName('Anybody');
    expect(palette).toContain(color);
  });
});

describe('formatDueDate', () => {
  let originalDate: typeof Date;

  beforeEach(() => {
    // Fix "today" to a known date for deterministic tests
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-15T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "Overdue" for past date', () => {
    const result = formatDueDate('2026-08-10');
    expect(result.label).toBe('Overdue');
    expect(result.isOverdue).toBe(true);
  });

  it('returns "Due today" for today', () => {
    const result = formatDueDate('2026-08-15');
    expect(result.label).toBe('Due today');
    expect(result.isOverdue).toBe(false);
  });

  it('returns "Due tomorrow" for tomorrow', () => {
    const result = formatDueDate('2026-08-16');
    expect(result.label).toBe('Due tomorrow');
    expect(result.isOverdue).toBe(false);
  });

  it('returns "Due in N days" for dates within a week', () => {
    const result = formatDueDate('2026-08-20');
    expect(result.label).toBe('Due in 5 days');
    expect(result.isOverdue).toBe(false);
  });

  it('returns formatted date for dates > 6 days out', () => {
    const result = formatDueDate('2026-09-01');
    expect(result.label).toMatch(/^Due\s/);
    expect(result.isOverdue).toBe(false);
  });
});

describe('formatRelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "just now" for < 1 minute ago', () => {
    expect(formatRelativeTime('2026-08-15T11:59:45Z')).toBe('just now');
  });

  it('returns "Nm ago" for minutes', () => {
    expect(formatRelativeTime('2026-08-15T11:55:00Z')).toBe('5m ago');
  });

  it('returns "Nh ago" for hours', () => {
    expect(formatRelativeTime('2026-08-15T09:00:00Z')).toBe('3h ago');
  });

  it('returns "Nd ago" for days', () => {
    expect(formatRelativeTime('2026-08-13T12:00:00Z')).toBe('2d ago');
  });
});
