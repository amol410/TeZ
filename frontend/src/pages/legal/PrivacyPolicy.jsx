import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 animate-fade-in">
      <div className="glass-card p-8 sm:p-12 border border-white/10">
        <h1 className="text-4xl font-black text-white mb-6">Privacy Policy</h1>
        <div className="w-16 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full mb-10"></div>
        
        <div className="space-y-8 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-white mb-3">1. Information We Collect</h2>
            <p>When you register for an account, we collect personal information such as your name, email address, and password. When making a purchase, payment information is securely processed by our third-party payment gateways; we do not store your raw credit card data on our servers.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">2. How We Use Your Information</h2>
            <p>We use the information we collect to provide, maintain, and improve our services. This includes authenticating your identity, processing transactions, tracking your course progress, and sending you important platform updates.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">3. Data Security</h2>
            <p>We implement a variety of security measures to maintain the safety of your personal information. Your personal information is contained behind secured networks and is only accessible by a limited number of persons who have special access rights to such systems.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">4. Third-Party Disclosure</h2>
            <p>We do not sell, trade, or otherwise transfer to outside parties your Personally Identifiable Information unless we provide users with advance notice. This does not include website hosting partners and other parties who assist us in operating our website or serving our users.</p>
          </section>

          <p className="text-sm text-gray-500 pt-8 border-t border-white/10">Last updated: August 2026</p>
        </div>
      </div>
    </div>
  );
}
