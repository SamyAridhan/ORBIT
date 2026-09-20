from fastapi import FastAPI

app = FastAPI(title="ORBIT MAS Backend")


@app.get("/")
async def root():
    return {"status": "ORBIT backend is alive"}
