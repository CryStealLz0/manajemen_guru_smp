// server.js
import { app, db, store } from './app.js';

const PORT = process.env.APP_PORT || 5000;

// bungkus supaya bisa pakai await walau bukan top-level module
(async () => {
    try {
        console.log('[BOOT] Authenticating DB...');
        await db.authenticate();

        // kalau ada model lain & perlu, boleh:
        // buat generate database
        // await db.sync();

        console.log('[BOOT] Sync session table...');
        await store.sync(); // penting: tunggu sampai tabel sessions siap

        app.listen(PORT, () => {
            console.log(`[BOOT] Server running at http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error('[BOOT] Failed to start server:', err);
        process.exit(1);
    }
})();
