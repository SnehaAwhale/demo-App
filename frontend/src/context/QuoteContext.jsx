import { createContext, useContext, useState } from "react";

const QuoteContext = createContext(null);

export function QuoteProvider({ children }) {
  const [quoteData, setQuoteData] = useState(null);
  const [applicantForm, setApplicantForm] = useState(null);
  const [quoteSelection, setQuoteSelection] = useState(null);

  return (
    <QuoteContext.Provider
      value={{
        quoteData,
        setQuoteData,
        applicantForm,
        setApplicantForm,
        quoteSelection,
        setQuoteSelection,
      }}
    >
      {children}
    </QuoteContext.Provider>
  );
}

export function useQuoteContext() {
  const ctx = useContext(QuoteContext);
  if (!ctx) {
    throw new Error("useQuoteContext must be used within a QuoteProvider");
  }
  return ctx;
}
