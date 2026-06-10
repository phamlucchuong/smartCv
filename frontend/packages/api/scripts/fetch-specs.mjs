import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.resolve(__dirname, '../openapi/live');

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const SPECS = [
  {
    name: 'user-service',
    url: process.env.USER_SERVICE_URL ?? 'http://localhost:8081/user/v3/api-docs',
    out: path.join(OUTPUT_DIR, 'user-service.json'),
  },
  {
    name: 'job-service',
    url: process.env.JOB_SERVICE_URL ?? 'http://localhost:8082/job/v3/api-docs',
    out: path.join(OUTPUT_DIR, 'job-service.json'),
  },
  {
    name: 'application-service',
    url: process.env.APP_SERVICE_URL ?? 'http://localhost:8083/application/v3/api-docs',
    out: path.join(OUTPUT_DIR, 'application-service.json'),
  },
  {
    name: 'ai-service',
    url: process.env.AI_SERVICE_URL ?? 'http://localhost:8085/ai/v3/api-docs',
    out: path.join(OUTPUT_DIR, 'ai-service.json'),
  },
];

let failed = false;

for (const spec of SPECS) {
  process.stdout.write(`Fetching ${spec.name} ... `);
  try {
    execFileSync('curl', ['-sf', '--max-time', '10', spec.url, '-o', spec.out]);
    console.log(`saved -> ${path.relative(process.cwd(), spec.out)}`);
  } catch {
    console.error(`FAILED (is ${spec.url} reachable?)`);
    if (fs.existsSync(spec.out)) fs.unlinkSync(spec.out);
    failed = true;
  }
}

if (failed) {
  console.error('\nOne or more specs could not be fetched. Make sure backend services are running.');
  process.exit(1);
}
