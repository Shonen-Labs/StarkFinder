# Research on the Best LLM for Cairo Programming

## Introduction

Cairo is a specialized programming language designed for writing provable programs, primarily used in blockchain ecosystems like **StarkNet**. Due to its niche nature, mainstream **Large Language Models (LLMs)** often struggle to generate accurate Cairo code. This document explores the current state of LLMs for Cairo programming, identifies the best models, and evaluates the feasibility of fine-tuning LLMs with custom Cairo datasets.

---

## Current Challenges with Mainstream LLMs

### Claude Sonnet 3.5
- **Performance**: Claude Sonnet 3.5 often generates incorrect or error-prone Cairo code.
- **Reason**: Lack of sufficient Cairo-specific training data in its dataset.
- **Example Issues**: Syntax errors, incorrect logic, and failure to adhere to Cairo's unique constraints.

### Other Mainstream LLMs
- **GPT-4, GPT-3.5**: Struggles with Cairo due to limited exposure to the language during training.
- **Code Llama**: While better at structured code generation, it lacks Cairo-specific fine-tuning.
- **StarCoder, WizardCoder, Mistral**: These models are general-purpose and not optimized for Cairo.

---

## Specialized LLMs for Cairo Programming

### 1. **StarkNet Agent**
   - **Description**: A specialized LLM designed for Cairo programming, tailored to StarkNet's ecosystem.
   - **Performance**: Generates more accurate Cairo code compared to mainstream models.
   - **Availability**: Limited access; primarily used within the StarkNet community.
   - **Reference**: [StarkNet Agent Documentation](https://starknet.io)

### 2. **DevDock - Web3 Developer Copilot**
   - **Description**: A developer tool that supports Cairo programming and provides code suggestions.
   - **Performance**: Better than general-purpose LLMs but still has room for improvement.
   - **Reference**: [DevDock Website](https://devdock.ai)

### 3. **StarkWizard**
   - **Description**: A community-driven LLM fine-tuned for Cairo programming.
   - **Performance**: Promising results but not widely tested.
   - **Reference**: [StarkWizard GitHub](https://github.com/starkwizard)

---

## Feasibility of Fine-Tuning LLMs with Custom Cairo Code

### Why Fine-Tuning?
Fine-tuning allows LLMs to specialize in niche domains like Cairo programming. By training on Cairo-specific datasets, models can learn the language's syntax, constraints, and best practices.

### Steps for Fine-Tuning
1. **Dataset Collection**:
   - Gather Cairo code from open-source repositories (e.g., GitHub, StarkNet repos).
   - Include examples of smart contracts, libraries, and common patterns.
2. **Model Selection**:
   - **Code Llama**: Best base model due to its proficiency in code generation and structured languages.
   - **GPT-4**: Alternatively, GPT-4 can be fine-tuned if computational resources are available.
3. **Training**:
   - Use frameworks like Hugging Face's `transformers` or OpenAI's fine-tuning API.
   - Train on Cairo-specific datasets with a focus on accuracy and error reduction.
4. **Evaluation**:
   - Test the fine-tuned model on Cairo programming tasks.
   - Use benchmarks like **HumanEval** adapted for Cairo.

### Computational Cost
- Fine-tuning **Code Llama** is computationally efficient compared to larger models like GPT-4.
- Requires access to GPUs (e.g., NVIDIA A100) or cloud services like AWS, GCP, or Azure.

---

## Best Model for Fine-Tuning

### **Code Llama**
- **Why?**
  - Specializes in code generation.
  - Supports structured languages, making it ideal for Cairo.
  - Lower computational cost compared to GPT-4.
- **Fine-Tuning Process**:
  - Use Cairo datasets from GitHub and StarkNet repositories.
  - Train using Hugging Face's `transformers` library.
- **Expected Outcome**:
  - Improved accuracy in Cairo code generation.
  - Reduced errors and better adherence to Cairo's constraints.

---

## Recommendations

1. **Use Specialized Models**: For immediate needs, leverage **StarkNet Agent** or **DevDock** for Cairo code generation.
2. **Fine-Tune Code Llama**: For long-term solutions, fine-tune **Code Llama** with Cairo-specific datasets.
3. **Community Collaboration**: Engage with the StarkNet community to share datasets and fine-tuned models.

---

## References

1. [StarkNet Official Documentation](https://starknet.io)
2. [DevDock - Web3 Developer Copilot](https://devdock.ai)
3. [StarkWizard GitHub Repository](https://github.com/starkwizard)
4. [Code Llama by Meta AI](https://ai.meta.com/blog/code-llama-large-language-model-coding/)
5. [Hugging Face Transformers Library](https://huggingface.co/transformers/)
6. [HumanEval Benchmark by OpenAI](https://github.com/openai/human-eval)
