import { motion } from 'framer-motion';
import { MessageSquare, Cpu, MapPin, CheckCircle2 } from 'lucide-react';

const STEPS = [
  {
    number: '01',
    title: 'Describe the Problem',
    desc: 'Tell Naagrik AI what happened in your own words. You can write in English, Hindi, or Hinglish.',
    icon: MessageSquare,
  },
  {
    number: '02',
    title: 'AI Understands the Issue',
    desc: 'Naagrik AI interprets your complaint, identifies the issue and category, and converts it into a clear professional complaint.',
    icon: Cpu,
  },
  {
    number: '03',
    title: 'Add Location & Review',
    desc: 'Confirm where the issue occurred, review the complaint, and make any changes before submission.',
    icon: MapPin,
  },
  {
    number: '04',
    title: 'Submit & Track',
    desc: 'Your complaint is routed toward the responsible authority and you can track its status from one place.',
    icon: CheckCircle2,
  },
];

export default function HowItWorksSection() {
  return (
    <section className="relative z-10 mx-auto w-full max-w-5xl px-4 py-16 text-left">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <span className="text-eyebrow">Seamless Process</span>
        <h2 className="mt-3 font-display text-2xl sm:text-3xl font-semibold text-white">
          How It Works
        </h2>
        <p className="mt-3 text-sm text-gray-400 leading-relaxed text-balance">
          Report a civic issue in a few simple steps. Naagrik AI understands your complaint, identifies the right authority, and helps you submit and track it.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          return (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.4 }}
              className="rounded-2xl glass p-6 flex flex-col justify-between hover:border-accent-400/30 transition-all group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono font-bold text-accent-300 bg-accent-500/10 px-2.5 py-1 rounded-full border border-accent-400/20">
                    {step.number}
                  </span>
                  <Icon className="h-5 w-5 text-gray-400 group-hover:text-accent-300 transition-colors" />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">
                  {step.title}
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
