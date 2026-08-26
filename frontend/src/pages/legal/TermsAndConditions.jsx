import React from 'react';

export default function TermsAndConditions() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 animate-fade-in">
      <div className="glass-card p-8 sm:p-12 border border-white/10">
        <h1 className="text-4xl font-black text-white mb-6">Terms and Conditions</h1>
        <div className="w-16 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full mb-10"></div>
        
        <div className="space-y-8 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-white mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using TezSend LMS, you agree to be bound by these Terms and Conditions. If you do not agree to all the terms and conditions, then you may not access the website or use any services.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">2. User Accounts</h2>
            <p>You must create an account to purchase and access courses. You are entirely responsible for maintaining the confidentiality of your password and account. You agree to notify TezSend immediately of any unauthorized use of your account.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">3. Intellectual Property</h2>
            <p>All content included on the site, such as text, graphics, logos, videos, and flashcards, is the property of TezSend LMS or its content suppliers and protected by copyright laws. You may not distribute, modify, transmit, reuse, or use the content for public or commercial purposes without written permission.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">4. Payments and Access</h2>
            <p>Course purchases are processed through our secure payment gateways. Once a payment is successful, you will be granted access to the purchased digital goods. TezSend reserves the right to change course prices at any time.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">5. Termination</h2>
            <p>We may terminate or suspend access to our service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.</p>
          </section>

          <p className="text-sm text-gray-500 pt-8 border-t border-white/10">Last updated: August 2026</p>
        </div>
      </div>
    </div>
  );
}
