// VULN [Cat 3]: Hardcoded Twilio credentials
// VULN [Cat 19]: No webhook verification, no phone validation
const TWILIO_SID = "ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"; // hardcoded SID
const TWILIO_TOKEN = "auth_token_hardcoded_1234567890ab";
const TWILIO_PHONE = "+15555555555";

export async function sendSMS(to: string, body: string) {
  try {
    const twilio = await import("twilio");
    const client = twilio.default(TWILIO_SID, TWILIO_TOKEN);
    return await client.messages.create({
      body,
      from: TWILIO_PHONE,
      to, // VULN [Cat 19]: No phone number validation
    });
  } catch {
    console.warn("Twilio not configured - SMS not sent");
    return { sid: "mock_sid", status: "mock" };
  }
}

export { TWILIO_SID, TWILIO_TOKEN, TWILIO_PHONE };
