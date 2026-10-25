import '@testing-library/jest-dom';

// No need to mock localStorage in jsdom - it's already available
// Just ensure it's clean before each test
beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
});
