import React, { memo, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { WhatsappLogo } from "@phosphor-icons/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const AssistantMockup = memo(function AssistantMockup() {
    const containerRef = useRef<HTMLDivElement>(null);
    const messagesRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current || !messagesRef.current) return;

        const ctx = gsap.context(() => {
            const messages = messagesRef.current!.children;

            gsap.fromTo(
                messages,
                { opacity: 0, y: 15, scale: 0.95 },
                {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    duration: 0.5,
                    stagger: 0.6,
                    ease: "power2.out",
                    scrollTrigger: {
                        trigger: containerRef.current,
                        start: "top 75%",
                    },
                }
            );
        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <div ref={containerRef} className="relative mx-auto mt-12 w-full max-w-[360px] md:mt-0 md:max-w-[420px] shrink-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-[48px] bg-[#25D366]/10 blur-[80px] -z-10 pointer-events-none" />
            <div className="flex flex-col gap-4 rounded-[32px] border border-white/10 bg-[#0c0c0c] p-6 shadow-2xl relative overflow-hidden">
                <div className="flex items-center gap-4 py-2 border-b border-white/5 pb-4">
                    <div className="h-12 w-12 rounded-full bg-[#141414] border border-white/10 flex items-center justify-center relative shadow-lg shadow-black/50">
                        <span className="text-xl">🤖</span>
                        <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-[#25D366] ring-2 ring-[#0c0c0c]" />
                    </div>
                    <div>
                        <div className="text-white font-semibold flex items-center gap-1.5">
                            Corelys <WhatsappLogo size={16} weight="fill" className="text-[#25D366]" />
                        </div>
                        <div className="text-xs text-[#25D366]">online</div>
                    </div>
                </div>
                <div ref={messagesRef} className="flex flex-col gap-4 mt-2 h-[260px] relative">
                    <div className="self-start max-w-[85%] rounded-2xl rounded-tl-sm bg-[#141414] border border-white/5 p-3 px-4 shadow-md">
                        <div className="text-sm text-white/90 leading-relaxed">Opa! Vi que seu treino de perna tá agendado pras 18h. Posso confirmar no calendário? 💪</div>
                        <div className="text-[10px] text-white/30 text-right mt-1">11:42</div>
                    </div>
                    <div className="self-end max-w-[80%] rounded-2xl rounded-tr-sm bg-[#112a1f] border border-[#25D366]/20 p-3 px-4 shadow-md">
                        <div className="text-sm text-white/90 leading-relaxed">Confirma, mas muda pra 19h por favor. Fiquei preso numa call.</div>
                        <div className="text-[10px] text-[#25D366]/60 text-right mt-1 flex items-center justify-end gap-1">11:45 <span className="text-[#25D366]">✓✓</span></div>
                    </div>
                    <div className="self-start max-w-[85%] rounded-2xl rounded-tl-sm bg-[#141414] border border-white/5 p-3 px-4 shadow-md">
                        <div className="text-sm text-white/90 leading-relaxed text-[#c1ff72]">✦ Feito! Remarquei seu treino para 19h e ajustei o alarme. Bom treino!</div>
                        <div className="text-[10px] text-white/30 text-right mt-1">11:46</div>
                    </div>
                </div>
                <div className="flex items-center gap-3 mt-2">
                    <div className="flex-1 h-10 rounded-full border border-white/10 bg-[#141414] flex items-center px-4">
                        <span className="text-sm text-white/30">Mensagem</span>
                    </div>
                    <div className="h-10 w-10 flex shrink-0 items-center justify-center rounded-full bg-[#25D366] text-black">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 translate-x-1 -translate-y-1 rotate-45">
                            <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    );
});

export default AssistantMockup;
