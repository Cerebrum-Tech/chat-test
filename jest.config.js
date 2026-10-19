module.exports = {
  preset: 'jest-expo',
  clearMocks: true,
  moduleNameMapper: {
    // jest-expo imports Expo's internal dependency, which npm may install under expo.
    '^expo-modules-core$': require.resolve('expo-modules-core', {
      paths: [require.resolve('expo/package.json')],
    }),
  },
};
