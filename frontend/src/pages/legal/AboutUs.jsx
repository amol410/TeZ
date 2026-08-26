import React from 'react';

export default function AboutUs() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 animate-fade-in">
      <div className="glass-card p-8 sm:p-12 border border-white/10">
        <h1 className="text-4xl font-black text-white mb-6 text-center">About Us</h1>
        <div className="w-16 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 mx-auto rounded-full mb-10"></div>
        
        <div className="space-y-6 text-gray-300 leading-relaxed text-lg">
          <p>
            Welcome to <strong className="text-white">TezSend LMS</strong>, your premier destination for mastering technical and competitive exams. 
          </p>
          <p>
            Originated in <span className="text-white">Pune, Wagholi, Gulmohar Park</span>, we are dedicated to providing high-quality, accessible, and structured educational content. Our platform is built by educators and technologists who understand the rigor required to succeed in today's highly competitive environments.
          </p>
          <p>
            Whether you are preparing for coding interviews, engineering entrances, or government competitive exams, our robust curriculum of video lectures, comprehensive notes, interactive quizzes, and flashcards ensures you have all the tools you need to succeed.
          </p>
          <p>
            At TezSend, we believe in empowering students through technology. Join us, and let's achieve excellence together.
          </p>
        </div>
      </div>
    </div>
  );
}
