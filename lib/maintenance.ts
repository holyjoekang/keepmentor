// Keep reads and login available while the production database is being switched.
const READ_ACTIONS = new Set(['me', 'home', 'bundle', 'meetings', 'linkableEngagements', 'meetingsForEng', 'programs', 'users', 'engagementAssignments']);
export function blocksWrite(action: string, readOnly: string | undefined) {
  return readOnly === '1' && !READ_ACTIONS.has(action);
}
