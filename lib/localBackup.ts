import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";

import { TICKET_DIRECTORY } from "./ticketFiles";

const LOCAL_BACKUP_DIRECTORY = `${FileSystem.documentDirectory}ticket-frame-local-backup/`;
const LOCAL_BACKUP_TEMP_DIRECTORY = `${FileSystem.documentDirectory}ticket-frame-local-backup-new/`;
const LOCAL_RESTORE_ROLLBACK_DIRECTORY = `${FileSystem.documentDirectory}ticket-frame-restore-rollback/`;
const LOCAL_BACKUP_MANIFEST = `${LOCAL_BACKUP_DIRECTORY}manifest.json`;
type LocalBackupManifest = {
  formatVersion: 1;
  createdAt: string;
  storage: [string, string][];
};

async function localBackupManifest(): Promise<LocalBackupManifest | null> {
  try {
    const info = await FileSystem.getInfoAsync(LOCAL_BACKUP_MANIFEST);
    if (!info.exists) return null;
    const parsed = JSON.parse(
      await FileSystem.readAsStringAsync(LOCAL_BACKUP_MANIFEST),
    ) as LocalBackupManifest;
    return parsed.formatVersion === 1 && Array.isArray(parsed.storage)
      ? parsed
      : null;
  } catch {
    return null;
  }
}

async function copyDirectoryWhenPresent(from: string, to: string) {
  const info = await FileSystem.getInfoAsync(from);
  if (info.exists && info.isDirectory)
    await FileSystem.copyAsync({ from, to });
}

async function createLocalBackup(): Promise<LocalBackupManifest> {
  const keys = (await AsyncStorage.getAllKeys()).filter((key) =>
    key.startsWith("ticket-frame."),
  );
  const storage = (await AsyncStorage.multiGet(keys)).filter(
    (entry): entry is [string, string] => entry[1] !== null,
  );
  const manifest: LocalBackupManifest = {
    formatVersion: 1,
    createdAt: new Date().toISOString(),
    storage,
  };

  await FileSystem.deleteAsync(LOCAL_BACKUP_TEMP_DIRECTORY, {
    idempotent: true,
  });
  await FileSystem.makeDirectoryAsync(LOCAL_BACKUP_TEMP_DIRECTORY, {
    intermediates: true,
  });
  await copyDirectoryWhenPresent(
    TICKET_DIRECTORY,
    `${LOCAL_BACKUP_TEMP_DIRECTORY}ticket-frame-tickets/`,
  );
  await copyDirectoryWhenPresent(
    `${FileSystem.documentDirectory}match-memories/`,
    `${LOCAL_BACKUP_TEMP_DIRECTORY}match-memories/`,
  );

  const documentNames = await FileSystem.readDirectoryAsync(
    FileSystem.documentDirectory!,
  );
  const oldSchoolNames = documentNames.filter(
    (name) => name.startsWith("oldschool-") && name.endsWith(".png"),
  );
  if (oldSchoolNames.length) {
    const oldSchoolDirectory = `${LOCAL_BACKUP_TEMP_DIRECTORY}old-school/`;
    await FileSystem.makeDirectoryAsync(oldSchoolDirectory, {
      intermediates: true,
    });
    for (const name of oldSchoolNames)
      await FileSystem.copyAsync({
        from: `${FileSystem.documentDirectory}${name}`,
        to: `${oldSchoolDirectory}${name}`,
      });
  }

  await FileSystem.writeAsStringAsync(
    `${LOCAL_BACKUP_TEMP_DIRECTORY}manifest.json`,
    JSON.stringify(manifest),
  );
  await FileSystem.deleteAsync(LOCAL_BACKUP_DIRECTORY, { idempotent: true });
  await FileSystem.moveAsync({
    from: LOCAL_BACKUP_TEMP_DIRECTORY,
    to: LOCAL_BACKUP_DIRECTORY,
  });
  return manifest;
}

