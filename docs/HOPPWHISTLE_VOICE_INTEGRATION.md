# Dial Browser ⇄ Hoppwhistle voice integration

Dial Browser is a Hoppwhistle softphone client. Hoppwhistle is the telephony
platform. There is one VoIP system, and it is Hoppwhistle's.

```
Dial Browser UI (ModernDialer, ModernCallView, contacts, ?dial= links)
      │  useHoppwhistleVoice()
      ▼
HoppwhistleVoiceClient            src/telephony/hoppwhistle/voiceClient.js
      ├── HTTPS ──────────────►  Hoppwhistle API   (api.js, auth.js, session.js)
      └── SIP.js / WSS / WebRTC ► Hoppwhistle FreeSWITCH (sipTransport.js)
                                        │
                                        ▼
                         Hoppwhistle carrier waterfall (SOFTPHONE_MANUAL)
                                        │
                                        ▼
                                       PSTN
```

Audio flows browser ⇄ FreeSWITCH directly. Nothing in Dial Browser (browser or
Base44 backend) touches RTP.

---

## 1. Configuration

| Variable | Required | Meaning |
| --- | --- | --- |
| `VITE_HOPPWHISTLE_API_URL` | no | Hoppwhistle origin. Defaults to `https://agents.netenroll.com` (the NetEnroll agent portal), because Base44's hosted build has nowhere to set it. Override for staging. |
| `VITE_HOPPWHISTLE_SIP_WS_URL` | no | Only if FreeSWITCH's SIP WebSocket is **not** at `wss://<api host>/ws` (the path Hoppwhistle's nginx proxies on 443 and Hoppwhistle's own phone uses). e.g. `wss://sip.example.com:7443`. |

Nothing secret goes in either. SIP identities, passwords, caller IDs, ICE
servers and permissions come from Hoppwhistle at runtime, per agent.

Hoppwhistle's API already answers CORS for any origin (`apps/api/src/index.ts`,
`origin: true`), so no Hoppwhistle change is needed for the HTTPS calls. The
WebSocket at `/ws` must be reachable from the Dial Browser origin — confirm the
production nginx `/ws` location (it is not in the repository's
`scripts/hopwhistle_nginx.conf`).

---

## 2. Module map

| Path | Purpose |
| --- | --- |
| `src/telephony/hoppwhistle/config.js` | Env config, SIP WebSocket URL derivation, route type, ICE/retry constants. |
| `src/telephony/hoppwhistle/auth.js` | The isolated authentication adapter (Hoppwhistle agent session, bound to the Dial Browser user). |
| `src/telephony/hoppwhistle/api.js` | The Hoppwhistle endpoints used, with the agent's bearer token. 401 ends the session. |
| `src/telephony/hoppwhistle/session.js` | Voice-session bootstrap: composes credentials + caller IDs into the shape of the desired `POST /api/v1/voice/session`. |
| `src/telephony/hoppwhistle/sipTransport.js` | The only module importing `sip.js` (lazy-loaded on first connect). `registerAndConfirm`, INFO DTMF, session handles. |
| `src/telephony/hoppwhistle/mediaManager.js` | Hidden remote-audio sink, late-track handling, autoplay blocking, mic preflight, sender-track mute, ringtone, DTMF tones. |
| `src/telephony/hoppwhistle/callState.js` | Canonical call model and the phone/presence state enums. |
| `src/telephony/hoppwhistle/numbers.js` | The single number normalizer every dial path goes through. |
| `src/telephony/hoppwhistle/tabCoordinator.js` | One registered phone per browser across Dial Browser tabs (localStorage lease + BroadcastChannel, `hoppwhistle-device-id`). |
| `src/telephony/hoppwhistle/voiceClient.js` | The call lifecycle, retries, presence, cleanup. Framework-free, fully injected. |
| `src/telephony/hoppwhistle/HoppwhistleVoiceProvider.jsx` | React provider + `useHoppwhistleVoice()` / `useCallSurface()`. Mounted once in `App.jsx`. |
| `src/telephony/hoppwhistle/logoutHook.js` | Lets `AuthContext.logout()` tear the phone down synchronously before its redirect. |
| `src/components/phone/HoppwhistleConnectCard.jsx` | "Connect phone" sign-in with the Hoppwhistle agent account. |
| `src/components/phone/VoiceStatusNotice.jsx` | Sign-in / reconnect / enable-audio / other-tab notices. |
| `src/components/phone/CallerIdSelect.jsx` | Caller-ID picker over Hoppwhistle's numbers. |
| `src/components/phone/GlobalCallDock.jsx` | Shows the call on pages without a phone (inbound can ring anywhere; a call survives navigation). |
| `src/components/phone/voiceCallViewProps.js` | The one mapping from voice state to `ModernCallView` props. |

