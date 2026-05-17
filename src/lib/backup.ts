import { db } from './db';
import { getSettings, saveSettings } from './settings';

export async function createLocalBackup(trigger: 'MIDNIGHT' | 'MANUAL' | 'THRESHOLD') {
    const settings = getSettings();
    if (!settings.autoBackupEnabled && trigger !== 'MANUAL') return;

    try {
        const concepts = await db.concepts.toArray();
        const decks = await db.decks.toArray();
        const logs = await db.reviewLogs.toArray();

        const backupInfo = {
            timestamp: Date.now(),
            trigger,
            data: { concepts, decks, logs }
        };

        const json = JSON.stringify(backupInfo);
        
        // Rolling history: store last 7 backups or something inside IndexedDB or localStorage
        // Since backups can be large, we'll store them in a new IndexedDB table 'backups'
        await db.backups.add({
            timestamp: backupInfo.timestamp,
            trigger,
            sizeBytes: new Blob([json]).size,
            data: json
        });

        // Cleanup old backups (keep last 5)
        const allBackups = await db.backups.orderBy('timestamp').toArray();
        if (allBackups.length > 5) {
            const toDelete = allBackups.slice(0, allBackups.length - 5).map(b => b.id!);
            await db.backups.bulkDelete(toDelete);
        }

        saveSettings({
            ...settings,
            lastBackupAt: backupInfo.timestamp
        });
        
    } catch (e) {
        console.error("Backup failed", e);
    }
}
