"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/navigation/Footer";
import { Logo } from "@/components/ui/Logo";
import {
  ShoppingCart,
  Shield,
  Zap,
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
                className="text-gray-700 hover:text-[#97f0e5] transition-colors font-medium"
              >
                Features
              </a>
              <a
                href="#sdk"
                className="text-gray-700 hover:text-[#97f0e5] transition-colors font-medium"
              >
                SDK
              </a>
              <a
                href="https://www.npmjs.com/package/storewave-sdk"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-700 hover:text-[#97f0e5] transition-colors font-medium"
              >
                Docs
              </a>
            </div>

            {/* CTA Button */}
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
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full
                            border-2 border-[#97f0e5] bg-[#97f0e5]/10 mb-8">
              <Sparkles className="w-4 h-4 text-[#97f0e5]" />
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
            <p className="text-lg sm:text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
              Trade storage capacity, manage your data, and explore the future
              of Web3 storage. Built on Walrus, the cutting-edge decentralized
              storage network.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/buy-storage">
                <Button
                  size="lg"
                  className="rounded-xl border-2 border-[#97f0e5] font-bold text-lg
                             shadow-[6px_6px_0px_0px_rgba(151,240,229,1)]
                             hover:shadow-[3px_3px_0px_0px_rgba(151,240,229,1)]
                             hover:translate-x-[3px] hover:translate-y-[3px]
                             transition-all bg-[#97f0e5] hover:bg-[#97f0e5]/90
                             text-black px-8 py-6"
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
                  <div className="text-gray-600 font-medium">
                    Storage Providers
                  </div>
                </div>
                <div>
                  <div className="text-4xl sm:text-5xl font-black text-[#97f0e5] mb-2">
                    1TB+
                  </div>
                  <div className="text-gray-600 font-medium">
                    Available Storage
                  </div>
                </div>
                <div>
                  <div className="text-4xl sm:text-5xl font-black text-[#97f0e5] mb-2">
                    24/7
                  </div>
                  <div className="text-gray-600 font-medium">
                    Network Uptime
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
              Experience the next generation of decentralized storage with
              powerful features built for Web3
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1: Decentralized Storage */}
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
                <Shield className="w-8 h-8 text-[#97f0e5]" />
              </div>
              <h3 className="text-2xl font-black mb-3">
                True Decentralization
              </h3>
              <p className="text-gray-600">
                Your data is distributed across the Walrus network, ensuring no
                single point of failure. Enjoy enterprise-grade reliability with
                Web3 principles.
              </p>
            </div>

            {/* Feature 2: Marketplace */}
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
                <ShoppingCart className="w-8 h-8 text-[#97f0e5]" />
              </div>
              <h3 className="text-2xl font-black mb-3">
                Storage Marketplace
              </h3>
              <p className="text-gray-600">
                Buy and sell storage capacity in a peer-to-peer marketplace.
                Monetize unused storage or find the perfect capacity for your
                needs.
              </p>
            </div>

            {/* Feature 3: Lightning Fast */}
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
                <Zap className="w-8 h-8 text-[#97f0e5]" />
              </div>
              <h3 className="text-2xl font-black mb-3">Lightning Fast</h3>
              <p className="text-gray-600">
                Powered by cutting-edge technology, Walrus delivers
                blazing-fast upload and retrieval speeds. Experience Web2
                performance with Web3 security.
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
                    <div className="w-2 h-2 rounded-full bg-[#97f0e5]"></div>
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
                    <div className="w-2 h-2 rounded-full bg-[#97f0e5]"></div>
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
                    <div className="w-2 h-2 rounded-full bg-[#97f0e5]"></div>
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
                  className="rounded-xl border-2 border-[#97f0e5] font-bold text-lg
                             shadow-[6px_6px_0px_0px_rgba(151,240,229,1)]
                             hover:shadow-[3px_3px_0px_0px_rgba(151,240,229,1)]
                             hover:translate-x-[3px] hover:translate-y-[3px]
                             transition-all bg-[#97f0e5] hover:bg-[#97f0e5]/90
                             text-black px-8"
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
                  <span className="text-purple-400">npm install</span>{" "}
                  <span className="text-[#97f0e5]">storewave-sdk</span>
                  {"\n\n"}
                  <span className="text-gray-500">// Import the SDK</span>
                  {"\n"}
                  <span className="text-purple-400">import</span>{" "}
                  <span className="text-yellow-300">{"{"}</span>{" "}
                  <span className="text-[#97f0e5]">StorewaveClient</span>{" "}
                  <span className="text-yellow-300">{"}"}</span>
                  {"\n"}
                  <span className="text-purple-400">from</span>{" "}
                  <span className="text-green-400">'storewave-sdk'</span>;
                  {"\n\n"}
                  <span className="text-gray-500">// Initialize client</span>
                  {"\n"}
                  <span className="text-purple-400">const</span>{" "}
                  <span className="text-blue-300">client</span> ={" "}
                  <span className="text-purple-400">new</span>{" "}
                  <span className="text-yellow-300">StorewaveClient</span>();
                  {"\n\n"}
                  <span className="text-gray-500">// Upload data</span>
                  {"\n"}
                  <span className="text-purple-400">const</span>{" "}
                  <span className="text-blue-300">result</span> ={" "}
                  <span className="text-purple-400">await</span>{" "}
                  client.
                  <span className="text-yellow-300">upload</span>(
                  {"\n"}
                  {"  "}data
                  {"\n"});
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
