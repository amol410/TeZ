import React from 'react';
import { Mail, MapPin } from 'lucide-react';

export default function ContactUs() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 animate-fade-in">
      <div className="glass-card p-8 sm:p-12 border border-white/10 text-center">
        <h1 className="text-4xl font-black text-white mb-6">Contact Us</h1>
        <div className="w-16 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 mx-auto rounded-full mb-10"></div>
        
        <p className="text-gray-300 text-lg mb-10">
          We are here to help! If you have any questions, concerns, or need technical support, please reach out to us using the information below.
        </p>

        <div className="grid sm:grid-cols-2 gap-6">
          <div className="bg-black/20 border border-white/5 p-6 rounded-2xl flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center mb-4">
              <Mail className="w-6 h-6 text-indigo-400" />
            </div>
            <h3 className="text-white font-semibold mb-2">Email & Phone</h3>
            <span className="text-indigo-400 mb-1">
              support@tezsend.com
            </span>
            <span className="text-indigo-400">
              7020914188
            </span>
          </div>

          <div className="bg-black/20 border border-white/5 p-6 rounded-2xl flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-4">
              <MapPin className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-white font-semibold mb-2">Our Office</h3>
            <p className="text-gray-400 text-sm text-center">
              103, 1st floor before<br />
              Gulmohar Park<br />
              Wagholi, Pune<br />
              Maharashtra, India
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
