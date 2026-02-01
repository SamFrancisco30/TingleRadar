from dataclasses import dataclass
from typing import Iterable, List, Dict

from app.models.video import Video


@dataclass
class TagRule:
    tag: str
    field: str  # "title" | "description" | "tags" | "all"
    keywords: List[str]


# First-pass rules for triggers, talking style, and roleplay scenes.
# These are intentionally conservative; we can expand or tweak based on real data.
TAG_RULES: List[TagRule] = [
    # Talking style / meta
    TagRule(tag="whisper", field="all", keywords=["whisper", "耳语", "whispering"]),
    TagRule(tag="soft_spoken", field="all", keywords=["soft spoken", "soft-spoken"]),
    TagRule(tag="no_talking", field="all", keywords=["no talking", "silent", "不讲话", "no-talking"]),

    # Core triggers
    TagRule(tag="tapping", field="all", keywords=["tapping", "敲击", "knuckle tapping"]),
    TagRule(tag="scratching", field="all", keywords=["scratching", "scratch", "抓挠"]),
    TagRule(tag="crinkling", field="all", keywords=["crinkle", "crinkling", "包装袋", "塑料袋"]),
    TagRule(tag="brushing", field="all", keywords=["brushing", "brush sounds", "耳刷", "hair brushing"]),
    TagRule(tag="ear_cleaning", field="all", keywords=["ear cleaning", "ear massage", "耳搔", "耳朵清洁"]),
    TagRule(tag="mouth_sounds", field="all", keywords=["mouth sounds", "口腔音", "tongue clicking"]),
    TagRule(tag="white_noise", field="all", keywords=["white noise", "fan noise", "air conditioner", "雨声", "rain sounds"]),
    TagRule(tag="binaural", field="all", keywords=["binaural", "3dio", "双耳"]),
    TagRule(tag="visual_asmr", field="all", keywords=["visual asmr", "light triggers", "hand movements", "tracing", "visual triggers"]),
    TagRule(tag="layered", field="all", keywords=["layered asmr", "layered sounds", "soundscape", "multi-layer"]),

    # High-level roleplay flag
    TagRule(tag="roleplay", field="all", keywords=["roleplay", "r.p", "场景", "girlfriend roleplay", "doctor roleplay"]),
]

# Scene-specific roleplay tags; when these match we also imply generic "roleplay".
ROLEPLAY_SCENE_RULES: List[TagRule] = [
    TagRule(tag="rp_haircut", field="all", keywords=["haircut", "hair cut", "barber", "理发"]),
    TagRule(tag="rp_cranial", field="all", keywords=["cranial nerve exam", "cranial nerve", "神经检查"]),
    TagRule(tag="rp_dentist", field="all", keywords=["dentist", "dental", "tooth exam", "牙医"]),
]


def _build_bag(video: Video) -> Dict[str, str]:
    """Build lowercased search bags for different fields from a Video row."""
    title = (video.title or "").lower()
    description = (video.description or "").lower()
    tags_raw: Iterable[str] = video.tags or []
    tags_joined = " ".join(tags_raw).lower()

    return {
        "title": title,
        "description": description,
        "tags": tags_joined,
        "all": " ".join([title, description, tags_joined]),
    }


def compute_tags_for_video(video: Video) -> List[str]:
    """Compute a list of tags for a single Video using simple keyword rules.

    This is a first-pass rules engine; over time we can grow it with weights,
    regexes, and manual corrections. For now the goal is to provide a stable,
    explainable tagging baseline for the weekly rankings.
    """

    bag_by_field = _build_bag(video)
    tags: set[str] = set()

    # Generic rules
    for rule in TAG_RULES:
        bag = bag_by_field.get(rule.field, bag_by_field["all"])
        if any(keyword in bag for keyword in rule.keywords):
            tags.add(rule.tag)

    # Roleplay scenes imply generic roleplay
    for rule in ROLEPLAY_SCENE_RULES:
        bag = bag_by_field.get(rule.field, bag_by_field["all"])
        if any(keyword in bag for keyword in rule.keywords):
            tags.add(rule.tag)
            tags.add("roleplay")

    return sorted(tags)
