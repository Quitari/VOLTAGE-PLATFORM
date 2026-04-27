from celery import shared_task
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)


@shared_task
def auto_draw_expired_giveaways():
    """
    Автоматически проводит розыгрыши у которых истёк ends_at
    """
    from .models import Giveaway, Participant, Winner
    import random

    now = timezone.now()
    expired = Giveaway.objects.filter(
        status=Giveaway.Status.ACTIVE,
        ends_at__lte=now
    )

    for giveaway in expired:
        try:
            already_won = giveaway.winners.values_list('user_id', flat=True)
            eligible = giveaway.participants.filter(
                is_active=True
            ).exclude(user_id__in=already_won)

            if not eligible.exists():
                giveaway.status = Giveaway.Status.CANCELLED
                giveaway.save()
                logger.info(f'Розыгрыш {giveaway.id} отменён — нет участников')
                continue

            winner_participant = random.choice(list(eligible))
            Winner.objects.create(
                giveaway=giveaway,
                user=winner_participant.user,
                status=Winner.Status.PENDING
            )
            giveaway.status = Giveaway.Status.DRAWING
            giveaway.save()
            logger.info(f'Розыгрыш {giveaway.id} — победитель {winner_participant.user.username}')

        except Exception as e:
            logger.error(f'Ошибка автодроу {giveaway.id}: {e}')
