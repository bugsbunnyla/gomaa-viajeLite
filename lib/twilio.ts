import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

export async function sendSMS(to: string, body: string) {
  if (!accountSid || !authToken || !fromNumber) {
    console.log("[SMS MOCK] To:", to, "Body:", body);
    return { sid: "mock-sms-sid" };
  }
  try {
    const client = twilio(accountSid, authToken);
    const message = await client.messages.create({ body, from: fromNumber, to });
    return message;
  } catch (e) {
    console.error("SMS send failed:", e);
    return null;
  }
}
