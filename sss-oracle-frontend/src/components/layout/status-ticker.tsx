export default function StatusTicker() {
    return (
        <div className="border-[#2A2A2A] bg-[#A855F7] flex h-8 items-center overflow-hidden whitespace-nowrap border-b text-black">
            <div className="label flex gap-8 text-xs font-bold" style={{ animation: 'ticker 50s linear infinite' }}>
                <span>SOL/USD $101.45 <span className="text-[#064E3B]">+2.4%</span></span>
                <span>BRL/USD $0.20 <span className="text-[#7F1D1D]">-0.1%</span></span>
                <span>EUR/USD $1.08 <span className="text-[#064E3B]">+0.2%</span></span>
                <span>BTC/USD $51,200 <span className="text-[#064E3B]">+5.1%</span></span>
                <span>ETH/USD $2,950 <span className="text-[#064E3B]">+3.2%</span></span>

                {/* Repeat for continuous scroll illusion */}
                <span>SOL/USD $101.45 <span className="text-[#064E3B]">+2.4%</span></span>
                <span>BRL/USD $0.20 <span className="text-[#7F1D1D]">-0.1%</span></span>
                <span>EUR/USD $1.08 <span className="text-[#064E3B]">+0.2%</span></span>
            </div>
            <style>{`
        @keyframes ticker {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
        </div>
    );
}
