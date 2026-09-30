import { describe, expect, it, vi } from 'vitest';

import { buildEngagementRingCandidatesFetcher } from '../buildEngagementRingCandidatesFetcher';
import { buildEngagementRingCandidatesKey } from '../buildEngagementRingCandidatesKey';

describe('engagement ring candidates query helpers', () => {
  it('includes the fid in the query key', () => {
    expect(buildEngagementRingCandidatesKey({ fid: 123 })).toEqual([
      'engagementRingCandidates',
      123,
    ]);
  });

  it('calls the API client and returns response data', async () => {
    const data = {
      result: {
        candidates: [],
      },
    };
    const apiClient = {
      getEngagementRingCandidates: vi.fn().mockResolvedValue({
        data,
      }),
    };

    await expect(
      buildEngagementRingCandidatesFetcher({
        apiClient: apiClient as never,
        fid: 123,
      })(),
    ).resolves.toBe(data);

    expect(apiClient.getEngagementRingCandidates).toHaveBeenCalledWith({
      fid: 123,
    });
  });
});
