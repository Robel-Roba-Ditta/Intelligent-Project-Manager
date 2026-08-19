import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../domain/notification.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notifRepo: Repository<Notification>,
  ) {}

  async findAllForUser(userId: number) {
    const notifications = await this.notifRepo.find({
      where: { userId },
      relations: { task: true },
      order: { createdAt: 'DESC' },
      take: 50,
    });

    const unreadCount = await this.notifRepo.count({
      where: { userId, isRead: false },
    });

    return { notifications, unreadCount };
  }

  async markRead(id: number, userId: number) {
    const notif = await this.notifRepo.findOne({ where: { id } });
    if (!notif) throw new NotFoundException('Notification not found');
    if (notif.userId !== userId) throw new ForbiddenException();
    notif.isRead = true;
    return this.notifRepo.save(notif);
  }

  async markAllRead(userId: number) {
    await this.notifRepo.update({ userId, isRead: false }, { isRead: true });
    return { success: true };
  }
}
