# Contributing to Geek Protocol

First off, thank you for considering contributing to Geek Protocol! It's people like you that make Geek Protocol such a great platform.

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to team@geekprotocol.xyz.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

* **Use a clear and descriptive title** for the issue
* **Describe the exact steps to reproduce the problem**
* **Provide specific examples** to demonstrate the steps
* **Describe the behavior you observed** and what behavior you expected to see
* **Include screenshots and animated GIFs** if possible
* **Include your environment details** (OS, Node version, browser, etc.)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

* **Use a clear and descriptive title**
* **Provide a detailed description of the suggested enhancement**
* **Explain why this enhancement would be useful** to most Geek Protocol users
* **List some other applications where this enhancement exists**, if applicable

### Pull Requests

#### Development Process

1. **Fork the repository** and create your branch from `main`
2. **Make your changes** following our coding standards
3. **Write or update tests** if you've added code that should be tested
4. **Ensure the test suite passes** with `npm run test`
5. **Run type checking** with `npm run type-check`
6. **Lint your code** with `npm run lint`
7. **Write a descriptive commit message** following Conventional Commits
8. **Push to your fork** and submit a pull request

#### Commit Message Format

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that don't affect code meaning (formatting, etc.)
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Performance improvements
- `test`: Adding or correcting tests
- `chore`: Changes to build process or auxiliary tools

**Examples:**
```
feat(quiz): add timer pause functionality
fix(api): resolve authentication token expiry issue
docs(readme): update installation instructions
```

#### Code Style Guidelines

**TypeScript:**
- Use TypeScript strict mode
- Prefer interfaces over types for object shapes
- Use meaningful variable and function names
- Add JSDoc comments for public APIs

**React:**
- Use functional components with hooks
- Keep components small and focused
- Extract reusable logic into custom hooks
- Use proper TypeScript types for props

**General:**
- Follow existing code formatting (Prettier)
- Keep functions pure when possible
- Write self-documenting code
- Add comments for complex logic

#### Testing

- Write tests for new features
- Ensure existing tests pass
- Aim for meaningful test coverage
- Use descriptive test names

```typescript
// Good
test('should return error when quiz attempt has expired', () => {
  // test implementation
});

// Bad
test('test1', () => {
  // test implementation
});
```

## Project Structure

Understanding the project structure will help you contribute effectively:

```
geek-protocol-alpha/
├── apps/
│   ├── api/           # Backend API (Fastify)
│   │   ├── src/
│   │   │   ├── routes/    # API endpoints
│   │   │   ├── lib/       # Shared utilities
│   │   │   └── workers/   # Background jobs
│   │   └── prisma/        # Database schema
│   └── web/           # Frontend (Next.js)
│       ├── src/
│       │   ├── app/       # Next.js app router
│       │   ├── components/# React components
│       │   └── lib/       # Client utilities
│       └── tests/         # E2E tests
└── packages/
    └── shared/        # Shared types & utilities
```

## Development Setup

See the [README.md](README.md) for detailed setup instructions. Quick version:

```bash
# Clone and install
git clone https://github.com/GEEKProtocol0110/geek-protocol-alpha.git
cd geek-protocol-alpha
npm install

# Start infrastructure
docker-compose up -d

# Setup database
cd apps/api
npm run prisma:push
npm run prisma:generate
npm run seed
cd ../..

# Start development servers
npm run dev
```

## Areas We Need Help With

- **Quiz Questions:** Adding new questions to our question bank
- **UI/UX Improvements:** Making the interface more intuitive and accessible
- **Testing:** Writing tests for existing features
- **Documentation:** Improving guides and API documentation
- **Performance:** Optimizing load times and responsiveness
- **Internationalization:** Adding support for multiple languages

## Questions?

Feel free to:
- Open a [GitHub Discussion](https://github.com/GEEKProtocol0110/geek-protocol-alpha/discussions)
- Ask in our [Telegram community](https://t.me/GEEKonKAScommunity)
- Reach out on [X/Twitter](https://x.com/geekonkas)

## Recognition

Contributors will be:
- Listed in our contributors page
- Mentioned in release notes for significant contributions
- Eligible for special community roles and recognition

Thank you for contributing to Geek Protocol! 🚀
