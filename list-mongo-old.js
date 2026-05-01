// liste-collections-mongodb-atlas.js
// Prérequis: npm install mongodb

const { MongoClient } = import('mongodb');
import('dotenv').config();

// Lire l'URI depuis une variable d'environnement MONGO_URI
const uri = process.env.MONGO_URI || '';

if (!uri) {
    console.error('Veuillez définir l’URI MongoDB Atlas dans la variable d’environnement MONGO_URI.');
    process.exit(1);
}

async function listerBasesEtCollections() {
    const client = new MongoClient(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });

    try {
        await client.connect();

        const adminDb = client.db().admin();
        const { databases } = await adminDb.listDatabases();

        if (!databases || databases.length === 0) {
            console.log('Aucune base de données trouvée.');
            return;
        }

        // Filtrer les bases système et préparer une sortie JSON
        const result = [];

        for (const dbInfo of databases) {
            const dbName = dbInfo.name;

            // Exclure les bases système si voulu
            if (dbName === 'admin' || dbName === 'local' || dbName === 'config') {
                continue;
            }

            const db = client.db(dbName);
            const collections = await db.listCollections().toArray();

            result.push({
                database: dbName,
                collections: collections.map((c) => c.name),
            });
        }

        // Sortie JSON
        console.log(JSON.stringify(result, null, 2));
    } catch (err) {
        console.error('Erreur lors de la liste des bases/collections:', err);
    } finally {
        await client.close();
    }
}

listerBasesEtCollections().catch((err) => {
    console.error('Erreur non gérée:', err);
});
