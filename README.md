# CoffeeBudget Frontend

Smart personal finance tracking application with keyword-based transaction categorization.

## Features

- Transaction management with auto-categorization
- Smart keyword extraction and learning
- Budget planning and tracking
- Expense analytics and reporting
- Recurring transaction detection

## Smart Categorization Features

- **Keyword-Based Categorization**: Categorizes transactions using user-defined keywords
- **Smart Keyword Management**: Easy keyword addition and refinement for categories
- **Bulk Processing**: Categorize multiple transactions with similar patterns at once
- **User Control**: Full control over categorization rules and keywords

## Tech Stack

- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- Shadcn UI Components
- NextAuth.js (Auth0)
- TanStack Query (React Query)

## 📚 Documentation

### User Documentation (This Repo)
- [Cypress Setup](./docs/cypress-setup.md) - E2E testing configuration
- [Security Token Validation](./docs/security-token-validation.md) - Token handling guide

### Development Documentation (Main Repo)
- **[Complete Documentation Hub](../docs/README.md)** - Central documentation index
- [Service Architecture](../docs/comprehensive-logic-documentation/SERVICE-ARCHITECTURE.md) - Full system architecture
- [Development Process](../docs/STRICT-DEVELOPMENT-PROCESS.md) - Mandatory development workflow
- [Testing Standards](../docs/development/TESTING-STANDARDS.md) - Frontend testing best practices
- [Frontend Session Notes](../docs/development/session-notes/frontend/) - Development session logs
- [Frontend Testing Docs](../docs/development/testing/) - Comprehensive testing guide
- [UI Components](../docs/features/) - Feature-specific UI documentation

**All development planning, architecture docs, and task management are in the main repository at `../docs/`**

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/coffeebudget/coffee-budget-frontend.git
   cd coffee-budget-frontend
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. Start the development server
   ```bash
   npm run dev
   # or
   yarn dev
   ```

## Project Structure

- `/src/app` - Next.js app router pages and components
- `/src/components` - Reusable UI components
- `/src/utils` - Utility functions and API clients
- `/public` - Static assets

## Screenshots

[Add screenshots of your application here]

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[Your chosen license]
