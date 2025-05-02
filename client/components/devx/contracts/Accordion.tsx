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

  const gettingStarted: NavigationItem[] = [
    { topic: "Install Cairo", link: "/devx/contracts/getting-started/install" },
    { topic: "Create a new project", link: "/devx/contracts/getting-started/create" },
    { topic: "Build your project", link: "/devx/contracts/getting-started/build" },
    { topic: "Testing", link: "/devx/contracts/getting-started/testing" },
  ];

  const components: NavigationItem[] = [
    { topic: "Components How-To", link: "/devx/contracts/components/how-to" },
    { topic: "Components Dependencies", link: "/devx/contracts/components/dependencies" },
    { topic: "Storage Collisions", link: "/devx/contracts/components/storage" },
    { topic: "Ownable", link: "/devx/contracts/components/ownable" },
  ];

  const applications: NavigationItem[] = [
    {
      topic: "Upgradeable Contract",
      link: "/devx/contracts/applications/upgradeable-contract",
    },
    { topic: "DeFi Vault", link: "/devx/contracts/applications/defi-vault" },
    { topic: "ERC20 Token", link: "/devx/contracts/applications/erc20-token" },
    { topic: "ERC721 NFT", link: "/devx/contracts/applications/erc721-nft" },
  ];

  const advancedConcept: NavigationItem[] = [
    { topic: "Hashing", link: "/devx/contracts/advanced-concept/hashing" },
    { topic: "Plugins", link: "/devx/contracts/advanced-concept/plugins" },
    {
      topic: "Signature Verification",
      link: "/devx/contracts/advanced-concept/verification",
    },
    { topic: "Sierra IR", link: "/devx/contracts/advanced-concept/sierra" },
  ];

  const cairoCheatsheet: NavigationItem[] = [
    { topic: "Felt", link: "/devx/contracts/cairo-cheatsheet/felt" },
    { topic: "Events", link: "/devx/contracts/cairo-cheatsheet/events" },
    { topic: "Maps", link: "/devx/contracts/cairo-cheatsheet/maps" },
    { topic: "Arrays", link: "/devx/contracts/cairo-cheatsheet/arrays" },
  ];

  return (
    <div className="w-full px-4 overflow-y-auto pb-6">
      <div className="space-y-2">
        <div className="cursor-pointer pb-3 rounded-md">
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
            <h1 className="text-lg font-medium">Advanced Concepts</h1>
            {openSections["advanced-concept"] ? (
              <ChevronUp size={20} />
            ) : (
              <ChevronDown size={20} />
            )}
          </div>
          {openSections["advanced-concept"] && (
            <div className="mt-2 ml-4 text-gray-300">
              <ul className="pl-2 space-y-1">
                {advancedConcept.map((item, index) => (
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