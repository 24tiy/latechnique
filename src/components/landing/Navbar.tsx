import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";

const navLinksLeft = ["Возможности", "Тарифы", "Как это работает"];

const Navbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      <div className="relative flex items-center justify-between p-4 sm:p-6">
        {/* Left nav links */}
        <div className="hidden md:flex items-center gap-6">
          {navLinksLeft.map((link) => (
            <a key={link} href="#" className="text-sm text-white/70 hover:text-white transition-colors font-medium">
              {link}
            </a>
          ))}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3 ml-auto">
          <a href="#" className="hidden md:inline-block text-sm text-white/70 hover:text-white transition-colors font-medium">
            Войти
          </a>
          <button
            className="h-11 px-6 rounded-lg border border-white/30 text-white text-sm font-medium backdrop-blur-sm bg-white/5 hover:bg-white/15 transition-all"
          >
            Начать
          </button>
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden h-11 w-11 rounded-lg border border-white/30 text-white flex items-center justify-center backdrop-blur-sm bg-white/5 hover:bg-white/15 transition-all"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-20 right-6 w-64 rounded-2xl bg-white/90 backdrop-blur-xl shadow-xl border border-white/50 p-4 md:hidden"
          >
            {[...navLinksLeft, "Войти"].map((link) => (
              <a
                key={link}
                href="#"
                className="block px-4 py-3 text-sm font-medium text-foreground/70 hover:text-foreground rounded-lg hover:bg-foreground/5 transition-colors"
                onClick={() => setOpen(false)}
              >
                {link}
              </a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
