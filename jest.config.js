module.exports = {
  moduleFileExtensions: ['mock.js', 'ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    '\\.(gif|ttf|eot|png|jpg|svg)$': '<rootDir>/test/__mocks__/mockExportString.js',
    '@superset-ui/core': '<rootDir>/test/__mocks__/@superset-ui/core.js',
    '@superset-ui/chart-controls': '<rootDir>/test/__mocks__/@superset-ui/chart-controls.js',
    'leaflet': '<rootDir>/test/__mocks__/mockExportString.js',
    'react-leaflet': '<rootDir>/test/__mocks__/mockExportString.js',
  },
  testEnvironment: 'jsdom',
};

