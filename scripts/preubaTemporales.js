import bcrypt from 'bcrypt';

const testPasswords = [
  'Carlos.1090',
  ' Carlos.1090',
  'Carlos.1090 ',
  'carlos.1090',
  'CARLOS.1090'
];

const hash = '$2b$12$.JJaNFGmoZbxwhtB36Pc1.Q0QWiNthT90oxiLNt9Ej5EGPVJ6nOdi';

for (const pwd of testPasswords) {
  const match = await bcrypt.compare(pwd, hash);
  console.log(`"${pwd}" => ${match}`);
}