import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';

@Entity('test_cases')
export class TestCase {
  @PrimaryColumn({ length: 36 })
  id: string;

  @Column({ name: 'project_id', length: 36 })
  projectId: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 500, nullable: true })
  url: string;

  @Column({ name: 'use_relative_url', type: 'tinyint', default: 0 })
  useRelativeUrl: number;

  @Column({ name: 'expected_results', type: 'json', nullable: true })
  expectedResults: any;

  @Column({ name: 'test_data', type: 'json', nullable: true })
  testData: any;

  @Column({ type: 'json', nullable: true })
  tags: any;

  @Column({ name: 'data_driven', type: 'json', nullable: true })
  dataDriven: any;

  @Column({ name: 'menu_path', length: 255, nullable: true })
  menuPath: string;

  @Column({ name: 'menu_path_name', length: 255, nullable: true })
  menuPathName: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
