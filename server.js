import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();
const port = Number(process.env.PORT) || 3000;
const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), 'dist');

app.disable('x-powered-by');
app.use(express.static(dist, { index: 'index.html' }));
app.get('*', (_req, res) => {
  res.sendFile(path.join(dist, 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`MAINTEXCEL listening on port ${port}`);
});
