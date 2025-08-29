"""Tests for the POST /generate endpoint."""

from fastapi.testclient import TestClient

from app.api import routes
from app.models.base import SessionLocal
from app.models.generated_contract import GeneratedContract

client = TestClient(routes.app)


def create_user(username: str = "alice", email: str = "alice@example.com") -> int:
    res = client.post(
        "/reg",
        json={"username": username, "email": email, "password": "secret123"},
    )
    assert res.status_code == 201
    return res.json()["id"]


def test_generate_contract_success():
    user_id = create_user()

    payload = {
        "user_id": user_id,
        "contract_type": "token",
        "contract_name": "MyToken",
        "description": "A test token contract",
        "parameters": {"name": "TestToken"},
        "template_id": "token_v1",
    }

    res = client.post("/generate", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["user_id"] == user_id
    assert data["contract_type"] == "token"
    assert data["contract_name"] == "MyToken"
    assert data["status"] == "generated"

    # Verify persistence
    db = SessionLocal()
    try:
        contract = db.query(GeneratedContract).filter_by(id=data["id"]).first()
        assert contract is not None
        assert contract.contract_name == "MyToken"
    finally:
        db.close()


def test_generate_contract_user_not_found():
    payload = {
        "user_id": 9999,
        "contract_type": "token",
        "contract_name": "Unknown",
    }
    res = client.post("/generate", json=payload)
    assert res.status_code == 404
    assert res.json()["detail"] == "User not found"
