import React from "react";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import Link from "next/link";
import { ModeToggle } from "../Theme/ModeToggle";

const Header = () => {
  return (
    <>
      <div className="dark:bg-gray-800 dark:bg-opacity-50 text-black bg-white/80 backdrop-blur-lg dark:text-white flex py-2 px-6 border-[1px] dark:border-gray-400 border-black rounded-full items-center mx-6 sm:mx-20 justify-between">
       <Link href="/"> <div className="text-base sm:text-lg hover:cursor-pointer hover:text-black/80 dark:hover:text-gray-300 font-semibold">
          MetaManager
        </div> </Link>

        <div className="flex items-center gap-4">
          {/* <DarkModeOutlinedIcon className="border border-slate-200 h-8 w-9 py-1 rounded-sm cursor-pointer hover:bg-gray-800"/> */}
          <ModeToggle />
          <Link href="/signup">
            <button className="relative h-10 overflow-hidden rounded-lg p-[1px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50 hidden sm:inline-flex">
              <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
              <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-lg bg-slate-950 hover:bg-gray-800 px-3 py-1 text-sm font-medium text-white backdrop-blur-3xl">
                Get Started
              </span>
            </button>
          </Link>
          
        </div>
      </div>
    </>
  );
};

export default Header;
