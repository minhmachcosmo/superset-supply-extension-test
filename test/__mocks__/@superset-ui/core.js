module.exports = {
  t: str => str,
  validateNonEmpty: jest.fn(),
  SupersetClient: { post: jest.fn().mockResolvedValue({}) },
  ChartMetadata: jest.fn().mockImplementation(opts => opts),
  ChartPlugin: class ChartPlugin {
    constructor(config) { this.config = config; }
    configure(opts) { Object.assign(this, opts); return this; }
  },
  ChartProps: jest.fn().mockImplementation(opts => opts),
  supersetTheme: {},
  buildQueryContext: jest.fn((formData, fn) => ({ queries: fn({}) })),
  QueryFormData: {},
};
