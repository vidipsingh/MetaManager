"use client";

import React from "react";
import { Excalidraw } from "@excalidraw/excalidraw";

const WhiteboardComponent = () => {
  return (
    <div className="h-screen w-full bg-gray-100 dark:bg-slate-900 p-4">
      <div className="h-full w-full rounded-lg overflow-hidden border border-gray-300 dark:border-gray-700">
        <Excalidraw
          theme="dark"
          initialData={{
            elements: [],
            appState: { viewBackgroundColor: "#1e293b" },
          }}
        />
      </div>
    </div>
  );
};

export default WhiteboardComponent;