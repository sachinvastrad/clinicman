"use client";

import { Header } from "@/components/shared/header";

export default function MagicDietPage() {
  return (
    <>
      <Header title="MagicDiet" />
      <div className="flex-1 overflow-hidden">
        <iframe
          src="/diet-app.html"
          title="MagicDiet — AI Diet Chart Generator"
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-modals allow-downloads"
        />
      </div>
    </>
  );
}
