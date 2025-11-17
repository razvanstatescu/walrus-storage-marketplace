import Link from "next/link";
import { Github, Twitter } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t-2 border-[#97f0e5] bg-white/80 backdrop-blur-md mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="md:col-span-2">
            <h3 className="text-2xl font-black mb-3">
              <span className="text-black">Store</span>
              <span className="text-[#97f0e5]">wave</span>
            </h3>
            <p className="text-gray-600 text-sm max-w-md">
              The decentralized storage marketplace built on Walrus.
              Trade storage capacity, manage your data, and explore the future of Web3 storage.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-black uppercase mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/buy-storage"
                  className="text-gray-600 hover:text-[#97f0e5] transition-colors text-sm"
                >
                  Buy Storage
                </Link>
              </li>
              <li>
                <Link
                  href="/my-listings"
                  className="text-gray-600 hover:text-[#97f0e5] transition-colors text-sm"
                >
                  Marketplace
                </Link>
              </li>
              <li>
                <Link
                  href="/wallet"
                  className="text-gray-600 hover:text-[#97f0e5] transition-colors text-sm"
                >
                  My Wallet
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-sm font-black uppercase mb-4">Resources</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://www.npmjs.com/package/storewave-sdk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-[#97f0e5] transition-colors text-sm"
                >
                  SDK Documentation
                </a>
              </li>
              <li>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-[#97f0e5] transition-colors text-sm"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href="https://www.walrus.xyz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-[#97f0e5] transition-colors text-sm"
                >
                  About Walrus
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t-2 border-[#97f0e5] flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-600 text-sm">
            © {new Date().getFullYear()} Storewave. Built on Walrus.
          </p>

          <div className="flex items-center gap-4">
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg border-2 border-[#97f0e5]
                         shadow-[2px_2px_0px_0px_rgba(151,240,229,1)]
                         hover:shadow-[1px_1px_0px_0px_rgba(151,240,229,1)]
                         hover:translate-x-[1px] hover:translate-y-[1px]
                         transition-all"
              aria-label="Twitter"
            >
              <Twitter className="w-5 h-5" />
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg border-2 border-[#97f0e5]
                         shadow-[2px_2px_0px_0px_rgba(151,240,229,1)]
                         hover:shadow-[1px_1px_0px_0px_rgba(151,240,229,1)]
                         hover:translate-x-[1px] hover:translate-y-[1px]
                         transition-all"
              aria-label="GitHub"
            >
              <Github className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
