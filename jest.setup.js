import '@testing-library/jest-dom'
import 'whatwg-fetch'

// Import server but don't try to set it up
import { server } from './src/mocks/server'

// Simple setup
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())