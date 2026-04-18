from django.db import models
from apps.users.models import User


class Clip(models.Model):
    STATUS_CHOICES = [
        ('pending', 'На модерации'),
        ('approved', 'Одобрен'),
        ('rejected', 'Отклонён'),
    ]

    title = models.CharField(max_length=200, verbose_name='Название')
    url = models.URLField(verbose_name='Ссылка на клип')
    game = models.CharField(max_length=100, blank=True, default='', verbose_name='Игра')
    preview_url = models.URLField(blank=True, default='', verbose_name='Превью')
    submitted_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='submitted_clips',
        verbose_name='Предложил'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        verbose_name='Статус'
    )
    admin_note = models.TextField(blank=True, default='', verbose_name='Заметка администратора')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Клип'
        verbose_name_plural = 'Клипы'
        db_table = 'clips'
        ordering = ['-created_at']

    def __str__(self):
        return self.title