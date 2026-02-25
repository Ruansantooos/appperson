import React, { memo, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Flame, CheckCircle, Wallet } from "@phosphor-icons/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const PhoneMockup = memo(function PhoneMockup() {
    const phoneRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!phoneRef.current) return;

        const ctx = gsap.context(() => {
            gsap.fromTo(
                phoneRef.current,
                { y: 100, opacity: 0, rotateX: 10 },
                {
                    y: 0,
                    opacity: 1,
                    rotateX: 0,
                    duration: 1.2,
                    ease: "power3.out",
                    scrollTrigger: {
                        trigger: phoneRef.current,
                        start: "top 85%",
                    },
                }
            );
        }, phoneRef);

        return () => ctx.revert();
    }, []);

    return (
        <div
            ref={phoneRef}
            className="relative mx-auto mt-12 w-[300px] h-[600px] md:mt-0 md:w-[320px] md:h-[640px] shrink-0 transform-gpu perspective-[1000px]"
        >
            <div className="absolute inset-0 rounded-[48px] border-[6px] border-[#202020] bg-black shadow-2xl overflow-hidden ring-1 ring-white/10 ring-offset-4 ring-offset-[#0c0c0c]">
                <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
                <div className="absolute top-3 left-1/2 -translate-x-1/2 h-[26px] w-[90px] rounded-full bg-black flex items-center justify-between px-2 z-20">
                    <div className="h-2 w-2 rounded-full bg-green-500 blur-[2px] animate-pulse" />
                    <div className="h-2 w-2 rounded-full bg-white/20" />
                </div>
                <div className="absolute inset-0 bg-[#060606] pt-14 pb-8 px-4 flex flex-col gap-4 overflow-hidden">
                    <div className="flex items-center justify-between">
                        <div className="text-white/80 font-semibold text-sm">Olá, Corelys</div>
                        <div className="h-8 w-8 rounded-full border border-white/10 bg-[#141414] flex items-center justify-center">
                            <div className="h-2 w-2 rounded-full bg-[#c1ff72] shadow-sm shadow-[#c1ff72]" />
                        </div>
                    </div>
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        className="rounded-[20px] border border-[#c1ff72]/20 bg-[#141414] p-4 relative overflow-hidden"
                    >
                        <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-[#c1ff72]/10 blur-xl pointer-events-none" />
                        <div className="text-xs uppercase tracking-[0.2em] text-white/40 mb-2 flex items-center gap-1">
                            <Wallet size={12} className="text-[#c1ff72]" /> Finanças
                        </div>
                        <div className="text-2xl font-mono text-[#c1ff72] font-semibold mb-1">R$ 4.280,00</div>
                        <div className="text-[10px] text-white/50">+12% este mês</div>
                    </motion.div>
                    <div>
                        <div className="text-xs uppercase tracking-[0.2em] text-white/40 mb-3 pl-1">A Fazer Hoje</div>
                        <div className="space-y-2">
                            {[
                                { label: "Treino de Peito", time: "18:00", active: true },
                                { label: "Leitura 30 min", time: "20:30", active: false },
                                { label: "Meditação", time: "22:00", active: false },
                            ].map((task, i) => (
                                <motion.div
                                    key={task.label}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.7 + i * 0.1, duration: 0.5 }}
                                    className={`flex items-center justify-between rounded-[16px] border ${task.active ? "border-[#c1ff72]/30 bg-[#c1ff72]/5" : "border-white/5 bg-[#101010]"} p-3`}
                                >
                                    <div className="flex items-center gap-3">
                                        <CheckCircle size={18} weight={task.active ? "fill" : "regular"} className={task.active ? "text-[#c1ff72]" : "text-white/20"} />
                                        <span className={`text-xs ${task.active ? "text-white" : "text-white/60"}`}>{task.label}</span>
                                    </div>
                                    <span className="text-[10px] text-white/30 font-mono">{task.time}</span>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1.2, duration: 0.6 }}
                        className="mt-auto rounded-[20px] border border-white/10 bg-[#101010] p-4 flex items-center justify-between"
                    >
                        <div>
                            <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Ritmo Atual</div>
                            <div className="flex items-center gap-1 text-sm text-white">
                                <Flame size={14} weight="fill" className="text-[#c1ff72]" />
                                <span className="font-semibold">23 Dias Direto</span>
                            </div>
                        </div>
                        <div className="flex gap-1 items-end h-8">
                            {[4, 6, 5, 8, 7, 10].map((h, i) => (
                                <div key={i} className="w-1.5 rounded-t-sm" style={{ height: `${h * 10}%`, backgroundColor: i === 5 ? "#c1ff72" : "rgba(255,255,255,0.1)" }} />
                            ))}
                        </div>
                    </motion.div>
                </div>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 h-1 w-24 rounded-full bg-white/40 z-20" />
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] rounded-full bg-[#c1ff72]/10 blur-[100px] -z-10 pointer-events-none" />
        </div>
    );
});

export default PhoneMockup;
