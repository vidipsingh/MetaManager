import Header from "@/components/Home/Header";
import Hero from "@/components/Home/Hero";

export default function Home() {
  return (
    <div className="w-full h-[1020px] pt-5 bg-slate-950">
      <Header />
      <div>
        <Hero />
      </div>
    </div>
  );
}
