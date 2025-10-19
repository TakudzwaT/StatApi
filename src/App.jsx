import { Routes, Route } from "react-router-dom";
import ApiDocs from "./pages/ApiDocs";

function App() {
  return (
    <Routes>
      <Route path="/docs" element={<ApiDocs />} />
    </Routes>
  );
}

export default App;
