import { motion } from "framer-motion";
import featureVisual from "@/assets/feature-visual.png";

const features = [
  {
    emoji: "🖥",
    title: "Integrated",
    description: "Desktop app integrates with your Finder making your entire workspace available without opening the browser.",
  },
  {
    emoji: "🔍",
    title: "Streamlined",
    description: "AI-powered search and seamless visual UI makes browsing, finding, and organizing assets effortless.",
  },
  {
    emoji: "🤝",
    title: "Collaborative",
    description: "Real-time collaboration, version tracking, and feedback tools help teams stay aligned.",
  },
  {
    emoji: "⚡",
    title: "Automated",
    description: "Automate repetitive tasks with smart workflows. From approvals to publishing, keep your pipeline flowing.",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features-section" className="py-28 relative z-20">
      <div className="max-w-[1200px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-20"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-medium text-white tracking-tight leading-[1.1] mb-5">
            Designed to send team
            <br />
            <span className="italic">productivity soaring</span>
          </h2>
          <p className="text-white/60 text-lg">
            Every detail crafted to help creative teams move faster.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="rounded-2xl overflow-hidden shadow-xl border border-white/20"
          >
            <img src={featureVisual} alt="Feature visualization" className="w-full h-auto" loading="lazy" />
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="bg-white/10 backdrop-blur-md rounded-2xl p-7 border border-white/20 hover:bg-white/15 transition-all duration-300"
              >
                <span className="text-2xl mb-3 block">{f.emoji}</span>
                <h3 className="text-lg font-serif font-medium text-white mb-2">{f.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
