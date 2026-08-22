"""Twilio Verify — SMS OTP. Auto-disabled until auth token + verify service are set."""
import os
import asyncio
import logging

logger = logging.getLogger("veded.twilio")

ACCOUNT_SID = os.environ.get("TWILIO_ACCOUNT_SID", "")
AUTH_TOKEN = os.environ.get("TWILIO_AUTH_TOKEN", "")
VERIFY_SERVICE = os.environ.get("TWILIO_VERIFY_SERVICE", "")


def is_configured() -> bool:
    return bool(ACCOUNT_SID and AUTH_TOKEN and VERIFY_SERVICE)


def _client():
    from twilio.rest import Client
    return Client(ACCOUNT_SID, AUTH_TOKEN)


async def send_otp(phone: str) -> str:
    def _do():
        v = _client().verify.v2.services(VERIFY_SERVICE).verifications.create(
            to=phone, channel="sms"
        )
        return v.status
    return await asyncio.to_thread(_do)


async def check_otp(phone: str, code: str) -> bool:
    def _do():
        c = _client().verify.v2.services(VERIFY_SERVICE).verification_checks.create(
            to=phone, code=code
        )
        return c.status == "approved"
    return await asyncio.to_thread(_do)
