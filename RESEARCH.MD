# Research on the Best LLM for Cairo Programming

## Introduction

The aim of this document is to share information on which **LLM/AI model** generates the most accurate **Cairo codes**. After in-depth research, mainstream LLMs such as **GPT-3.5**, **GPT-4.5**, **StarCoder**, **PaLM 2**, **WizardCoder**, **Claude 3.7**, **Llama 3.2**, **Code Llama**, and **Mistral** often struggle to generate accurate Cairo code. This is primarily because their training datasets lack sufficient **Cairo-specific examples**. The scarcity of Cairo-related data in their training datasets leads to inaccuracies when these models attempt to produce code that has not been tested or trained previously. Consequently, the use of mainstream AI tools such as **ChatGPT**, **Claude**, **Qwen**, or **Deepseek** often results in constant inaccuracies and errors in Cairo codes.

## Mainstream LLMs and Their Limitations

Mainstream LLMs, despite their advanced capabilities, face significant challenges when it comes to generating accurate Cairo code. The primary reason for this is the lack of sufficient Cairo-specific data in their training datasets. This limitation leads to the following issues:

- **Inaccurate Code Generation**: Models often produce code that contains errors or does not function as intended.
- **Lack of Specialization**: These models are not specialized in Cairo programming, leading to suboptimal performance.

## Specialized LLMs for Cairo Programming

Apart from the mainstream LLMs, there are a few models that claim to have been trained on Cairo data. These models are:

1. **StarkNet Agent**: A specialized LLM designed for Cairo programming.
2. **DevDock - Web3 Developer Copilot Supporting Cairo**: A developer tool that supports Cairo programming.
3. **StarkWizard**: Another LLM related to Cairo programming.

## Fine-Tuning LLMs with Custom Cairo Code

Fine-tuning an LLM for Cairo programming is entirely possible. With the datasets already available for Cairo (e.g., GitHub, Starknet repositories), we can train a model to specialize in writing and explaining Cairo code. The best base model for fine-tuning tokenized Cairo codes would be **Code Llama**, known for its proficiency in code generation and structured smart contract languages. Fine-tuning Code Llama would be the best approach with minimal computational cost.

### Benchmark Results

According to **HumanEval** (by OpenAI), **Code Llama** has shown promising results in code generation tasks. This makes it a strong candidate for fine-tuning with Cairo-specific data.

## Conclusion

While mainstream LLMs struggle with Cairo programming due to a lack of specialized training data, there are specialized models and approaches that can be employed to achieve better results. Fine-tuning models like **Code Llama** with Cairo-specific datasets appears to be the most effective strategy for generating accurate Cairo code.

## References

- [StarkNet Agent](#)
- [DevDock - Web3 Developer Copilot Supporting Cairo](#)
- [StarkWizard](#)
- [HumanEval by OpenAI](#)
