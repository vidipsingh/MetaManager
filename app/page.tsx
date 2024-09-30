import Header from "@/components/Home/Header";
import Hero from "@/components/Home/Hero";

export default function Home() {
  return (
    <div className="h-screen w-full pt-5 bg-slate-950">
      <Header />

      <div>
        <Hero />
      </div>
    </div>
  );
}