Removed: `src/hooks/useTwilioVoice.js`, `@twilio/voice-sdk`,
`base44/functions/mint-voice-token`, `base44/functions/outbound-voice` (the
Twilio browser Device and the two functions that existed only to serve it).

---

## 3. Hoppwhistle endpoints used

All are the endpoints Hoppwhistle's own browser phone calls
(`apps/web/src/components/phone/phone-provider.tsx`), with the same bodies.
Every one resolves the agent and tenant from the bearer token, never the body.

| Endpoint | Used for |
| --- | --- |
| `POST /api/auth/login` | Linking the agent's Hoppwhistle account (once). |
| `POST /api/auth/refresh` | Renewing the agent session inside Hoppwhistle's 24h refresh window. |
| `GET /api/v1/agent/webrtc/credentials` | The agent's own SIP extension + per-agent password + realm + STUN/TURN. |
| `GET /api/v1/agent/my-numbers` | Caller IDs the agent may present. |
| `PUT /api/v1/agent/status` | Presence: `available` on registration and after calls, `on-call` on answer, `offline` on disconnect/close. |
| `POST /api/v1/agent/call/originate` | Before every outbound INVITE: validation, licensed-state check, caller-ID selection, call row, `callId`. |
| `POST /api/v1/agent/call/:callId/answer` | Outbound call established (once per call); returns `recordingEnabled`. |
| `POST /api/v1/agent/call/:callId/hangup` | Outbound call ended (once per call): `duration`, `startedAt`, `answeredAt`, `endedAt`, `endReason`. |
| `POST /api/v1/agent/call/merge` | Three-way merge — **wired but disabled** until gap G3 is closed. |

Deliberately **not** used: `/call/:id/transfer` (metadata only, no SIP),
`/call/:id/dtmf` (returns `sent: true`, sends nothing), `/call/:id/mute`
(acknowledge only), `/call/:id/hold` (Redis flag only), `/call/incoming`
(unauthenticated, see G8).

---

## 4. Authentication

Hoppwhistle's agent endpoints only accept a **per-user** session: an API key
carries a tenant but no user, so no platform credential can act as an agent,
and none is in Dial Browser.

Today:

1. The Dial Browser member is signed in to Dial Browser (Base44).
2. On the phone, they link their Hoppwhistle agent account once
   (`HoppwhistleConnectCard` → `POST /api/auth/login`). The password goes to
   Hoppwhistle and is never stored.
3. The returned agent JWT is stored under `hoppwhistle.voice.session.v1`,
   **bound to the Base44 user id**. A different Dial Browser user on the same
   browser never inherits it; Dial Browser logout deletes it synchronously.
4. It is renewed inside Hoppwhistle's refresh window; any 401 ends it, and the
   phone asks to sign in again (a live call is allowed to finish first).

`auth.js` is the only file that knows this. Replacing it with the token
exchange in G6 changes that file and nothing else.

---

## 5. Call lifecycle

