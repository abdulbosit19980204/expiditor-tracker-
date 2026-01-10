"""
Email Service - Yandex va Gmail uchun email jo'natish
IMAP/SMTP orqali email yuborish
"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from django.conf import settings
from .models import EmailConfig
import logging

logger = logging.getLogger(__name__)


class EmailService:
    """Email yuborish service - Yandex va Gmail qo'llab-quvvatlaydi"""
    
    # Provider konfiguratsiyalari
    PROVIDER_CONFIGS = {
        'yandex': {
            'smtp_host': 'smtp.yandex.ru',
            'smtp_port': 465,  # SSL uchun
            'smtp_port_tls': 587,  # TLS uchun
            'imap_host': 'imap.yandex.ru',
            'imap_port': 993,
            'use_ssl': True,
            'use_tls': False,
        },
        'gmail': {
            'smtp_host': 'smtp.gmail.com',
            'smtp_port': 465,  # SSL uchun
            'smtp_port_tls': 587,  # TLS uchun
            'imap_host': 'imap.gmail.com',
            'imap_port': 993,
            'use_ssl': True,
            'use_tls': False,
        },
    }
    
    def __init__(self, email_config: EmailConfig = None):
        """Email service ni ishga tushiradi"""
        self.email_config = email_config or EmailConfig.objects.filter(is_active=True).first()
        if not self.email_config:
            raise ValueError("Email konfiguratsiyasi topilmadi. Iltimos, admin panelda EmailConfig yarating va faollashtiring.")
    
    def detect_provider(self, email_address: str) -> str:
        """Email provider'ni aniqlash"""
        email_lower = email_address.lower()
        if '@yandex.ru' in email_lower or '@yandex.com' in email_lower:
            return 'yandex'
        elif '@gmail.com' in email_lower:
            return 'gmail'
        return 'custom'
    
    def get_smtp_config(self, provider: str = None):
        """SMTP konfiguratsiyasini olish"""
        if provider is None:
            # EmailConfig dan provider ni aniqlash
            from_email = self.email_config.from_email or self.email_config.username
            if from_email:
                provider = self.detect_provider(from_email)
            else:
                provider = 'custom'
        
        if provider in self.PROVIDER_CONFIGS:
            config = self.PROVIDER_CONFIGS[provider].copy()
            # EmailConfig sozlamalarini ustun qo'yish
            if self.email_config.host:
                config['smtp_host'] = self.email_config.host
            if self.email_config.port:
                if self.email_config.use_ssl:
                    config['smtp_port'] = self.email_config.port
                elif self.email_config.use_tls:
                    config['smtp_port'] = self.email_config.port
            config['use_ssl'] = self.email_config.use_ssl
            config['use_tls'] = self.email_config.use_tls
            return config
        else:
            # Custom provider
            return {
                'smtp_host': self.email_config.host or 'smtp.gmail.com',
                'smtp_port': self.email_config.port or 587,
                'use_ssl': self.email_config.use_ssl,
                'use_tls': self.email_config.use_tls,
            }
    
    def send_email(self, to_emails: list, subject: str, html_content: str, text_content: str = None):
        """
        Email yuborish
        
        Args:
            to_emails: Qabul qiluvchilar email ro'yxati
            subject: Email mavzusi
            html_content: HTML formatda email mazmuni
            text_content: Text formatda email mazmuni (ixtiyoriy)
        
        Returns:
            dict: {'success': bool, 'message': str, 'sent_to': list}
        """
        try:
            from_email = self.email_config.from_email or self.email_config.username
            if not from_email:
                raise ValueError("From email topilmadi. EmailConfig'da from_email yoki username ni to'ldiring.")
            
            username = self.email_config.username or from_email
            password = self.email_config.password
            
            if not password:
                raise ValueError("Email parol topilmadi. EmailConfig'da password ni to'ldiring.")
            
            # Provider ni aniqlash
            provider = self.detect_provider(from_email)
            smtp_config = self.get_smtp_config(provider)
            
            # Email yaratish
            msg = MIMEMultipart('alternative')
            msg['From'] = from_email
            msg['To'] = ', '.join(to_emails)
            msg['Subject'] = subject
            
            # HTML va text qismlarni qo'shish
            if text_content:
                part1 = MIMEText(text_content, 'plain', 'utf-8')
                msg.attach(part1)
            
            part2 = MIMEText(html_content, 'html', 'utf-8')
            msg.attach(part2)
            
            # SMTP orqali yuborish
            if smtp_config['use_ssl']:
                # SSL bilan ulanish
                server = smtplib.SMTP_SSL(smtp_config['smtp_host'], smtp_config['smtp_port'])
            else:
                # TLS yoki oddiy ulanish
                server = smtplib.SMTP(smtp_config['smtp_host'], smtp_config['smtp_port'])
                if smtp_config['use_tls']:
                    server.starttls()
            
            # Autentifikatsiya
            server.login(username, password)
            
            # Email yuborish
            server.sendmail(from_email, to_emails, msg.as_string())
            server.quit()
            
            logger.info(f"Email muvaffaqiyatli yuborildi: {subject} -> {to_emails}")
            
            return {
                'success': True,
                'message': f'Email {len(to_emails)} ta manzilga yuborildi',
                'sent_to': to_emails,
                'provider': provider
            }
            
        except smtplib.SMTPAuthenticationError as e:
            error_msg = f"SMTP autentifikatsiya xatosi: {str(e)}"
            logger.error(error_msg)
            return {
                'success': False,
                'message': error_msg,
                'error_type': 'authentication_error'
            }
        except smtplib.SMTPException as e:
            error_msg = f"SMTP xatosi: {str(e)}"
            logger.error(error_msg)
            return {
                'success': False,
                'message': error_msg,
                'error_type': 'smtp_error'
            }
        except Exception as e:
            error_msg = f"Email yuborishda xatolik: {str(e)}"
            logger.error(error_msg, exc_info=True)
            return {
                'success': False,
                'message': error_msg,
                'error_type': 'general_error'
            }
    
    @classmethod
    def send_email_with_config(cls, email_config: EmailConfig, to_emails: list, subject: str, html_content: str, text_content: str = None):
        """Statik metod - berilgan config bilan email yuborish"""
        service = cls(email_config)
        return service.send_email(to_emails, subject, html_content, text_content)
    
    @classmethod
    def send_email_default(cls, to_emails: list, subject: str, html_content: str, text_content: str = None):
        """Statik metod - default config bilan email yuborish"""
        service = cls()
        return service.send_email(to_emails, subject, html_content, text_content)
