import { motion } from "framer-motion";
import productScreenshot from "@/assets/product-screenshot.png";

const ProductSection = () => {
  return (
    <section id="product-section" className="py-28 relative z-20">
      <div className="max-w-[1200px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-20"
        >
          <p className="text-white/50 text-xs tracking-[0.25em] uppercase mb-6 font-medium">
            150,000+ users · 100,000,000+ assets
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-medium text-white tracking-tight leading-[1.1]">
            Far more than another archaic
            <br />
            <span className="italic">digital asset management</span> tool
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, delay: 0.2 }}
          className="rounded-2xl overflow-hidden shadow-2xl border border-white/20"
        >
          <img
            src={productScreenshot}
            alt="LaTechNique platform dashboard"
            className="w-full h-auto"
            loading="lazy"
          />
        </motion.div>
      </div>
    </section>
  );
};

export default ProductSection;
