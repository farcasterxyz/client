import { enqueueImageUploadUrlReservation } from '../imageUploadUrlReservation';

describe('enqueueImageUploadUrlReservation', () => {
  it('runs concurrent reservations strictly one after another', async () => {
    const order: number[] = [];
    const delays = [30, 10, 20];

    const tasks = delays.map((ms, i) =>
      enqueueImageUploadUrlReservation(async () => {
        await new Promise<void>((resolve) => {
          setTimeout(resolve, ms);
        });
        order.push(i);
        return i;
      }),
    );

    const results = await Promise.all(tasks);
    expect(results).toEqual([0, 1, 2]);
    expect(order).toEqual([0, 1, 2]);
  });

  it('continues the chain after a rejected reservation', async () => {
    const order: string[] = [];

    await expect(
      enqueueImageUploadUrlReservation(async () => {
        order.push('a');
        throw new Error('fail');
      }),
    ).rejects.toThrow('fail');

    await enqueueImageUploadUrlReservation(async () => {
      order.push('b');
    });

    expect(order).toEqual(['a', 'b']);
  });
});
