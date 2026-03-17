export default function Privacy() {
  return (
    <main className="relative z-10 pt-20">
      <section className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-12">
          <h1 className="text-4xl font-black text-white mb-4" style={{ fontFamily: 'Playfair Display,serif' }}>
            Privacy Policy
          </h1>
          <p className="text-white/40">Last updated: February 2025</p>
        </div>

        <div className="space-y-8 text-white/70">
          <div>
            <h2 className="text-xl font-bold text-white mb-3">1. Introduction</h2>
            <p>IndiaStartupMap ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services.</p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-3">2. Information We Collect</h2>
            <p className="mb-3">We may collect information about you in a variety of ways:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li><strong>Personal Information:</strong> Name, email address, phone number, company details, and startup information you voluntarily provide through our listing form.</li>
              <li><strong>Automated Information:</strong> Browser type, IP address, pages visited, and time spent on our website.</li>
              <li><strong>Payment Information:</strong> Processed securely through Razorpay. We do not store full credit card details.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-3">3. How We Use Your Information</h2>
            <p className="mb-3">We use the information we collect to:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Create and manage your startup listing</li>
              <li>Process payments and generate invoices</li>
              <li>Send service-related updates and communications</li>
              <li>Improve our website and services</li>
              <li>Comply with legal obligations</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-3">4. Data Security</h2>
            <p>We implement appropriate security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet is 100% secure.</p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-3">5. Third-Party Services</h2>
            <p className="mb-3">We use third-party services including:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li><strong>Supabase:</strong> For database and authentication services</li>
              <li><strong>Razorpay:</strong> For payment processing</li>
            </ul>
            <p className="mt-3">These third parties have their own privacy policies and practices.</p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-3">6. Your Privacy Rights</h2>
            <p className="mb-3">Depending on your location, you may have rights including:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Access to your personal information</li>
              <li>Correction of inaccurate data</li>
              <li>Deletion of your information</li>
              <li>Opt-out of marketing communications</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-3">7. Contact Us</h2>
            <p>If you have questions about this Privacy Policy, please contact us at:</p>
            <p className="mt-2 text-blue-400">aniketsharma224124@gmail.com</p>
          </div>
        </div>
      </section>
    </main>
  )
}
