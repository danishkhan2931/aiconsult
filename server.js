require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
// Serve static files from the current directory (this website folder)
app.use(express.static(path.join(__dirname)));

// Simple health route
app.get('/ping', (req, res) => res.json({ok: true}));

// Test route: uses nodemailer's ethereal test account to send a preview message
app.post('/api/contact/test', async (req, res) => {
  try{
    const testAccount = await nodemailer.createTestAccount();
    const transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: { user: testAccount.user, pass: testAccount.pass }
    });

    const { name='Test User', email='test@example.com', company='-', message='This is a test message' } = req.body || {};
    const mailOptions = {
      from: `Test <${testAccount.user}>`,
      to: process.env.CONTACT_TO || 'danishkhan2931@gmail.com',
      subject: `Test contact form submission from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\nCompany: ${company}\n\nMessage:\n${message}`,
    };

    const info = await transporter.sendMail(mailOptions);
    const preview = nodemailer.getTestMessageUrl(info);
    return res.json({ ok: true, previewUrl: preview, info: info });
  }catch(err){
    console.error('Test mail error', err);
    return res.status(500).json({ error: 'Failed to send test message', details: err && err.message });
  }
});

app.post('/api/contact', async (req, res) => {
  const { name, email, company, message } = req.body || {};
  if(!name || !email || !message){
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Instead of sending email, save the submission to a file under customerdetail/
  const fs = require('fs');
  const submissionsDir = path.join(__dirname, 'customerdetail');
  const submissionsFile = path.join(submissionsDir, 'submissions.txt');

  const entry = [
    '---',
    `Time: ${new Date().toISOString()}`,
    `Name: ${escapeHtml(name)}`,
    `Email: ${escapeHtml(email)}`,
    `Company: ${escapeHtml(company || '-')}`,
    'Message:',
    `${escapeHtml(message)}`,
    '\n'
  ].join('\n');

  try{
    await fs.promises.mkdir(submissionsDir, { recursive: true });
    await fs.promises.appendFile(submissionsFile, entry + '\n', { encoding: 'utf8' });
    console.log(`Saved contact submission to ${submissionsFile}`);
    return res.json({ ok: true, message: 'Submission saved', path: `customerdetail/submissions.txt` });
  }catch(err){
    console.error('File save error', err);
    return res.status(500).json({ error: 'Failed to save submission' });
  }
});

// New endpoints: list submissions and download raw file (only when SAVE_TO_FILE=true)
app.get('/api/submissions', async (req, res) => {
  try{
    const saveToFile = (process.env.SAVE_TO_FILE || 'true').toLowerCase() === 'true';
    if(!saveToFile){
      return res.status(400).json({ error: 'Submissions are not stored to file (SAVE_TO_FILE=false)' });
    }

    const submissionsDir = path.join(__dirname, process.env.SUBMISSIONS_DIR || 'customerdetail');
    const submissionsFile = path.join(submissionsDir, process.env.SUBMISSIONS_FILE || 'submissions.txt');

    const fs = require('fs');
    let exists = false;
    try{ await fs.promises.access(submissionsFile); exists = true; }catch(e){ exists = false; }
    if(!exists) return res.json({ ok: true, submissions: [] });

    const raw = await fs.promises.readFile(submissionsFile, 'utf8');
    // Split entries on lines that contain only --- (allow variations)
    const blocks = raw.split(/\n-{3,}\n/).map(b=>b.trim()).filter(Boolean);

    const submissions = blocks.map(block => {
      const lines = block.split(/\r?\n/);
      const obj = { time: null, name: null, email: null, company: null, message: null, raw: block };
      let i = 0;
      while(i < lines.length){
        const line = lines[i];
        if(line.startsWith('Time:')){ obj.time = line.replace(/^Time:\s*/,'').trim(); i++; continue; }
        if(line.startsWith('Name:')){ obj.name = line.replace(/^Name:\s*/,'').trim(); i++; continue; }
        if(line.startsWith('Email:')){ obj.email = line.replace(/^Email:\s*/,'').trim(); i++; continue; }
        if(line.startsWith('Company:')){ obj.company = line.replace(/^Company:\s*/,'').trim(); i++; continue; }
        if(line === 'Message:'){
          // remainder is message
          const msg = lines.slice(i+1).join('\n').trim();
          obj.message = msg;
          break;
        }
        i++;
      }
      return obj;
    });

    return res.json({ ok: true, submissions });
  }catch(err){
    console.error('Read submissions error', err);
    return res.status(500).json({ error: 'Failed to read submissions' });
  }
});

app.get('/api/submissions/download', async (req, res) => {
  try{
    const saveToFile = (process.env.SAVE_TO_FILE || 'true').toLowerCase() === 'true';
    if(!saveToFile){
      return res.status(400).json({ error: 'Submissions are not stored to file (SAVE_TO_FILE=false)' });
    }
    const submissionsDir = path.join(__dirname, process.env.SUBMISSIONS_DIR || 'customerdetail');
    const submissionsFile = path.join(submissionsDir, process.env.SUBMISSIONS_FILE || 'submissions.txt');
    const fs = require('fs');
    await fs.promises.access(submissionsFile);
    res.download(submissionsFile, process.env.SUBMISSIONS_FILE || 'submissions.txt');
  }catch(err){
    console.error('Download submissions error', err);
    return res.status(404).json({ error: 'No submissions file found' });
  }
});

// Fallback to index.html for SPA routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, ()=>{
  console.log(`Server running on port ${PORT}`);
});

function escapeHtml(unsafe){
  return (unsafe || '').replace(/[&<>"']/g, function(m){
    return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]);
  });
}
