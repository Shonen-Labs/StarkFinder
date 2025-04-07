// Using OpenAI SDK

import { ChatOpenAI } from "@langchain/openai";

export const createGrokClient = () => {
    return new ChatOpenAI({
        modelName: "grok-2-latest",
        temperature: 0.2,
        maxTokens: undefined,
        maxRetries: 3,
        openAIApiKey: process.env.XAI_API_KEY,
        configuration: {
            baseURL: "https://api.x.ai/v1",
            defaultHeaders: {
                "x-api-key": process.env.XAI_API_KEY
            }
        }
    });
}; 


// import OpenAI from "openai";
    
// const client = new OpenAI({
//   apiKey: $XAI_API_KEY,
//   baseURL: "https://api.x.ai/v1",
// });

// const completion = await client.chat.completions.create({
//   model: "grok-2-latest",
//   messages: [
//     {
//         role: "system",
//         content:
//             "You are Grok, a chatbot inspired by the Hitchhiker's Guide to the Galaxy.",
//     },
//     {
//         role: "user",
//         content:
//             "What is the meaning of life, the universe, and everything?",
//     },
// ],
// });


// // Using Anthropic SDK

// import Anthropic from '@anthropic-ai/sdk';

// const client = new Anthropic({
//   apiKey: $XAI_API_KEY,
//   baseURL: "https://api.x.ai/",
// });
