import { testApiHandler } from "next-test-api-route-handler";
import { Readable } from "stream";
import * as appHandler from "@/app/api/audit-sourceCode/route";
import * as deepseekModule from "@/lib/devxstark/deepseek-client";
import { example_contract, example_response } from "@/data/audit-test";

jest.mock("@/lib/devxstark/deepseek-client", () => {
  const mockChatStream = jest.fn();

  return {
    __esModule: true,
    deepseek: {
      chatStream: mockChatStream,
    },
    __mockChatStream__: mockChatStream,
  };
});

describe("POST /api/audit-sourceCode", () => {
  const mockChatStream = (
    deepseekModule as typeof import("@/lib/devxstark/deepseek-client") & {
      __mockChatStream__: jest.Mock;
    }
  ).__mockChatStream__;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns 200 with mocked stream response", async () => {
    const readable = Readable.from([JSON.stringify(example_response)]);

    mockChatStream.mockResolvedValueOnce(readable);

    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const body = { sourceCode: JSON.stringify(example_contract) };

        const response = await fetch({
          method: "POST",
          body: JSON.stringify(body),
          headers: { "Content-Type": "application/json" },
        });

        expect(response.status).toBe(200);

        const text = await response.text();
        expect(text).toContain(JSON.stringify(example_response));

        expect(mockChatStream).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({ role: "system" }),
            expect.objectContaining({ role: "user" }),
          ])
        );
      },
    });
  });

  it("returns 500 if deepseek.chatStream throws", async () => {
    mockChatStream.mockRejectedValueOnce(new Error("Mocked error"));

    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const body = { sourceCode: JSON.stringify(example_contract) };

        const response = await fetch({
          method: "POST",
          body: JSON.stringify(body),
          headers: { "Content-Type": "application/json" },
        });

        expect(response.status).toBe(500);

        const json = await response.json();
        expect(json).toHaveProperty("error", "Mocked error");
      },
    });
  });

  it("returns 400 if sourceCode is missing", async () => {
    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const response = await fetch({
          method: "POST",
          body: JSON.stringify({}),
          headers: { "Content-Type": "application/json" },
        });

        expect(response.status).toBe(400);
        const json = await response.json();
        expect(json).toEqual({
          error: "`sourceCode` is required in the request body.",
        });
      },
    });
  });

  it("returns 400 if sourceCode is not a string", async () => {
    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const response = await fetch({
          method: "POST",
          body: JSON.stringify({ sourceCode: 12345 }),
          headers: { "Content-Type": "application/json" },
        });

        expect(response.status).toBe(400);
        const json = await response.json();
        expect(json).toEqual({
          error: "`sourceCode` is required in the request body.",
        });
      },
    });
  });
});
