export function clubInitials(name: string) {
  const words = name
    .replace(/&/g, " and ")
    .split(/\s+/)
    .filter((word) => word && !/^(fc|afc|the|and)$/i.test(word));
  if (!words.length) return "TF";
  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}
