import { SheetManager } from './components/SheetManager'
import './App.css'

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1><span>AI</span>Sheets</h1>
        <p className="tagline">Spreadsheet with formulas</p>
      </header>
      <SheetManager />
    </div>
  )
}

export default App
