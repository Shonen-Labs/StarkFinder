-- AlterTable
ALTER TABLE "public"."GeneratedContract" ADD COLUMN     "deployedAt" TIMESTAMP(3),
ADD COLUMN     "deployedContractId" TEXT,
ADD COLUMN     "isDeployed" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "public"."GeneratedContract" ADD CONSTRAINT "GeneratedContract_deployedContractId_fkey" FOREIGN KEY ("deployedContractId") REFERENCES "public"."DeployedContract"("id") ON DELETE SET NULL ON UPDATE CASCADE;
