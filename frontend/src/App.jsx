import { Routes, Route, Navigate } from "react-router-dom";
import PreQualifyPage from "./pages/PreQualifyPage";
import QuotePage from "./pages/QuotePage";
import { QuoteProvider } from "./context/QuoteContext";

export default function App() {
  return (
    <QuoteProvider>
      <Routes>
        <Route path="/" element={<PreQualifyPage />} />
        <Route path="/quote" element={<QuotePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </QuoteProvider>
  );
}
