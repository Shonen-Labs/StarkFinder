from fastapi import FastAPI, Depends, Query # type: ignore
from typing import Optional
from app.api import user
from typing import Annotated
from app.db.Sessions import engine, SessionLocal , get_db
from app.models.base import Base
from sqlalchemy.orm import Session  # type: ignore
from sqlalchemy import text # type: ignore
from app.core.config import settings

app = FastAPI(title=settings.PROJECT_NAME)
Base.metadata.create_all(bind=engine)

@app.get("/")
def read_root(
    db: Session = Depends(get_db),
    name: Optional[str] = Query(None, description="Your name"),
    age: Optional[int] = Query(None, description="Your age")
):
    result = db.execute(text("SELECT 'Hello from Postgres!'"))
    message = result.scalar()
    return {
        "db_message": message,
        "greeting": f"Hello {name}, you are {age or 'unknown'} years old"
    }
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
db_dependency= Annotated[Session, Depends(get_db)] 
app.include_router(user.router, prefix="/api/routes", tags=["users"])