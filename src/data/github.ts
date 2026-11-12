export type Repository = { name: string; description: string; language: string; url: string }

export const repositories: Repository[] = [
  { name: 'DigitalMenuQrNFC', description: 'Multi-tenant SaaS for restaurants with QR/NFC digital menus, live orders, payments and a localized admin dashboard.', language: 'TypeScript', url: 'https://github.com/mohammedbourass-youssef/DigitalMenuQrNFC' },
  { name: 'ManageMate', description: 'Flutter team-management app to search members, assign and track tasks, monitor progress and collaborate in real time.', language: 'Dart', url: 'https://github.com/mohammedbourass-youssef/ManageMate' },
  { name: 'QuickNotes', description: 'Lightweight Flutter note-taking app with Cubit state management, Hive persistence and dynamic theming.', language: 'Dart', url: 'https://github.com/mohammedbourass-youssef/QuickNotes' },
  { name: 'Hanotk', description: 'Mobile shopping app for store clients, backed by a C# API and a restore-ready database.', language: 'Dart', url: 'https://github.com/mohammedbourass-youssef/Hanotk' },
  { name: 'Rif-Hotel-Management-System', description: 'Desktop hotel management system in C# and SQL Server covering bookings, rooms, guests, billing and reports.', language: 'C#', url: 'https://github.com/mohammedbourass-youssef/Rif-Hotel-Management-System' },
  { name: 'QURAAN-PLAYER', description: 'C# desktop Quran player with an organized audio library and database-driven playback.', language: 'C#', url: 'https://github.com/mohammedbourass-youssef/QURAAN-PLAYER' },
]

export const bestRepositoryNames = repositories.map(repo => repo.name)
