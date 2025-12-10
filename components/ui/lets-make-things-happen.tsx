import React from "react";
import Image from "next/image";

export default function LetsMakeThingsHappenSection() {
  return (
    <div className="rounded-2xl bg-[#181C22] px-6 py-16 md:py-24 shadow-xl border border-[#232c3b] flex flex-col items-center text-center">
      <h2 className="text-4xl md:text-6xl font-extrabold gradient-text mb-6 drop-shadow-lg">Let&apos;s make things happen</h2>
      <p className="text-lg md:text-2xl text-white/80 mb-10 max-w-2xl font-medium">
        Contact us today to learn more about how our digital marketing services can help your business grow and succeed online.
      </p>
      <a href="https://calendly.com/khamareclarke/new-meeting" target="_blank" rel="noopener noreferrer" className="py-4 px-10 md:text-xl font-bold rounded-[8px] shadow-lg bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-700 text-white border-0 hover:scale-105 hover:from-blue-700 hover:to-blue-500 transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400">
        Book a Call
      </a>
          </div>
  );
}
