import Header from "@/components/Home/Header";
import Hero from "@/components/Home/Hero";

const Home = () => {
  return (
    <div className="w-full min-h-screen relative">
      <div className="w-full dark:bg-slate-950 bg-white dark:bg-grid-white/[0.2] bg-grid-black/[0.2] pt-5">
        <div className="absolute pointer-events-none inset-0">
          <div className="absolute left-0 top-0 w-80 h-full bg-gradient-to-r from-white/50 to-transparent dark:from-slate-950/50"></div>
          <div className="absolute right-0 top-0 w-80 h-full bg-gradient-to-l from-white/50 to-transparent dark:from-slate-950/50"></div>
        </div>
        <Header />
        <div>
          <Hero />
        </div>
      </div>
    </div>
  );
};

export default Home;