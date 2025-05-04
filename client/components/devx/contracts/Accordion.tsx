import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavigationItem {
  topic: string;
  link: string;
}

const MultiSectionAccordion = () => {
  const pathname = usePathname();

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    "getting-started": false,
    components: false,
    applications: false,
    "advanced-concepts": false,
    "cairo-cheatsheet": false,
  });

  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!isInitialized) {
      const sections = {
        "getting-started": false,
        components: false,
        applications: false,
        "advanced-concept": false,
        "cairo-cheatsheet": false,
      };

      if (pathname?.includes('/getting-started/')) {
        sections["getting-started"] = true;
      } else if (pathname?.includes('/components/')) {
        sections.components = true;
      } else if (pathname?.includes('/applications/')) {
        sections.applications = true;
      } else if (pathname?.includes('/advanced-concept/')) {
        sections["advanced-concept"] = true;
      } else if (pathname?.includes('/cairo-cheatsheet/')) {
        sections["cairo-cheatsheet"] = true;
      }

      setOpenSections(sections);
      setIsInitialized(true);
    }
  }, [pathname, isInitialized]);

  const toggleSection = (section: string) => {
    setOpenSections({
      ...openSections,
      [section]: !openSections[section],
    });
  };

  const isActive = (path: string): boolean => pathname === path;

  const tokenContracts: NavigationItem[] = [
    { topic: "ERC20 Token", link: "/devx/contracts/token-contracts/erc20" },
    { topic: "Mock ERC20", link: "/devx/contracts/token-contracts/mockerc20" },
    { topic: "Mock ERC721", link: "/devx/contracts/token-contracts/mockerc721" },
  ];

  const defiContracts: NavigationItem[] = [
    { topic: "Constant Product AMM", link: "/devx/contracts/defi-contracts/const-amm" },
    { topic: "Concentrated Liquidity AMM", link: "/devx/contracts/defi-contracts/conc-liq-amm" },
    { topic: "DeFi Vault", link: "/devx/contracts/defi-contracts/defivault" },
    { topic: "NFT Dutch Auction", link: "/devx/contracts/defi-contracts/dutch-auction" },
    { topic: "Crowdfunding", link: "/devx/contracts/defi-contracts/crowdfund" },
    { topic: "Staking Contract", link: "/devx/contracts/defi-contracts/staking-contract" },
  ];

  const utilityContracts: NavigationItem[] = [
    { topic: "Simple Storage", link: "/devx/contracts/utility-contracts/simplestorage" },
    { topic: "Random Number", link: "/devx/contracts/utility-contracts/randomnum" },
    { topic: "Merkle", link: "/devx/contracts/utility-contracts/merkle" },
    { topic: "Timelock", link: "/devx/contracts/utility-contracts/timelock" },
    { topic: "Evolving NFT", link: "/devx/contracts/utility-contracts/evolving-nft" },
  ];

  const governanceContracts: NavigationItem[] = [
    { topic: "Upgradable", link: "/devx/contracts/governance-contracts/upgradable" },
    { topic: "Stark Identity", link: "/devx/contracts/governance-contracts/starkidentity" },
    { topic: "Starkfinder", link: "/devx/contracts/governance-contracts/sf" },
  ];

  return (
    <div className="w-full px-4 overflow-y-auto pb-6">
      <div className="space-y-2">
        <div className="cursor-pointer pb-3 rounded-md">
          <div
            className="flex justify-between items-center"
            onClick={() => toggleSection("getting-started")}
          >
            <h1 className="text-lg font-medium">Token Contracts</h1>
            {openSections["getting-started"] ? (
              <ChevronUp size={20} />
            ) : (
              <ChevronDown size={20} />
            )}
          </div>
          {openSections["getting-started"] && (
            <div className="mt-2 ml-4 text-gray-300">
              <ul className="pl-2 space-y-1">
                {tokenContracts.map((item, index) => (
                  <li key={index} className={isActive(item.link) ? "text-white font-bold" : ""}>
                    <Link href={item.link} prefetch={false}>{item.topic}</Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="cursor-pointer pb-3 rounded-md">
          <div
            className="flex justify-between items-center"
            onClick={() => toggleSection("components")}
          >
            <h1 className="text-lg font-medium">Defi Contracts</h1>
            {openSections["components"] ? (
              <ChevronUp size={20} />
            ) : (
              <ChevronDown size={20} />
            )}
          </div>
          {openSections["components"] && (
            <div className="mt-2 ml-4 text-gray-300">
              <ul className="pl-2 space-y-1">
                {defiContracts.map((item, index) => (
                  <li key={index} className={isActive(item.link) ? "text-white font-bold" : ""}>
                    <Link href={item.link} prefetch={false}>{item.topic}</Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="cursor-pointer pb-3 rounded-md">
          <div
            className="flex justify-between items-center"
            onClick={() => toggleSection("applications")}
          >
            <h1 className="text-lg font-medium">Utility Contracts</h1>
            {openSections["applications"] ? (
              <ChevronUp size={20} />
            ) : (
              <ChevronDown size={20} />
            )}
          </div>
          {openSections["applications"] && (
            <div className="mt-2 ml-4 text-gray-300">
              <ul className="pl-2 space-y-1">
                {utilityContracts.map((item, index) => (
                  <li key={index} className={isActive(item.link) ? "text-white font-bold" : ""}>
                    <Link href={item.link} prefetch={false}>{item.topic}</Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="cursor-pointer pb-3 rounded-md">
          <div
            className="flex justify-between items-center"
            onClick={() => toggleSection("advanced-concept")}
          >
            <h1 className="text-lg font-medium">Governance Contracts</h1>
            {openSections["advanced-concept"] ? (
              <ChevronUp size={20} />
            ) : (
              <ChevronDown size={20} />
            )}
          </div>
          {openSections["advanced-concept"] && (
            <div className="mt-2 ml-4 text-gray-300">
              <ul className="pl-2 space-y-1">
                {governanceContracts.map((item, index) => (
                  <li key={index} className={isActive(item.link) ? "text-white font-bold" : ""}>
                    <Link href={item.link} prefetch={false}>{item.topic}</Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
export default MultiSectionAccordion;