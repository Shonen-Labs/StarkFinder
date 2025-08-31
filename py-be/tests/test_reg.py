"""Integration tests for the POST /reg registration endpoint."""

from app.models.base import User


def test_register_user_success(db_session, client):
    payload = {"username": "newuser", "email": "newuser@example.com", "password": "secret123"}
    res = client.post("/reg", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert "id" in data and isinstance(data["id"], int)

    # Ensure DB persistence
    user = db_session.query(User).filter_by(id=data["id"]).first()
    assert user is not None
    assert user.username == "newuser"
    assert user.email == "newuser@example.com"


def test_register_user_missing_fields(client):
    # Missing password
    res = client.post("/reg", json={"username": "x", "email": "x@example.com"})
    assert res.status_code == 422

    # Missing email
    res = client.post("/reg", json={"username": "x", "password": "p"})
    assert res.status_code == 422

    # Missing username
    res = client.post("/reg", json={"email": "x@example.com", "password": "p"})
    assert res.status_code == 422


def test_register_user_invalid_email(client):
    res = client.post(
        "/reg", json={"username": "bademail", "email": "not-an-email", "password": "p"}
    )
    # Pydantic EmailStr should reject invalid email with 422
    assert res.status_code == 422


def test_register_user_duplicate_username(db_session, client):
    # Create initial user
    res = client.post(
        "/reg",
        json={"username": "dupuser", "email": "dup1@example.com", "password": "p"},
    )
    assert res.status_code == 201

    # Attempt duplicate username with different email
    res = client.post(
        "/reg",
        json={"username": "dupuser", "email": "dup2@example.com", "password": "p"},
    )
    assert res.status_code == 400
    assert res.json()["detail"] == "User with this username or email already exists"


def test_register_user_duplicate_email(db_session, client):
    # Create initial user
    res = client.post(
        "/reg",
        json={"username": "u1", "email": "dup@example.com", "password": "p"},
    )
    assert res.status_code == 201

    # Attempt duplicate email with different username
    res = client.post(
        "/reg",
        json={"username": "u2", "email": "dup@example.com", "password": "p"},
    )
    assert res.status_code == 400
    assert res.json()["detail"] == "User with this username or email already exists"


