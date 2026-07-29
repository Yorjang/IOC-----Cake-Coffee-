import React from 'react';
import { motion } from 'motion/react';

interface BlurTextProps {
  text: string;
  className?: string;
}

export function BlurText({ text, className }: BlurTextProps) {
  const words = text.split(' ');

  return (
    <motion.p
      className={className}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        rowGap: '0.1em',
      }}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
    >
      {words.map((word, i) => (
        <motion.span
          key={i}
          style={{ display: 'inline-block', marginRight: '0.28em' }}
          variants={{
            hidden: { filter: 'blur(10px)', opacity: 0, y: 50 },
            visible: {
              filter: ['blur(10px)', 'blur(5px)', 'blur(0px)'],
              opacity: [0, 0.5, 1],
              y: [50, -5, 0],
              transition: {
                duration: 0.7,
                times: [0, 0.5, 1],
                ease: 'easeOut',
                delay: i * 0.1,
              },
            },
          }}
        >
          {word}
        </motion.span>
      ))}
    </motion.p>
  );
}
