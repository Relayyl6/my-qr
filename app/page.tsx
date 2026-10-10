import { prisma } from '@/lib/prisma';
import LinkForm from '@/components/LinkForm';
import LinkList from '@/components/LinkList';
import { ArrowUpRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const links = await prisma.qrLink.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="bg-[#F7F7F5] min-h-screen pb-20">
      
      {/* Hero Section */}
      <div className="p-3 md:p-6 h-[95vh] min-h-[700px]">
        <div className="relative w-full h-full rounded-[2.5rem] overflow-hidden bg-gray-900 shadow-xl">
          {/* Background Image - Architectural */}
          <img 
            src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2560&auto=format&fit=crop" 
            alt="Minimalist Architecture" 
            className="absolute inset-0 w-full h-full object-cover opacity-80"
          />
          
          {/* Top Nav Overlay */}
          <nav className="absolute top-0 left-0 right-0 p-6 md:px-12 flex justify-between items-center z-10 text-white">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 flex flex-wrap gap-0.5">
                {/* 4 leaf clover logo approximation */}
                <div className="w-2.5 h-2.5 bg-white/90 rounded-tl-full"></div>
                <div className="w-2.5 h-2.5 bg-white/90 rounded-tr-full"></div>
                <div className="w-2.5 h-2.5 bg-white/90 rounded-bl-full"></div>
                <div className="w-2.5 h-2.5 bg-white/90 rounded-br-full"></div>
              </div>
              <span className="font-semibold text-lg tracking-tight">DynamicQR</span>
            </div>
            <div className="hidden md:flex items-center gap-8 text-sm font-medium bg-black/30 backdrop-blur-md px-6 py-3 rounded-full border border-white/10">
              <a href="#dashboard" className="hover:text-white/80 transition-colors">Product</a>
              <a href="#platform" className="hover:text-white/80 transition-colors">Platform</a>
              <a href="#customers" className="hover:text-white/80 transition-colors">Customers</a>
              <a href="#company" className="hover:text-white/80 transition-colors">Company</a>
            </div>
            <a href="#dashboard" className="bg-white text-black px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-gray-100 transition-colors">
              Login
            </a>
          </nav>

          {/* Center Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-10 px-4 mt-8">
            <h1 className="text-5xl md:text-7xl font-medium text-white tracking-tight leading-[1.05] max-w-3xl">
              Meet DynamicQR.<br/>
              <span className="font-serif italic font-normal text-white/95">Redefine links</span> with<br/>
              intelligent routing
            </h1>
            <a href="#dashboard" className="mt-12 bg-white text-black px-8 py-4 rounded-full text-base font-semibold hover:scale-105 transition-transform shadow-xl shadow-black/20 flex items-center gap-2">
              Start generating for free
            </a>
          </div>

          {/* Bottom Blur / Glass overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-[#BBAFA3]/95 via-[#BBAFA3]/60 to-transparent backdrop-blur-[4px]"></div>

          {/* Bottom Content */}
          <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 flex flex-col md:flex-row justify-between items-end z-20">
            <p className="text-white text-sm md:text-base max-w-md font-medium leading-relaxed drop-shadow-sm">
              It helps you create, manage, and track physical QR codes through dynamic routing.
              From printing to updating destinations, it adapts to your needs.
            </p>
            
            <div className="flex flex-col gap-3 mt-6 md:mt-0 w-full md:w-auto">
              <a href="#dashboard" className="px-6 py-3.5 rounded-full border border-white/30 bg-black/20 backdrop-blur-md text-white text-sm font-medium text-left flex items-center justify-between min-w-[280px] hover:bg-white/10 transition-colors">
                Solutions for print
              </a>
              <div className="flex gap-2">
                <a href="#dashboard" className="w-[52px] h-[52px] rounded-full border border-white/30 bg-black/20 backdrop-blur-md text-white flex items-center justify-center hover:bg-white/10 transition-colors shrink-0">
                  <ArrowUpRight className="w-5 h-5" />
                </a>
                <a href="#dashboard" className="flex-1 px-6 py-3.5 rounded-full border border-white/30 bg-black/20 backdrop-blur-md text-white text-sm font-medium flex items-center hover:bg-white/10 transition-colors">
                  Analytics & Tracking
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="platform" className="max-w-[1400px] mx-auto px-4 md:px-6 py-24 md:py-32">
        <h2 className="text-4xl md:text-5xl text-center mb-16 tracking-tight font-medium text-gray-900">
          <span className="font-serif italic font-normal">Craft experiences</span> your<br/>
          scanners will remember
        </h2>

        <div className="grid md:grid-cols-3 gap-6 h-auto md:h-[550px]">
          {/* Card 1 */}
          <div className="relative rounded-[2rem] overflow-hidden bg-gray-200 group p-6 flex flex-col justify-end min-h-[450px]">
            <img 
              src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop" 
              alt="Abstract"
              className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700"
            />
            {/* Glassmorphic UI Elements simulating UI */}
            <div className="absolute inset-0 p-8 flex flex-col gap-4 z-10 opacity-90">
               <div className="w-[85%] h-14 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center px-4 gap-4">
                 <div className="w-8 h-8 rounded-full bg-white/40"></div>
                 <div className="w-24 h-2.5 bg-white/40 rounded-full"></div>
               </div>
               <div className="w-full h-14 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center px-4 gap-4">
                 <div className="w-8 h-8 rounded-full bg-white/40"></div>
                 <div className="w-32 h-2.5 bg-white/40 rounded-full"></div>
               </div>
               
               <div className="mt-auto mb-28 w-[90%] h-14 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center px-4 gap-4">
                 <div className="w-8 h-8 rounded-full bg-white/40"></div>
                 <div className="w-20 h-2.5 bg-white/40 rounded-full"></div>
               </div>
            </div>

            <div className="relative z-20 bg-white/20 backdrop-blur-2xl border border-white/30 p-6 rounded-[1.5rem] text-white">
               <div className="flex items-center gap-4 mb-2">
                  <div className="w-8 h-8 flex flex-wrap gap-0.5 opacity-90 shrink-0">
                    <div className="w-[14px] h-[14px] bg-white rounded-tl-full"></div>
                    <div className="w-[14px] h-[14px] bg-white rounded-tr-full"></div>
                    <div className="w-[14px] h-[14px] bg-white rounded-bl-full"></div>
                    <div className="w-[14px] h-[14px] bg-white rounded-br-full"></div>
                  </div>
                  <h3 className="font-medium text-xl leading-tight">High-Res Vector Design</h3>
               </div>
               <p className="text-[10px] text-white/70 uppercase tracking-widest ml-12 font-medium">DYNAMICQR CHOICE</p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="rounded-[2rem] bg-[#111111] p-8 flex flex-col text-white min-h-[450px]">
            <div className="flex-1 flex flex-col gap-5 pt-8">
               <div className="self-end bg-[#222222] border border-white/5 p-4 rounded-2xl rounded-tr-sm w-4/5">
                 <div className="w-8 h-8 rounded-lg bg-white/10 mb-4"></div>
                 <div className="w-3/4 h-2 bg-white/20 rounded-full mb-3"></div>
                 <div className="w-1/2 h-2 bg-white/10 rounded-full"></div>
               </div>
               <div className="self-start bg-[#9F968A] text-[#111] p-4 rounded-2xl rounded-tl-sm w-[85%] flex gap-3">
                 <div className="w-8 h-8 rounded-full bg-black/20 shrink-0 overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100&auto=format&fit=crop" alt="Avatar" className="w-full h-full object-cover mix-blend-multiply opacity-80" />
                 </div>
                 <div>
                   <p className="font-semibold text-[13px] mb-1">User</p>
                   <p className="text-sm opacity-90 leading-[1.4] font-medium">My link destination changed, how do I update the QR code without reprinting?</p>
                 </div>
               </div>
            </div>
            <div className="mt-10 flex justify-between items-end pb-2">
               <h3 className="text-2xl md:text-3xl font-medium leading-[1.1] tracking-tight text-white/95">Engage and<br/>delight customers</h3>
               <div className="flex gap-1.5 bg-white/10 p-1.5 rounded-full">
                 <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-medium">01</div>
                 <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs text-white/40 font-medium">2</div>
                 <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs text-white/40 font-medium">3</div>
               </div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="rounded-[2rem] bg-[#A49A8E] p-8 flex flex-col text-[#111] min-h-[450px]">
             <h3 className="text-3xl font-medium leading-[1.1] mb-5 tracking-tight text-white">Its completely<br/>adaptable.</h3>
             <p className="text-white/80 text-[15px] leading-relaxed mb-8 font-medium max-w-[90%]">
               Customize destinations to fit your campaign needs—whether you want modern routing, simple redirects, or bold tracking.
             </p>

             <div className="space-y-3 mt-auto">
               <div className="bg-white/95 text-black px-6 py-4 rounded-2xl flex justify-between items-center shadow-lg shadow-black/5 font-medium text-lg">
                 Link preference
                 <span className="text-2xl font-light text-gray-400">+</span>
               </div>
               <div className="bg-black/10 backdrop-blur-md px-6 py-4 rounded-2xl flex justify-between items-center text-white/90 font-medium text-lg border border-white/10">
                 Routing rules
                 <span className="text-2xl font-light opacity-50">+</span>
               </div>
               <div className="bg-black/5 px-6 py-4 rounded-2xl flex justify-between items-center text-white/50 font-medium text-lg">
                 Analytics setup
               </div>
             </div>
          </div>
        </div>
      </div>

      {/* The Dashboard / Generator Section */}
      <div id="dashboard" className="max-w-[1400px] mx-auto px-4 md:px-6 py-24 scroll-mt-6">
        <div className="mb-12 text-center md:text-left pl-2">
           <h2 className="text-4xl font-medium tracking-tight text-gray-900 mb-3">Your Workspace</h2>
           <p className="text-gray-500 text-lg">Create, manage, and track your dynamic QR codes.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
          <section className="h-fit rounded-[2rem] border border-gray-200/60 bg-white p-8 shadow-sm">
            <h2 className="mb-8 text-2xl font-medium tracking-tight">Create New Link</h2>
            <LinkForm />
          </section>

          <section className="rounded-[2rem] border border-gray-200/60 bg-white p-8 shadow-sm min-h-[500px]">
            <h2 className="mb-8 text-2xl font-medium tracking-tight">Active Links <span className="text-gray-400 ml-2">({links.length})</span></h2>
            <LinkList links={links} />
          </section>
        </div>
      </div>
    </div>
  );
}
