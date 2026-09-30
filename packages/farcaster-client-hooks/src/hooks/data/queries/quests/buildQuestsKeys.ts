import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildQuestsKey = () => compactQueryKey(['quests']);
const buildQuestKey = (questId: string) => compactQueryKey(['quest', questId]);

export { buildQuestKey, buildQuestsKey };
