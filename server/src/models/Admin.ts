import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { IsString, IsEmail, IsEnum, IsDate, IsBoolean } from 'class-validator';

export enum AdminRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  SUPPORT = 'support'
}

export enum AdminPermission {
  MANAGE_USERS = 'manage_users',
  MANAGE_BOOKINGS = 'manage_bookings',
  MANAGE_CONTENT = 'manage_content',
  MANAGE_REVIEWS = 'manage_reviews',
  VIEW_STATISTICS = 'view_statistics',
  MANAGE_SETTINGS = 'manage_settings',
  MODERATE_CONTENT = 'moderate_content',
  SUPPORT_TICKETS = 'support_tickets'
}

@Entity('admins')
export class Admin {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @IsString()
  username: string;

  @Column()
  @IsEmail()
  email: string;

  @Column({ select: false })
  password: string;

  @Column({
    type: 'enum',
    enum: AdminRole,
    default: AdminRole.MODERATOR
  })
  @IsEnum(AdminRole)
  role: AdminRole;

  @Column('simple-array')
  permissions: AdminPermission[];

  @Column({ default: true })
  @IsBoolean()
  isActive: boolean;

  @Column({ nullable: true })
  @IsDate()
  lastLogin: Date;

  @Column({ type: 'jsonb', nullable: true })
  preferences: {
    theme: 'light' | 'dark';
    notifications: boolean;
    language: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  actions: {
    timestamp: Date;
    action: string;
    details: string;
  }[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}