const path = require('path');
const express = require('express');

const apiRouter = require('./server/routes');
const { publicStage, getStage } = require('./server/game/stages');
const progress = require('./server/game/progress');
const { schemas, relationship, statusCodes } = require('./server/data/schemas');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'server/views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'client')));

app.get('/', (req, res) => {
  res.render('index', { stage: publicStage(getStage(1)), progress: progress.summary() });
});

app.get('/schemas', (req, res) => {
  res.render('schemas', { schemas, relationship, statusCodes });
});

app.use('/api', apiRouter);

app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Not Found', path: req.path });
  }
  res.status(404).render('error', { status: 404, message: 'Page not found' });
});

app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  if (req.path.startsWith('/api')) {
    return res.status(status).json({ error: err.message || 'Internal Server Error' });
  }
  res.status(status).render('error', { status, message: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
