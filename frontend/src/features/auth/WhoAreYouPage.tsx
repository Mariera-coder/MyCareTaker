import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Bath, BedDouble, Building2, CheckCircle2, KeyRound, LogIn, Mail, MapPin, ReceiptText, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/shared/BrandLogo";

const adminEmail = "marieramichael01@gmail.com";

const exhibits = [
  {
    eyebrow: "Managed Estates",
    title: "Present your estate like a place worth moving into",
    copy:
      "INKAHOME gives owners and caretakers a composed way to show the estate, track houses, and keep daily operations visible.",
    artifact: "estate",
  },
  {
    eyebrow: "Vacant Homes",
    title: "Let available houses feel easy to inspect",
    copy:
      "Vacant units can be organized with the details people ask for first: location, rooms, rent readiness, and current status.",
    artifact: "houses",
  },
  {
    eyebrow: "Property Care",
    title: "Keep maintenance from becoming a guessing game",
    copy:
      "Repairs move from tenant reports to caretaker review and owner approval, with enough context to make decisions quickly.",
    artifact: "complaints",
  },
  {
    eyebrow: "Owner Records",
    title: "See rent and reports without chasing updates",
    copy:
      "Rent confirmations and monthly summaries help owners understand occupancy, payments, and estate activity at a glance.",
    artifact: "reports",
  },
] as const;

type Artifact = (typeof exhibits)[number]["artifact"];