**Bootstrap** (`voice.connect()`): credentials + caller IDs → SIP.js UA →
WSS connect → REGISTER → **registered only on the registrar's 2xx**
(`registerAndConfirm`) → presence `available` → listening for INVITEs.
Failures retry with 2s/4s/8s/16s backoff, 5 attempts, then `failed` with a
Reconnect button. 403/409 from the credential endpoint and a 403 REGISTER are
terminal (no retry). Recovery is event-driven (`online`, tab visible,
wake-from-sleep probe) — no polling.

**Outbound**: `normalizeDialable` → mic preflight → `originate` →
INVITE `sip:<dial>@<realm>` with
`X-Caller-ID: <callerId Hoppwhistle returned>`,
`X-Hopwhistle-Call-Id: <callId>`, `X-Hopwhistle-Route-Type: SOFTPHONE_MANUAL`
→ `connecting` → `ringing` (180/183) → `active` (+ `/answer`, once) →
`/hangup` once on any end. Hanging up during `originate` closes the row and
sends no INVITE.

**Inbound**: INVITE → call id from `X-Call-Id: fs-<uuid>` (the CDR's id; SIP
Call-ID only if absent) → `incoming`, ringtone → Accept: mic preflight → SIP
accept → remote audio → `active`, presence `on-call`. Reject: SIP reject.
Busy (already on a call) → 486. Supervisor listen-in legs → 480. Inbound
answer/hangup are recorded by FreeSWITCH's CDR, as in Hoppwhistle.

**Hangup**: establishing outbound → CANCEL; ringing inbound → reject;
established → BYE; then idempotent local cleanup (one hangup report per call
id, however many paths notice the end).

**Mute**: `sender.track.enabled` on the peer connection. **Hold**:
Hoppwhistle's model — the agent's audio is cut and the call stays up (no
re-INVITE, no MOH). Sending audio = `!isMuted && !isOnHold`; neither undoes
the other.

**DTMF**: SIP INFO `application/dtmf-relay` (FreeSWITCH relays it across the
bridge), RFC 2833 only if INFO cannot be sent.

**Transfer**: returns `UNSUPPORTED` (G4). **Three-way**: implemented after
Hoppwhistle's flow but gated on `permissions.conference`, which is `false`
until G3.

**Recording**: owned by Hoppwhistle. The browser never records. The dialer's
"Record" toggle is hidden; the call view shows `REC` when Hoppwhistle's
`/answer` reports `recordingEnabled: true`.

**Tabs**: one Dial Browser tab owns the registration; others show "active in
another tab" with "Use phone here", and take over automatically when the
owner closes or stops renewing its lease.

---

## 6. Hoppwhistle backend gaps

Dial Browser does not work around any of these client-side.

### G1 — Caller ID, destination and route type are not enforced at INVITE time (HIGH, affects Hoppwhistle's own softphone too)

- **FILE**: `apps/freeswitch/conf/dialplan/default.xml` (`outbound-to-bulkvs`),
  `apps/api/src/routes/carrier-routing.ts` (`GET /api/v1/freeswitch/carrier-route`).
- **EXISTING BEHAVIOR**: The dialplan presents `${sip_h_X-Caller-ID}` — a
  header the browser writes — as the caller ID, and dials whatever request URI
  the browser sends. `carrier-route` uses `call_id` only to pick the tenant; it
  never compares `cid` or `dest` to the call row `originate` created. An
  INVITE with no `X-Hopwhistle-Call-Id` still routes (a default caller ID is
  substituted). `X-Hopwhistle-Route-Type` selects any waterfall.
- **WHY IT BLOCKS/WEAKENS**: `originate`'s caller-ID authorization is advisory.
  A registered agent's browser (any client holding their SIP credential) can
  present any caller ID and dial any number on the agency's trunks. Dial
  Browser only ever sends what `originate` returned, but enforcement must be
  server-side.
