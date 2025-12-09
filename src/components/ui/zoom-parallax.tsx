'use client';

import React, { useRef } from 'react';
import { useScroll, useTransform, motion } from 'framer-motion';

interface Image {
  src: string;
  alt?: string;
}

interface ZoomParallaxProps {
  /** Array of images to be displayed in the parallax effect max 7 images */
  images?: Image[];
  /** Optional custom nodes instead of images */
  items?: React.ReactNode[];
  className?: string;
}

export function ZoomParallax({ images = [], items, className = "relative h-[240vh] md:h-[260vh]" }: ZoomParallaxProps) {
  const container = useRef(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ['start start', 'end end'],
  });

  const scale4 = useTransform(scrollYProgress, [0, 1], [1, 4]);
  const scale5 = useTransform(scrollYProgress, [0, 1], [1, 5]);
  const scale6 = useTransform(scrollYProgress, [0, 1], [1, 6]);
  const scale8 = useTransform(scrollYProgress, [0, 1], [1, 8]);
  const scale9 = useTransform(scrollYProgress, [0, 1], [1, 9]);

  const scales = [scale4, scale5, scale6, scale5, scale6, scale8, scale9];

  return (
    <div ref={container} className={className}>
      <div className="sticky top-0 h-screen overflow-hidden">
        {items
          ? items.map((node, index) => {
              const scale = scales[index % scales.length];
              return (
                <motion.div
                  key={index}
                  style={{ scale }}
                  className="absolute top-0 flex h-full w-full items-center justify-center"
                >
                  <div className="relative h-[56vh] w-[82vw] md:h-[52vh] md:w-[68vw] lg:w-[60vw] rounded-[28px] border border-white/10 shadow-[0_25px_80px_-40px_rgba(0,0,0,0.8)] overflow-hidden bg-black/70 backdrop-blur-xl">
                    <div className="absolute inset-0">{node}</div>
                  </div>
                </motion.div>
              );
            })
          : images.map(({ src, alt }, index) => {
              const scale = scales[index % scales.length];
              return (
                <motion.div
                  key={index}
                  style={{ scale }}
                  className="absolute top-0 flex h-full w-full items-center justify-center"
                >
                  <div className="relative h-[56vh] w-[82vw] md:h-[52vh] md:w-[68vw] lg:w-[60vw] rounded-[28px] border border-white/10 shadow-[0_25px_80px_-40px_rgba(0,0,0,0.8)] overflow-hidden">
                    <img
                      src={src || '/placeholder.svg'}
                      alt={alt || `Parallax image ${index + 1}`}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10" />
                  </div>
                </motion.div>
              );
            })}
      </div>
    </div>
  );
}
