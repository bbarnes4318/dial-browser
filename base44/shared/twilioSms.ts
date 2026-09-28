/**
 * Sends a real SMS via the Twilio REST API.
 *
 * Credentials come from app secrets:
 *   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER
 *
 * Returns { success, messageId?, error?, status } so callers can
 * update their SmsNotification record with the real delivery result.
 *
 * If the secrets are missing, returns a failed result without throwing
 * so the calling function can still create its notification record and
 * report the configuration problem gracefully.
 */
export async function sendTwilioSms(
  to: string,
  body: string,
  fromOverride?: string
): Promise<{ success: boolean; messageId?: string; error?: string; status: string }> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = fromOverride || process.env.TWILIO_FROM_NUMBER;

  if (!sid || !token || !from) {
    return {
      success: false,
      error: "Twilio not configured (missing TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_FROM_NUMBER)",
      status: "failed",
    };
  }

  // Normalize the destination to E.164. Assume US (+1) for 10-digit numbers.
  let toNum = String(to || "").trim();
  if (!toNum.startsWith("+")) {
    const digits = toNum.replace(/[^0-9]/g, "");
    toNum = digits.length === 10 ? `+1${digits}` : `+${digits}`;
  }

  try {
    const auth = btoa(`${sid}:${token}`);
    const params = new URLSearchParams();
    params.set("From", from);
    params.set("To", toNum);
    params.set("Body", body);

    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      }
    );

    const data: any = await res.json();
    if (res.ok && data.sid) {
      return { success: true, messageId: data.sid, status: "sent" };
    }
    return {
      success: false,
      error: data.message || `Twilio error ${res.status}`,
      status: "failed",
    };
  } catch (e: any) {
    return { success: false, error: e.message, status: "failed" };
  }
}