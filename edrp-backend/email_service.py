import os
from email.message import EmailMessage

import aiosmtplib


async def send_email(
    recipient: str,
    subject: str,
    body: str,
):
    message = EmailMessage()

    message["From"] = (
        f"{os.getenv('SMTP_FROM_NAME')} "
        f"<{os.getenv('SMTP_FROM_EMAIL')}>"
    )

    message["To"] = recipient
    message["Subject"] = subject

    message.set_content(body)

    await aiosmtplib.send(
        message,
        hostname=os.getenv("SMTP_HOST"),
        port=int(os.getenv("SMTP_PORT", 587)),
        username=os.getenv("SMTP_USERNAME"),
        password=os.getenv("SMTP_PASSWORD"),
        start_tls=True,
    )