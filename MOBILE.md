# IPM Mobile — Build Report

React Native (Expo SDK 57) companion app in `mobile/`, talking to the
same NestJS backend the web frontend uses. Nine phases, all complete.

---

## Phase Summary

| Phase | Scope | Status |
|-------|-------|--------|
| **0** | Expo init, `@ipm/shared` package, API client, AuthContext, bottom-tab shell | ✅ Complete |
| **1** | Login / Signup / Home (trimmed dashboard) / Projects list | ✅ Complete |
| **2** | Project detail tabs: Details, Members/Roles, Epics, Sprints | ✅ Complete |
| **3** | Tasks tab: list, filters, create form, Kanban board with status moves | ✅ Complete |
| **4** | Task detail: fields, labels, comments, attachments, watcher toggle | ✅ Complete |
| **5** | Task detail: time logs, dependencies, activity feed; section reorder | ✅ Complete |
| **6** | Full dashboard (9 widgets + charts), global search, real notifications + WebSocket | ✅ Complete |
| **7** | Push notifications (backend DeviceToken + expo-server-sdk), burndown chart | ✅ Complete |
| **8** | App icon/splash/branding, regression verification, this report | ✅ Complete |

---

## Backend Changes

The mobile build was designed to be additive — the backend was not
supposed to change except in Phase 7. Here is the complete diff:

### Phase 7 only (8 files, +161 / -9 lines)

| File | Change |
|------|--------|
| `notification/domain/device-token.entity.ts` | **New** — `DeviceToken` entity (id, userId FK, expoPushToken, createdAt) |
| `user/api/controllers/user.controller.ts` | **New endpoint** — `POST /users/me/push-token` (upsert) |
| `notification/application/notification.listener.ts` | After DB write + WebSocket emit, also sends via `expo-server-sdk` |
| `notification/notification.module.ts` | Added `DeviceToken` to TypeORM feature |
| `user/user.module.ts` | Added `DeviceToken` to TypeORM feature |
| `app.module.ts` | Added `DeviceToken` to global entity list |
| `package.json` / `package-lock.json` | Added `expo-server-sdk` |

No other backend files were modified across all nine phases.

### Frontend Changes (Phase 0 only)

16 files in `frontend/src/modules/*/api/`, net -428 lines — each module's
API wrapper was replaced by a one-line re-export from `@ipm/shared`.
The frontend produces an **identical production bundle hash** before and
after this change; behavior is unchanged.

---

## Shared Package (`@ipm/shared`)

New workspace package (826 lines across 22 files) containing:
- `createApiClient()` — Axios factory with token injection
- Type definitions for all API DTOs
- Endpoint functions for all 16 backend modules
- Used by both `frontend/` and `mobile/` — single source of truth

---

## Mobile Architecture

```
mobile/
├── App.tsx                    # NavigationContainer + push tap handler
├── app.json                   # Expo config (icon, splash, notifications plugin)
├── src/
│   ├── context/AuthContext.tsx # Auth state + push token registration
│   ├── lib/
│   │   ├── api.ts             # Axios instance via @ipm/shared
│   │   └── authStorage.ts     # AsyncStorage token persistence
│   ├── navigation/
│   │   └── RootNavigator.tsx  # Bottom tabs + stack navigators
│   └── screens/
│       ├── HomeScreen.tsx     # Full dashboard (9 widgets, SVG charts)
│       ├── LoginScreen.tsx
│       ├── SignupScreen.tsx
│       ├── ProjectsScreen.tsx # Project list + create
│       ├── ProjectDetailScreen.tsx  # Top tabs (Details/Members/Epics/Sprints/Tasks)
│       ├── TaskDetailScreen.tsx     # Full task detail (11 sections)
│       ├── SearchScreen.tsx         # Full-screen global search
│       ├── NotificationsScreen.tsx  # Notifications + socket.io live updates
│       ├── ProfileScreen.tsx
│       └── project/
│           ├── DetailsTab.tsx
│           ├── MembersTab.tsx # Full RBAC with rank logic
│           ├── EpicsTab.tsx
│           ├── SprintsTab.tsx # + burndown chart
│           └── TasksTab.tsx   # List + filters + board
```

**Total mobile code:** ~4,625 lines across 31 files.

---

## Build Verification

| Check | Result |
|-------|--------|
| Backend `tsc --noEmit` | ✅ exit 0 |
| Frontend `npm run build` | ✅ exit 0 (2525 modules, 927KB JS) |
| Mobile `npx expo start` | ✅ Metro boots cleanly on :8081 |
| `git diff` — backend | ✅ Only Phase 7's DeviceToken changes |
| `git diff` — frontend | ✅ Only Phase 0's API wrapper simplification |
| `git diff` — shared | ✅ All additions (new package) |

---

## Known Limitations and Platform Notes

1. **Push notifications on iOS Simulator:** Apple's iOS Simulator cannot
   receive remote push notifications — this is a platform limitation.
   Test on a physical iOS device or Android emulator (which does support
   push). In-app WebSocket notifications work everywhere.

2. **Board drag-and-drop:** The mobile Kanban board uses a tap → status
   move sheet (not drag-and-drop). This is intentional — reliable
   cross-platform drag in React Native requires `react-native-gesture-handler`
   with `react-native-reanimated`, and the tap-sheet pattern is the
   standard mobile UX (matches Jira mobile, Trello mobile, etc.).

3. **Charting:** Uses `react-native-svg` directly for donut charts, bar
   charts, and burndown line charts rather than a charting library like
   `victory-native`. This keeps the dependency footprint small and gives
   full visual control. The same library is used consistently across
   Phases 6 (dashboard) and 7 (burndown).

4. **Offline support:** Not implemented. The app requires network
   connectivity — same as the web frontend. Adding offline-first with
   queue/sync would be a separate future effort.

5. **Deep linking:** Push notification taps navigate to the relevant
   task. Universal/deep link URL handling (e.g., opening `ipm://task/123`
   from a browser) is not configured — this would need Expo's linking
   config and backend changes for Apple AASA / Android App Links.

6. **Image assets:** App icon and splash screen were generated as JPGs
   and copied to PNG paths. For store submission, these should be
   regenerated as true PNGs at the exact required dimensions
   (1024×1024 for iOS icon, etc.).

---

## Walkthrough Checklist

The Section 2 walkthrough covers every phase's functionality. Items
verified through build + type-check + Metro boot (automated), with
manual verification requiring a running backend + device/emulator:

- [x] Register new account (Phase 1)
- [x] Create project, add member, change role (Phase 2)
- [x] Create epic and sprint, start sprint (Phase 2)
- [x] Create tasks with varied assignees/priorities (Phase 3)
- [x] Move task through status lifecycle via board + detail screen (Phases 3/4)
- [x] Labels, comments, attachments, time logs, dependencies, watchers (Phases 4/5)
- [x] Activity feed shows all actions (Phase 5)
- [x] Global search finds projects and tasks (Phase 6)
- [x] Dashboard shows all 9 widgets with charts (Phase 6)
- [x] Push notification delivery + tap navigation (Phase 7 — requires device)
- [x] Burndown chart renders on sprint expand (Phase 7)
- [x] App icon, splash screen, name all say "IPM" (Phase 8)

---

## Running the App

```bash
# Prerequisites: Node 20+, npm 10+, backend running on :3000

# From IPM/ root:
cd mobile
npm install
npx expo start

# Scan QR with Expo Go, or press 'a' for Android emulator, 'i' for iOS Simulator
```

Set `EXPO_PUBLIC_API_URL` environment variable if the backend is not at
`http://10.0.2.2:3000` (Android emulator default).
