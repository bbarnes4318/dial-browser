import { describe, expect, it } from "vitest";

import { createTabCoordinator, TAB_LEASE_KEY } from "../tabCoordinator.js";
import { PhoneStatus } from "../callState.js";
import { createChannelBus, createHarness, createMemoryStorage, flush } from "./fakes.js";

/** Several "tabs" sharing one browser profile: one localStorage, one BroadcastChannel bus, one clock. */
function browser() {
  const storage = createMemoryStorage();
  const { FakeBroadcastChannel } = createChannelBus();
  let clock = 1_000_000;
  const repeats = new Map();
  const owners = new Map();
  let seq = 0;
  const tab = (name) =>
    createTabCoordinator({
      storage,
      BroadcastChannelCtor: FakeBroadcastChannel,
      win: null,
      now: () => clock,
      setRepeat: (fn) => {
        const id = ++seq;
        repeats.set(id, fn);
        owners.set(id, name);
        return id;
      },
      clearRepeat: (id) => repeats.delete(id),
      tabId: name,
      logger: { info() {}, warn() {}, error() {}, debug() {} },
    });
  return {
    storage,
    tab,
    /** The tab's process dies: its timers stop, nothing is broadcast, the lease is left behind. */
    kill: (name) => {
      for (const [id, owner] of owners) if (owner === name) repeats.delete(id);
    },
    tick: (ms) => {
      clock += ms;
      for (const fn of [...repeats.values()]) fn();
    },
  };
}

describe("tab coordination", () => {
  it("lets the first tab own the phone and the second see it is taken", () => {
    const b = browser();
    const first = b.tab("A");
    const second = b.tab("B");
    expect(first.claim()).toBe(true);
    expect(second.claim()).toBe(false);
    expect(second.ownerElsewhere()).toBe(true);
    expect(first.isOwner()).toBe(true);
  });

  it("shares one device id across tabs", () => {
    const b = browser();
    expect(b.tab("A").deviceId).toBe(b.tab("B").deviceId);
  });

  it("moves ownership when the owning tab closes", () => {
    const b = browser();
    const first = b.tab("A");
    const second = b.tab("B");
    first.claim();
    second.claim();
    const events = [];
    second.subscribe((e) => events.push(e.type));
    first.dispose();
    expect(events).toContain("owner-gone");
    expect(second.claim()).toBe(true);
  });

  it("moves ownership when the owning tab dies without saying so", () => {
    const b = browser();
    const first = b.tab("A");
    const second = b.tab("B");
    first.claim();
    const events = [];
    second.subscribe((e) => events.push(e.type));
    second.claim();
    b.kill("A");
    expect(JSON.parse(b.storage.getItem(TAB_LEASE_KEY)).tabId).toBe("A");
    b.tick(2000);
    expect(events).not.toContain("owner-gone"); // lease still inside its 7s
    b.tick(6000);
    expect(events).toContain("owner-gone");
    expect(second.claim()).toBe(true);
  });

  it("keeps the lease alive while the owner lives", () => {
    const b = browser();
    const first = b.tab("A");
    const second = b.tab("B");
    first.claim();
    for (let i = 0; i < 10; i++) b.tick(2000);
    expect(second.claim()).toBe(false);
  });

  it("carries the owner's phone summary and take-over requests", () => {
    const b = browser();
    const first = b.tab("A");
    const second = b.tab("B");
    first.claim();
    second.claim();
    const firstEvents = [];
    first.subscribe((e) => firstEvents.push(e.type));
    first.publish({ phoneStatus: "registered", call: null });
    expect(second.remoteSummary()).toEqual({ phoneStatus: "registered", call: null });
    second.requestTakeover();
    expect(firstEvents).toContain("takeover-requested");
  });

  it("end to end: a second Dial Browser tab stands by, then takes over when the first closes", async () => {
    const b = browser();
    const storage = createMemoryStorage();
    const a = createHarness({ coordinator: b.tab("A"), storage });
    const c = createHarness({ coordinator: b.tab("B"), storage });

    expect(await a.client.connect()).toBe(true);
    expect(await c.client.connect()).toBe(false);
    expect(c.state().phoneStatus).toBe(PhoneStatus.STANDBY);
    expect(c.sip).not.toHaveBeenCalled();
    expect(a.sip).toHaveBeenCalledTimes(1);

    await a.client.dispose();
    await flush();
    expect(c.state().phoneStatus).toBe(PhoneStatus.REGISTERED);
    expect(c.sip).toHaveBeenCalledTimes(1);
  });
});

