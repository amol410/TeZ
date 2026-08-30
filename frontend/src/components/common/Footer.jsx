import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-black/40 border-t border-white/5 pt-12 pb-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-xl font-black text-white mb-4">TezSend LMS</h3>
            <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
              Empowering students with structured courses, videos, quizzes, and flashcards to succeed in technical and competitive exams.
            </p>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/about" className="hover:text-indigo-400 transition-colors">About Us</Link></li>
              <li><Link to="/terms" className="hover:text-indigo-400 transition-colors">Terms & Conditions</Link></li>
              <li><Link to="/privacy" className="hover:text-indigo-400 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/refund-policy" className="hover:text-indigo-400 transition-colors">Refund Policy</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/contact" className="hover:text-indigo-400 transition-colors">Contact Us</Link></li>
              <li><span className="text-gray-400">support@tezsend.com</span></li>
              <li><span className="text-gray-400">7020914188</span></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} TezSend LMS. All rights reserved.<br />
          103, 1st floor before Gulmohar Park, Wagholi, Pune, Maharashtra
        </div>
      </div>
    </footer>
  );
}
