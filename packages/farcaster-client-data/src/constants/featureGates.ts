import { NEYNAR_TEAM_FIDS } from './adminFids';

export function checkGate(gateId: GateId, fid: number): boolean {
  const gate = gates.find((g) => g.gateId === gateId);
  if (!gate) {
    return false;
  }
  if (gate.status !== 'active') {
    return false;
  }
  const segmentFids = (seg: SegmentName): number[] =>
    (segments[seg] ?? []) as number[];
  const allowedUserIds = gate.allowedUserIds as readonly number[];
  return (
    allowedUserIds.includes(fid) ||
    gate.allowedSegments.some((segment) => segmentFids(segment).includes(fid))
  );
}

type Segment = number[];

// mapping of segment name to list of fids
const segments = {
  neynarTeam: [...NEYNAR_TEAM_FIDS] as Segment,
} as const;

type SegmentName = keyof typeof segments;

type GateInput = {
  gateId: string;
  gateName: string;
  status: string;
  checksPerHour?: number; // this is how many checks per hour this gate had when i imported it from statsig
  allowedSegments: SegmentName[];
  allowedUserIds: number[];
};

const gates = [
  {
    gateId: 'creator_labels',
    gateName: 'Creator Labels',
    status: 'active',
    checksPerHour: 15732,
    allowedSegments: ['neynarTeam'],
    allowedUserIds: [],
  },
  {
    gateId: 'mobile_debug_menu_access',
    gateName: 'Mobile Debug Menu Access',
    status: 'active',
    checksPerHour: 3587,
    allowedSegments: ['neynarTeam'],
    allowedUserIds: [],
  },
  {
    gateId: 'swap_aggregation',
    gateName: 'swap_aggregation',
    status: 'active',
    checksPerHour: 3515,
    allowedSegments: ['neynarTeam'],
    allowedUserIds: [],
  },
  {
    gateId: 'festive_theme',
    gateName: 'Festive Theme',
    status: 'active',
    checksPerHour: 3510,
    allowedSegments: ['neynarTeam'],
    allowedUserIds: [],
  },
  {
    // TODO remove. Was 10% partial rollout
    gateId: 'ingest_mobile_navigation_events',
    gateName: 'Ingest Mobile Navigation Events',
    status: 'inactive',
    checksPerHour: 3481,
    allowedSegments: [],
    allowedUserIds: [],
  },
] as const satisfies readonly GateInput[];

/** Union of all gate IDs defined in the gates array. Invalid gate IDs are a type error. */
export type GateId = (typeof gates)[number]['gateId'];

/** Ordered list of all gate IDs for shared usage. */
export const GATE_IDS: readonly GateId[] = gates.map((g) => g.gateId);
