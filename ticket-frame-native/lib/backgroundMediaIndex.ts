import * as BackgroundTask from "expo-background-task";
import * as MediaLibrary from "expo-media-library";
import * as TaskManager from "expo-task-manager";

import {
  runBackgroundMediaIndexPass,
} from "@/lib/matchMediaLibrary";

export const BACKGROUND_MEDIA_INDEX_TASK =
  "ticket-frame-background-media-index.v1";

TaskManager.defineTask(BACKGROUND_MEDIA_INDEX_TASK, async () => {
  try {
    const permission = await MediaLibrary.getPermissionsAsync();

    if (!permission.granted) {
      return BackgroundTask.BackgroundTaskResult.Success;
    }

    await runBackgroundMediaIndexPass();

    return BackgroundTask.BackgroundTaskResult.Success;
  } catch (error) {
    console.warn("[media-index] background task failed", error);
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

export async function setBackgroundMediaIndexEnabled(enabled: boolean) {
  const registered = await TaskManager.isTaskRegisteredAsync(
    BACKGROUND_MEDIA_INDEX_TASK,
  );

  if (!enabled) {
    if (registered) {
      await BackgroundTask.unregisterTaskAsync(BACKGROUND_MEDIA_INDEX_TASK);
    }
    return;
  }

  if (registered) return;

  await BackgroundTask.registerTaskAsync(BACKGROUND_MEDIA_INDEX_TASK, {
    minimumInterval: 60,
  });
}
