import twilio from "twilio";
import dotenv from "dotenv";

dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

export const sendVerificationSMS = async (to, token) => {
  try {
    const message = await client.messages.create({
      body: `Your verification code is: ${token}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to, 
    });
    console.log("SMS sent:", message.body);
  } catch (error) {
    console.error("Failed to send SMS:", error);
  }
};
