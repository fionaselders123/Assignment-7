require('dotenv').config();
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');

// Environment-specific configuration
const config = {
  development: {
    dialect: 'sqlite',
    storage: process.env.DB_STORAGE_DEVELOPMENT || './database/music_library.db',
    logging: false
  },
  production: {
    dialect: 'sqlite',
    storage: process.env.DB_STORAGE_PRODUCTION || './database/music_library_prod.db',
    logging: false
  }
};

const env = process.env.NODE_ENV === 'production' ? 'production' : 'development';
const dbConfig = { ...config[env] };
// Resolve the storage path from the project root so it works from any cwd
dbConfig.storage = path.resolve(__dirname, '..', dbConfig.storage);

// Initialize Sequelize
const sequelize = new Sequelize(dbConfig);

// Track model
const Track = sequelize.define(
  'Track',
  {
    trackId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    songTitle: {
      type: DataTypes.STRING,
      allowNull: false
    },
    artistName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    albumName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    genre: {
      type: DataTypes.STRING,
      allowNull: false
    },
    duration: {
      type: DataTypes.INTEGER, // seconds
      allowNull: false
    },
    releaseYear: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  },
  {
    tableName: 'tracks',
    timestamps: false
  }
);

// Create the database and tables
async function setupDatabase() {
  try {
    await sequelize.authenticate();
    console.log('Connection to the database has been established successfully.');

    await sequelize.sync({ force: true });
    console.log('Database and tables created successfully.');
  } catch (error) {
    console.error('Unable to set up the database:', error);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

// Only run setup when this file is executed directly (node database/setup.js)
if (require.main === module) {
  setupDatabase();
}

module.exports = { sequelize, Track };