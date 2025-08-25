import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

export interface AccordionItemType {
  id?: string | number;
  title: React.ReactNode;
  content: React.ReactNode | (() => React.ReactNode);
  icon?: React.ReactNode;
}

export interface AccordionProps {
  items?: AccordionItemType[];
  allowMultiple?: boolean;
  className?: string;
  itemClassName?: string;
  headerClassName?: string;
  contentClassName?: string;
  iconClassName?: string;
  springConfig?: Record<string, any>;
  onToggle?: (index: number, isOpen: boolean) => void;
}

export const Accordion: React.FC<AccordionProps> = ({
  items = [],
  allowMultiple = false,
  className = '',
  itemClassName = '',
  headerClassName = '',
  contentClassName = '',
  iconClassName = '',
  springConfig = { type: "spring", stiffness: 300, damping: 30 },
  onToggle = () => {}
}) => {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());

  const toggleItem = (index: number) => {
    const newOpenItems = new Set(openItems);

    if (openItems.has(index)) {
      newOpenItems.delete(index);
    } else {
      if (!allowMultiple) {
        newOpenItems.clear();
      }
      newOpenItems.add(index);
    }

    setOpenItems(newOpenItems);
    onToggle(index, newOpenItems.has(index));
  };

  return (
    <div className={`accordion-main ${className}`}>
      {items.map((item, index) => (
        <AccordionItem
          key={item.id ?? index}
          item={item}
          index={index}
          isOpen={openItems.has(index)}
          onToggle={() => toggleItem(index)}
          itemClassName={itemClassName}
          headerClassName={headerClassName}
          contentClassName={contentClassName}
          iconClassName={iconClassName}
          springConfig={springConfig}
        />
      ))}
    </div>
  );
};

interface AccordionItemProps {
  item: AccordionItemType;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
  itemClassName?: string;
  headerClassName?: string;
  contentClassName?: string;
  iconClassName?: string;
  springConfig?: Record<string, any>;
}

export const AccordionItem: React.FC<AccordionItemProps> = ({
  item,
  index,
  isOpen,
  onToggle,
  itemClassName = '',
  headerClassName = '',
  contentClassName = '',
  iconClassName = '',
  springConfig = { type: "spring", stiffness: 300, damping: 30 }
}) => {
  return (
    <div className={`backdrop-blur-xl rounded-lg overflow-hidden ${itemClassName}`}>
      <motion.button
        className={`flex items-center  justify-between accordion-header w-full transition-colors duration-200 ${isOpen ? 'bg-white/5' : 'bg-transparent'}  ${headerClassName}`}
        onClick={onToggle}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <h1>
            {item.title}
        </h1>
        <motion.div
          className={`flex-shrink-0 rounded-full ${isOpen ? 'bg-white text-black' : 'bg-transparent'} ${iconClassName}`}
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={springConfig}
        >
          {item.icon ?? <ChevronDown size={32} />}
        </motion.div>
      </motion.button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{
              height: "auto",
              opacity: 1,
              transition: {
                height: springConfig,
                opacity: { ...springConfig, delay: 0.1 }
              }
            }}
            exit={{
              height: 0,
              opacity: 0,
              transition: {
                height: springConfig,
                opacity: { ...springConfig, duration: 0.2 }
              }
            }}
            style={{ overflow: "hidden" }}
          >
            <motion.div
              className={`accordion-body  ${contentClassName}`}
              initial={{ y: -10 }}
              animate={{ y: 0 }}
              exit={{ y: -10 }}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 30,
                mass: 0.8
              }}
            >
              {typeof item.content === 'function' ? item.content() : item.content}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};