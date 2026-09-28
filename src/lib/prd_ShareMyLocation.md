# PRD — Share My Location with Friends & Emergency Contacts

## Overview
Let members share their live location (or a one-time snapshot) with selected friends or emergency contacts, with recipient consent required before access is granted.

## Goals
- Members can broadcast their real-time GPS position to chosen people.
- Recipients must accept the share request before any location data is revealed.
- A dedicated emergency-contacts variant routes to the existing EmergencyContact entity.
- Two sharing modes the user chooses between: **Live** (continuous updates while the page is open) and **Snap** (one-time position ping).

## Non-goals
- Background tracking when the app is closed (browser geolocation requires the page to be active).
- Cross-app integration (Google Maps / Find My Friends) — in-app only for v1.
- SMS/email link delivery of live location (out of scope; share lives inside the app).

---

## Data model

### New entity: `SharedLocation`
| Field | Type | Notes |
|---|---|---|
| `owner_user_id` | string | The member sharing their location |
| `owner_name` | string | Denormalized display name |
| `owner_avatar` | string | Denormalized avatar URL |
| `mode` | enum `live` / `snap` | Live = continuous, snap = one-time |
| `latitude` | number | Latest latitude |
| `longitude` | number | Latest longitude |
| `accuracy` | number | GPS accuracy in meters |
| `last_updated` | date-time | When coordinates were last refreshed |
| `expires_at` | date-time | Auto-expiry (live: configurable 15/30/60 min; snap: fixed 1 hour) |
| `status` | enum `pending` / `active` / `revoked` / `expired` | Lifecycle |
| `recipient_type` | enum `friend` / `emergency` | Which contact list it was sent to |
| `recipients_json` | string | JSON array of selected recipient user/contact IDs + display names |

### New entity: `SharedLocationRecipient` (per-recipient consent record)
| Field | Type | Notes |
|---|---|---|
| `shared_location_id` | string | FK to SharedLocation |
| `recipient_user_id` | string | The friend's user id (for `friend` type) |
| `recipient_contact_id` | string | The EmergencyContact id (for `emergency` type) |
| `recipient_name` | string | Denormalized |
| `accepted` | boolean | Default false — set true when recipient accepts |
| `accepted_at` | date-time | When consent was given |
| `declined` | boolean | If recipient explicitly declined |

### RLS
- `SharedLocation`: owner + admin can read/write; recipients can read rows where they appear in `recipients_json` (via a query on `SharedLocationRecipient` instead).
- `SharedLocationRecipient`: recipient (by `recipient_user_id`) + owner + admin read; recipient updates their own `accepted`/`declined`; owner creates/deletes.

---

## Reused infrastructure
- **`src/hooks/useGeolocation.js`** — already captures live GPS; reused for both modes.
- **`SocialProfile` / `SocialFollow`** — mutual follows = the friend list the picker draws from.
- **`EmergencyContact`** — existing entity backs the emergency-contacts variant.
- **`VoiceGpsPanel` / Leaflet** — map rendering reused for the live view.

---

## User flows

### 1. Share flow (sender)
1. Member opens a new **"Share My Location"** page (or action from member dashboard).
2. Chooses **mode**: Live or Snap.
   - Live → pick duration (15 / 30 / 60 minutes).
   - Snap → fixed 1-hour visibility.
3. Chooses **audience**: Friends or Emergency Contacts.
4. Picks recipients from the list (multi-select).
   - Friends: from mutual-follow graph.
   - Emergency Contacts: from `EmergencyContact` records they've added.
5. Confirms → captures GPS → creates `SharedLocation` (status `pending`) + one `SharedLocationRecipient` per chosen person.
6. If **Live**: page stays open and updates `SharedLocation.latitude/longitude/last_updated` every ~10s via `useGeolocation`.
7. Sender sees a control panel: list of recipients with accept/decline status, "Stop sharing" button (revokes).

### 2. Accept flow (recipient)
1. Recipient sees a pending entry in their location inbox (new section in member dashboard or social inbox).
2. They can **Accept** or **Decline** — updates their `SharedLocationRecipient.accepted`.
3. Only after accepting do they see the map with the sender's live/snap coordinates.
4. They can revoke their own access at any time.

### 3. Emergency variant
- Same flow but audience locked to Emergency Contacts.
- Recepients are not app users necessarily (EmergencyContact may hold a phone number), so for v1:
  - If the contact has an app account (matched by phone), they get the in-app consent flow above.
  - If not, the share creates the record and the sender can optionally trigger an SMS (reusing `sendEmergencyAlert`) — but live location is not exposed to a non-app contact. (Scope: keep it in-app; SMS alert is a follow-up.)

---

## UI changes
- **New page** `src/pages/ShareMyLocation.jsx` (protected) — the share wizard + sender control panel.
  - Step 1: mode (Live/Snap) + duration.
  - Step 2: audience (Friends/Emergency) + recipient multi-select.
  - Step 3: confirm + capture + live panel.
- **New component** `src/components/location/LocationShareControls.jsx` — live map, recipient status list, stop button.
- **New component** `src/components/location/LocationInbox.jsx` — recipient's pending/active shares with Accept/Decline.
- **New component** `src/components/location/RecipientPicker.jsx` — friend vs emergency contact multi-select.
- Wire entry points: member dashboard, voice GPS page, SOS/emergency area, and nav.
- Register `/share-location` route (protected).

## Open questions / deferred
- SMS link to non-app emergency contacts → deferred (requires delivery provider secrets the user hasn't set).
- Expiry cron (auto-mark `expired` after `expires_at`) → v1.1; v1 checks expiry lazily on read.