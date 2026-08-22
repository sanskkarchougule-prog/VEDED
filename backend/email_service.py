"""Resend transactional email — best-effort, non-blocking."""
import os
import asyncio
import logging

import resend

logger = logging.getLogger("veded.email")

resend.api_key = os.environ.get("RESEND_API_KEY", "")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")

LIME = "#c9f24d"
BG = "#0c0c0d"
CARD = "#151517"


def _wrap(title: str, body_html: str) -> str:
    return f"""
    <div style="background:{BG};padding:32px 0;font-family:Arial,Helvetica,sans-serif;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr><td align="center">
          <table role="presentation" width="520" cellpadding="0" cellspacing="0"
                 style="background:{CARD};border-radius:16px;overflow:hidden;border:1px solid #262629;">
            <tr><td style="padding:28px 32px 8px;">
              <span style="color:{LIME};font-size:22px;font-weight:800;letter-spacing:1px;">VEDED</span>
              <span style="color:#8a8a90;font-size:11px;letter-spacing:3px;"> &nbsp;CREATIVE SUITE</span>
            </td></tr>
            <tr><td style="padding:8px 32px 4px;">
              <h1 style="color:#f4f4f5;font-size:24px;margin:12px 0 4px;">{title}</h1>
            </td></tr>
            <tr><td style="padding:8px 32px 28px;color:#c4c4c9;font-size:15px;line-height:1.6;">
              {body_html}
            </td></tr>
            <tr><td style="padding:18px 32px;border-top:1px solid #262629;color:#6b6b70;font-size:12px;">
              You're receiving this because you have a VEDED account. © VEDED Creative Suite.
            </td></tr>
          </table>
        </td></tr>
      </table>
    </div>
    """


def welcome_html(name: str) -> str:
    body = f"""
      <p>Hi {name}, welcome to <strong style="color:#f4f4f5;">VEDED</strong> — your AI creative studio.</p>
      <p>Your studio is activated with <strong style="color:{LIME};">10 free images, 1 video and audio credits</strong> to start creating right away.</p>
      <p style="margin-top:20px;">
        <a href="https://veded.app/app" style="background:{LIME};color:#0c0c0d;text-decoration:none;
           font-weight:700;padding:12px 24px;border-radius:10px;display:inline-block;">Open your studio</a>
      </p>
      <p style="color:#8a8a90;font-size:13px;margin-top:20px;">Generate images, audio, video and more — all from one balance.</p>
    """
    return _wrap("Your studio is live 🎬", body)


def receipt_html(name: str, package_name: str, amount: float) -> str:
    body = f"""
      <p>Hi {name}, thanks for your purchase. Your payment was successful and your credits are now available.</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
             style="margin:18px 0;border:1px solid #262629;border-radius:10px;">
        <tr><td style="padding:14px 18px;color:#8a8a90;">Plan / Pack</td>
            <td style="padding:14px 18px;color:#f4f4f5;text-align:right;font-weight:600;">{package_name}</td></tr>
        <tr><td style="padding:14px 18px;color:#8a8a90;border-top:1px solid #262629;">Amount</td>
            <td style="padding:14px 18px;color:{LIME};text-align:right;font-weight:700;border-top:1px solid #262629;">${amount:.2f}</td></tr>
      </table>
      <p style="color:#8a8a90;font-size:13px;">Your new credits have been added to your wallet.</p>
    """
    return _wrap("Payment received ✅", body)


async def _send(to: str, subject: str, html: str):
    if not resend.api_key:
        logger.warning("RESEND_API_KEY not set; skipping email to %s", to)
        return
    try:
        params = {"from": SENDER_EMAIL, "to": [to], "subject": subject, "html": html}
        res = await asyncio.to_thread(resend.Emails.send, params)
        logger.info("Sent email to %s (id=%s)", to, (res or {}).get("id"))
    except Exception as e:
        logger.error("Failed to send email to %s: %s", to, e)


async def send_welcome(to: str, name: str):
    await _send(to, "Welcome to VEDED — your studio is live", welcome_html(name))


async def send_receipt(to: str, name: str, package_name: str, amount: float):
    await _send(to, "Your VEDED payment receipt", receipt_html(name, package_name, amount))
