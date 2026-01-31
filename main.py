from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import requests
import io

app = FastAPI()

# Enable CORS for frontend interaction
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Google Sheets Reader API is running"}

@app.get("/api/sheet-data")
def get_sheet_data(sheet_url: str):
    """
    Fetches data from a public Google Sheet URL.
    The URL should be the standard browser URL.
    """
    try:
        # Convert standard URL to export CSV URL
        if "/edit" in sheet_url:
            base_url = sheet_url.split("/edit")[0]
            csv_url = f"{base_url}/export?format=csv"
        elif "/view" in sheet_url:
            base_url = sheet_url.split("/view")[0]
            csv_url = f"{base_url}/export?format=csv"
        else:
            # Try to construct if it's just the ID
            if len(sheet_url) > 20 and not sheet_url.startswith("http"):
                csv_url = f"https://docs.google.com/spreadsheets/d/{sheet_url}/export?format=csv"
            else:
                csv_url = sheet_url

        response = requests.get(csv_url)
        response.raise_for_status()
        
        # Read CSV data
        df = pd.read_csv(io.StringIO(response.text))
        
        # Replace NaN with empty string for JSON compatibility
        df = df.fillna("")
        
        return {
            "columns": df.columns.tolist(),
            "data": df.to_dict(orient="records")
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
