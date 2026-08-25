export function hasFeedbackForCurrentLevel({ hintLevel, feedbackLevel }) {
  return hintLevel >= 1 && feedbackLevel === hintLevel;
}

export function canUnlockNextHint({ hintLevel, feedbackLevel }) {
  return (
    hintLevel >= 1 &&
    hintLevel < 4 &&
    hasFeedbackForCurrentLevel({ hintLevel, feedbackLevel })
  );
}

export function canRevealAnswer({ hintLevel, feedbackLevel }) {
  return (
    hintLevel === 4 &&
    hasFeedbackForCurrentLevel({ hintLevel, feedbackLevel })
  );
}
