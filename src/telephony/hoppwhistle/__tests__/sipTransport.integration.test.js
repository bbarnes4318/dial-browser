/**
 * The real SIP.js adapter, over a real WebSocket, against a minimal
 * SIP-over-WebSocket registrar standing in for FreeSWITCH. Nothing in SIP.js
 * is mocked: this is what proves the phone only reports "registered" when a
 * registrar accepted a digest-authenticated REGISTER.
 */

import { createHash } from "node:crypto";

import { afterEach, describe, expect, it } from "vitest";
import { WebSocketServer } from "ws";

import { createSipStack } from "../sipTransport.js";

const REALM = "sip.test";
const PASSWORD = "per-agent-secret";
const md5 = (s) => createHash("md5").update(s).digest("hex");
const header = (msg, name) => (msg.match(new RegExp(`^${name}:\\s*(.*)$`, "im")) || [])[1]?.trim() || "";
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function startRegistrar({ refuse = false } = {}) {
  const wire = [];
  const wss = new WebSocketServer({ port: 0, handleProtocols: () => "sip" });
  let socket = null;
  wss.on("connection", (ws) => {
    socket = ws;
    ws.on("message", (buf) => {
      const msg = buf.toString();
      const first = msg.split("\r\n")[0];
      const base = ["Via", "From", "To", "Call-ID", "CSeq"].map((h) => `${h}: ${header(msg, h)}`).join("\r\n");
      if (first.startsWith("REGISTER")) {
        const auth = header(msg, "Authorization");
        const expires = header(msg, "Expires") || (msg.match(/expires=(\d+)/i) || [])[1];
        wire.push({ method: "REGISTER", authorized: Boolean(auth), expires });
        if (refuse) return ws.send(`SIP/2.0 403 Forbidden\r\n${base}\r\nContent-Length: 0\r\n\r\n`);
        if (!auth) {
          return ws.send(
            `SIP/2.0 401 Unauthorized\r\n${base}\r\nWWW-Authenticate: Digest realm="${REALM}", nonce="n0nce", algorithm=MD5, qop="auth"\r\nContent-Length: 0\r\n\r\n`,
          );
        }
        const p = Object.fromEntries([...auth.matchAll(/(\w+)="?([^",]+)"?/g)].map((m) => [m[1], m[2]]));
        const expected = md5(`${md5(`${p.username}:${REALM}:${PASSWORD}`)}:${p.nonce}:${p.nc}:${p.cnonce}:${p.qop}:${md5(`REGISTER:${p.uri}`)}`);
        wire.push({ digestValid: expected === p.response, username: p.username });
        return ws.send(
          `SIP/2.0 ${expected === p.response ? "200 OK" : "403 Forbidden"}\r\n${base}\r\nContact: ${header(msg, "Contact")};expires=${expires || 600}\r\nContent-Length: 0\r\n\r\n`,
        );
      }
      if (first.startsWith("SIP/2.0")) wire.push({ response: first });
    });
  });
  const ready = new Promise((r) => wss.on("listening", r));
  return {
    wire,
    ready,
    url: () => `ws://127.0.0.1:${wss.address().port}`,
    close: () => new Promise((r) => wss.close(r)),
    sendInvite() {
      const sdp = "v=0\r\no=- 1 1 IN IP4 127.0.0.1\r\ns=-\r\nc=IN IP4 127.0.0.1\r\nt=0 0\r\nm=audio 4000 RTP/AVP 0\r\na=rtpmap:0 PCMU/8000\r\n";
      socket.send(
        [
          `INVITE sip:1047@${REALM};transport=ws SIP/2.0`,
          "Via: SIP/2.0/WSS fs.test;branch=z9hG4bKinv1",
          "Max-Forwards: 70",
          `From: "Jane Caller" <sip:+14235550199@${REALM}>;tag=fs1`,
          `To: <sip:1047@${REALM}>`,
          "Call-ID: inbound-call-1",
          "CSeq: 1 INVITE",
          "Contact: <sip:fs@fs.test;transport=ws>",
          "X-Call-Id: fs-0f8e2b6c-1111-4c3d-9a55-2b7d0e0d9a10",
          "Content-Type: application/sdp",
          `Content-Length: ${Buffer.byteLength(sdp)}`,
          "",
          sdp,
        ].join("\r\n"),
      );
    },
  };
}

describe("sipTransport against a live SIP-over-WebSocket registrar", () => {
  const cleanups = [];
  afterEach(async () => {
    for (const fn of cleanups.splice(0)) await fn();
  });

  it("registers only after the registrar accepts a valid digest, takes an inbound INVITE, and unregisters", async () => {
    const reg = startRegistrar();
    await reg.ready;
    let invited = null;
    const stack = createSipStack({
      username: "1047",
      password: PASSWORD,
      realm: REALM,
      wsUrl: reg.url(),
      iceServers: [],
      delegate: { onInvite: (h) => (invited = h) },
    });
    cleanups.push(() => stack.stop(), () => reg.close());

    await stack.start();
    expect(stack.isConnected()).toBe(true);
    expect(stack.isRegistered()).toBe(false);
    await stack.register(5000);
    expect(reg.wire).toContainEqual({ digestValid: true, username: "1047" });
    expect(stack.isRegistered()).toBe(true);

    reg.sendInvite();
    await wait(300);
    expect(invited).not.toBe(null);
    expect(invited.getHeader("X-Call-Id")).toBe("fs-0f8e2b6c-1111-4c3d-9a55-2b7d0e0d9a10");
    expect(invited.remoteUser).toBe("+14235550199");
    expect(invited.remoteDisplayName).toBe("Jane Caller");
    expect(invited.state).toBe("initial");

    await invited.reject(486);
    await wait(200);
    expect(reg.wire.some((w) => w.response?.startsWith("SIP/2.0 486"))).toBe(true);

    await stack.unregister();
    await wait(300);
    expect(reg.wire.some((w) => w.method === "REGISTER" && w.authorized && w.expires === "0")).toBe(true);
  }, 15000);

  it("rejects with the status code when the registrar refuses", async () => {
    const reg = startRegistrar({ refuse: true });
    await reg.ready;
    const stack = createSipStack({ username: "1047", password: "wrong", realm: REALM, wsUrl: reg.url(), iceServers: [], delegate: {} });
    cleanups.push(() => stack.stop(), () => reg.close());
    await stack.start();
    await expect(stack.register(5000)).rejects.toMatchObject({ name: "RegistrationRejectedError", statusCode: 403 });
    expect(stack.isRegistered()).toBe(false);
  }, 15000);
});
