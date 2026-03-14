import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('test_executions')
export class TestExecution {
  @PrimaryColumn({ length: 36 })
  id: string;

  @Column({ name: 'project_id', length: 36 })
  projectId: string;

  @Column({ name: 'test_case_id', length: 36 })
  testCaseId: string;

  @Column({ name: 'test_case_name', length: 255, nullable: true })
  testCaseName: string;

  @Column({ name: 'data_name', length: 255, nullable: true })
  dataName: string;

  @Column({ name: 'menu_path', length: 255, nullable: true })
  menuPath: string;

  @Column({ name: 'menu_path_name', length: 255, nullable: true })
  menuPathName: string;

  @Column({ length: 20, default: 'pending' })
  status: string;

  @Column({ name: 'start_time', type: 'datetime', default: () => 'CURRENT_TIMESTAMP(3)' })
  startTime: Date;

  @Column({ name: 'end_time', type: 'datetime', nullable: true })
  endTime: Date;

  @Column({ type: 'int', nullable: true })
  duration: number;

  @Column({ type: 'text', nullable: true })
  error: string;

  @Column({ type: 'json', nullable: true })
  logs: any;

  @Column({ type: 'json', nullable: true })
  context: any;

  @Column({ name: 'structured_logs', type: 'json', nullable: true })
  structuredLogs: any;

  @Column({ name: 'performance_metrics', type: 'json', nullable: true })
  performanceMetrics: any;

  @Column({ name: 'created_by', length: 100, nullable: true })
  createdBy: string;

  @Column({ name: 'environment_info', type: 'json', nullable: true })
  environmentInfo: any;
}
