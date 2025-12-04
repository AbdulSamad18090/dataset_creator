import { Suspense } from "react";
import { DatasetManager } from "@/components/DatasetManager";

export default function Home() {
  return (
    <main className="h-screen w-screen overflow-hidden">
      <Suspense fallback={<div className="flex h-full items-center justify-center">Loading...</div>}>
        <DatasetManager />
      </Suspense>
    </main>
  );
}
