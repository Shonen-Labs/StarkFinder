import { testApiHandler } from "next-test-api-route-handler";
import * as appHandler from "@/app/api/deploy-contract/route";
import {
  badContract,
  contractWithConstructor,
  simpleContract,
  validScarbToml,
} from "@/data/deploy-test";

describe("POST /api/deploy-contract", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it("should return 500 if required env vars are missing", async () => {
    delete process.env.OZ_ACCOUNT_PRIVATE_KEY;
    delete process.env.ACCOUNT_ADDRESS;

    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contractName: "generatedcontract",
            sourceCode: simpleContract,
            scarbToml: validScarbToml,
          }),
        });

        expect(res.status).toBe(500);
        const json = await res.json();
        expect(json).toMatchObject({
          success: false,
          error: "Environment configuration error",
          details: expect.stringMatching(
            /ACCOUNT_ADDRESS|OZ_ACCOUNT_PRIVATE_KEY/
          ),
        });
      },
    });
  });

  it("should return 400 if source code is missing", async () => {
    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contractName: "generatedcontract",
            sourceCode: "",
            scarbToml: validScarbToml,
          }),
        });

        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json).toMatchObject({
          success: false,
          error: "Missing required field: sourceCode",
          details: "Source code is required for deployment",
        });
      },
    });
  });

  it("should return 400 if scarbToml is missing", async () => {
    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contractName: "generatedcontract",
            sourceCode: simpleContract,
            scarbToml: "",
          }),
        });

        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json).toMatchObject({
          success: false,
          error: "Missing required field: scarbToml",
          details: "Scarb.toml configuration is required for deployment",
        });
      },
    });
  });

  it("should return 500 if #[starknet::contract] is missing for contract validation", async () => {
    const modified = simpleContract.replace("#[starknet::contract]", "");
    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contractName: "generatedcontract",
            sourceCode: modified,
            scarbToml: validScarbToml,
          }),
        });

        expect(res.status).toBe(500);
        const json = await res.json();
        expect(json).toMatchObject({
          success: false,
          error: "Contract deployment failed",
          details:
            "Contract validation failed: Missing Starknet contract definition (#[starknet::contract] or mod contract)",
        });
      },
    });
  });

  it("should return 500 if #[storage] is missing for contract validation", async () => {
    const modified = simpleContract.replace(
      /#\[storage\]\s*struct\s+Storage\s*\{[^}]*\}/,
      ""
    );
    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contractName: "generatedcontract",
            sourceCode: modified,
            scarbToml: validScarbToml,
          }),
        });

        expect(res.status).toBe(500);
        const json = await res.json();
        expect(json).toMatchObject({
          success: false,
          error: "Contract deployment failed",
          details: "Contract validation failed: Missing storage definition",
        });
      },
    });
  });

  it("should return 500 if compiling bad contract", async () => {
    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contractName: "generatedcontract",
            sourceCode: badContract,
            scarbToml: validScarbToml,
          }),
        });

        expect(res.status).toBe(500);
        const json = await res.json();
        expect(json).toMatchObject({
          success: false,
          error: "Compilation failed",
        });
      },
    });
  });

  it("should return 400 if constructorArgs is missing when required for deployment", async () => {
    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contractName: "generatedcontract",
            sourceCode: contractWithConstructor,
            scarbToml: validScarbToml,
          }),
        });

        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json).toMatchObject({
          success: false,
          error: "Missing required field: constructorArgs",
          details: "constructorArgs configuration is required for deployment",
        });
      },
    });
  });
});
