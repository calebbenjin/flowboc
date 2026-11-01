import React from "react";
import { Check } from "lucide-react";

const benefits = [
  "A page that feels like you",
  "Students book without an account",
  "Your business, brought together",
];

const Benefits = () => {
  return (
    <div className="mx-auto lg:mt-16 mt-20 flex w-full flex-wrap justify-center gap-6 border border-[#e9e2dc] bg-[#f6f3eb] px-6 py-5 text-xs sm:gap-16 sm:text-sm">
      {benefits.map((b) => (
        <span key={b} className="flex items-center gap-2 text-[#272334]">
          <Check className="size-3.5 rounded-full bg-[#e5e9d9] p-0.5 text-[#6e8060]" />
          {b}
        </span>
      ))}
    </div>
  );
};

export default Benefits;
