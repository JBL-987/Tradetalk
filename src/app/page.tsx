"use client";
import { useState, useLayoutEffect, useRef } from "react";
import Spline from '@splinetool/react-spline';
import gsap from 'gsap';
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

gsap.registerPlugin(ScrollTrigger);

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false);
  const splineRef = useRef(null);
  const containerRef = useRef(null);
  const headerRef = useRef(null);
  const headerContentRef = useRef(null);
  
  // Mengoptimalkan useLayoutEffect dengan cleanup yang lebih baik
  useLayoutEffect(() => {
    if (!isLoaded) return;
    
    let scrollTriggers = [];
    const ctx = gsap.context(() => {
      // Hero section animation
      if (splineRef.current && headerRef.current && containerRef.current) {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: containerRef.current,
            scrub: true, // Menggunakan true daripada 1 untuk performa yang lebih baik
            start: "top top",
            end: "+=100%", // Menggunakan persentase daripada pixel tetap
            pin: headerRef.current,
            pinSpacing: true,
            onEnter: () => {
              // Preload konten lain saat animasi hero dimulai
              gsap.set(".section-card", { visibility: "visible" });
            },
          },
        });
        
        scrollTriggers.push(ScrollTrigger.getById(tl.scrollTrigger.id));

        // Animasi untuk 3D model dan hero content
        tl.fromTo(splineRef.current, 
          { clipPath: "inset(0%)", filter: "brightness(100%)" },
          { clipPath: "inset(5%)", filter: "brightness(70%)", ease: "power2.inOut", duration: 0.8 }
        )
        .to(splineRef.current, {
          scale: 0.85,
          duration: 0.5,
        }, 0.3); // Slight delay for staggered effect
        
        // Animasi untuk konten header
        tl.to(headerContentRef.current, {
          opacity: 0, 
          y: -80, 
          ease: "power1.in",
          duration: 0.6
        }, 0.1);
      }

      // Section cards animations dengan performa yang lebih baik
      const sections = gsap.utils.toArray(".section-card");
      
      sections.forEach((section, i) => {
        const trigger = ScrollTrigger.create({
          trigger: section,
          start: "top 75%",
          onEnter: () => animateSection(section, true),
          onLeaveBack: () => animateSection(section, false),
          once: false
        });
        
        // Set initial state
        gsap.set(section, { 
          opacity: 0, 
          y: 50, 
          scale: 0.98
        });
        
        scrollTriggers.push(trigger);
      });
      
      // Helper function untuk animasi section
      function animateSection(element, show) {
        gsap.to(element, {
          opacity: show ? 1 : 0,
          y: show ? 0 : 50,
          scale: show ? 1 : 0.98,
          duration: 0.8,
          ease: "power2.out",
          overwrite: "auto" // Mencegah tween yang saling bertentangan
        });
      }
    }, containerRef);
    
    // Cleanup yang lebih komprehensif
    return () => {
      scrollTriggers.forEach(trigger => trigger && trigger.kill());
      ctx.revert();
    };
  }, [isLoaded]);

  const SectionCard = ({ id, title, content }) => (
    <section
      id={id}
      className="section-card min-h-[60vh] h-auto flex items-center justify-center bg-black text-white px-2 sm:px-4 md:px-8 py-8 relative z-20"
      style={{ visibility: "hidden" }} // Hide initially for animation
    >
      <Card className="w-full max-w-full sm:max-w-2xl md:max-w-3xl lg:max-w-5xl xl:max-w-6xl h-auto shadow-2xl rounded-2xl border-white/10 border backdrop-blur-sm bg-white/5 flex flex-col">
        <CardHeader className="p-4 sm:p-6 md:p-8">
          <CardTitle className="text-white text-2xl sm:text-3xl md:text-4xl lg:text-5xl">{title}</CardTitle>
        </CardHeader>
        <CardContent className="text-gray-300 text-base sm:text-lg overflow-x-auto flex-grow px-2 sm:px-4 md:px-8 py-2 sm:py-4">
          {content}
        </CardContent>
      </Card>
    </section>
  );

  const handleSplineLoad = () => {
    setIsLoaded(true);
    // Preload animation
    gsap.to(".loading-screen", {
      opacity: 0,
      duration: 0.5,
      onComplete: () => gsap.set(".loading-screen", { display: "none" })
    });
  };

  return (
    <div ref={containerRef} className="relative h-screen bg-black w-screen font-[family-name:var(--font-geist-sans)]">
      <div ref={splineRef} className="fixed inset-0 w-full h-full z-10">
        <Spline
          scene="https://prod.spline.design/wzxrk97vdNZbGrCk/scene.splinecode"  
          className="w-full h-full object-cover min-w-full min-h-full"
          onLoad={handleSplineLoad}
        />
        {!isLoaded && (
          <div className="loading-screen absolute inset-0 flex items-center justify-center bg-black">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-t-white border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-white">Loading 3D...</p>
            </div>
          </div>
        )}
      </div>
      
      <div ref={headerRef} className="relative z-10 flex flex-col items-center justify-center h-screen p-6">
        <main ref={headerContentRef} className="w-full max-w-4xl mx-auto flex flex-col items-center text-center gap-6">
          <h1 className="text-4xl md:text-6xl font-bold text-white drop-shadow-md dark:drop-shadow-lg transition-all duration-300">
            Welcome to TradeTalk
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto drop-shadow">
            The best place to chat with friends and family.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a
              className="rounded-full bg-white text-black border border-transparent transition-all duration-300 ease-out transform hover:scale-105 hover:bg-black hover:text-white hover:border-white flex items-center justify-center gap-2 px-6 py-3 font-medium shadow-lg"
              href="/signup"
            >
              Get started
            </a>
            <a
              className="rounded-full bg-white text-black border border-transparent transition-all duration-300 ease-out transform hover:scale-105 hover:bg-black hover:text-white hover:border-white flex items-center justify-center gap-2 px-6 py-3 font-medium shadow-lg"
              href="/login"
            >
              Already have an account?
            </a>
          </div>
        </main>
      </div>
      
      <div className="relative z-20">
        <SectionCard
          id="about-us"
          title="About Us"
          content={
            <>
              <h3 className="text-xl font-semibold mb-2 mt-4">Our Mission</h3>
              <p className="mb-4">TradeTalk is revolutionizing human-AI interaction through our advanced chat assistant built with cutting-edge Web3 technology. Founded in 2023, our team combines expertise in artificial intelligence, blockchain, and natural language processing to create secure, intuitive communication tools.</p>
              
              <h3 className="text-xl font-semibold mb-2 mt-4">Our Vision</h3>
              <p className="mb-4">We envision a world where AI assistants respect privacy, empower individuals, and integrate seamlessly with decentralized technologies. TradeTalk strives to be at the forefront of this revolution, creating tools that enhance human potential while respecting personal autonomy.</p>
              
              <h3 className="text-xl font-semibold mb-2 mt-4">Our Team</h3>
              <p className="mb-4">Our diverse team of AI researchers, blockchain developers, and UX specialists work together from our offices in Singapore and San Francisco. Led by our founders Dr. Eliza Chen and Marcus Wei, we're united by our passion for ethical AI development and Web3 innovation.</p>
            </>
          }
        />

        <SectionCard
          id="privacy-policy"
          title="Privacy Policy"
          content={
            <>
              <h3 className="text-xl font-semibold mb-2 mt-4">Data Ownership</h3>
              <p className="mb-4">At TradeTalk, we believe your data belongs to you and only you. Unlike traditional AI services, we do not store conversations on central servers. Your interactions remain fully encrypted and stored locally or on your preferred decentralized storage solution.</p>
              
              <h3 className="text-xl font-semibold mb-2 mt-4">No Data Mining</h3>
              <p className="mb-4">We will never mine your conversations for training data or marketing insights. Your communications with our AI assistant are private and will not be used to improve our models without your explicit, opt-in consent.</p>
              
              <h3 className="text-xl font-semibold mb-2 mt-4">Transparency</h3>
              <p className="mb-4">Our privacy protocols are open-source and auditable by the community. We regularly publish transparency reports and invite independent security researchers to evaluate our systems.</p>
              
              <h3 className="text-xl font-semibold mb-2 mt-4">Compliance</h3>
              <p className="mb-4">While embracing Web3 principles, TradeTalk complies with relevant data protection regulations including GDPR, CCPA, and other applicable privacy laws where our services are available.</p>
            </>
          }
        />

        <SectionCard
          id="licensing"
          title="Licensing"
          content={
            <>
              <h3 className="text-xl font-semibold mb-2 mt-4">Software Licensing</h3>
              <p className="mb-4">Our core technology is available under dual licensing: open-source for non-commercial and research purposes, and enterprise licensing for commercial applications. This approach balances innovation with sustainability.</p>
              
              <h3 className="text-xl font-semibold mb-2 mt-4">Asset Attribution</h3>
              <p className="mb-4">All assets used within TradeTalk platforms are properly licensed under MIT, Creative Commons, or commercial licenses. We maintain detailed attribution for all third-party components used in our products.</p>
              
              <h3 className="text-xl font-semibold mb-2 mt-4">API Usage</h3>
              <p className="mb-4">Developers integrating with TradeTalk can access our API under tiered licensing options, from free developer accounts for experimentation to enterprise solutions with guaranteed uptime and support.</p>
              
              <h3 className="text-xl font-semibold mb-2 mt-4">Token Economics</h3>
              <p className="mb-4">Our TPTK utility token powers certain advanced features and provides governance rights within the TradeTalk ecosystem. Token holders enjoy premium features and participate in protocol governance decisions.</p>
            </>
          }
        />

        <SectionCard
          id="contact"
          title="Contact Us"
          content={
            <>
              <h3 className="text-xl font-semibold mb-2 mt-4">General Inquiries</h3>
              <p className="mb-4">Email: team@tradetalk.io<br/>
              Twitter: @TradeTalk<br/>
              Discord: discord.tradetalk.io</p>
              
              <h3 className="text-xl font-semibold mb-2 mt-4">Business Development</h3>
              <p className="mb-4">For partnership opportunities and enterprise solutions:<br/>
              Email: partnerships@tradetalk.io<br/>
              Schedule a call: calendly.com/tradetalk-partnerships</p>
              
              <h3 className="text-xl font-semibold mb-2 mt-4">Support</h3>
              <p className="mb-4">Technical support and customer service:<br/>
              Email: support@tradetalk.io<br/>
              Help Center: help.tradetalk.io<br/>
              Response Time: Within 24 hours</p>
              
              <h3 className="text-xl font-semibold mb-2 mt-4">Office Locations</h3>
              <p className="mb-4">Singapore HQ: 60 Anson Road, #12-01, Singapore 079914<br/>
              San Francisco: 535 Mission St, 14th Floor, San Francisco, CA 94105</p>
            </>
          }
        />

        <SectionCard
          id="products"
          title="Our Products"
          content={
            <>
              <h3 className="text-xl font-semibold mb-2 mt-4">TradeTalk Chat</h3>
              <p className="mb-4">Our flagship AI assistant with unparalleled privacy features and Web3 integration, available on web, mobile, and as a browser extension.</p>
              
              <h3 className="text-xl font-semibold mb-2 mt-4">TradeTalk Protocol</h3>
              <p className="mb-4">The underlying decentralized infrastructure powering secure AI interactions across the web. Available for developers through our SDK.</p>
              
              <h3 className="text-xl font-semibold mb-2 mt-4">TradeTalk Enterprise</h3>
              <p className="mb-4">Custom AI solutions for businesses seeking private, secure alternatives to conventional AI assistants. Features include custom training, brand voice adaptation, and enterprise-grade security.</p>
              
              <h3 className="text-xl font-semibold mb-2 mt-4">TradeTalk DAO</h3>
              <p className="mb-4">Our decentralized governance structure allowing community members to shape the future of the protocol through transparent proposal and voting mechanisms.</p>
            </>
          }
        /> 
      </div>
      
      <footer className="absolute bottom-4 w-full text-center text-white/80 text-sm">
        2025 © TradeTalk. All rights reserved.
      </footer>
    </div>
  );
}