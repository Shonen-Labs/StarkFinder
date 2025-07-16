import { testApiHandler } from "next-test-api-route-handler"; // Must always be first
import * as appHandler from "@/app/api/deploy-contract/route";
import {
  contractWithConstructor,
  simpleContract,
  validScarbToml,
} from "@/data/deploy-test";

// ensure you're running devnet before running
describe("Integration Test POST /api/audit-sourceCode", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it("deploy contract successfully without constructor", async () => {
    process.env.OZ_ACCOUNT_PRIVATE_KEY = "";
    process.env.ACCOUNT_ADDRESS = "";
    process.env.STARKNET_RPC_URL = "http://127.0.0.1:5050";
    process.env.STARKNET_PROVIDER_URL = "http://127.0.0.1:5050";

    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const body = {
          sourceCode: JSON.stringify({
            contractName: "generatedcontract",
            sourceCode: JSON.stringify(simpleContract),
            scarbToml: JSON.stringify(validScarbToml),
          }),
        };

        const response = await fetch({
          method: "POST",
          body: JSON.stringify(body),
          headers: { "Content-Type": "application/json" },
        });

        expect(response.status).toBe(200);
      },
    });
  }, 20000000);

  it("deploy contract successfully with constructor", async () => {
    process.env.OZ_ACCOUNT_PRIVATE_KEY = "";
    process.env.ACCOUNT_ADDRESS = "";
    process.env.STARKNET_RPC_URL = "http://127.0.0.1:5050";
    process.env.STARKNET_PROVIDER_URL = "http://127.0.0.1:5050";

    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const response = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contractName: "generatedcontract",
            sourceCode: JSON.stringify(contractWithConstructor),
            scarbToml: JSON.stringify(validScarbToml),
            constructorArgs: JSON.stringify([
              {
                name: "initial_value",
                type: "u256",
                value: "10000000",
              },
            ]),
          }),
        });

        expect(response.status).toBe(200);

        const json = await response.json();

        expect(json).toMatchObject({
          success: true,
          contractAddress: expect.any(String),
          classHash: expect.any(String),
          transactionHash: expect.any(String),
          casmHash: expect.any,
        });

        console.log(json);
      },
    });
  }, 20000000);
});
