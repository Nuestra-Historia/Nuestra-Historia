import readline from 'node:readline';
import { Writable } from 'node:stream';
import bcrypt from 'bcryptjs';

async function generateHash(password) {
  const trimmed = password.replace(/[\r\n]+$/, '');
  if (trimmed.length < 12) {
    console.error('Error: la contraseña debe tener al menos 12 caracteres.');
    process.exit(1);
  }

  const salt = await bcrypt.genSalt(12);
  const hash = await bcrypt.hash(trimmed, salt);
  const hashB64 = Buffer.from(hash, 'utf-8').toString('base64');
  console.log(`Hash (Base64): ${hashB64}`);
}

if (!process.stdin.isTTY) {
  let data = '';
  process.stdin.setEncoding('utf-8');
  process.stdin.on('data', chunk => {
    data += chunk;
  });
  process.stdin.on('end', async () => {
    await generateHash(data);
  });
} else {
  const mutableStdout = new Writable({
    write: function(chunk, encoding, callback) {
      if (!this.muted) {
        process.stdout.write(chunk, encoding);
      }
      callback();
    }
  });

  mutableStdout.muted = false;

  const rl = readline.createInterface({
    input: process.stdin,
    output: mutableStdout,
    terminal: true
  });

  process.stdout.write('Ingrese contraseña (mínimo 12 caracteres): ');
  mutableStdout.muted = true;

  rl.question('', async (password) => {
    mutableStdout.muted = false;
    process.stdout.write('\n');
    rl.close();
    await generateHash(password);
  });
}

