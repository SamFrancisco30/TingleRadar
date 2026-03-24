import unittest

from app.services.tag_feedback import build_effective_tags


class TagFeedbackTests(unittest.TestCase):
    def test_positive_user_tags_are_added_to_effective_tags(self) -> None:
        tags = build_effective_tags(
            auto_tags=["soft_spoken", "roleplay"],
            vote_scores={},
            user_tags=["binaural"],
        )

        self.assertEqual(tags, ["binaural", "roleplay", "soft_spoken"])

    def test_heavily_downvoted_auto_tags_are_removed(self) -> None:
        tags = build_effective_tags(
            auto_tags=["soft_spoken", "roleplay", "whisper"],
            vote_scores={"whisper": -3},
            user_tags=[],
        )

        self.assertEqual(tags, ["roleplay", "soft_spoken"])

    def test_heavily_upvoted_missing_tags_are_added(self) -> None:
        tags = build_effective_tags(
            auto_tags=["soft_spoken"],
            vote_scores={"whisper": 3},
            user_tags=[],
        )

        self.assertEqual(tags, ["soft_spoken", "whisper"])


if __name__ == "__main__":
    unittest.main()
