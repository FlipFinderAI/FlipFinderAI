export function upgradeImageUrl(url: string): string {
  return url
    .replace(/-\d+x\d+(?=\.)/i, "")
    .replace(/\/480\//, "/original/")
    .replace(/\/1024\//, "/original/");
}