- **EXACT CHANGE**: In `carrier-route`, when `type` is a softphone route:
  require `call_id`; load the `Call` by id; require `status = INITIATED`,
  `direction = OUTBOUND`, `createdAt` within ~2 minutes, the A-leg's
  authenticated SIP user (`${sip_auth_username}`, passed as a new `ext` query
  param from the dialplan) equal to the `AgentSipCredential.extension` of
  `call.createdById`, and `dest` equal to `call.toNumber` (last 10 digits).
  Build the bridge with `call.callerId`, ignoring the header. Restrict `type`
  to the route types the agent's role may use. On any mismatch return the
  literal body `REFUSED`: today an empty or failed response makes the dialplan
  fall back to the static FracTEL chain, so the dialplan needs one more
  condition that hangs up `CALL_REJECTED` when `${carrier_bridge}` is
  `REFUSED`, ahead of that fallback.
- **REQUEST CONTRACT**: `GET /api/v1/freeswitch/carrier-route?type=&dest=&cid=&call_id=&ext=&corr=&k=` (adds `ext`).
- **RESPONSE CONTRACT**: `text/plain` bridge string as today, or `REFUSED`.
- **SECURITY**: internal-key gated as today; log refusals with tenant/agent;
  goes through the telephony change-control gate
  (`docs/saas/PROTECTED_SYSTEM_INVARIANTS.md` §4).

### G2 — Answer/hangup are scoped to the tenant, not the agent

- **FILE**: `apps/api/src/routes/agent-phone.ts` (`/call/:callId/answer`, `/call/:callId/hangup`).
- **EXISTING BEHAVIOR**: `findFirst({ where: { id, tenantId } })`.
- **WHY**: Any agent in the agency who learns a call id can mark another
  agent's call answered/completed, start its recording and reset that agent's
  presence. Dial Browser only reports call ids `originate` returned to it.
- **EXACT CHANGE**: `where: { id: callId, tenantId, createdById: userId }`
  for outbound (and `answeredByUserId: userId` for inbound if inbound is ever
  reported). 404 otherwise.
- **REQUEST/RESPONSE CONTRACT**: unchanged.
- **SECURITY**: prevents cross-agent call control within a tenant.

### G3 — Merge acts on any SIP Call-IDs it is given

- **FILE**: `apps/api/src/routes/agent-phone.ts` (`POST /call/merge`),
  `apps/api/src/services/freeswitch-service.ts` (`mergeCalls`).
- **EXISTING BEHAVIOR**: Resolves both SIP Call-IDs to FreeSWITCH channels and
  conferences them; no check that the legs belong to the requesting agent or
  tenant.
- **WHY**: A second application should not be able to move someone else's
  call into a conference. Dial Browser keeps three-way calling disabled
  (`permissions.conference = false`) until this is fixed.
- **EXACT CHANGE**: In `mergeCalls`, after resolving each agent leg, read the
  channel's `variable_sip_auth_username` (or `presence_id`) and require it to
  equal the requesting agent's extension; require the bridged customer leg's
  `hopwhistle_tenant_id` (or the Call row) to match `tenantId`. Pass
  `{ userId, tenantId }` in from the route. 404 on mismatch.
- **REQUEST CONTRACT**: `POST /api/v1/agent/call/merge { activeCallId, heldCallId }` (unchanged).
- **RESPONSE CONTRACT**: unchanged; add `404 CALL_NOT_FOUND` for foreign legs.
- **SECURITY**: ownership + tenant validation of both legs. Then expose
  `permissions.conference = true` via G6.

### G4 — No working transfer

- **FILE**: `apps/api/src/routes/agent-phone.ts` (`POST /call/:callId/transfer`);
  `apps/web/.../phone-provider.tsx` (`transferCall` is a TODO).
- **EXISTING BEHAVIOR**: Writes `metadata.transferred*` and sets the agent
  available; no SIP REFER, no `uuid_transfer`.
- **WHY**: Exposing it would tell the agent a call was transferred while the
  caller stays on the line with them. Dial Browser returns `UNSUPPORTED`.
