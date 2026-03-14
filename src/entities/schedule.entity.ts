import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('schedules')
export class Schedule {
  @PrimaryColumn({ length: 36 })
  id: string;

  @Column({ name: 'project_id', length: 36 })
  projectId: string;

  @Column({ name: 'scenario_id', length: 36, nullable: true })
  scenarioId: string;

  @Column({ name: 'scenario_name', length: 255, nullable: true })
  scenarioName: string;

  @Column({ length: 255 })
  name: string;

  @Column({ name: 'execution_date', type: 'datetime', nullable: true })
  executionDate: Date;

  @Column({ name: 'cron_expression', length: 100, nullable: true })
  cronExpression: string;

  @Column({ length: 20, default: 'pending' })
  status: string;

  @Column({ name: 'feishu_webhook', length: 500, nullable: true })
  feishuWebhook: string;

  @Column({ name: 'notify_on_success', type: 'tinyint', default: 1 })
  notifyOnSuccess: number;

  @Column({ name: 'notify_on_failure', type: 'tinyint', default: 1 })
  notifyOnFailure: number;

  @Column({ name: 'executed_at', type: 'datetime', nullable: true })
  executedAt: Date;

  @Column({ name: 'last_executed_at', type: 'datetime', nullable: true })
  lastExecutedAt: Date;

  @Column({ type: 'json', nullable: true })
  result: any;

  @Column({ type: 'text', nullable: true })
  error: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
