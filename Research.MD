# Research: Best LLM for Cairo Programming on StarkNet

![StarkNet](https://img.shields.io/badge/StarkNet-EC7211?style=flat&logo=starknet&logoColor=white)
![Cairo](https://img.shields.io/badge/Cairo-1.0-2B817D?style=flat)

This document evaluates LLMs for **Cairo programming** (StarkNet's language for provable smart contracts) and provides actionable recommendations for fine-tuning.

---

## Key Challenges with Mainstream LLMs

| Model              | Strengths                          | Weaknesses (Cairo-Specific)          |
|--------------------|------------------------------------|---------------------------------------|
| **Claude Sonnet 3.5** | General code logic                | Syntax errors, ignores Cairo constraints |
| **GPT-4**            | Strong problem decomposition      | Outdated Cairo 1.0 patterns           |
| **Code Llama**       | Structured code generation        | No Cairo-specific tuning              |
| **Mistral/StarCoder**| General-purpose                  | Fails on low-level memory management  |

---

## Specialized LLMs for Cairo

### 1. StarkNet Agent
- **Pros**: Generates syntactically correct Cairo code.
- **Cons**: 90% failure rate on non-keyword queries.
- **Use Case**: Scaffolding only.  
- **Reference**: [StarkNet Docs](https://starknet.io)

### 2. Deepseek R1
- **Pros**:  
  - Native Cairo 1.0 support (e.g., `#[starknet::contract]`).  
  - Open-source, hostable via Hugging Face.  
  - Outperforms GPT-4 in logic/correctness.  
- **Cons**: Minor syntax errors (fixable via fine-tuning).  
- **GitHub**: [Deepseek R1](https://github.com/deepseek-ai)

### 3. Grok 3 (Unreleased)
- **Potential**: Real-time StarkNet data integration.  
- **Risks**: Closed-source; unproven for Cairo.  

---

## Data Collection for Fine-Tuning

### Critical Data Sources
1. **Code Repositories**  
   - Scrape GitHub for Cairo 1.0 contracts, tests, and StarkNet integrations (e.g., account abstraction).  
   - Include error logs (compiler outputs, debugging workflows).  

2. **User Interaction Logs**  
   - Annotate real developer queries (e.g., "Fix `Array<felt252>` error") with intent labels.  

3. **Synthetic Data**  
   - Generate error-correction pairs using GPT-4/Deepseek R1.  

### Preprocessing Steps
- Remove outdated Cairo 0.x examples.  
- Balance dataset: 30% debugging, 40% codegen, 30% architecture.  

---

## Fine-Tuning Strategy

### Base Model Selection
| Model          | Recommendation Reason          | Hosting Options        |
|----------------|---------------------------------|------------------------|
| **Deepseek R1**| Native Cairo syntax proficiency | Hugging Face, Local GPU|
| **Code Llama** | Fallback for structured code    | AWS/GCP/Azure          |

### Steps
1. **Technique**: Use **LoRA** (Low-Rank Adaptation) for cost-efficient tuning.  
2. **Focus Areas**:  
   - Error recovery (e.g., `Panic` error fixes).  
   - StarkNet ecosystem patterns (sequencer interactions).  
3. **Tools**:  
   ```bash
   # Hugging Face Transformers Example
   from transformers import AutoModelForCausalLM
   model = AutoModelForCausalLM.from_pretrained("deepseek/r1-base")
