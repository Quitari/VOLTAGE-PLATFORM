from celery import shared_task
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)


@shared_task
def auto_revoke_expired_punishments():
    """
    Автоматически снимает наказания у которых истёк expires_at
    """
    from .models import Punishment

    now = timezone.now()
    expired = Punishment.objects.filter(
        status=Punishment.Status.ACTIVE,
        expires_at__lte=now
    )
    count = expired.count()
    expired.update(status=Punishment.Status.EXPIRED)
    if count > 0:
        logger.info(f'Автоснято {count} наказаний')
