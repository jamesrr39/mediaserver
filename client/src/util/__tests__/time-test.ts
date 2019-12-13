import { Time } from '../time';

test('Time', () => {
    const t1 = new Time(3600 + 60 + 1);
    expect(t1.hours).toBe(1);
    expect(t1.minutes).toBe(1);
    expect(t1.seconds).toBe(1);
    expect(t1.toString()).toBe('1h 1m 1s');

    const t2 = new Time((3600 * 2) + (60 * 3) + (1 * 4));
    expect(t2.hours).toBe(2);
    expect(t2.minutes).toBe(3);
    expect(t2.seconds).toBe(4);
    expect(t2.toString()).toBe('2h 3m 4s');
});
