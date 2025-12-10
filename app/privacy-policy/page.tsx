import Link from "next/link";
import Image from "next/image";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#181C22] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-[#121212] shadow-xl border-b border-[#232323]">
        <div className="flex items-center justify-between px-4 md:px-10 py-4 max-w-[1600px] mx-auto">
          <Link href="/" className="flex items-center gap-x-3 group">
            <Image src="/logo/logo.svg" alt="AdsStarter Logo" width={48} height={48} className="drop-shadow-lg" />
            <span className="text-2xl md:text-3xl font-extrabold gradient-text tracking-tight group-hover:scale-105 transition-transform duration-200">AdsStarter</span>
          </Link>
          <nav className="hidden md:flex gap-x-8 items-center text-white font-semibold text-lg">
            <Link href="/" className="hover:gradient-text transition-colors text-white">Home</Link>
            <a href="https://calendly.com/khamareclarke/new-meeting" target="_blank" rel="noopener noreferrer" className="hover:gradient-text transition-colors text-white">Book a Call</a>
            <Link href="/#process" className="hover:gradient-text transition-colors text-white">Our Process</Link>
            <Link href="/#guarentees" className="hover:gradient-text transition-colors text-white">Guarantees</Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-20 flex flex-col items-center">
        <h1 className="text-3xl md:text-5xl font-extrabold gradient-text mb-8">Privacy Policy</h1>
        <div className="w-full max-w-2xl bg-[#232c3b] rounded-xl shadow-lg p-8 flex flex-col gap-4 text-white/90 text-base md:text-lg">
          <p><strong>Effective Date:</strong> September 14, 2025</p>
          <p>AdsStarter is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our website and services.</p>
          <h2 className="font-bold text-lg mt-4 mb-2 gradient-text">Information We Collect</h2>
          <ul className="list-disc list-inside mb-2">
            <li>Personal Information (name, email, phone) you provide via forms or bookings.</li>
            <li>Usage data (pages visited, actions taken) via analytics tools.</li>
          </ul>
          <h2 className="font-bold text-lg mt-4 mb-2 gradient-text">How We Use Your Information</h2>
          <ul className="list-disc list-inside mb-2">
            <li>To provide and improve our services</li>
            <li>To communicate with you about your inquiries and bookings</li>
            <li>To analyze website usage and improve user experience</li>
          </ul>
          <h2 className="font-bold text-lg mt-4 mb-2 gradient-text">How We Protect Your Data</h2>
          <p>Your data is stored securely and we do not sell your information to third parties.</p>
          <h2 className="font-bold text-lg mt-4 mb-2 gradient-text">Your Rights</h2>
          <p>You may request to access, update, or delete your personal information at any time by contacting us at admin@adsstarter.com.</p>
          <h2 className="font-bold text-lg mt-4 mb-2 gradient-text">Contact Us</h2>
          <p>If you have any questions, please email <a href="mailto:admin@adsstarter.com" className="text-blue-400 underline">admin@adsstarter.com</a>.</p>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#181C22] py-16 px-6 md:px-12 border-t-0 mt-0">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row md:justify-between md:items-start gap-12 md:gap-20">
          <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left gap-4">
            <div className="flex items-center gap-3 mb-3">
              <Image src="/logo/logo.svg" width={48} height={48} alt="AdsStarter Logo" className="drop-shadow-lg" />
              <span className="text-2xl md:text-3xl font-extrabold gradient-text tracking-tight">AdsStarter</span>
            </div>
            <p className="text-white/80 text-base md:text-lg">519-200-5000</p>
            <p className="text-white/80 text-base md:text-lg">admin@adsstarter.com</p>
          </div>
          <div className="flex-1 flex flex-col items-center md:items-start gap-2">
            <span className="font-bold text-white/80 mb-2">Navigation</span>
            <Link href="/" className="text-blue-400 hover:underline">Home</Link>
            <a href="https://calendly.com/khamareclarke/new-meeting" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Book a Call</a>
            <Link href="/#process" className="text-blue-400 hover:underline">Our Process</Link>
            <Link href="/#guarentees" className="text-blue-400 hover:underline">Guarantees</Link>
          </div>
          <div className="flex-1 flex flex-col items-center md:items-start gap-3">
            <span className="font-bold text-white/80 mb-2">Stay in the loop</span>
            <form className="flex w-full max-w-xs">
              <input type="email" placeholder="Your email" className="flex-1 px-3 py-2 rounded-l bg-[#232c3b] text-white placeholder:text-white/50 focus:outline-none" />
              <button type="submit" className="px-4 py-2 rounded-r bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-bold hover:from-blue-700 hover:to-cyan-600 transition-all">Subscribe</button>
            </form>
            <span className="text-xs text-white/50 mt-1">No spam. Unsubscribe anytime.</span>
          </div>
          <div className="flex-1 flex flex-col items-center md:items-end gap-4"></div>
        </div>
        <div className="flex justify-center gap-8 mb-6">
          <a href="https://facebook.com" target="_blank" rel="noopener" className="hover:scale-110 transition-transform">
            <svg className="w-7 h-7 text-blue-500 fill-current" viewBox="0 0 24 24"><path d="M22.675 0h-21.35C.597 0 0 .597 0 1.326v21.348C0 23.403.597 24 1.326 24H12.82v-9.294H9.692v-3.622h3.127V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.797.143v3.24l-1.918.001c-1.504 0-1.797.715-1.797 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116C23.403 24 24 23.403 24 22.674V1.326C24 .597 23.403 0 22.675 0"/></svg>
          </a>
          <a href="https://instagram.com" target="_blank" rel="noopener" className="hover:scale-110 transition-transform">
            <svg className="w-7 h-7 text-blue-500 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.334 3.608 1.308.974.974 1.246 2.241 1.308 3.608.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.334 2.633-1.308 3.608-.974.974-2.241 1.246-3.608 1.308-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.334-3.608-1.308-.974-.974-1.246-2.241-1.308-3.608C2.175 15.647 2.163 15.267 2.163 12s.012-3.584.07-4.85c.062-1.366.334-2.633 1.308-3.608.974-.974 2.241-1.246 3.608-1.308C8.416 2.175 8.796 2.163 12 2.163zm0-2.163C8.741 0 8.332.013 7.052.072 5.775.131 4.602.433 3.635 1.4c-.967.967-1.269 2.14-1.328 3.417C2.013 8.332 2 8.741 2 12c0 3.259.013 3.668.072 4.948.059 1.277.361 2.45 1.328 3.417.967.967 2.14 1.269 3.417 1.328C8.332 23.987 8.741 24 12 24s3.668-.013 4.948-.072c1.277-.059 2.45-.361 3.417-1.328.967-.967 1.269-2.14 1.328-3.417.059-1.28.072-1.689.072-4.948 0-3.259-.013-3.668-.072-4.948-.059-1.277-.361-2.45-1.328-3.417-.967-.967-2.14-1.269-3.417-1.328C15.668.013 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zm0 10.162a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
          </a>
          <a href="https://tiktok.com" target="_blank" rel="noopener" className="hover:scale-110 transition-transform">
            <svg className="w-7 h-7 text-blue-500 fill-current" viewBox="0 0 48 48"><path d="M41.3 17.4c.1.8.1 1.5.1 2.3 0 9.5-7.2 20.5-20.5 20.5-4.1 0-7.9-1.2-11.1-3.3.6.1 1.2.2 1.9.2 3.4 0 6.5-1.2 9-3.2-3.2-.1-5.8-2.1-6.7-5 .4.1.8.2 1.2.2.6 0 1.3-.1 1.9-.3-3.3-.7-5.7-3.5-5.7-6.9v-.1c1 .6 2.1 1 3.3 1.1-2-1.3-3.3-3.5-3.3-6.1 0-1.3.3-2.5.9-3.5 3.5 4.3 8.8 7.1 14.7 7.4-.1-.5-.2-1-.2-1.5 0-3.8 3.1-6.9 6.9-6.9 2 0 3.7.8 5 2.1 1.6-.3 3.1-.9 4.5-1.7-.5 1.6-1.6 2.9-3.1 3.7 1.4-.2 2.7-.5 3.9-1.1-1 1.4-2.1 2.7-3.5 3.7z"/></svg>
          </a>
          <a href="https://linkedin.com" target="_blank" rel="noopener" className="hover:scale-110 transition-transform">
            <svg className="w-7 h-7 text-blue-500 fill-current" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.761 0 5-2.239 5-5v-14c0-2.761-2.239-5-5-5zm-8.5 19h-3v-8h3v8zm-1.5-9.268c-.966 0-1.75-.784-1.75-1.75s.784-1.75 1.75-1.75 1.75.784 1.75 1.75-.784 1.75-1.75 1.75zm13.5 9.268h-3v-4.604c0-1.099-.021-2.513-1.532-2.513-1.534 0-1.768 1.197-1.768 2.434v4.683h-3v-8h2.881v1.093h.041c.401-.762 1.379-1.562 2.84-1.562 3.036 0 3.6 2 3.6 4.591v5.878z"/></svg>
          </a>
        </div>
        <div className="border-t border-[#232c3b] pt-8 mt-12">
          <div className="flex flex-wrap justify-center gap-x-10 gap-y-2 mb-3">
            <Link href="/privacy-policy" className="text-blue-400 hover:underline text-sm transition-link">Privacy Policy</Link>
            <span className="text-white/40">|</span>
            <Link href="/sitemap" className="text-blue-400 hover:underline text-sm transition-link">Sitemap</Link>
            <span className="text-white/40">|</span>
            <Link href="/" className="text-blue-400 hover:underline text-sm transition-link">Terms</Link>
          </div>
          <div className="text-center text-white/60 text-xs">
            &copy; 2025 <span className="gradient-text font-bold">AdsStarter</span>. All Rights Reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
