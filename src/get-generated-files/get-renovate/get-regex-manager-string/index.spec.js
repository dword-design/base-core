import self from './index.js';

export default {
  'code before': () =>
    expect(
      new RegExp(self('foo', '(?<currentValue>.*?)')).test(
        "console.log('foo');foo`18`",
      ),
    ).toEqual(true),
  default: () =>
    expect(
      new RegExp(self('foo', '(?<currentValue>.*?)')).test('foo`18`'),
    ).toEqual(true),
  'letters before': () =>
    expect(
      new RegExp(self('foo', '(?<currentValue>.*?)')).test('xyzfoo`18`'),
    ).toEqual(false),
};
