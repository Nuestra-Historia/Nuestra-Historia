import crypto from 'node:crypto';

const ownerAdminPath = crypto.randomBytes(24).toString('base64url');
const sharedAdminPath = crypto.randomBytes(24).toString('base64url');
const sessionSecret = crypto.randomBytes(48).toString('base64url');
const cronSecret = crypto.randomBytes(32).toString('hex');
const ipHashPepper = crypto.randomBytes(32).toString('hex');

console.log('--- GENERATED SECRETS ---');
console.log(`OWNER_ADMIN_PATH=${ownerAdminPath}`);
console.log(`SHARED_ADMIN_PATH=${sharedAdminPath}`);
console.log(`SESSION_SECRET=${sessionSecret}`);
console.log(`CRON_SECRET=${cronSecret}`);
console.log(`IP_HASH_PEPPER=${ipHashPepper}`);

