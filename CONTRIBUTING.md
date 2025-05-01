# Contributing to StarkFinder

First off, thank you for considering contributing to StarkFinder! We welcome any help, from reporting bugs and suggesting features to writing code and improving documentation.

This document provides guidelines for contributing to the project.

## How to Contribute

*   **Reporting Bugs:** If you find a bug, please open an issue using the "Bug Report" template. Provide as much detail as possible, including steps to reproduce, expected behavior, and actual behavior.
*   **Suggesting Enhancements:** If you have an idea for a new feature or an improvement to an existing one, please open an issue using the "Feature Request" template. Describe the feature and why you think it's valuable.
*   **Pull Requests:** If you want to contribute code or documentation changes:
    1.  Fork the repository.
    2.  Create a new branch based on our branching strategy (see below).
    3.  Make your changes, adhering to the project's coding style and guidelines.
    4.  Ensure your changes include appropriate tests (see Testing Guidelines).
    5.  Make sure all tests pass locally.
    6.  Update documentation if your changes affect usage, architecture, or setup.
    7.  Commit your changes with clear, descriptive messages.
    8.  Push your branch to your fork.
    9.  Open a pull request against the `main` (or `develop`) branch of the original StarkFinder repository. Use the Pull Request template.
    10. Be prepared to discuss your changes and make adjustments based on feedback.

## Issue and Pull Request Templates

We use GitHub templates to ensure consistency and gather necessary information. When you open a new issue or pull request, please use the appropriate template provided.

## Branching Strategy

We follow a simplified Gitflow model:

*   **`main`:** This branch represents the latest stable release. Direct commits are not allowed. Merges happen from `develop` during a release process.
*   **`develop`:** This is the main development branch where features are integrated. All feature branches should be based on `develop`. PRs are typically merged into this branch.
*   **Feature Branches:** Create branches off `develop` for new features. Use the naming convention `feature/<feature-name>` (e.g., `feature/add-user-profiles`).
*   **Bugfix Branches:** Create branches off `develop` (or `main` for critical hotfixes) for bug fixes. Use the naming convention `bugfix/<issue-number>-<short-description>` (e.g., `bugfix/42-fix-login-error`).
*   **Chore Branches:** For maintenance tasks (updating dependencies, refactoring). Use `chore/<task-description>` (e.g., `chore/update-docker-base-image`).

**General Workflow:**

1.  `git checkout develop`
2.  `git pull origin develop`
3.  `git checkout -b feature/your-feature-name`
4.  *Make your changes and commit*
5.  `git push origin feature/your-feature-name`
6.  Open a PR from `your-fork/feature/your-feature-name` to `original-repo/develop`.

## Local Development Environment

Detailed instructions for setting up your local development environment are in the main README.md. Key aspects include:

*   **Containerization:** We use Docker for building service images. [**Add link to Dockerfiles or relevant directories if helpful**].
*   **Orchestration:** Local development typically runs on a local Kubernetes cluster (Minikube, Kind, Docker Desktop). Configuration is managed via Helm charts located in the `/helm` directory. See `helm/starkfinder/values-local.yaml` for local overrides.
*   **Database (Prisma):**
    *   Migrations are managed using Prisma Migrate (`pnpm prisma migrate dev`). Ensure your database connection string in `.env` points to your local database instance (often running in Kubernetes/Docker).
    *   The Prisma client is generated automatically during `pnpm install` or can be generated manually with `pnpm prisma generate`.
    *   Seeding the database (if applicable) is done via `pnpm prisma db seed`. [**Mention if seeding is required/recommended for local dev**].
*   **Troubleshooting Common Issues:**
    *   **Service Connection Errors:** Ensure Kubernetes services are running (`kubectl get pods -n starkfinder`) and check port-forwarding if needed. Verify environment variables for service URLs.
    *   **Database Connection Errors:** Double-check the `DATABASE_URL` in `.env`. Ensure the database container/pod is running and accessible. You might need to port-forward the database port (`kubectl port-forward svc/<db-service-name> <local-port>:<db-port> -n starkfinder`).
    *   **Helm Errors:** Check Helm chart syntax (`helm lint ./helm/starkfinder`) and ensure your local Kubernetes cluster is configured correctly as the current context (`kubectl config current-context`).

## Testing Guidelines

We aim for comprehensive test coverage to ensure code quality and stability.

*   **Unit Tests:** Test individual functions or components in isolation. [**Specify location, e.g., `*.test.ts` files next to source files**]. Use [**mention testing framework, e.g., Jest, Vitest**].
*   **Integration Tests:** Test the interaction between different components or services. [**Specify location and framework/tools used**].
*   **End-to-End (E2E) Tests:** Test the entire application flow from a user's perspective. [**Specify location and framework/tools used, e.g., Playwright, Cypress**].
*   **Running Tests:**
    ```bash
    # Run all tests
    pnpm test

    # Run unit tests for a specific package
    cd packages/service-1 && pnpm test:unit

    # Run E2E tests
    pnpm test:e2e
    # (Replace with your actual test commands)
    ```
*   **Coverage:** Aim to maintain or increase test coverage with your contributions. [**Mention coverage tool, e.g., Istanbul/nyc, and target percentage if applicable**].

## Code Style

We use [**mention tools like ESLint, Prettier**] to enforce a consistent code style. Please run `pnpm lint` and `pnpm format` before committing your changes. Configuration files can be found at the root of the repository ([**e.g., `.eslintrc.js`, `.prettierrc.js`**]).

Thank you for contributing!


