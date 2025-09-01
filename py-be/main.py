from fastapi import FastAPI

from app.api import auth, routes

app = FastAPI(title="StarkFinder_py-be")


@app.get("/")
def root():
    return {"message": "🚀 FastAPI server is running!"}


app.include_router(routes.router, prefix="/api/routes", tags=["users"])
app.include_router(
    auth.router,
    prefix="/api/routes",
)