- **EXACT CHANGE**: Server-side blind transfer:
  `uuid_transfer <customer-leg> <destination> XML default` via ESL, after
  resolving the customer leg bridged to the agent's leg (same ownership checks
  as G3); warm transfer = existing add-party + a server "complete transfer"
  that bridges customer↔third party and drops the agent leg.
- **REQUEST CONTRACT**: `POST /api/v1/agent/call/:callId/transfer { destination, type: "blind" | "warm", sipCallId }`.
- **RESPONSE CONTRACT**: `200 { callId, transferType, destination, status: "transferred" | "consulting" }`; `404` foreign/unknown leg; `409` leg not answered.
- **SECURITY**: agent ownership of the leg; destination through the same
  licensed-state / route-type policy as `originate`.

### G5 — The credential response's `wsUrl` is the Verto URL; no TURN

- **FILE**: `apps/api/src/routes/agent-phone.ts` (`GET /webrtc/credentials`).
- **EXISTING BEHAVIOR**: `wsUrl = VERTO_WS_URL || wss://<PUBLIC_IP>:8082`;
  `turnServers: []`. Hoppwhistle's own client ignores `wsUrl`.
- **WHY**: A second client cannot learn the SIP socket from Hoppwhistle and has
  to derive it (`wss://<api host>/ws`) or be configured. Without TURN, agents on
  symmetric NAT / strict corporate networks get one-way or no audio.
- **EXACT CHANGE**: Add `sipWsUrl` (from a new `SIP_WS_PUBLIC_URL`, e.g.
  `wss://hopwhistle.com/ws`) — keep `wsUrl` for the documented contract — and
  return short-lived TURN credentials (`{ urls, username, credential }`,
  coturn REST auth).
- **RESPONSE CONTRACT**: adds `sipWsUrl: string`, `turnServers: Array<{ urls, username, credential }>`.
- **SECURITY**: TURN credentials time-limited (≤ 1h) and per agent.

### G6 — No voice-session bootstrap or cross-app token exchange

- **FILE**: new `apps/api/src/routes/voice-session.ts`; Dial Browser: new
  Base44 function (e.g. `base44/functions/hoppwhistle-voice-session`), then
  `src/telephony/hoppwhistle/auth.js` + `session.js` only.
- **EXISTING BEHAVIOR**: Agents must sign in to Hoppwhistle inside Dial
  Browser; bootstrap takes two requests; permissions are inferred.
- **WHY**: Preferred long-term auth is a short-lived, voice-scoped token for
  the signed-in Dial Browser user, with no Hoppwhistle password typed into
  Dial Browser, and an explicit permission set.
- **EXACT CHANGE**: (a) A Dial Browser ↔ Hoppwhistle user link (Hoppwhistle
  table `external_identity { provider: 'dial-browser', externalUserId, userId, tenantId }`).
  (b) `POST /api/v1/integrations/dial-browser/voice-token`, called **server to
  server** by the Base44 function with an integration secret held in Base44
  secrets, body `{ externalUserId }`, returning a JWT with `aud: "voice"`,
  `exp ≤ 15 min`, accepted only on `/api/v1/agent/*` and `/api/v1/voice/*`.
  (c) `POST /api/v1/voice/session` (bearer = that token) returning:
  ```json
  {
    "agent": { "id": "user-id", "extension": "1047" },
    "sip": { "username": "1047", "password": "…", "realm": "sip.example.com",
             "wsUrl": "wss://sip.example.com/ws", "iceServers": [ … ] },
    "callerIds": [ { "id": "number-id", "number": "+18655551212" } ],
    "permissions": { "inbound": true, "outbound": true, "recording": "server",
                     "transfer": false, "conference": false },
    "expiresAt": "…"
  }
  ```
  The Base44 function can also enforce Dial Browser's non-emergency disclaimer
  before minting (see §7).
- **SECURITY**: integration secret never reaches a browser; token audience-
  and route-restricted; link rows created by an authenticated, consented flow;
  rate-limited; audited.

