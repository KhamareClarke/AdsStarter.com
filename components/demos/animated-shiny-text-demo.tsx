'use client'
import { cn } from "@/lib/utils";
import AnimatedShinyText from "../magicui/animated-shiny-text";
import { FcGoogle } from "react-icons/fc";

export function AnimatedShinyTextDemo() {
  return (
    <div className="z-10 flex items-center justify-center">
      <div
        className={cn(
          "group rounded-full text-base bg-[#232c3b] px-4 py-2 shadow transition-all ease-in",
        )}
      >
        <AnimatedShinyText className="flex items-center gap-x-2 text-white text-sm font-semibold tracking-wide transition ease-out hover:text-neutral-300 hover:duration-300">
          <span className="text-yellow-400 text-xl">⭐️⭐️⭐️⭐️⭐️</span>
          <div className="flex items-center space-x-2">
            <FcGoogle className="h-6 w-6" />
            <span>4.9/5 — 200+ Google Reviews</span>
          </div>
        </AnimatedShinyText>
      </div>
    </div>
  );
}
