import { Mail, MapPin } from 'lucide-react'

export default function Contact() {
  return (
    <main className="relative z-10 pt-20">
      <section className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-12">
          <h1 className="text-4xl font-black text-white mb-4" style={{ fontFamily: 'Playfair Display,serif' }}>
            Get In Touch
          </h1>
          <p className="text-white/40">Have questions? We'd love to hear from you.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'Playfair Display,serif' }}>
                Contact Information
              </h2>
              <p className="text-white/60 mb-6">
                Have a question about IndiaStartupMap or want to feature your startup? Reach out and we'll get back to you as soon as possible.
              </p>
            </div>

            <div className="card p-6 space-y-6">
              {/* Email */}
              <div className="flex gap-4">
                <div className="text-blue-400 flex-shrink-0 mt-1">
                  <Mail size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-white mb-1">Email</h3>
                  <a href="mailto:aniketsharma224124@gmail.com" className="text-blue-400 hover:text-blue-300 transition-colors">
                    aniketsharma224124@gmail.com
                  </a>
                  <p className="text-xs text-white/40 mt-2">We typically respond within 24 hours</p>
                </div>
              </div>

              {/* Location */}
              <div className="flex gap-4">
                <div className="text-blue-400 flex-shrink-0 mt-1">
                  <MapPin size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-white mb-1">Location</h3>
                  <p className="text-white/60">India</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <div className="card p-8 space-y-6">
              <div>
                <h3 className="font-bold text-white mb-4 text-lg">Common Questions</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-blue-400 font-semibold mb-2">How do I list my startup?</h4>
                  <p className="text-sm text-white/60">
                    Visit our home page, select your state on the map, choose a plan (Basic, Premium, or Enterprise), and submit your startup details. Pay through Razorpay and your listing goes live instantly.
                  </p>
                </div>

                <div className="border-t border-white/10 pt-4">
                  <h4 className="text-blue-400 font-semibold mb-2">Can I update my listing?</h4>
                  <p className="text-sm text-white/60">
                    Yes, you can reach out to us with update requests. Email us with your listing details and the changes you'd like to make.
                  </p>
                </div>

                <div className="border-t border-white/10 pt-4">
                  <h4 className="text-blue-400 font-semibold mb-2">What payment methods do you accept?</h4>
                  <p className="text-sm text-white/60">
                    We accept all payment methods supported by Razorpay including credit/debit cards, UPI, net banking, and digital wallets.
                  </p>
                </div>

                <div className="border-t border-white/10 pt-4">
                  <h4 className="text-blue-400 font-semibold mb-2">Are there refunds?</h4>
                  <p className="text-sm text-white/60">
                    Listing payments are non-refundable once processed. Please review our Terms of Service for more details.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <div className="card p-8 bg-gradient-to-r from-blue-600/10 to-blue-400/10 border-blue-500/20">
            <h3 className="text-2xl font-bold text-white mb-3" style={{ fontFamily: 'Playfair Display,serif' }}>
              Ready to Join?
            </h3>
            <p className="text-white/60 mb-6 max-w-md mx-auto">
              Get your startup discovered by thousands of visitors every month. List your startup on IndiaStartupMap today.
            </p>
            <a href="/" className="btn-primary">
              List Your Startup
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}