### G7 — Same extension registered from several apps

- **FILE**: FreeSWITCH SIP profile / directory; `apps/api/src/routes/agent-phone.ts` (`PUT /agent/status`).
- **EXISTING BEHAVIOR**: An agent with Hoppwhistle and Dial Browser open
  registers the same extension twice. Inbound calls fork to both (or go to the
  last registration, depending on `multiple-registrations`), and both write
  the single Redis presence key, last writer wins (closing either marks the
  agent offline).
- **WHY**: Dial Browser coordinates its own tabs (one registration per
  browser) but cannot arbitrate against the Hoppwhistle dashboard.
- **EXACT CHANGE**: Make registrations device-aware: clients send
  `+sip.instance="<urn:uuid:deviceId>"` (Dial Browser already has a persistent
  `hoppwhistle-device-id`); presence becomes per device
  (`agent:status:<userId>:<deviceId>`, agent available if any device is) and
  `PUT /agent/status` takes `{ status, deviceId }`. Optionally a policy
  "single active softphone" that unregisters the older contact.
- **SECURITY**: deviceId is not a credential; it only partitions the agent's own presence.

### G8 — `POST /api/v1/agent/call/incoming` is unauthenticated (pre-existing, not used by Dial Browser)

- **FILE**: `apps/api/src/routes/agent-phone.ts`.
- **EXISTING BEHAVIOR**: `tenantId = body.tenantId ?? 'demo-tenant'`, no auth.
- **EXACT CHANGE**: require the internal key (as `carrier-route` does) and derive the tenant from the dialled DID.

### G9 — Inbound recording state is not observable by the agent's client

- **FILE**: `apps/api/src/routes/agent-phone.ts`.
- **EXISTING BEHAVIOR**: Only `/answer` (outbound) returns `recordingEnabled`.
- **EXACT CHANGE**: `GET /api/v1/agent/call/:callSid/recording` → `{ recordingStatus }`,
  scoped to `tenantId` and the answering agent. Until then Dial Browser shows no
  REC indicator on inbound calls rather than guess.

### G10 — An outbound call is only closed by the browser

- **FILE**: `apps/api/src/services/freeswitch-service.ts` / CDR handling.
- **EXISTING BEHAVIOR**: Outbound agent calls are completed by the browser's
  `/hangup`. Dial Browser also reports on `pagehide` with `keepalive`, but a
  crashed browser leaves the row `INITIATED`/`ANSWERED`.
- **EXACT CHANGE**: Complete agent-phone calls from FreeSWITCH
  `CHANNEL_HANGUP_COMPLETE` matched on `hopwhistle_call_id`, idempotent with `/hangup`.

---

## 7. Dial Browser items that remain on Twilio (not the softphone path)

These are server-side Base44 features that existed beside the Twilio browser
phone. They were left untouched because removing them changes product
behaviour that is not part of the softphone:

- `inbound-phone-voice` — inbound calls to members' **Twilio** personal numbers
  still `<Dial><Client>member_…</Client>`, which no browser registers any
  more, for ~25s before voicemail. Decide: port member DIDs into Hoppwhistle
  (preferred: Hoppwhistle owns inbound DIDs), or drop the `<Client>` leg.
- `provision-phone-number`, `set-call-forwarding`, `phone-call-status`,
  `phone-recording-status`, `start-group-call`, SMS functions, the radio and
  audiobook "listen by phone" bridges.
- Minute metering (`PhoneUsageWidget`) counted Twilio calls; Hoppwhistle calls
  are billed by Hoppwhistle and do not decrement it.
- The non-emergency disclaimer used to be enforced server-side by
  `mint-voice-token`; it is now enforced in the UI (the Phone page does not
  connect until it is accepted). Server-side enforcement belongs in G6's token
  function.

---

## 8. Tests

`npm test` (vitest):

