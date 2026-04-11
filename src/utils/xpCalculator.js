export const calculateTaskReward = (difficulty, priority, hardMode = false) => {
  const diffXp = { easy: 10, medium: 25, hard: 50 }[difficulty] || 10;
  const priXp = { low: 0, medium: 5, high: 10 }[priority] || 0;
  const baseTotal = diffXp + priXp;
  return Math.floor(baseTotal * (hardMode ? 1.5 : 1.0));
};