function ArtifactImage({ type }: { type: Artifact }) {
  if (type === "estate") {
    return (
      <div className="grid h-full grid-rows-[1fr_auto] bg-[#f7efe4]">
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,#9db7a8_0%,#e7d5b8_52%,#b9916b_100%)]" />
          <div className="absolute bottom-0 left-[8%] h-[58%] w-[34%] bg-[#efe6d5] shadow-2xl">
            <div className="h-[18%] bg-[#7d4f35]" />
            <div className="grid grid-cols-3 gap-3 p-5">
              {Array.from({ length: 9 }).map((_, index) => (
                <span key={index} className="aspect-square bg-[#8fb3bd]" />
              ))}
            </div>
          </div>
          <div className="absolute bottom-0 left-[42%] h-[72%] w-[42%] bg-[#fff8ec] shadow-2xl">
            <div className="h-[16%] bg-[#355d50]" />
            <div className="grid grid-cols-4 gap-3 p-5">
              {Array.from({ length: 16 }).map((_, index) => (
                <span key={index} className="aspect-[1.2] bg-[#c8dce3]" />
              ))}
            </div>
          </div>
          <div className="absolute bottom-0 h-[22%] w-full bg-[#6f8d6a]" />
          <div className="absolute left-6 top-6 bg-white/88 p-4 shadow-lg">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a5a3c]">Featured Estate</p>
            <p className="mt-2 text-2xl font-semibold text-[#2f2a24]">Sunrise Court</p>
            <p className="mt-1 flex items-center gap-1 text-sm text-[#5f4d3e]">
              <MapPin className="h-4 w-4" />
              Quiet residential block
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 border-t border-[#dfcfb8] bg-white">
          {["24 units", "6 vacant", "3 repairs"].map((item) => (
            <div key={item} className="border-r border-[#eadfcd] px-5 py-4 text-sm font-semibold text-[#2f2a24] last:border-r-0">
              {item}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === "houses") {
    return (
      <div className="h-full bg-[#f8f1e8] p-5">
        <div className="grid h-full grid-cols-3 gap-4">
          {[
            ["House A1", "2 bed", "1 bath", "Ready"],
            ["House B4", "1 bed", "1 bath", "Viewing"],
            ["House C3", "3 bed", "2 bath", "Ready"],
          ].map(([house, beds, baths, status], index) => (
            <div key={house} className="overflow-hidden border border-[#b5ad9a] bg-white shadow-sm">
              <div className={`h-40 ${index === 0 ? "bg-[#b8cfc1]" : index === 1 ? "bg-[#d9bf95]" : "bg-[#b7c9d7]"}`}>
                <div className="flex h-full items-end p-4">
                  <div className="h-16 w-full bg-white/45 backdrop-blur-sm" />
                </div>
              </div>
              <div className="p-4">
                <p className="text-lg font-semibold text-[#2f2a24]">{house}</p>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-[#5f4d3e]">
                  <span className="flex items-center gap-1">
                    <BedDouble className="h-4 w-4" />
                    {beds}
                  </span>
                  <span className="flex items-center gap-1">
                    <Bath className="h-4 w-4" />
                    {baths}
                  </span>
                </div>
                <p className="mt-5 inline-flex items-center gap-1 border border-[#9bbba9] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#2d7d65]">
                  <KeyRound className="h-3.5 w-3.5" />
                  {status}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === "complaints") {
    return (
      <div className="flex h-full items-center bg-[#fff8ed] p-6 text-[#2f2a24]">
        <div className="grid w-full gap-5 md:grid-cols-[0.9fr_1.1fr]">
          <div className="relative min-h-80 overflow-hidden bg-[#d9c0a0]">
            <div className="absolute inset-x-0 bottom-0 h-24 bg-[#8a6b4b]" />
            <div className="absolute bottom-16 left-10 h-44 w-52 bg-[#f7eee0] shadow-xl">
              <div className="h-10 bg-[#456f63]" />
              <div className="grid grid-cols-2 gap-4 p-5">
                <span className="h-16 bg-[#bdd0d6]" />
                <span className="h-16 bg-[#bdd0d6]" />
              </div>
            </div>
            <div className="absolute right-8 top-8 bg-white p-4 shadow-lg">
              <Wrench className="h-7 w-7 text-[#b06d3a]" />
              <p className="mt-3 text-sm font-semibold">Kitchen leak</p>
            </div>
          </div>
          <div className="space-y-4">
          {[
            ["Tenant submits", "Leaking kitchen pipe"],
            ["Caretaker reviews", "Photo and estimate attached"],
            ["Owner approves", "Repair marked ready"],
          ].map(([label, text], index) => (
            <div key={label} className="flex items-center gap-4">
              <span className="flex h-11 w-11 items-center justify-center border border-[#c8b799] bg-white">
                {index + 1}
              </span>
              <div className="flex-1 border border-[#dac7a8] bg-white p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#87633d]">{label}</p>
                <p className="mt-1 text-sm">{text}</p>
              </div>
              {index === 2 ? <CheckCircle2 className="h-7 w-7 text-[#59c28a]" /> : null}
            </div>
          ))}
          </div>
        </div>
      </div>
    );
  }

  return (
      <div className="h-full bg-[#f7efe4] p-6">
      <div className="grid h-full grid-cols-[0.95fr_1.05fr] overflow-hidden border border-[#c7b490] bg-white">
        <div className="relative bg-[#c8d9cf]">
          <div className="absolute inset-x-0 bottom-0 h-24 bg-[#6f8d6a]" />
          <div className="absolute bottom-20 left-8 h-48 w-52 bg-[#fff8ec] shadow-xl">
            <div className="h-10 bg-[#7d4f35]" />
            <div className="p-5">
              <div className="h-20 bg-[#bed1d8]" />
              <div className="mt-4 h-10 bg-[#e5d0aa]" />
            </div>
          </div>
        </div>
        <div className="p-5">
        <div className="flex items-start justify-between border-b border-[#eadfcd] pb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[#876f4c]">Monthly Report</p>
            <p className="mt-2 text-2xl font-semibold text-[#2f2a24]">May Summary</p>
          </div>
          <ReceiptText className="h-8 w-8 text-[#2d7d65]" />
        </div>
        <div className="mt-5 grid grid-cols-3 gap-3">
          {["Paid", "Pending", "Repairs"].map((label, index) => (
            <div key={label} className="border border-[#eadfcd] p-3">
              <p className="text-2xl font-semibold text-[#2f2a24]">{[42, 6, 3][index]}</p>
              <p className="mt-1 text-xs text-[#746555]">{label}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 space-y-3">
          <span className="block h-3 w-full bg-[#e6f0ea]" />
          <span className="block h-3 w-4/5 bg-[#f4e2c4]" />
          <span className="block h-3 w-2/3 bg-[#dce8f2]" />
        </div>
        </div>
      </div>
    </div>
  );
}

export function WhoAreYouPage() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const scrollToExhibit = (index: number) => {
    const nextIndex = Math.max(0, Math.min(exhibits.length - 1, index));
    const scroller = scrollerRef.current;
    if (!scroller) {
      return;
    }

    scroller.scrollTo({ left: scroller.clientWidth * nextIndex, behavior: "smooth" });
    setActiveIndex(nextIndex);
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#f6f4ef] text-black">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#ffffff_0%,#f1eee8_100%)]" aria-hidden="true" />
      <div className="absolute inset-x-0 top-0 h-1 bg-[#2f2a24]" aria-hidden="true" />

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="flex items-center justify-between px-5 py-4 md:px-10">
          <Link to="/" aria-label="INKAHOME home">
            <BrandLogo markClassName="h-9 w-9" textClassName="text-sm md:text-base" />
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" className="h-10 border-[#9b9488] bg-white text-black hover:bg-[#f8f7f4]">
              <a href={`mailto:${adminEmail}`}>
                <Mail className="mr-2 h-4 w-4" />
                Admin help
              </a>
            </Button>
            <Button asChild className="h-10 bg-black text-white hover:bg-[#2f2f2f]">
              <Link to="/login">
                <LogIn className="mr-2 h-4 w-4" />
                Sign in
              </Link>
            </Button>
          </div>
        </header>

        <section
          ref={scrollerRef}
          className="flex flex-1 snap-x snap-mandatory overflow-x-auto scroll-smooth"
          onScroll={(event) => {
            const nextIndex = Math.round(event.currentTarget.scrollLeft / event.currentTarget.clientWidth);
            setActiveIndex(nextIndex);
          }}
          onWheel={(event) => {
            if (!scrollerRef.current || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) {
              return;
            }

            event.preventDefault();
            scrollerRef.current.scrollLeft += event.deltaY;
          }}
        >
          {exhibits.map((exhibit, index) => (
            <article key={exhibit.title} className="grid min-w-full snap-start content-center gap-8 px-5 pb-28 pt-6 md:grid-cols-[1.35fr_0.95fr] md:px-14 lg:px-24">
              <div className="mx-auto w-full max-w-3xl">
                <div className="h-[350px] overflow-hidden border border-[#6e5845] bg-white shadow-[0_24px_50px_rgba(54,37,22,0.24)] md:h-[430px]">
                  <ArtifactImage type={exhibit.artifact} />
                </div>
              </div>

              <div className="mx-auto flex w-full max-w-md items-center">
                <div className="border border-[#b9b3aa] bg-white p-6 shadow-[0_18px_45px_rgba(15,15,15,0.08)] md:p-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#5f564d]">{exhibit.eyebrow}</p>
                  <h1 className="mt-4 text-3xl font-semibold leading-tight text-black md:text-4xl">{exhibit.title}</h1>
                  <p className="mt-5 text-base leading-7 text-[#1f1f1f]">{exhibit.copy}</p>
                  {index === exhibits.length - 1 ? (
                    <div className="mt-7 grid gap-3">
                      <Button asChild className="h-11 bg-black text-white hover:bg-[#2f2f2f]">
                        <Link to="/register?role=OWNER">
                          <Building2 className="mr-2 h-4 w-4" />
                          Register estate
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="h-11 border-[#9b9488] bg-white text-black hover:bg-[#f8f7f4]">
                        <a href={`mailto:${adminEmail}`}>Request administrator assistance</a>
                      </Button>
                    </div>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </section>

        <footer className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-between gap-4 px-5 py-5 md:px-10">
          <div className="flex items-center gap-2">
            {exhibits.map((exhibit, index) => (
              <button
                key={exhibit.eyebrow}
                type="button"
                aria-label={`Go to ${exhibit.eyebrow}`}
                className={`h-2.5 rounded-full transition-all ${activeIndex === index ? "w-9 bg-black" : "w-2.5 bg-[#918a80]"}`}
                onClick={() => scrollToExhibit(index)}
              />
            ))}
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="h-11 border-[#9b9488] bg-white text-black hover:bg-[#f8f7f4]"
              onClick={() => scrollToExhibit(activeIndex - 1)}
              disabled={activeIndex === 0}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Prev
            </Button>
            <Button
              type="button"
              className="h-11 bg-black text-white hover:bg-[#2f2f2f]"
              onClick={() => scrollToExhibit(activeIndex + 1)}
              disabled={activeIndex === exhibits.length - 1}
            >
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </footer>
      </div>
    </main>
  );
}
