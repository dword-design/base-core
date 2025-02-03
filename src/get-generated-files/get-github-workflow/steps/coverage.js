import gitHubAction from 'tagged-template-noop';

export default [
  {
    uses: gitHubAction`codecov/codecov-action@v5`,
    with: { token: '${{ secrets.CODECOV_TOKEN }}' },
  },
];
