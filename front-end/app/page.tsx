"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/navigation/Footer";
import { Logo } from "@/components/ui/Logo";
import {
  TrendingDown,
  Wallet,
  Sliders,
  Code,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Navbar */}
      <nav className="border-b-2 border-[#97f0e5] bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 sm:gap-3 cursor-pointer hover:opacity-80 transition-opacity">
              <Logo size={32} className="sm:w-10 sm:h-10" />
              <h1 className="text-2xl font-black">
                <span className="text-black">Store</span>
                <span className="text-[#97f0e5]">wave</span>
              </h1>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              <a
                href="#features"
                className="text-gray-700 hover:text-secondary transition-colors font-medium"
              >
                Features
              </a>
              <a
                href="#sdk"
                className="text-gray-700 hover:text-secondary transition-colors font-medium"
              >
                SDK
              </a>
              <a
                href="https://github.com/razvanstatescu/walrus-storage-marketplace/blob/main/README.md"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-700 hover:text-secondary transition-colors font-medium"
              >
                About
              </a>
              <Link href="/buy-storage">
                <Button
                  className="rounded-xl border-2 border-[#97f0e5] font-bold
                           shadow-[4px_4px_0px_0px_rgba(151,240,229,1)]
                           hover:shadow-[2px_2px_0px_0px_rgba(151,240,229,1)]
                           hover:translate-x-[2px] hover:translate-y-[2px]
                           transition-all bg-white hover:bg-[#97f0e5]/10"
                >
                  Launch App
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full
                            border-2 border-[#97f0e5] bg-[#97f0e5]/10 mb-8">
              <Sparkles className="w-4 h-4 text-secondary" />
              <span className="text-sm font-bold">
                Powered by Walrus Protocol
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black mb-6 leading-tight">
              <span className="text-black">Decentralized Storage</span>
              <br />
              <span className="text-[#97f0e5]">Marketplace</span>
            </h1>

            {/* Subheadline */}
            <p className="sm:text-lg md:text-xl text-gray-600 mb-10 max-w-4xl mx-auto leading-relaxed font-medium">
              We turn wasted storage capacity into everyone's instant savings.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/buy-storage">
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-xl border-2 border-[#97f0e5] font-bold text-lg
                             shadow-[6px_6px_0px_0px_rgba(151,240,229,1)]
                             hover:shadow-[3px_3px_0px_0px_rgba(151,240,229,1)]
                             hover:translate-x-[3px] hover:translate-y-[3px]
                             transition-all bg-white hover:bg-[#97f0e5]/10 px-8 py-6"
                >
                  Get Started <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <a href="#features">
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-xl border-2 border-[#97f0e5] font-bold text-lg
                             shadow-[6px_6px_0px_0px_rgba(151,240,229,1)]
                             hover:shadow-[3px_3px_0px_0px_rgba(151,240,229,1)]
                             hover:translate-x-[3px] hover:translate-y-[3px]
                             transition-all bg-white hover:bg-[#97f0e5]/10 px-8 py-6"
                >
                  Learn More
                </Button>
              </a>
            </div>
          </div>

          {/* Hero Visual Element */}
          <div className="mt-16 max-w-5xl mx-auto">
            <div
              className="backdrop-blur-md bg-white/80 border-4 border-[#97f0e5]
                          rounded-2xl shadow-[8px_8px_0px_0px_rgba(151,240,229,1)]
                          p-8 sm:p-12"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
                <div>
                  <div className="text-4xl sm:text-5xl font-black text-[#97f0e5] mb-2">
                    100+
                  </div>
                  <div className="text-secondary text-xs font-bold uppercase">
                    Storage Providers
                  </div>
                </div>
                <div>
                  <div className="text-4xl sm:text-5xl font-black text-[#97f0e5] mb-2">
                    1TB+
                  </div>
                  <div className="text-secondary text-xs font-bold uppercase">
                    Available Storage
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-center mb-2">
                    <img
                      src="/walrus.svg"
                      alt="Walrus Protocol"
                      className="h-12 w-auto"
                    />
                  </div>
                  <div className="text-secondary text-xs font-bold uppercase">
                    Built On
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4">
              <span className="text-black">Why Choose</span>{" "}
              <span className="text-[#97f0e5]">Storewave</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Turning Walrus storage into a liquid, tradeable asset for the first time.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1: Always Get the Lowest Price */}
            <div
              className="backdrop-blur-md bg-white/80 border-2 border-[#97f0e5]
                          rounded-xl shadow-[4px_4px_0px_0px_rgba(151,240,229,1)]
                          hover:shadow-[2px_2px_0px_0px_rgba(151,240,229,1)]
                          hover:translate-x-[2px] hover:translate-y-[2px]
                          transition-all p-8"
            >
              <div
                className="w-14 h-14 rounded-xl border-2 border-[#97f0e5]
                            bg-[#97f0e5]/10 flex items-center justify-center mb-6"
              >
                <TrendingDown className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-2xl font-black mb-3">
                Always Get the Lowest Price
              </h3>
              <p className="text-gray-600">
                Our intelligent algorithm automatically finds the cheapest way to
                buy storage by comparing marketplace deals against system prices
                in real-time. Save up to 50% instantly.
              </p>
            </div>

            {/* Feature 2: Turn Unused Storage Into Cash */}
            <div
              className="backdrop-blur-md bg-white/80 border-2 border-[#97f0e5]
                          rounded-xl shadow-[4px_4px_0px_0px_rgba(151,240,229,1)]
                          hover:shadow-[2px_2px_0px_0px_rgba(151,240,229,1)]
                          hover:translate-x-[2px] hover:translate-y-[2px]
                          transition-all p-8"
            >
              <div
                className="w-14 h-14 rounded-xl border-2 border-[#97f0e5]
                            bg-[#97f0e5]/10 flex items-center justify-center mb-6"
              >
                <Wallet className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-2xl font-black mb-3">
                Turn Unused Storage Into Cash
              </h3>
              <p className="text-gray-600">
                List your overprovisioned or unused storage on the marketplace
                and recoup your investment. Stop losing money on wasted capacity
                or deleted blobs.
              </p>
            </div>

            {/* Feature 3: Buy Exactly What You Need */}
            <div
              className="backdrop-blur-md bg-white/80 border-2 border-[#97f0e5]
                          rounded-xl shadow-[4px_4px_0px_0px_rgba(151,240,229,1)]
                          hover:shadow-[2px_2px_0px_0px_rgba(151,240,229,1)]
                          hover:translate-x-[2px] hover:translate-y-[2px]
                          transition-all p-8"
            >
              <div
                className="w-14 h-14 rounded-xl border-2 border-[#97f0e5]
                            bg-[#97f0e5]/10 flex items-center justify-center mb-6"
              >
                <Sliders className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-2xl font-black mb-3">Buy Exactly What You Need</h3>
              <p className="text-gray-600">
                Purchase storage by exact size and duration—not rigid system
                packages. Flexible splitting means you only pay for what you
                actually use. Zero waste, perfect allocation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SDK Section */}
      <section
        id="sdk"
        className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-gray-50"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div>
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full
                              border-2 border-[#97f0e5] bg-[#97f0e5]/10 mb-6"
              >
                <Code className="w-4 h-4 text-[#97f0e5]" />
                <span className="text-sm font-bold">Developer Tools</span>
              </div>

              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-6">
                <span className="text-black">Integrate with</span>
                <br />
                <span className="text-[#97f0e5]">Storewave SDK</span>
              </h2>

              <p className="text-lg text-gray-600 mb-8">
                Build powerful applications with our TypeScript SDK. Access all
                Storewave features programmatically and create seamless Web3
                storage experiences for your users.
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full border-2 border-[#97f0e5] bg-[#97f0e5]/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="w-2 h-2 rounded-full bg-secondary"></div>
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">Type-Safe API</h4>
                    <p className="text-gray-600 text-sm">
                      Full TypeScript support with comprehensive type
                      definitions
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full border-2 border-[#97f0e5] bg-[#97f0e5]/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="w-2 h-2 rounded-full bg-secondary"></div>
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">Easy Integration</h4>
                    <p className="text-gray-600 text-sm">
                      Simple API that works with any JavaScript framework
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full border-2 border-[#97f0e5] bg-[#97f0e5]/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="w-2 h-2 rounded-full bg-secondary"></div>
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">Comprehensive Docs</h4>
                    <p className="text-gray-600 text-sm">
                      Detailed documentation with examples and guides
                    </p>
                  </div>
                </div>
              </div>

              <a
                href="https://www.npmjs.com/package/storewave-sdk"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-xl border-2 border-[#97f0e5] font-bold text-lg
                             shadow-[6px_6px_0px_0px_rgba(151,240,229,1)]
                             hover:shadow-[3px_3px_0px_0px_rgba(151,240,229,1)]
                             hover:translate-x-[3px] hover:translate-y-[3px]
                             transition-all bg-white hover:bg-[#97f0e5]/10 px-8"
                >
                  View on NPM <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </a>
            </div>

            {/* Right Code Preview */}
            <div
              className="backdrop-blur-md bg-gray-900/95 border-2 border-[#97f0e5]
                          rounded-xl shadow-[6px_6px_0px_0px_rgba(151,240,229,1)]
                          p-6 sm:p-8 overflow-hidden"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <pre className="text-sm sm:text-base overflow-x-auto">
                <code className="text-gray-100">
                  <span className="text-secondary">npm install</span>{" "}
                  <span className="text-[#97f0e5]">storewave-sdk</span>
                  {"\n\n"}
                  <span className="text-gray-500">// Import the SDK</span>
                  {"\n"}
                  <span className="text-secondary">import</span>{" "}
                  <span className="text-yellow-300">{"{"}</span>{" "}
                  <span className="text-[#97f0e5]">WalStorageMarketplace</span>{" "}
                  <span className="text-yellow-300">{"}"}</span>
                  {"\n"}
                  <span className="text-secondary">from</span>{" "}
                  <span className="text-green-400">'storewave-sdk'</span>;
                  {"\n\n"}
                  <span className="text-gray-500">
                    // Initialize SDK for testnet
                  </span>
                  {"\n"}
                  <span className="text-secondary">const</span>{" "}
                  <span className="text-blue-300">sdk</span> ={" "}
                  <span className="text-secondary">new</span>{" "}
                  <span className="text-yellow-300">
                    WalStorageMarketplace
                  </span>
                  (
                  <span className="text-green-400">'testnet'</span>);
                  {"\n\n"}
                  <span className="text-gray-500">
                    // Calculate storage reservation cost
                  </span>
                  {"\n"}
                  <span className="text-secondary">const</span>{" "}
                  <span className="text-blue-300">costData</span> ={" "}
                  <span className="text-secondary">await</span> sdk.
                  <span className="text-yellow-300">getReservationCost</span>(
                  <span className="text-yellow-300">{"{"}</span>
                  {"\n"}
                  {"  "}
                  <span className="text-blue-300">size</span>:{" "}
                  <span className="text-orange-400">1024</span>,
                  {"              "}
                  <span className="text-gray-500">// File size</span>
                  {"\n"}
                  {"  "}
                  <span className="text-blue-300">sizeUnit</span>:{" "}
                  <span className="text-green-400">'bytes'</span>,
                  {"       "}
                  <span className="text-gray-500">// Size unit</span>
                  {"\n"}
                  {"  "}
                  <span className="text-blue-300">durationInEpochs</span>:{" "}
                  <span className="text-orange-400">5</span>
                  {"      "}
                  <span className="text-gray-500">// Storage duration</span>
                  {"\n"}
                  <span className="text-yellow-300">{"}"}</span>);
                </code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
