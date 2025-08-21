from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
import json, requests

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins = ['*'],
    allow_credentials = True,
    allow_methods = ['*'],
    allow_headers = ['*'],
)

class HealthInput(BaseModel):
    age: int
    weight: float
    sugar: float
    bp_sys: int
    bp_dia: int

try:
    with open('health_history.json', 'r') as f:
        HISTORY = json.load(f)
except:
    HISTORY = []

def estimate_risk(age, weight, sugar, bp_sys, bp_dia):
    risk = 0
    if age > 50:
        risk += 15
    if weight > 90:
        risk += 15
    if sugar > 140:
        risk += 30
    if bp_sys > 130:
        risk += 25
    if bp_dia > 90:
        risk += 25
    return min(risk, 100)

def get_llm_advice(data):
    prompt = f"""
    A person has the following health data: 
    - Age: {data['age']}
    - Weight: {data['weight']} kg
    - Blood Sugar: {data['sugar']} mm/dL
    - Blood Pressure (Systolic): {data['bp_sys']} mmHg
    - Blood Pressure (Diastolic): {data['bp_dia']} mmHg
    - Risk Score: {data['risk']}%

    Give personlized lifestyle and dietary advice in 3-5 bullet points. Avoid medical jargon.
    """
    try:
        res = requests.post(
            'http://localhost:11434/api/generate',
            json={
                'model': 'mistral',
                'prompt': prompt,
                'stream': False
            }
        )
        return res.json().get('response', '(LLM response error)')
    except Exception as e:
        return f'LLM Error! {str(e)}'

@app.post('/analyze')
async def analyze(data: HealthInput):
    risk = estimate_risk(data.age, data.weight, data.sugar, data.bp_sys, data.bp_dia)
    record = {
        'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'age': data.age,
        'weight': data.weight,
        'sugar': data.sugar,
        'bp_sys': data.bp_sys,
        'bp_dia': data.bp_dia,
        'risk': risk
    }
    record['advice'] = get_llm_advice(record)
    HISTORY.append(record)
    with open('health_history.json', 'w') as f:
        json.dump(HISTORY, f, indent=2)
    return record

@app.get('/history')
def get_history():
    return HISTORY