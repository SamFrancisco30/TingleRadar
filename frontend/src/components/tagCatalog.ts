import {
  triggerTypeOptions,
  talkingStyleOptions,
  roleplaySceneOptions,
  languageOptions,
  displayTag,
  languageLabels,
} from "./FilterPanel";

export const ALL_TAG_IDS: string[] = Array.from(
  new Set([...triggerTypeOptions, ...talkingStyleOptions, ...roleplaySceneOptions, ...languageOptions])
);

export type TagDescriptor = {
  id: string;
  label: string;
  group: "Trigger" | "Talking style" | "Roleplay scene" | "Language" | "Other";
};

export const describeTag = (tagId: string): TagDescriptor => {
  if (triggerTypeOptions.includes(tagId)) {
    return { id: tagId, label: displayTag(tagId), group: "Trigger" };
  }
  if (talkingStyleOptions.includes(tagId)) {
    return { id: tagId, label: displayTag(tagId), group: "Talking style" };
  }
  if (roleplaySceneOptions.includes(tagId)) {
    return { id: tagId, label: displayTag(tagId), group: "Roleplay scene" };
  }
  if (languageOptions.includes(tagId)) {
    return { id: tagId, label: languageLabels[tagId] || tagId, group: "Language" };
  }
  return { id: tagId, label: tagId, group: "Other" };
};
