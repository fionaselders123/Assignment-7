require('dotenv').config();
const express = require('express');
const { sequelize, Track } = require('./database/setup');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const REQUIRED_FIELDS = [
  'songTitle',
  'artistName',
  'albumName',
  'genre',
  'duration',
  'releaseYear'
];

// Validate a request body; returns an error message string or null
function validateTrack(body) {
  if (!body || typeof body !== 'object') {
    return 'Request body is required';
  }

  const missing = REQUIRED_FIELDS.filter(
    (field) =>
      body[field] === undefined ||
      body[field] === null ||
      (typeof body[field] === 'string' && body[field].trim() === '')
  );
  if (missing.length > 0) {
    return `Missing required field(s): ${missing.join(', ')}`;
  }

  for (const field of ['songTitle', 'artistName', 'albumName', 'genre']) {
    if (typeof body[field] !== 'string') {
      return `${field} must be a string`;
    }
  }

  for (const field of ['duration', 'releaseYear']) {
    if (!Number.isInteger(body[field])) {
      return `${field} must be an integer`;
    }
  }
  if (body.duration <= 0) {
    return 'duration must be a positive number of seconds';
  }

  return null;
}

// Pick only the allowed fields from a body
function pickTrackFields(body) {
  const data = {};
  for (const field of REQUIRED_FIELDS) {
    data[field] = body[field];
  }
  return data;
}

// GET /api/tracks - all tracks
app.get('/api/tracks', async (req, res) => {
  try {
    const tracks = await Track.findAll();
    res.status(200).json(tracks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve tracks' });
  }
});

// GET /api/tracks/:id - one track
app.get('/api/tracks/:id', async (req, res) => {
  try {
    const track = await Track.findByPk(req.params.id);
    if (!track) {
      return res.status(404).json({ error: 'Track not found' });
    }
    res.status(200).json(track);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve track' });
  }
});

// POST /api/tracks - create a track
app.post('/api/tracks', async (req, res) => {
  try {
    const validationError = validateTrack(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const newTrack = await Track.create(pickTrackFields(req.body));
    res.status(201).json(newTrack);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create track' });
  }
});

// PUT /api/tracks/:id - update a track
app.put('/api/tracks/:id', async (req, res) => {
  try {
    const track = await Track.findByPk(req.params.id);
    if (!track) {
      return res.status(404).json({ error: 'Track not found' });
    }

    const validationError = validateTrack(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    await Track.update(pickTrackFields(req.body), {
      where: { trackId: req.params.id }
    });

    const updatedTrack = await Track.findByPk(req.params.id);
    res.status(200).json(updatedTrack);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update track' });
  }
});

// DELETE /api/tracks/:id - delete a track
app.delete('/api/tracks/:id', async (req, res) => {
  try {
    const deletedCount = await Track.destroy({
      where: { trackId: req.params.id }
    });
    if (deletedCount === 0) {
      return res.status(404).json({ error: 'Track not found' });
    }
    res.status(200).json({ message: 'Track deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete track' });
  }
});

// Handle malformed JSON and other unexpected errors
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON in request body' });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
}

startServer();