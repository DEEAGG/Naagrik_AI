import { motion } from 'framer-motion';

interface Props {
  text: string;
  onClick: () => void;
}

export default function SuggestionChip({ text, onClick }: Props) {
  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="rounded-full border border-white/10 bg-white/[0.02] px-3.5 py-1.5 text-[13px] text-gray-300 hover:border-accent-400/30 hover:bg-accent-500/5 hover:text-white transition-colors"
    >
      {text}
    </motion.button>
  );
}
