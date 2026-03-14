import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('scenarios')
export class Scenario {
  @PrimaryColumn({ length: 36 })
  id: string;

  @Column({ name: 'project_id', length: 36 })
  projectId: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'test_cases', type: 'json' })
  testCases: any;

  @Column({ name: 'menu_path', length: 255, nullable: true })
  menuPath: string;

  @Column({ name: 'menu_path_name', length: 255, nullable: true })
  menuPathName: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
