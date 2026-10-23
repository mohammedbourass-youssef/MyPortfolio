export type Certificate = {
  id: string
  title: { en: string; fr: string; ar: string }
  issuer: string
  date?: string
  /** Path under public/. Keep the directory spelling and filename as they exist on disk. */
  file: string
  thumb?: string
  verifyUrl?: string
}

const certificate = (id: string, title: Certificate['title'], issuer: string, file: string): Certificate => ({ id, title, issuer, file })

export const certificates: Certificate[] = [
  certificate('flutter-mvvm-bloc', { en: 'MVVM and BLoC', fr: 'MVVM et BLoC', ar: 'MVVM وBLoC' }, 'Flutter', 'Certifecates/Flutter/MVVM and Bloc.pdf'),
  certificate('mongodb-certificate', { en: 'MongoDB Certificate', fr: 'Certificat MongoDB', ar: 'شهادة MongoDB' }, 'MongoDB', 'Certifecates/MongoDB/mohammed-bourass-5eab58a7-bc7c-433b-9592-896ac3922a78-certificate.pdf'),
  certificate('oracle', { en: 'Oracle Certificate', fr: 'Certificat Oracle', ar: 'شهادة Oracle' }, 'Oracle', 'Certifecates/Oracle/Oracle.pdf'),
  certificate('oracle-clms-lesson', { en: 'CLMS Certificate — Lesson', fr: 'Certificat CLMS — Leçon', ar: 'شهادة CLMS — الدرس' }, 'Oracle', 'Certifecates/Oracle/clmsCertificate_Lesson.pdf'),
  certificate('oracle-exam', { en: 'Oracle Exam Certificate', fr: 'Certificat d’examen Oracle', ar: 'شهادة امتحان Oracle' }, 'Oracle', 'Certifecates/Oracle/exam.pdf'),
  certificate('oracle-exam-1', { en: 'Oracle Exam 1 Certificate', fr: 'Certificat d’examen Oracle 1', ar: 'شهادة امتحان Oracle 1' }, 'Oracle', 'Certifecates/Oracle/exm1.pdf'),
  certificate('oracle-lesson-1', { en: 'Oracle Lesson 1 Certificate', fr: 'Certificat Oracle — Leçon 1', ar: 'شهادة Oracle — الدرس 1' }, 'Oracle', 'Certifecates/Oracle/lesson_1.pdf'),
  certificate('algorithms-level-4', { en: 'Algorithms & Problem Solving — Level 4', fr: 'Algorithmes et résolution de problèmes — Niveau 4', ar: 'الخوارزميات وحل المشكلات — المستوى 4' }, 'Programming Advices', 'Certifecates/Programming Advices/certificate-of-completion-for-08-algorithms-problem-solving-level-4.pdf'),
  certificate('oop-concepts', { en: 'OOP as It Should Be — Concepts', fr: 'La POO comme elle devrait être — Concepts', ar: 'البرمجة كائنية التوجه كما ينبغي — المفاهيم' }, 'Programming Advices', 'Certifecates/Programming Advices/certificate-of-completion-for-10-oop-as-it-should-be-concepts.pdf'),
  certificate('oop-applications', { en: 'OOP as It Should Be — Applications', fr: 'La POO comme elle devrait être — Applications', ar: 'البرمجة كائنية التوجه كما ينبغي — التطبيقات' }, 'Programming Advices', 'Certifecates/Programming Advices/certificate-of-completion-for-11-oop-as-it-should-be-applications.pdf'),
  certificate('data-structures-level-1', { en: 'Data Structures — Level 1', fr: 'Structures de données — Niveau 1', ar: 'هياكل البيانات — المستوى 1' }, 'Programming Advices', 'Certifecates/Programming Advices/certificate-of-completion-for-12-data-structures-level1.pdf'),
  certificate('algorithms-level-5', { en: 'Algorithms & Problem Solving — Level 5', fr: 'Algorithmes et résolution de problèmes — Niveau 5', ar: 'الخوارزميات وحل المشكلات — المستوى 5' }, 'Programming Advices', 'Certifecates/Programming Advices/certificate-of-completion-for-13-algorithms-problem-solving-level-5.pdf'),
  certificate('c-level-1', { en: 'C Programming — Level 1', fr: 'Programmation en C — Niveau 1', ar: 'البرمجة بلغة C — المستوى 1' }, 'Programming Advices', 'Certifecates/Programming Advices/certificate-of-completion-for-14-c-level-1.pdf'),
  certificate('database-level-1', { en: 'Database Level 1 — SQL Concepts and Practice', fr: 'Bases de données niveau 1 — Concepts SQL et pratique', ar: 'قواعد البيانات المستوى 1 — مفاهيم SQL وتطبيقاتها' }, 'Programming Advices', 'Certifecates/Programming Advices/certificate-of-completion-for-15-database-level-1-sql-concepts-and-practice.pdf'),
  certificate('oop-in-c', { en: 'OOP as It Should Be in C', fr: 'La POO comme elle devrait être en C', ar: 'البرمجة كائنية التوجه كما ينبغي بلغة C' }, 'Programming Advices', 'Certifecates/Programming Advices/certificate-of-completion-for-16-oop-as-it-should-be-in-c.pdf'),
  certificate('full-real-project', { en: 'Full Real Project', fr: 'Projet réel complet', ar: 'مشروع عملي متكامل' }, 'Programming Advices', 'Certifecates/Programming Advices/certificate-of-completion-for-19-full-real-project.pdf'),
  certificate('c-programming-level-2', { en: 'C Programming — Level 2', fr: 'Programmation en C — Niveau 2', ar: 'البرمجة بلغة C — المستوى 2' }, 'Programming Advices', 'Certifecates/Programming Advices/certificate-of-completion-for-20-c-programming-level-2.pdf'),
  certificate('database-level-2', { en: 'Database Level 2 — Concepts and T-SQL', fr: 'Bases de données niveau 2 — Concepts et T-SQL', ar: 'قواعد البيانات المستوى 2 — المفاهيم وT-SQL' }, 'Programming Advices', 'Certifecates/Programming Advices/certificate-of-completion-for-21-database-level2-concepts-t-sql.pdf'),
  certificate('restful-api', { en: 'Introduction to RESTful API', fr: 'Introduction aux API RESTful', ar: 'مقدمة إلى RESTful API' }, 'Programming Advices', 'Certifecates/Programming Advices/certificate-of-completion-for-introduction-to-restful-api.pdf'),
  certificate('solid-principles', { en: 'SOLID Principles', fr: 'Principes SOLID', ar: 'مبادئ SOLID' }, 'Programming Advices', 'Certifecates/Programming Advices/certificate-of-completion-for-solid-principles.pdf')
]
