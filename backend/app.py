from fastapi import FastAPI
import uvicorn


app = FastAPI()


class DummyModel:
    def __init__(self):
        pass

    def load_model(self):
        pass

    def generate_response(self, prompt):
        return "Sallam"


model = DummyModel()


class RequestData(DummyModel):
    promt: str


@app.post("/generate")
async def generate_response(data: RequestData):
    return model.generate_response(data.prompt)


@app.post("/load_model")
async def load_model():
    return model.load_model()


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", post=8000)
