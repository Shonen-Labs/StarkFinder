import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";


const MultiSectionAccordion = () => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    "getting-started": false,
    components: false,
    applications: false,
    "advanced-concepts": false,
    "cairo-cheatsheet": false,
  });

  const toggleSection = (section: string) => {
    setOpenSections({
      ...openSections,
      [section]: !openSections[section],
    });
  };

  const gettingStarted = [
    { topic: "Install Cairo", link: "/devx/contracts/getting-started/install" },
    {
      topic: "Create a new project",
      link: "/devx/contracts/getting-started/create",
    },
    {
      topic: "Build your project",
      link: "/devx/contracts/getting-started/build",
    },
    { topic: "Testing", link: "/devx/contracts/getting-started/testing" },
  ];

  const components = [
    { topic: "Components How-To", link: "/devx/contracts/components/how-to" },
    {
      topic: "Components Dependencies",
      link: "/devx/contracts/components/dependencies",
    },
    { topic: "Storage Collisions", link: "/devx/contracts/components/storage" },
    { topic: "Ownable", link: "/devx/contracts/components/ownable" },
  ];

  const applications = [
    {
      topic: "Upgradeable Contract",
      link: "/devx/contracts/applications/upgradeable-contract",
    },
    { topic: "DeFi Vault", link: "/devx/contracts/applications/defi-vault" },
    { topic: "ERC20 Token", link: "/devx/contracts/applications/erc20-token" },
    { topic: "ERC721 NFT", link: "/devx/contracts/applications/erc721-nft" },
  ];

  const advancedConcept = [
    { topic: "Hashing", link: "/devx/contracts/advanced-concept/hashing" },
    { topic: "Plugins", link: "/devx/contracts/advanced-concept/plugins" },
    {
      topic: "Signature Verification",
      link: "/devx/contracts/advanced-concept/verification",
    },
    { topic: "Sierra IR", link: "/devx/contracts/advanced-concept/sierra" },
  ];

  const cairoCheatsheet = [
    { topic: "Felt", link: "/devx/contracts/cairo-cheatsheet/felt" },
    { topic: "Events", link: "/devx/contracts/cairo-cheatsheet/events" },
    { topic: "Maps", link: "/devx/contracts/cairo-cheatsheet/maps" },
    { topic: "Arrays", link: "/devx/contracts/cairo-cheatsheet/arrays" },
  ];

  return (
    <div className="w-full max-w-md mx-auto h-full overflow-y-auto max-h-[550px] pb-4">
      <div className="space-y-2">
        <div className="cursor-pointer pb-3 pr-3 rounded-md">
          <div
            className="flex justify-between items-center"
            onClick={() => toggleSection("getting-started")}
          >
            <h1 className="text-lg font-medium">Getting Started</h1>
            {openSections["getting-started"] ? (
              <ChevronUp size={20} />
            ) : (
              <ChevronDown size={20} />
            )}
          </div>
          {openSections["getting-started"] && (
            <div className="mt-2 ml-4 text-gray-300">
              <ul className="pl-2 space-y-1">
                {gettingStarted.map((item, index) => (
                  <ul key={index}>
                    <Link href={item.link}>{item.topic}</Link>
                  </ul>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="cursor-pointer pb-3 pr-3 rounded-md">
          <div
            className="flex justify-between items-center"
            onClick={() => toggleSection("components")}
          >
            <h1 className="text-lg font-medium">Components</h1>
            {openSections["components"] ? (
              <ChevronUp size={20} />
            ) : (
              <ChevronDown size={20} />
            )}
          </div>
          {openSections["components"] && (
            <div className="mt-2 ml-4 text-gray-300">
              <ul className="pl-2 space-y-1">
                {components.map((item, index) => (
                  <li key={index}>
                    <Link href={item.link}>{item.topic}</Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="cursor-pointer pb-3 pr-3 rounded-md">
          <div
            className="flex justify-between items-center"
            onClick={() => toggleSection("applications")}
          >
            <h1 className="text-lg font-medium">Applications</h1>
            {openSections["applications"] ? (
              <ChevronUp size={20} />
            ) : (
              <ChevronDown size={20} />
            )}
          </div>
          {openSections["applications"] && (
            <div className="mt-2 ml-4 text-gray-300">
              <ul className="pl-2 space-y-1">
                {applications.map((item, index) => (
                  <li key={index}>
                    <Link href={item.link}>{item.topic}</Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="cursor-pointer pb-3 pr-3 rounded-md">
          <div
            className="flex justify-between items-center"
            onClick={() => toggleSection("advanced-concepts")}
          >
            <h1 className="text-lg font-medium">Advanced Concepts</h1>
            {openSections["advanced-concepts"] ? (
              <ChevronUp size={20} />
            ) : (
              <ChevronDown size={20} />
            )}
          </div>
          {openSections["advanced-concepts"] && (
            <div className="mt-2 ml-4 text-gray-300">
              <ul className="pl-2 space-y-1">
                {advancedConcept.map((item, index) => (
                  <li key={index}>
                    <Link href={item.link}>{item.topic}</Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="cursor-pointer pb-3 pr-3 rounded-md">
          <div
            className="flex justify-between items-center"
            onClick={() => toggleSection("cairo-cheatsheet")}
          >
            <h1 className="text-lg font-medium">Cairo Cheatsheet</h1>
            {openSections["cairo-cheatsheet"] ? (
              <ChevronUp size={20} />
            ) : (
              <ChevronDown size={20} />
            )}
          </div>
          {openSections["cairo-cheatsheet"] && (
            <div className="mt-2 ml-4 text-gray-300">
              <ul className="pl-2 space-y-1">
                {cairoCheatsheet.map((item, index) => (
                  <li key={index}>
                    <Link href={item.link}>{item.topic}</Link>
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
