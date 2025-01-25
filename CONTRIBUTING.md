# Contributing to StarkFinder

Thank you for your interest in contributing to STARKFINDER! 
Please read the following rules carefully before applying to work on an issue.

## Application Process

When applying to work on an issue:

1. Provide a brief background about yourself.
2. Explain how you plan to approach the issue.
3. Share your estimated time of arrival (ETA) for completing the task.

## Deadlines and Communication

- If you cannot complete the task within your ETA + 1 day, **you must inform us** on Telegram. Failure to do so will result in you being unassigned from the issue.
- Contributors can reach out for help regarding the project anytime via:
  - Project Telegram: [StarkFinder](https://t.me/shogenlabs) 
- Maintainers
  - Poulav Bhowmick (@impoulav)[https://t.me/impoulav]
  - Soham Das (@tosoham)[https://t.me/tosoham]
  - Rahul guha (@darkdanate)[https://t.me/darkdanate]

## Workflow Requirements

1. **Work on a Separate Branch**
  
  - Fork the repository.
  - Create a new branch for your feature or bug fix.
  - Make your changes and commit them.
  - Push your changes to your forked repository.
  - Submit a pull request to the original repository.

2. **Run Checks Before Submitting a PR**
    2.1 **Checks for contracts**
    - Make sure to run the following command in the root directory:
      ```bash
      cd contracts && scarb fmt && scarb build
      ```
    - Ensure there are no errors before submitting your PR.
    
    2.2 **Checks for website client**
    ```bash
    cd client && npm run dev
    ```
    - Ensure there are no errors before submitting your PR. 
    - If you are working on any feature that requires env values, check with 
    ```bash
    cd client && npm run build
    ```
3. **PR Validation**
    - While pushing a PR, ensure you write what changes you made and write "fixes #(your_issue_name)" in the description.
    - If any checks fail on your PR, you must fix them before it can be merged.
  

## Project Setup

Refer to the [Getting Started](./README.md#getting-started) file in the same directory for detailed instructions on setting up the project.

By following these guidelines, you help ensure a smooth contribution process for everyone involved. Thank you for contributing!