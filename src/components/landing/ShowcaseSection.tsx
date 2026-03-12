import { motion } from "framer-motion";

const ShowcaseSection = () => {
  return (
    <section id="showcase-section" className="py-28 relative z-20">
      <div className="max-w-[1200px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center max-w-3xl mx-auto"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-medium text-white tracking-tight mb-6 leading-[1.1]">
            Get started in seconds,
            <br />
            <span className="italic">add your team as you go</span>
          </h2>
          <p className="text-white/60 text-lg mb-10 leading-relaxed max-w-xl mx-auto">
            Do more with your creative assets on LaTechNique — the creative workspace built for speed.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button className="h-13 px-10 rounded-full bg-white text-foreground text-sm font-semibold hover:bg-white/90 transition-colors shadow-lg">
              Sign up for free
            </button>
            <button className="h-13 px-10 rounded-full border-2 border-white/30 text-white text-sm font-semibold hover:border-white/50 transition-colors">
              Book a demo
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ShowcaseSection;
