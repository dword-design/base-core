export default [
  {
    uses: 'coverallsapp/github-action@master',
    with: {
      'github-token': '${{ secrets.GITHUB_TOKEN }}',
    },
  },
]
