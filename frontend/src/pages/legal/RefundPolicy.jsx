import React from 'react';

export default function RefundPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 animate-fade-in">
      <div className="glass-card p-8 sm:p-12 border border-white/10">
        <h1 className="text-4xl font-black text-white mb-6">Refund & Cancellation Policy</h1>
        <div className="w-16 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full mb-10"></div>
        
        <div className="space-y-8 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-white mb-3">Digital Goods Policy</h2>
            <p>At TezSend LMS, we offer digital educational content including video lectures, notes, quizzes, and flashcards. Due to the digital nature of our products and the immediate access granted upon purchase, all sales are generally considered final.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">Refund Eligibility</h2>
            <ul className="list-disc pl-5 space-y-2 text-gray-400">
              <li><strong className="text-white">Accidental Purchases:</strong> If you accidentally purchase the same course twice, you are eligible for a full refund on the duplicate purchase. Please contact support within 48 hours.</li>
              <li><strong className="text-white">Technical Issues:</strong> If you are unable to access the course material due to a verified technical fault on our end that cannot be resolved within a reasonable timeframe, a refund may be issued.</li>
              <li><strong className="text-white">Strictly Non-Refundable:</strong> If you have accessed/viewed the course materials, watched the videos, or downloaded the notes, the purchase is strictly non-refundable under any circumstances.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">Cancellation Process</h2>
            <p>If you believe you are eligible for a refund based on the criteria above, please reach out to us at <span className="text-indigo-400 font-medium">support@tezsend.com</span> with your transaction ID and registered email address. Our support team will review your request within 5-7 business days.</p>
          </section>

          <p className="text-sm text-gray-500 pt-8 border-t border-white/10">Last updated: August 2026</p>
        </div>
      </div>
    </div>
  );
}
