export type SkillGroup = { title: string; icon: string; items: string[] }
export const skills: SkillGroup[] = [
  { title: 'Backend', icon: 'server', items: ['C# / ASP.NET Core', 'Laravel (PHP)', 'Python', 'SignalR', 'Quartz', 'JWT and Keycloak role-based access', 'ADO.NET', 'Stored procedures'] },
  { title: 'Frontend / Mobile / Desktop', icon: 'code', items: ['React', 'TypeScript', 'TanStack Start', 'Flutter (BLoC/Cubit)', 'WPF', 'WinForms'] },
  { title: 'Databases', icon: 'database', items: ['SQL Server', 'PostgreSQL', 'MySQL', 'SQLite', 'Oracle', 'MongoDB', 'Neo4j', 'Cassandra', 'UML & ERD modeling', 'SQL (DDL/DML)', 'Schema review, SQL optimization, data migration'] },
  { title: 'DevOps & observability', icon: 'activity', items: ['Docker & Docker Compose', 'Linux VPS', 'nginx', "Let's Encrypt", 'IIS', 'Prometheus', 'Grafana', 'Seq', 'Serilog', 'GitHub Actions (learning)'] },
  { title: 'Architecture', icon: 'layers', items: ['System design', 'Replication', 'Scaling', 'Multi-tenancy', 'Repository / Service / Controller patterns'] }
]