- `voiceClient.test.js` — registration (success, refusal, timeout retry,
  budget exhaustion, manual reconnect, 403/409 terminal, sign-in required,
  transport drop recovery, mid-call blip, auth expiry); outbound (originate
  contract, INVITE headers, caller-ID override, connecting→ringing→active,
  answer reported once, BYE + hangup report, CANCEL, invalid number,
  unauthorized caller ID, originate refused, busy 486 in SIP.js's real event
  order, hangup during originate, mic denied, call-in-progress, connect on
  demand); inbound (X-Call-Id preserved, SIP Call-ID fallback, accept, mic
  denied keeps ringing, reject, remote hangup, caller cancel, busy 486,
  listen-in 480); mute/hold/resume interplay on the real sender track; DTMF;
  transfer unsupported; conference gated, and the enabled three-way flow;
  caller-ID selection + persistence; presence available→on-call→available;
  cleanup on call end, on logout, on dispose; duplicate terminations; tab
  standby/takeover/handover.
- `mediaManager.test.js` — track-event attach, existing receivers, late track,
  autoplay block + gesture retry, cleanup, sender mute, mic preflight errors.
- `tabCoordinator.test.js` — first tab owns, second stands by, ownership moves
  on close and on a silently dead tab, lease renewal, summaries, take-over;
  end-to-end with two voice clients.
- `adapters.test.js` — number normalization, config, auth (binding, refresh
  window, expiry), API (bearer, encoding, 401), bootstrap normalization.
- `sipTransport.test.js` — `registerAndConfirm`, INFO DTMF + RFC 2833 fallback, handle mapping.
- `sipTransport.integration.test.js` — **real SIP.js over a real WebSocket**
  against a digest-authenticating registrar: registered only after a valid
  200, inbound INVITE with `X-Call-Id`, 486 reject, unregister `Expires: 0`,
  403 refusal.

Also run during development (not in the suite; needs Playwright browsers): the
real client in Chromium with a fake microphone against a WebSocket registrar —
verified the INVITE on the wire (`sip:18655551212@realm`, `X-Caller-ID` from
`originate`, `X-Hopwhistle-Call-Id`, `X-Hopwhistle-Route-Type:
SOFTPHONE_MANUAL`, audio SDP), 180→ringing, 486→busy, CANCEL on hangup.

## 9. Manual QA (requires a real Hoppwhistle agent account; not yet run)

1. Log in to Dial Browser. 2. Connect phone with the Hoppwhistle agent login.
3. Indicator shows Online. 4. Caller IDs listed. 5. Select one. 6. Dial a
mobile. 7. It rings. 8. Correct caller ID shown. 9. Two-way audio. 10. Mute.
11. DTMF into an IVR. 12. Hold/resume. 13. Hang up from Dial Browser. 14. Call
in Hoppwhistle call records. 15. Recording per Hoppwhistle policy. 16. Duration
correct. 17. Inbound call to the agent's DID. 18. Rings (also on other pages,
via the dock). 19. Caller number shown. 20. Answer. 21. Two-way audio.
22. Remote hangup clears UI. 23. Second tab shows "active in another tab", no
second registration (`sofia status profile internal reg`). 24. Hoppwhistle +
Dial Browser together — record what FreeSWITCH does (G7). 25. Log out: mic
indicator off, registration gone, agent offline.

## 10. Risks

- **Cross-app registration** (G7) and **multi-device**: unresolved until Hoppwhistle is device-aware.
- **Caller-ID enforcement** (G1) is the highest-risk gap and predates this work.
- **Browser audio**: autoplay can block remote audio until a click (surfaced as
  "Enable audio"); mic permission prompts on first call/answer.
- **NAT**: no TURN today (G5).
- **Auth**: agents type their Hoppwhistle password into Dial Browser until G6;
  the token is a 7-day Hoppwhistle session stored in localStorage (as
  Hoppwhistle's own web app does), bound to the Dial Browser user.
- **Transfer/merge ownership** (G2–G4).
- **Hold** is Hoppwhistle's soft hold (agent audio cut, no MOH).
