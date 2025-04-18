/**
 * Storybook main configuration
 */
const config = {
  "stories": [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    "@storybook/addon-essentials",
    "@storybook/addon-onboarding",
    "@chromatic-com/storybook"
  ],
  "framework": {
    "name": "@storybook/react-vite",
    "options": {}
  },
  "staticDirs": [
    "../public"
  ]
};
export default config;