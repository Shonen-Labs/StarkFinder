"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Book, Code, FileCode, Wallet, Rocket, Wrench, ChevronDown } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible"
// import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

const contractCategories = [
  {
    name: "Getting Started",
    icon: Book,
    path: "/contracts/getting-started",
    items: [
      { name: "Introduction", path: "/contracts/getting-started/introduction" },
      { name: "Setup", path: "/contracts/getting-started/setup" },
      { name: "First Contract", path: "/contracts/getting-started/first-contract" },
    ],
  },
  {
    name: "Cairo & Starknet",
    icon: Code,
    path: "/contracts/cairo-starknet",
    items: [
      { name: "Cairo Basics", path: "/contracts/cairo-starknet/cairo-basics" },
      { name: "Starknet Specifics", path: "/contracts/cairo-starknet/starknet-specifics" },
      { name: "Advanced Patterns", path: "/contracts/cairo-starknet/advanced-patterns" },
    ],
  },
  {
    name: "Smart Contracts",
    icon: FileCode,
    path: "/contracts/smart-contracts",
    items: [
      { name: "ERC20", path: "/contracts/smart-contracts/erc20" },
      { name: "ERC721", path: "/contracts/smart-contracts/erc721" },
      { name: "Account Abstraction", path: "/contracts/smart-contracts/account-abstraction" },
    ],
  },
  {
    name: "Dojo",
    icon: Rocket,
    path: "/contracts/dojo",
    items: [
      { name: "Introduction", path: "/contracts/dojo/introduction" },
      { name: "Components", path: "/contracts/dojo/components" },
      { name: "Systems", path: "/contracts/dojo/systems" },
    ],
  },
  {
    name: "Wallets",
    icon: Wallet,
    path: "/contracts/wallets",
    items: [
      { name: "Integration", path: "/contracts/wallets/integration" },
      { name: "Connect Wallet", path: "/contracts/wallets/connect-wallet" },
    ],
  },
  {
    name: "Libraries & Tools",
    icon: Wrench,
    path: "/contracts/libraries-tools",
    items: [
      { name: "Starknet.js", path: "/contracts/libraries-tools/starknet-js" },
      { name: "Starknet React", path: "/contracts/libraries-tools/starknet-react" },
    ],
  },
]

export function ContractsSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar className="border-r border-border">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Starknet Contracts</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {contractCategories.map((category) => (
                <Collapsible
                  key={category.name}
                  defaultOpen={pathname.startsWith(category.path)}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton>
                        <category.icon className="h-4 w-4" />
                        <span>{category.name}</span>
                        <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {category.items.map((item) => (
                          <SidebarMenuSubItem key={item.path}>
                            <SidebarMenuSubButton asChild isActive={pathname === item.path}>
                              <Link href={item.path}>{item.name}</Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
