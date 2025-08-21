import React, {useState, useEffect} from "react"
import axios from 'axios'
import {Line} from 'react-chartjs-2'
import './App.css'

import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend
);

function App(){
  const [form, setForm] = useState({age: '', weight: '', sugar: '', bp: ''});
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [dark, setDark] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value});
  };

  const handleSubmit = async() => {
    const res = await axios.post('http://localhost:8000/analyze', form);
    setResult(res.data);
    fetchHistory();
  };

  const fetchHistory = async() => {
    const res = await axios.get('http://localhost:8000/history');
    setHistory(res.data);
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const chartData = {
    labels: history.map(item => item.timestamp.split(' ')[0]),
    datasets: [
      {
        label: 'Risk %',
        data: history.map(item => item.risk),
        borderColor: 'red',
        backgroundColor: 'rgba(255,0,0,0.1)',
        fill: true,
      },
    ],
  };

  return (
    <div className={dark? 'App dark':'App'}>
      <div className="toggle">
        <label>
          Dark Mode
          <input type="checkbox" checked={dark} onChange={() => setDark(!dark)} />
        </label>
      </div>

      <h2>Risk Eliminator</h2>

      <div className="form">
        <input name="age" placeholder="Age" value={form.age} onChange={handleChange} />
        <input name="weight" placeholder="Weight(kg)" value={form.weight} onChange={handleChange} />
        <input name="sugar" placeholder="Sugar(mm/dL)" value={form.sugar} onChange={handleChange} />
        <input name="bp_sys" placeholder="BP(SYS)" value={form.bp_sys} onChange={handleChange} />
        <input name="bp_dia" placeholder="BP(DIA)" value={form.bp_dia} onChange={handleChange} />
        <button onClick={handleSubmit}>Analyze</button>
      </div>

      {result && (
        <div className="result">
          <h3>Risk: {result.risk}%</h3>
          <p>{result.advice}</p>
        </div>
      )}

      <div className="chart">
        <h3>Risk Trend</h3>
        <Line data={chartData} />
      </div>
    </div>
  );
}

export default App;