async function restoreLocalBackup(): Promise<LocalBackupManifest> {
  const manifest = await localBackupManifest();
  if (!manifest) throw new Error("No readable backup was found.");

  const liveKeys = (await AsyncStorage.getAllKeys()).filter((key) =>
    key.startsWith("ticket-frame."),
  );
  const liveStorage = (await AsyncStorage.multiGet(liveKeys)).filter(
    (entry): entry is [string, string] => entry[1] !== null,
  );
  const memoriesDirectory = `${FileSystem.documentDirectory}match-memories/`;
  const documentNames = await FileSystem.readDirectoryAsync(
    FileSystem.documentDirectory!,
  );
  const oldSchoolNames = documentNames.filter(
    (value) => value.startsWith("oldschool-") && value.endsWith(".png"),
  );

  const replaceFilesFrom = async (source: string) => {
    await FileSystem.deleteAsync(TICKET_DIRECTORY, { idempotent: true });
    await copyDirectoryWhenPresent(`${source}ticket-frame-tickets/`, TICKET_DIRECTORY);
    await FileSystem.deleteAsync(memoriesDirectory, { idempotent: true });
    await copyDirectoryWhenPresent(`${source}match-memories/`, memoriesDirectory);
    const currentNames = await FileSystem.readDirectoryAsync(FileSystem.documentDirectory!);
    for (const name of currentNames.filter(
      (value) => value.startsWith("oldschool-") && value.endsWith(".png"),
    ))
      await FileSystem.deleteAsync(`${FileSystem.documentDirectory}${name}`, {
        idempotent: true,
      });
    const sourceOldSchool = `${source}old-school/`;
    const info = await FileSystem.getInfoAsync(sourceOldSchool);
    if (info.exists && info.isDirectory)
      for (const name of await FileSystem.readDirectoryAsync(sourceOldSchool))
        await FileSystem.copyAsync({
          from: `${sourceOldSchool}${name}`,
          to: `${FileSystem.documentDirectory}${name}`,
        });
  };

  await FileSystem.deleteAsync(LOCAL_RESTORE_ROLLBACK_DIRECTORY, { idempotent: true });
  await FileSystem.makeDirectoryAsync(LOCAL_RESTORE_ROLLBACK_DIRECTORY, {
    intermediates: true,
  });
  await copyDirectoryWhenPresent(
    TICKET_DIRECTORY,
    `${LOCAL_RESTORE_ROLLBACK_DIRECTORY}ticket-frame-tickets/`,
  );
  await copyDirectoryWhenPresent(
    memoriesDirectory,
    `${LOCAL_RESTORE_ROLLBACK_DIRECTORY}match-memories/`,
  );
  if (oldSchoolNames.length) {
    const rollbackOldSchool = `${LOCAL_RESTORE_ROLLBACK_DIRECTORY}old-school/`;
    await FileSystem.makeDirectoryAsync(rollbackOldSchool, { intermediates: true });
    for (const name of oldSchoolNames)
      await FileSystem.copyAsync({
        from: `${FileSystem.documentDirectory}${name}`,
        to: `${rollbackOldSchool}${name}`,
      });
  }

  try {
    await replaceFilesFrom(LOCAL_BACKUP_DIRECTORY);
    if (liveKeys.length) await AsyncStorage.multiRemove(liveKeys);
    if (manifest.storage.length) await AsyncStorage.multiSet(manifest.storage);
    await FileSystem.deleteAsync(LOCAL_RESTORE_ROLLBACK_DIRECTORY, {
      idempotent: true,
    });
    return manifest;
  } catch (error) {
    await replaceFilesFrom(LOCAL_RESTORE_ROLLBACK_DIRECTORY).catch(() => {});
    const currentKeys = (await AsyncStorage.getAllKeys()).filter((key) =>
      key.startsWith("ticket-frame."),
    );
    if (currentKeys.length) await AsyncStorage.multiRemove(currentKeys);
    if (liveStorage.length) await AsyncStorage.multiSet(liveStorage);
    throw error;
  }
}


export {
  LOCAL_BACKUP_DIRECTORY,
  localBackupManifest,
  createLocalBackup,
  restoreLocalBackup,
};

export type { LocalBackupManifest };
export const BACKUP_REMINDER_TICKET_COUNT = 5;
