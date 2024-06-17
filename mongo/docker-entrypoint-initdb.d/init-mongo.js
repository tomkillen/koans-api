/**
 * Upon starting mongo db, this script is executed (see ../docker-compose.yaml)
 * and this allows us to initialize the database, creating a user with limited read/write access
 * 
 * See https://hub.docker.com/_/mongo/
 */

// Initialize a database for use by the Koans API with read/write access to this db only
print('initializing koans database')
db = db.getSiblingDB('koans');
print('creating koans db user')
db.createUser(
  {
    user: 'koans',
    pwd: 'koans',
    roles: [{ role: 'readWrite', db: 'koans' }],
  },
);