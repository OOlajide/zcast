import cron from 'node-cron';
import { exec } from 'child_process';
import path from 'path';

console.log('Initializing Zcash Podcast Scheduler...');
console.log('Schedule: Daily at 12:00 PM UTC');

// 0 12 * * * -> At 12:00 PM UTC
cron.schedule('0 12 * * *', () => {
  console.log('Triggering daily pipeline...');
  const scriptPath = path.join(__dirname, 'daily-pipeline.ts');
  
  // Use npx tsx to run the typescript file directly
  exec(`npx tsx ${scriptPath}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Pipeline execution error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Pipeline stderr: ${stderr}`);
    }
    console.log(`Pipeline output: ${stdout}`);
  });
}, {
  timezone: "UTC"
});

console.log('Scheduler running.');
