import { Metadata } from "next";
import Link from "next/link";

import Navbar from "../../navbar/navbar";
import Footer from "../../footer/footer";

export const metadata: Metadata = {
  title:
    "About Us - Web3 Wallet Solutions | Empowering the Decentralized Future",
  description:
    "Meet the visionary team behind Web3 Wallet Solutions. Learn about our mission to create secure, intuitive crypto wallets that bring blockchain technology to everyone.",
  keywords:
    "web3, crypto wallet, blockchain, decentralized finance, team, about us, mission",
  authors: [{ name: "Web3 Wallet Solutions Team" }],
  openGraph: {
    title: "About Us - Web3 Wallet Solutions",
    description:
      "Empowering the decentralized future with secure, intuitive crypto wallets.",
    type: "website",
    url: "https://web3walletsolutions.com/about",
    siteName: "Web3 Wallet Solutions",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Web3 Wallet Solutions Team",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "About Us - Web3 Wallet Solutions",
    description:
      "Empowering the decentralized future with secure, intuitive crypto wallets.",
    images: ["/og-image.jpg"],
  },
  robots: "index, follow",
};

const teamMembers = [
  {
    id: 1,
    name: "Alex Johnson",
    role: "CEO & Founder",
    bio: "Blockchain expert with 10+ years in fintech. Passionate about making crypto accessible to everyone.",
    alt: "CEO Alex Johnson smiling in office with blockchain technology background",
  },
  {
    id: 2,
    name: "Rahul Guha",
    role: "Lead Developer",
    bio: "Full-stack developer specializing in smart contracts and blockchain architecture.",
    alt: "Lead Developer Rahul Guha working on code with multiple monitors",
  },
  {
    id: 3,
    name: "Soham Das",
    role: "UX Designer",
    bio: "Focused on making crypto accessible and user-friendly through intuitive design.",
    alt: "UX Designer Soham Das creating user interface designs on tablet",
  },
  {
    id: 4,
    name: "Poulav",
    role: "UI/UX Designer",
    bio: "Creating beautiful and functional interfaces that simplify complex blockchain interactions.",
    alt: "UI/UX Designer Poulav reviewing design prototypes",
  },
];

interface TeamMember {
  id: number;
  name: string;
  role: string;
  bio: string;
  alt: string;
}

function TeamCard({ member }: { member: TeamMember }) {
  return (
    <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/10 hover:border-purple-500/40 hover:scale-105 transition-all duration-300 group">
      <div className="relative w-full h-64 overflow-hidden rounded-xl shadow-md bg-gradient-to-br from-purple-600/20 to-blue-600/20 flex items-center justify-center">
        <div className="text-4xl">👤</div>
      </div>
      <h3 className="text-2xl font-bold mt-4 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
        {member.name}
      </h3>
      <p className="text-sm uppercase tracking-wide text-purple-400 mt-1">
        {member.role}
      </p>
      <p className="text-gray-300 mt-3 text-sm leading-relaxed">{member.bio}</p>
    </div>
  );
}

export default function AboutPage() {
  return (
    <Navbar/>
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      {/* Hero Section */}
      <section className="py-20 px-6 max-w-6xl mx-auto text-center">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-pulse">
            Empowering the Decentralized Future
          </h1>
          <p className="text-lg md:text-xl mt-6 max-w-3xl mx-auto text-gray-300 leading-relaxed">
            At Web3 Wallet Solutions, we&apos;re crafting secure, intuitive
            wallets that bring crypto to everyone. Our team blends expertise in
            blockchain, design, and engineering to build tools for
            tomorrow&apos;s economy.
          </p>
        </div>
      </section>

      {/* Mission Content Section */}
      {/* Mission Content Section */}
      <section className="py-20 px-6 max-w-4xl mx-auto text-center">
        <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl p-12 border border-white/10">
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-pink-500 to-blue-400 bg-clip-text text-transparent mb-6">
            Our Mission
          </h2>
          <p className="text-gray-300 text-lg mb-6 max-w-2xl mx-auto leading-relaxed">
            We believe that blockchain technology should be accessible to
            everyone, not just technical experts. Our mission is to bridge the
            gap between complex blockchain infrastructure and everyday users.
          </p>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto leading-relaxed">
            Through intuitive design, robust security, and seamless user
            experiences, we&apos;re building the tools that will power the next
            generation of decentralized applications and financial systems.
          </p>
        </div>
      </section>

      {/* Team Grid */}
      <section className="py-16 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Meet Our Team
          </h2>
          <p className="text-gray-400 mt-4 max-w-2xl mx-auto">
            Our diverse team brings together expertise from blockchain
            development, user experience design, and financial technology to
            create innovative solutions.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {teamMembers.map((member) => (
            <TeamCard key={member.id} member={member} />
          ))}
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 px-6 max-w-4xl mx-auto text-center">
        <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl p-12 border border-white/10">
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-pink-500 to-blue-400 bg-clip-text text-transparent mb-6">
            Ready to Join the Revolution?
          </h2>
          <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
            Whether you&apos;re a developer, designer, or crypto enthusiast, we&apos;d
            love to hear from you. Let&apos;s build the future of decentralized
            finance together.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-purple-600 hover:to-pink-600 rounded-xl shadow-lg text-white font-semibold transition-all duration-300 hover:scale-105"
            >
              Contact Us
            </Link>
            <Link
              href="/careers"
              className="inline-flex items-center px-8 py-4 border border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white rounded-xl transition-all duration-300"
            >
              View Careers
            </Link>
          </div>
        </div>
      </section>

      {/* Footer Navigation */}
      <Footer/>
    </main>
  );
}
