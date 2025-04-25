"use client";

import { motion } from "framer-motion";
import { ArrowTopRightIcon } from "@radix-ui/react-icons";
import { Header } from "@/components/devx/resources/header";

const resources = [
  {
    category: "Getting Started",
    description: "Begin your Starknet journey here",
    items: [
      {
        title: "Starknet Documentation",
        url: "https://docs.starknet.io",
        description: "Official Starknet developer documentation",
        icon: "📚",
      },
      {
        title: "Starknet by Example",
        url: "https://starknet-by-example.voyager.online/",
        description: "Practical Starknet contract examples",
        icon: "🌅",
      },
      {
        title: "Cairo Basics",
        url: "https://www.cairographics.org/documentation/",
        description: "Learn Cairo programming fundamentals",
        icon: "⚡",
      },
    ],
  },
  {
    category: "Cairo & Starknet",
    description: "Deep dive into core technologies",
    items: [
      {
        title: "Cairo Book",
        url: "https://book.cairo-lang.org",
        description: "Comprehensive guide to Cairo language",
        icon: "📖",
      },
      {
        title: "Starknet Cairo",
        url: "https://starknet.io/cairo",
        description: "Advanced Cairo patterns for Starknet",
        icon: "🌀",
      },
      {
        title: "Starknet Foundry",
        url: "https://foundry-rs.github.io/starknet-foundry/",
        description: "Development toolkit for Starknet",
        icon: "🛠️",
      },
    ],
  },
  {
    category: "Smart Contracts",
    description: "Contract development resources",
    items: [
      {
        title: "Starknet Contracts",
        url: "https://docs.starknet.io/architecture-and-concepts/smart-contracts/contract-classes/",
        description: "Official contract examples",
        icon: "📑",
      },
      {
        title: "OpenZeppelin Cairo",
        url: "https://docs.openzeppelin.com/",
        description: "Secure contract templates",
        icon: "🛡️",
      },
      {
        title: "Starknet Dev Tools",
        url: "https://docs.starknet.io/tools/devtools/",
        description: "Development utilities",
        icon: "�",
      },
    ],
  },
  {
    category: "Dojo",
    description: "Autonomous world framework",
    items: [
      {
        title: "Dojo Book",
        url: "https://book.dojoengine.org/overview",
        description: "Complete Dojo framework guide",
        icon: "🎮",
      },
      {
        title: "Dojo Starter",
        url: "https://dojotoolkit.org/documentation/tutorials/1.10/start/index.html",
        description: "Quickstart templates",
        icon: "🚀",
      },
    ],
  },
  {
    category: "Wallets",
    description: "Starknet wallet solutions",
    items: [
      {
        title: "Argent X",
        url: "https://www.argent.xyz/argent-x",
        description: "Popular Starknet wallet",
        icon: "🦄",
      },
      {
        title: "Braavos",
        url: "https://braavos.app",
        description: "Feature-rich mobile wallet",
        icon: "📱",
      },
      {
        title: "Starknet.js",
        url: "https://starknetjs.com",
        description: "JavaScript wallet integration",
        icon: "🧩",
      },
    ],
  },
  {
    category: "Libraries & Tools",
    description: "Development ecosystem",
    items: [
      {
        title: "Starknet React",
        url: "https://www.starknet-react.com/docs/getting-started",
        description: "React hooks library",
        icon: "⚛️",
      },
      {
        title: "StarkNet.py",
        url: "https://starknetpy.readthedocs.io",
        description: "Python development kit",
        icon: "🐍",
      },
      {
        title: "Starkli",
        url: "https://book.starkli.rs/",
        description: "Starknet CLI tool",
        icon: "💻",
      },
    ],
  },
];

interface ResourceItem {
  title: string;
  url: string;
  description: string;
  icon: string;
}

const ResourceCard = ({ item }: { item: ResourceItem }) => (
  <motion.a
    href={item.url}
    target="_blank"
    rel="noopener noreferrer"
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    className="group relative flex flex-col justify-between p-6 [background:linear-gradient(45deg,#172033,theme(colors.slate.800)_50%,#172033)_padding-box] hover:[background:linear-gradient(45deg,#172033,theme(colors.slate.800)_50%,#172033)_padding-box,conic-gradient(from_var(--border-angle),theme(colors.slate.600/.48)_80%,_theme(colors.gray.500)_86%,_theme(colors.gray.300)_90%,_theme(colors.gray.500)_94%,_theme(colors.slate.600/.48))_border-box] rounded-2xl border border-transparent animate-border"
  >
    <div>
      <div className="text-3xl mb-4">{item.icon}</div>
      <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
      <p className="text-white/70 text-sm">{item.description}</p>
    </div>
    <div className="mt-4 flex justify-end">
      <ArrowTopRightIcon className="w-5 h-5 text-purple-400" />
    </div>
  </motion.a>
);

export default function ResourcesPage() {
  return (
    <div className="min-h-screen bg-[#172033] py-12 px-4 sm:px-6 lg:px-8">
      <Header />
      <div className="max-w-7xl mt-24 mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r text-white bg-clip-text text-transparent mb-4">
            Starknet Developer Resources
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Curated collection of essential tools, libraries, and learning
            materials for Starknet ecosystem development
          </p>
        </motion.div>

        <div className="space-y-16">
          {resources.map((section, sectionIndex) => (
            <motion.div
              key={section.category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: sectionIndex * 0.1 }}
            >
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">
                  {section.category}
                </h2>
                <p className="text-white/70">{section.description}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {section.items.map((item) => (
                  <ResourceCard key={item.title} item={item} />
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
