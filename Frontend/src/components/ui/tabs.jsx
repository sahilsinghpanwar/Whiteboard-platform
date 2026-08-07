import { useState, createContext, useContext } from "react";

const TabsContext = createContext(null);

export const Tabs = ({ defaultValue, value, onValueChange, children, className = "", ...props }) => {
  const [selected, setSelected] = useState(defaultValue);
  const current = value !== undefined ? value : selected;
  const changeTab = (val) => {
    setSelected(val);
    if (onValueChange) onValueChange(val);
  };
  return (
    <TabsContext.Provider value={{ activeTab: current, changeTab }}>
      <div className={className} {...props}>{children}</div>
    </TabsContext.Provider>
  );
};

export const TabsList = ({ children, className = "", ...props }) => (
  <div className={`inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 ${className}`} {...props}>{children}</div>
);

export const TabsTrigger = ({ value, children, className = "", onClick, ...props }) => {
  const { activeTab, changeTab } = useContext(TabsContext);
  const isActive = activeTab === value;
  return (
    <button
      type="button"
      onClick={(e) => {
        onClick?.(e);
        changeTab(value);
      }}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all ${
        isActive ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export const TabsContent = ({ value, children, className = "", ...props }) => {
  const { activeTab } = useContext(TabsContext);
  if (activeTab !== value) return null;
  return <div className={className} {...props}>{children}</div>;
};
