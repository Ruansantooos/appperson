import React, { memo } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { ArrowRight } from "@phosphor-icons/react";

type MagneticButtonProps = {
  label: string;
  href?: string;
  onClick?: () => void;
  className?: string;
  icon?: boolean;
};

const MagneticButton = memo(function MagneticButton({
  label,
  href,
  onClick,
  className,
  icon = true,
}: MagneticButtonProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scale = useTransform(x, [-30, 0, 30], [1.03, 1, 1.03]);

  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - rect.left - rect.width / 2;
    const my = e.clientY - rect.top - rect.height / 2;
    x.set(mx * 0.25);
    y.set(my * 0.25);
  }

  function handleLeave() {
    x.set(0);
    y.set(0);
  }

  const content = (
    <div className="inline-flex items-center gap-2 rounded-full bg-[#c1ff72] px-6 py-3 text-sm font-semibold text-[#0c0c0c]">
      <span>{label}</span>
      {icon && <ArrowRight size={16} weight="bold" />}
    </div>
  );

  return (
    <motion.div
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ x, y, scale }}
      whileTap={{ scale: 0.98 }}
      className={className}
    >
      {href ? (
        <a href={href} aria-label={label}>{content}</a>
      ) : (
        <button type="button" onClick={onClick} aria-label={label}>{content}</button>
      )}
    </motion.div>
  );
});

export default MagneticButton;
