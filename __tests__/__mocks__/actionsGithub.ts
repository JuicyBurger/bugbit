export function getOctokit(_token: string) {
  return {
    rest: {
      pulls: {
        get: jest.fn(),
        createReview: jest.fn(),
        deletePendingReview: jest.fn(),
      },
    },
  };
}
