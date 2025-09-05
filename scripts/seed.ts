import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create a default user
  const user = await prisma.user.upsert({
    where: { email: 'demo@verificai.com' },
    update: {},
    create: {
      id: 'default-user',
      email: 'demo@verificai.com',
      name: 'Demo Teacher',
      role: 'TEACHER'
    }
  });

  console.log('✅ Default user created:', user.email);

  // Create a sample test
  const test = await prisma.test.upsert({
    where: { id: 'sample-test' },
    update: {},
    create: {
      id: 'sample-test',
      title: 'Test Matematica - Equazioni',
      description: 'Test di esempio sulle equazioni di primo grado',
      subject: 'Matematica',
      topic: 'Equazioni di primo grado',
      classLabel: '2ª media',
      authorId: user.id,
      status: 'DRAFT'
    }
  });

  console.log('✅ Sample test created:', test.title);

  // Create sample questions
  await prisma.question.createMany({
    data: [
      {
        testId: test.id,
        questionIndex: 0,
        type: 'MCQ',
        prompt: 'Risolvi l\'equazione: 2x + 3 = 11',
        options: JSON.stringify(['x = 2', 'x = 4', 'x = 6', 'x = 8']),
        correctAnswer: JSON.stringify({ selected: 1 }),
        points: 2,
        explainForTeacher: 'Equazione lineare semplice: sottrai 3 da entrambi i lati, poi dividi per 2'
      },
      {
        testId: test.id,
        questionIndex: 1,
        type: 'TF',
        prompt: 'In un\'equazione, quello che faccio a sinistra dell\'uguale devo farlo anche a destra',
        correctAnswer: JSON.stringify({ value: true }),
        points: 1,
        explainForTeacher: 'Principio fondamentale delle equazioni: mantenere l\'uguaglianza'
      }
    ],
    skipDuplicates: true
  });

  console.log('✅ Sample questions created');
  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });