import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';

@Entity('projects')
export class Project {
  @PrimaryColumn({ length: 36 })
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'base_url', length: 500, nullable: true })
  baseUrl: string;

  @Column({ type: 'json', nullable: true })
  settings: any;

  @Column({ name: 'feishu_webhook', length: 500, nullable: true })
  feishuWebhook: string;

  @Column({ name: 'owner_id', length: 36, nullable: true })
  ownerId: string;

  @Column({ type: 'json', nullable: true })
  members: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ type: 'tinyint', default: 0 })
  deleted: number;
}
