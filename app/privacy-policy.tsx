export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#181C22] px-4 py-20 flex flex-col items-center">
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
  );
}
