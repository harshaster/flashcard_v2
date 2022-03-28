from email import encoders
from email.mime.base import MIMEBase
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import smtplib
from jinja2 import Template




SMTP_SERVER_HOST= "smtp.gmail.com"
SMTP_SERVER_PORT= 587
SENDER_ADDRESS = "31hk12@gmail.com"
SENDER_PASSWORD = "31122002hk"


def send_email(to_address, message, subject, attachment=None):
    msg=MIMEMultipart()
    msg["From"] = "flashcard.harshit"
    msg["To"] = to_address
    msg["Subject"] = subject
    msg.attach(MIMEText(message,"html"))
    if attachment:
        with open(attachment, 'rb') as att:
            part=MIMEBase("application", "octet-stream")
            part.set_payload(att.read())
        encoders.encode_base64(part)
        part.add_header(
            "Content-Disposition", f"attachment: filename= 'test.go'"
        )
        msg.attach(part)
    s=smtplib.SMTP(host=SMTP_SERVER_HOST, port=SMTP_SERVER_PORT)
    s.starttls()
    s.login(SENDER_ADDRESS, SENDER_PASSWORD)
    s.send_message(msg)
    s.quit()

    return True

def main():
    # new_users = [
    #     {"name": "Neha", "email": "neha@harshit.com"},
    #     {"name": "Yasho", "email": "yasho@harshit.com"}
    # ]
    # with open("welcome.html", 'r') as temp:
    #     template=Template(temp.read())
    # for user in new_users:
    #     send_email(user["email"], subject="Test Email", message=template.render(data=user), attachment="new.cpp")
    send_email("harshasterhk@gmail.com", subject="Test mail", message="Hi there this is a test mail to check if my python code works")

if __name__=="__main__":
    main()
