// Mongo descartable para probar el panel en local: node tools/mongo-local.mjs  (puerto 27019, datos en memoria).
import { MongoMemoryServer } from 'mongodb-memory-server';

const mongo = await MongoMemoryServer.create({ instance: { port: 27019 } });
console.log(`Mongo local listo. En .env: MONGODB_URI=${mongo.getUri()}`);
process.on('SIGINT', async () => { await mongo.stop(); process.exit(0); });
