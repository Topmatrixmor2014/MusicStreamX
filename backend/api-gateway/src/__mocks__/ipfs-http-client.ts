export const create = jest.fn(() => ({
  add: jest.fn(),
  cat: jest.fn(),
}));
export type IPFSHTTPClient = ReturnType<typeof create>;
